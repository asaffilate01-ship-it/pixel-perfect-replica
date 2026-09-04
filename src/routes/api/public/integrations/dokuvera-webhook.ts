import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { hmacSha256, safeEqual, verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const payloadSchema = z
  .object({
    event_id: z.string().min(1).optional(),
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().min(1),
    case_id: z.string().uuid().optional(),
    evidence_id: z.string().optional(),
    kind: z.string().optional(),
    file_name: z.string().optional(),
    sha256: z.string().optional(),
    captured_at: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    reason: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const MAX_SKEW_SECONDS = 300;

async function verifyDokuveraRequest(request: Request, raw: string) {
  const secret = process.env["DOKUVERA_WEBHOOK_SECRET"];
  const signature =
    request.headers.get("x-dokuvera-signature") ?? request.headers.get("x-domureva-signature");
  const timestamp =
    request.headers.get("x-dokuvera-timestamp") ?? request.headers.get("x-domureva-timestamp");

  if (secret && signature && timestamp) {
    const parsed = Number(timestamp);
    if (!Number.isFinite(parsed)) return { ok: false as const, reason: "invalid_timestamp" };
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parsed) > MAX_SKEW_SECONDS) {
      return { ok: false as const, reason: "stale_timestamp" };
    }
    const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const expected = await hmacSha256(secret, `${timestamp}.${raw}`);
    return safeEqual(provided, expected)
      ? { ok: true as const }
      : { ok: false as const, reason: "signature_mismatch" };
  }

  // Compatibility path for Dokuvera deployments that currently sign the raw body only.
  return verifySignature(secret, signature, raw);
}

export const Route = createFileRoute("/api/public/integrations/dokuvera-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const verification = await verifyDokuveraRequest(request, raw);
        if (!verification.ok) {
          return Response.json({ error: "invalid signature", reason: verification.reason }, { status: 401 });
        }

        let json: unknown;
        try {
          json = JSON.parse(raw);
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }

        const parsed = payloadSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: "invalid payload" }, { status: 400 });
        }
        const p = parsed.data;
        const eventId = String(p.event_id || p.id || "");
        if (!eventId) return Response.json({ error: "event id required" }, { status: 400 });

        const { duplicate, key, db } = await beginWebhook("dokuvera", eventId);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
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
                metadata: { ...(p.metadata || {}), dokuvera_status: "verified" },
              } as never,
              { onConflict: "external_dokuvera_id" },
            );
          }

          if (p.type === "evidence.rejected" && p.case_id && p.kind) {
            await db.from("evidence_items").upsert(
              {
                case_id: p.case_id,
                external_dokuvera_id: p.evidence_id ?? null,
                kind: p.kind,
                file_name: p.file_name ?? null,
                sha256: p.sha256 ?? null,
                captured_at: p.captured_at ?? null,
                verified: false,
                metadata: {
                  ...(p.metadata || {}),
                  dokuvera_status: "rejected",
                  rejection_reason: p.reason ?? null,
                },
              } as never,
              { onConflict: "external_dokuvera_id" },
            );
          }

          await db.from("integration_events").insert({
            provider: "dokuvera",
            event_type: p.type,
            external_id: eventId,
            case_id: p.case_id ?? null,
            payload: p as never,
            status: "processed",
            processed_at: new Date().toISOString(),
          } as never);

          await finishWebhook(db, key, { ok: true });
          return Response.json({ ok: true });
        } catch (error) {
          await db.from("integration_events").insert({
            provider: "dokuvera",
            event_type: p.type,
            external_id: eventId,
            case_id: p.case_id ?? null,
            payload: p as never,
            status: "failed",
            error: error instanceof Error ? error.message : "unknown error",
          } as never);
          await finishWebhook(db, key, { ok: false });
          return Response.json({ error: "processing failed" }, { status: 500 });
        }
      },
    },
  },
});
