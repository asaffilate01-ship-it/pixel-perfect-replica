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
    result: z.record(z.string(), z.unknown()).optional(),
    confidence: z.number().optional(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/integrations/gabley-retrofit-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const verification = await verifySignature(
          process.env["GABLEY_RETROFIT_WEBHOOK_SECRET"],
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

        const { duplicate, key, db } = await beginWebhook("gabley_retrofit", eventId);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        if (p.type === "assessment.completed" && p.case_id) {
          await db.from("assessments").insert({
            case_id: p.case_id,
            type: "retrofit",
            result: p.result || {},
            confidence: p.confidence ?? null,
            requires_human_review: true,
          } as never);
        }

        await finishWebhook(db, key, { ok: true });
        return Response.json({ ok: true });
      },
    },
  },
});
