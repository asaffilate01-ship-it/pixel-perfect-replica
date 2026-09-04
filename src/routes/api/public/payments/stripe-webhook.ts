import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function verifyStripeSignature(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((x) => x.split("=") as [string, string]));
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;
  const expected = await hmacSha256Hex(secret, `${timestamp}.${raw}`);
  return safeEqual(expected, sig);
}

const eventSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    data: z
      .object({
        object: z
          .object({
            metadata: z.record(z.string(), z.string()).optional(),
            amount_total: z.number().optional(),
            currency: z.string().optional(),
            payment_status: z.string().optional(),
            status: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export const Route = createFileRoute("/api/public/payments/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret || !(await verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret))) {
          return Response.json({ error: "invalid signature" }, { status: 401 });
        }

        const parsed = eventSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          return Response.json({ error: "invalid payload" }, { status: 400 });
        }
        const event = parsed.data;
        const object = event.data?.object || {};

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("billing_events").upsert(
          {
            provider: "stripe",
            external_id: event.id,
            event_type: event.type,
            user_id: object.metadata?.["user_id"] ?? null,
            amount: object.amount_total ? object.amount_total / 100 : null,
            currency: object.currency ?? null,
            status: object.payment_status || object.status || "received",
            metadata: object.metadata || {},
          } as never,
          { onConflict: "external_id" },
        );

        return Response.json({ received: true });
      },
    },
  },
});
