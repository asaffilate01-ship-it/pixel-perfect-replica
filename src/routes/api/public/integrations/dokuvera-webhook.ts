import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { hmacSha256, safeEqual, verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook, releaseWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const payloadSchema = z.object({
  event_id: z.string().min(1).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  type: z.enum(["evidence.verified", "evidence.rejected"]),
  case_id: z.string().uuid(),
  evidence_id: z.string().trim().min(1).max(255),
  kind: z.string().trim().min(1).max(100),
  file_name: z.string().max(255).optional(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  captured_at: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  reason: z.string().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

const MAX_SKEW_SECONDS = 300;

async function verifyDokuveraRequest(request: Request, raw: string) {
  const secret = process.env["DOKUVERA_WEBHOOK_SECRET"];
  const signature = request.headers.get("x-dokuvera-signature") ?? request.headers.get("x-domureva-signature");
  const timestamp = request.headers.get("x-dokuvera-timestamp") ?? request.headers.get("x-domureva-timestamp");
  if (secret && signature && timestamp) {
    const parsed = Number(timestamp);
    if (!Number.isSafeInteger(parsed)) return { ok: false as const, reason: "invalid_timestamp" };
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parsed) > MAX_SKEW_SECONDS) return { ok: false as const, reason: "stale_timestamp" };
    const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const expected = await hmacSha256(secret, timestamp + "." + raw);
    return safeEqual(provided, expected)
      ? { ok: true as const }
      : { ok: false as const, reason: "signature_mismatch" };
  }
  // Preserve the existing raw-body compatibility contract until Dokuvera
  // deployments are migrated to timestamped signatures.
  return verifySignature(secret, signature, raw);
}

export const Route = createFileRoute("/api/public/integrations/dokuvera-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 250_000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });

        const verification = await verifyDokuveraRequest(request, raw);
        if (!verification.ok) return Response.json({ error: "invalid signature" }, { status: 401 });

        let payload: unknown;
        try { payload = JSON.parse(raw); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
        const parsed = payloadSchema.safeParse(payload);
        if (!parsed.success) return Response.json({ error: "INVALID_EVIDENCE_EVENT" }, { status: 400 });

        const p = parsed.data;
        const eventId = String(p.event_id || p.id || "");
        if (!eventId) return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });

        let claim: Awaited<ReturnType<typeof beginWebhook>>;
        try {
          claim = await beginWebhook("dokuvera", eventId);
        } catch {
          return Response.json({ error: "WEBHOOK_RETRY_REQUIRED" }, { status: 503 });
        }
        const { duplicate, db, key } = claim;
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
          const verified = p.type === "evidence.verified";
          const { data: existing, error: existingError } = await db.from("evidence_items")
            .select("id,case_id").eq("external_dokuvera_id", p.evidence_id).limit(1).maybeSingle();
          if (existingError) throw existingError;
          if (existing && existing.case_id !== p.case_id) {
            throw new Error("EVIDENCE_CASE_MISMATCH");
          }
          const attributes = {
            case_id: p.case_id,
            external_dokuvera_id: p.evidence_id,
            kind: p.kind,
            file_name: p.file_name ?? null,
            sha256: p.sha256 ?? null,
            captured_at: p.captured_at ?? null,
            latitude: p.latitude ?? null,
            longitude: p.longitude ?? null,
            verified,
            metadata: {
              ...(p.metadata ?? {}),
              dokuvera_status: verified ? "verified" : "rejected",
              ...(!verified ? { rejection_reason: p.reason ?? null } : {}),
            },
          };

          const write = existing
            ? await db.from("evidence_items").update(attributes).eq("id", existing.id)
            : await db.from("evidence_items").insert(attributes);
          if (write.error) throw write.error;

          const eventWrite = await db.from("integration_events").insert({
            provider: "dokuvera",
            event_type: p.type,
            external_id: eventId,
            case_id: p.case_id,
            payload: { evidence_id: p.evidence_id, kind: p.kind },
            status: "processed",
            processed_at: new Date().toISOString(),
          });
          if (eventWrite.error) throw eventWrite.error;
          await finishWebhook(db, key, { ok: true, evidenceId: p.evidence_id });

          return Response.json({ ok: true });
        } catch {
          try { await releaseWebhook(db, key); } catch { /* blocked claim remains retryable, not acknowledged */ }
          return Response.json({ error: "EVIDENCE_PROCESSING_FAILED" }, { status: 503 });
        }
      },
    },
  },
});
