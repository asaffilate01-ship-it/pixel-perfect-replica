import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const payloadSchema = z
  .object({
    event_id: z.string().optional(),
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional(),
    case_id: z.string().uuid().optional(),
    evidence_id: z.string().optional(),
    kind: z.string().optional(),
    file_name: z.string().optional(),
    sha256: z.string().optional(),
    captured_at: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/integrations/dokuvera-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const verification = await verifySignature(
          process.env["DOKUVERA_WEBHOOK_SECRET"],
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

        const { duplicate, key, db } = await beginWebhook("dokuvera", eventId);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        if (p.type === "evidence.verified" && p.case_id && p.kind) {
          await db.from("evidence_items").upsert(
            {
              case_id: p.case_id,
              external_dokuvera_id: p.evidence_id ?? null,
              kind: p.kind,
              file_name: p.file_name ?? null,
              sha256: p.sha256 ?? null,
              captured_at: p.captured_at ?? null,
              latitude: p.latitude ?? null,
              longitude: p.longitude ?? null,
              verified: true,
              metadata: p.metadata || {},
            } as never,
            { onConflict: "external_dokuvera_id" },
          );
        }

        await db.from("integration_events").insert({
          provider: "dokuvera",
          event_type: p.type || "unknown",
          external_id: eventId,
          case_id: p.case_id ?? null,
          payload: p as never,
          status: "processed",
          processed_at: new Date().toISOString(),
        } as never);

        await finishWebhook(db, key, { ok: true });
        return Response.json({ ok: true });
      },
    },
  },
});
