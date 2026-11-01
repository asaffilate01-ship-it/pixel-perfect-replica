import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { verifyStripeSignature } from "@/lib/domureva/payments/stripeSignature";

const eventSchema = z.object({
  id: z.string().min(1).max(256),
  type: z.string().min(1).max(180),
  data: z.object({
    object: z.object({
      metadata: z.record(z.string(), z.string()).optional(),
      amount_total: z.number().int().nonnegative().optional(),
      currency: z.string().optional(),
      payment_status: z.string().optional(),
      status: z.string().optional(),
    }).passthrough().optional(),
  }).optional(),
}).passthrough();

export const Route = createFileRoute("/api/public/payments/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.text();
          const secret = process.env["STRIPE_WEBHOOK_SECRET"];
          const valid = await verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret);
          if (!valid) return Response.json({ error: "INVALID_STRIPE_SIGNATURE" }, { status: 401 });

          let payload: unknown;
          try {
            payload = JSON.parse(raw);
          } catch {
            return Response.json({ error: "INVALID_JSON" }, { status: 400 });
          }
          const parsed = eventSchema.safeParse(payload);
          if (!parsed.success) return Response.json({ error: "INVALID_STRIPE_EVENT" }, { status: 400 });

          const event = parsed.data;
          const object = event.data?.object;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const userId = object?.metadata?.["user_id"];
          const validatedUserId = userId && z.string().uuid().safeParse(userId).success ? userId : null;

          // External Stripe IDs are unique. Repeated deliveries update the same
          // billing event; do not claim success when Supabase rejects the write.
          const { error } = await supabaseAdmin.from("billing_events").upsert({
            provider: "stripe",
            external_id: event.id,
            event_type: event.type,
            user_id: validatedUserId,
            amount: object?.amount_total === undefined ? null : object.amount_total / 100,
            currency: object?.currency ?? null,
            status: object?.payment_status ?? object?.status ?? "received",
            metadata: object?.metadata ?? {},
          }, { onConflict: "external_id" });
          if (error) return Response.json({ error: "BILLING_EVENT_NOT_STORED" }, { status: 503 });

          // Subscription entitlements must be granted by an independently
          // reconciled, trusted Stripe payment/subscription workflow, not by
          // arbitrary webhook metadata in this event.
          return Response.json({ received: true });
        } catch {
          return Response.json({ error: "STRIPE_WEBHOOK_UNAVAILABLE" }, { status: 500 });
        }
      },
    },
  },
});
