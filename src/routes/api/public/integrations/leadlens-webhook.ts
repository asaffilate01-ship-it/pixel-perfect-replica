import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

import { verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook, releaseWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const payloadSchema = z.object({
  event_id: z.string().min(1).max(255).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  type: z.literal("funding.scheme_upsert"),
  case_id: z.string().uuid().optional(),
  source: z.object({
    url: z.string().url().refine((value) => value.startsWith("https://"), "HTTPS_REQUIRED"),
    hash: z.string().max(255).optional(),
    checked_at: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    raw: z.record(z.string(), z.unknown()).optional(),
  }),
  scheme: z.object({
    authority: z.string().trim().min(2).max(200),
    name: z.string().trim().min(2).max(250),
    scheme_type: z.string().max(100).optional(),
    max_amount: z.number().finite().nonnegative().optional(),
    min_empty_months: z.number().int().nonnegative().optional(),
    eligible_owner_types: z.array(z.string()).max(50).optional(),
    eligible_uses: z.array(z.string()).max(50).optional(),
    eligible_works: z.array(z.string()).max(100).optional(),
    geography: z.record(z.string(), z.unknown()).optional(),
    valid_from: z.string().optional(),
    valid_to: z.string().optional(),
  }),
}).passthrough();

function changed(existing: Record<string, unknown>, proposal: Record<string, unknown>): boolean {
  return Object.entries(proposal).some(([key, value]) => JSON.stringify(existing[key]) !== JSON.stringify(value));
}

export const Route = createFileRoute("/api/public/integrations/leadlens-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 250_000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
        const valid = await verifySignature(
          process.env["LEADLENS_WEBHOOK_SECRET"],
          request.headers.get("x-domureva-signature"),
          raw,
        );
        if (!valid.ok) return Response.json({ error: "INVALID_SIGNATURE" }, { status: 401 });

        let payload: unknown;
        try { payload = JSON.parse(raw); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
        const parsed = payloadSchema.safeParse(payload);
        if (!parsed.success) return Response.json({ error: "INVALID_FUNDING_SOURCE_EVENT" }, { status: 400 });
        const p = parsed.data;
        const eventId = String(p.event_id || p.id || "");
        if (!eventId) return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });

        let claim: Awaited<ReturnType<typeof beginWebhook>>;
        try { claim = await beginWebhook("leadlens", eventId); }
        catch { return Response.json({ error: "WEBHOOK_RETRY_REQUIRED" }, { status: 503 }); }
        const { db, key, duplicate } = claim;
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
          const { data: source, error: sourceError } = await db.from("source_records").upsert({
            source_system: "leadlens",
            source_url: p.source.url,
            source_hash: p.source.hash ?? null,
            last_checked_at: p.source.checked_at ?? new Date().toISOString(),
            confidence: p.source.confidence ?? null,
            raw: JSON.parse(JSON.stringify(p.source.raw ?? {})) as Json,
          }, { onConflict: "source_system,source_url" }).select("id").single();
          if (sourceError) throw sourceError;

          const proposal = {
            authority: p.scheme.authority,
            name: p.scheme.name,
            scheme_type: p.scheme.scheme_type ?? null,
            max_amount: p.scheme.max_amount ?? null,
            min_empty_months: p.scheme.min_empty_months ?? null,
            eligible_owner_types: p.scheme.eligible_owner_types ?? [],
            eligible_uses: p.scheme.eligible_uses ?? [],
            eligible_works: p.scheme.eligible_works ?? [],
            geography: JSON.parse(JSON.stringify(p.scheme.geography ?? {})) as Json,
            valid_from: p.scheme.valid_from ?? null,
            valid_to: p.scheme.valid_to ?? null,
          };
          const { data: original, error: lookupError } = await db.from("funding_schemes")
            .select("*")
            .eq("source_id", source.id)
            .eq("authority", proposal.authority)
            .eq("name", proposal.name)
            .limit(1).maybeSingle();
          if (lookupError) throw lookupError;

          let result = "draft_created";
          let schemeId: string | null = original?.id ?? null;
          if (!original) {
            const { data: draft, error: draftError } = await db.from("funding_schemes")
              .insert({ ...proposal, source_id: source.id, status: "draft" })
              .select("id").single();
            if (draftError) throw draftError;
            schemeId = draft.id;
          } else if (original.status === "reviewed") {
            if (changed(original as Record<string, unknown>, proposal)) {
              const { data: previous, error: queueCheckError } = await db.from("rule_change_queue")
                .select("id").eq("source_id", source.id).eq("scheme_id", original.id)
                .eq("status", "draft").limit(1).maybeSingle();
              if (queueCheckError) throw queueCheckError;
              if (!previous) {
                const { error: queueError } = await db.from("rule_change_queue").insert({
                  source_id: source.id,
                  scheme_id: original.id,
                  change_type: "material_rule_change",
                  before: JSON.parse(JSON.stringify(original)) as Json,
                  proposed: JSON.parse(JSON.stringify(proposal)) as Json,
                  confidence: p.source.confidence ?? null,
                  status: "draft",
                });
                if (queueError) throw queueError;
              }
              result = "review_required";
            } else {
              result = "reviewed_unchanged";
            }
          } else {
            const { error: draftError } = await db.from("funding_schemes")
              .update({ ...proposal, status: "draft" })
              .eq("id", original.id);
            if (draftError) throw draftError;
            result = "draft_updated";
          }

          const eventLog = await db.from("integration_events").insert({
            provider: "leadlens",
            event_type: "funding.scheme_upsert",
            external_id: eventId,
            case_id: p.case_id ?? null,
            payload: { sourceId: source.id, schemeId, disposition: result },
            status: "processed",
            processed_at: new Date().toISOString(),
          });
          if (eventLog.error) throw eventLog.error;
          await finishWebhook(db, key, { ok: true, schemeId, disposition: result });
          return Response.json({ ok: true, schemeId, disposition: result });
        } catch {
          try { await releaseWebhook(db, key); } catch { /* do not acknowledge failed write */ }
          return Response.json({ error: "SOURCE_INGESTION_UNAVAILABLE" }, { status: 503 });
        }
      },
    },
  },
});
