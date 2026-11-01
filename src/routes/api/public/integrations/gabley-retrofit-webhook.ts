import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

import { verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook, releaseWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const payloadSchema = z.object({
  event_id: z.string().min(1).max(255).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  type: z.enum(["assessment.completed", "assessment.failed"]),
  case_id: z.string().uuid(),
  result: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  failure_reason: z.string().max(500).optional(),
}).passthrough();

export const Route = createFileRoute("/api/public/integrations/gabley-retrofit-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 250_000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
        const signature = await verifySignature(
          process.env["GABLEY_RETROFIT_WEBHOOK_SECRET"],
          request.headers.get("x-domureva-signature"),
          raw,
        );
        if (!signature.ok) return Response.json({ error: "INVALID_SIGNATURE" }, { status: 401 });

        let payload: unknown;
        try { payload = JSON.parse(raw); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
        const parsed = payloadSchema.safeParse(payload);
        if (!parsed.success) return Response.json({ error: "INVALID_ASSESSMENT_EVENT" }, { status: 400 });
        const p = parsed.data;
        if (p.type === "assessment.completed" && !p.result) {
          return Response.json({ error: "ASSESSMENT_RESULT_REQUIRED" }, { status: 400 });
        }
        const eventId = String(p.event_id || p.id || "");
        if (!eventId) return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });

        let claim: Awaited<ReturnType<typeof beginWebhook>>;
        try { claim = await beginWebhook("gabley_retrofit", eventId); }
        catch { return Response.json({ error: "WEBHOOK_RETRY_REQUIRED" }, { status: 503 }); }
        const { duplicate, key, db } = claim;
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
          const { data: propertyCase, error: caseError } = await db.from("cases")
            .select("id").eq("id", p.case_id).maybeSingle();
          if (caseError || !propertyCase) throw new Error("CASE_NOT_FOUND");

          if (p.type === "assessment.completed") {
            // A failed acknowledgement may lead to redelivery. Check the
            // integration log before inserting a second assessment.
            const { data: logged, error: logCheckError } = await db.from("integration_events")
              .select("id").eq("provider", "gabley_retrofit").eq("external_id", eventId)
              .eq("status", "processed").limit(1).maybeSingle();
            if (logCheckError) throw logCheckError;

            const { data: existingAssessment, error: assessmentLookupError } = await db.from("assessments")
              .select("id").eq("case_id", p.case_id).eq("type", "retrofit")
              .contains("result", { sourceEventId: eventId }).limit(1).maybeSingle();
            if (assessmentLookupError) throw assessmentLookupError;
            if (!logged && !existingAssessment) {
              const { error: insertError } = await db.from("assessments").insert({
                case_id: p.case_id,
                type: "retrofit",
                result: JSON.parse(JSON.stringify({
                  ...p.result,
                  sourceEventId: eventId,
                  sourceProvider: "gabley_retrofit",
                })) as Json,
                confidence: p.confidence ?? null,
                requires_human_review: true,
              });
              if (insertError) throw insertError;
            }
          }

          const { error: logError } = await db.from("integration_events").insert({
            provider: "gabley_retrofit",
            event_type: p.type,
            external_id: eventId,
            case_id: p.case_id,
            payload: p.type === "assessment.failed" ? { failureReason: p.failure_reason ?? "Unspecified" } : { assessmentResultRecorded: true },
            status: p.type === "assessment.failed" ? "failed" : "processed",
            processed_at: new Date().toISOString(),
          });
          if (logError) throw logError;
          await finishWebhook(db, key, { ok: true, type: p.type });
          return Response.json({ ok: true });
        } catch {
          try { await releaseWebhook(db, key); } catch { /* stay retryable */ }
          return Response.json({ error: "RETROFIT_CALLBACK_NOT_STORED" }, { status: 503 });
        }
      },
    },
  },
});
