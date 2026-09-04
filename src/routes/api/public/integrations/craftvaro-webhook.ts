import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const payloadSchema = z
  .object({
    event_id: z.string().optional(),
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional(),
    quote_request_id: z.string().uuid().optional(),
    contractor_org_id: z.string().uuid().optional(),
    quote_id: z.string().optional(),
    amount: z.number().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/integrations/craftvaro-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const verification = await verifySignature(
          process.env["CRAFTVARO_WEBHOOK_SECRET"],
          request.headers.get("x-domureva-signature"),
          raw,
        );
        if (!verification.ok) {
          return Response.json({ error: "invalid signature" }, { status: 401 });
        }

        const parsed = payloadSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          return Response.json({ error: "invalid payload" }, { status: 400 });
        }
        const p = parsed.data;
        const eventId = String(p.event_id || p.id || "");

        const { duplicate, key, db } = await beginWebhook("craftvaro", eventId);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        if (p.type === "quote.submitted") {
          await db.from("quotes").upsert(
            {
              quote_request_id: p.quote_request_id ?? null,
              contractor_org_id: p.contractor_org_id ?? null,
              external_craftvaro_id: p.quote_id ?? null,
              amount: p.amount ?? null,
              status: "submitted",
              details: p.details || {},
            } as never,
            { onConflict: "external_craftvaro_id" },
          );
        }

        await finishWebhook(db, key, { ok: true });
        return Response.json({ ok: true });
      },
    },
  },
});
