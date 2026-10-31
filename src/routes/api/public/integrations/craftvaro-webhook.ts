import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

import { verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook, releaseWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const quoteEvent = z.object({
  event_id: z.string().min(1).max(255).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  type: z.literal("quote.submitted"),
  quote_request_id: z.string().uuid(),
  contractor_org_id: z.string().uuid(),
  quote_id: z.string().trim().min(1).max(255),
  amount: z.number().finite().positive().max(1_000_000_000),
  details: z.record(z.string(), z.unknown()).default({}),
}).passthrough();

export const Route = createFileRoute("/api/public/integrations/craftvaro-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 250_000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
        const valid = await verifySignature(
          process.env["CRAFTVARO_WEBHOOK_SECRET"],
          request.headers.get("x-domureva-signature"),
          raw,
        );
        if (!valid.ok) return Response.json({ error: "INVALID_SIGNATURE" }, { status: 401 });

        let body: unknown;
        try { body = JSON.parse(raw); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
        const parsed = quoteEvent.safeParse(body);
        if (!parsed.success) return Response.json({ error: "INVALID_QUOTE_EVENT" }, { status: 400 });
        const event = parsed.data;
        const eventId = String(event.event_id || event.id || "");
        if (!eventId) return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });

        let claim: Awaited<ReturnType<typeof beginWebhook>>;
        try { claim = await beginWebhook("craftvaro", eventId); }
        catch { return Response.json({ error: "WEBHOOK_RETRY_REQUIRED" }, { status: 503 }); }
        const { duplicate, key, db } = claim;
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
          const { data: requestRecord, error: requestError } = await db.from("quote_requests")
            .select("id,status,case_id").eq("id", event.quote_request_id).maybeSingle();
          if (requestError || !requestRecord || requestRecord.status !== "published") {
            throw new Error("PUBLISHED_QUOTE_REQUEST_NOT_FOUND");
          }

          const { data: profile, error: profileError } = await db.from("contractor_profiles")
            .select("verified").eq("organisation_id", event.contractor_org_id).maybeSingle();
          if (profileError || !profile?.verified) throw new Error("CONTRACTOR_NOT_VERIFIED");

          const { data: existing, error: lookupError } = await db.from("quotes")
            .select("id,quote_request_id,contractor_org_id")
            .eq("external_craftvaro_id", event.quote_id).limit(1).maybeSingle();
          if (lookupError) throw lookupError;
          if (existing && (existing.quote_request_id !== requestRecord.id || existing.contractor_org_id !== event.contractor_org_id)) {
            throw new Error("EXTERNAL_QUOTE_RELATION_MISMATCH");
          }

          const data = {
            quote_request_id: requestRecord.id,
            contractor_org_id: event.contractor_org_id,
            external_craftvaro_id: event.quote_id,
            amount: Math.round(event.amount * 100) / 100,
            status: "submitted",
            details: JSON.parse(JSON.stringify(event.details)) as Json,
          };
          const operation = existing
            ? await db.from("quotes").update(data).eq("id", existing.id)
            : await db.from("quotes").insert(data);
          if (operation.error) throw operation.error;

          const log = await db.from("integration_events").insert({
            provider: "craftvaro",
            event_type: event.type,
            external_id: eventId,
            case_id: requestRecord.case_id,
            payload: { externalQuoteId: event.quote_id, quoteRequestId: requestRecord.id },
            status: "processed",
            processed_at: new Date().toISOString(),
          });
          if (log.error) throw log.error;
          await finishWebhook(db, key, { ok: true, externalQuoteId: event.quote_id });
          return Response.json({ ok: true });
        } catch {
          try { await releaseWebhook(db, key); } catch { /* do not claim success */ }
          return Response.json({ error: "QUOTE_INTEGRATION_UNAVAILABLE" }, { status: 503 });
        }
      },
    },
  },
});
