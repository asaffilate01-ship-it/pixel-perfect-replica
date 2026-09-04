import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifySignature } from "@/lib/domureva/security/webhook";
import { beginWebhook, finishWebhook } from "@/lib/domureva/integrations/webhookStore.server";

const sourceSchema = z.object({
  url: z.string(),
  hash: z.string().optional(),
  checked_at: z.string().optional(),
  confidence: z.number().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});

const schemeSchema = z.object({
  authority: z.string(),
  name: z.string(),
  scheme_type: z.string().optional(),
  max_amount: z.number().optional(),
  min_empty_months: z.number().optional(),
  eligible_owner_types: z.array(z.string()).optional(),
  eligible_uses: z.array(z.string()).optional(),
  eligible_works: z.array(z.string()).optional(),
  geography: z.record(z.string(), z.unknown()).optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
});

const payloadSchema = z
  .object({
    event_id: z.string().optional(),
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional(),
    case_id: z.string().uuid().optional(),
    source: sourceSchema.optional(),
    scheme: schemeSchema.optional(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/integrations/leadlens-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const verification = await verifySignature(
          process.env["LEADLENS_WEBHOOK_SECRET"],
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
        if (!eventId) return Response.json({ error: "missing event_id" }, { status: 400 });

        const { duplicate, key, db } = await beginWebhook("leadlens", eventId);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        let outcome: Record<string, unknown> = {};

        if (p.type === "funding.scheme_upsert" && p.source && p.scheme) {
          const src = p.source;
          const { data: source, error: se } = await db
            .from("source_records")
            .upsert(
              {
                source_system: "leadlens",
                source_url: src.url,
                source_hash: src.hash ?? null,
                last_checked_at: src.checked_at || new Date().toISOString(),
                confidence: src.confidence ?? null,
                raw: src.raw || {},
              } as never,
              { onConflict: "source_system,source_url" },
            )
            .select()
            .single();
          if (se) throw se;

          const s = p.scheme;
          const { data: scheme, error } = await db
            .from("funding_schemes")
            .upsert(
              {
                authority: s.authority,
                name: s.name,
                scheme_type: s.scheme_type ?? null,
                max_amount: s.max_amount ?? null,
                min_empty_months: s.min_empty_months ?? null,
                eligible_owner_types: s.eligible_owner_types || [],
                eligible_uses: s.eligible_uses || [],
                eligible_works: s.eligible_works || [],
                geography: s.geography || {},
                source_id: (source as { id: string }).id,
                status: "draft",
                valid_from: s.valid_from ?? null,
                valid_to: s.valid_to ?? null,
              } as never,
              { onConflict: "id" },
            )
            .select()
            .single();
          if (error) throw error;
          outcome = { scheme_id: (scheme as { id: string }).id, status: "draft" };
        }

        await db.from("integration_events").insert({
          provider: "leadlens",
          event_type: p.type || "unknown",
          external_id: eventId,
          case_id: p.case_id ?? null,
          payload: p as never,
          status: "processed",
          processed_at: new Date().toISOString(),
        } as never);

        await finishWebhook(db, key, outcome);
        return Response.json({ ok: true, ...outcome });
      },
    },
  },
});
