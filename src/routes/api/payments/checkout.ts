import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";
import { createCheckout } from "@/lib/domureva/payments/stripe";

const schema = z.object({
  product: z.enum(["funding_report", "application_pack", "project_management"]),
});

export const Route = createFileRoute("/api/payments/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          const prices: Record<string, string | undefined> = {
            funding_report: process.env["STRIPE_PRICE_FUNDING_REPORT"],
            application_pack: process.env["STRIPE_PRICE_APPLICATION_PACK"],
            project_management: process.env["STRIPE_PRICE_PROJECT_MANAGEMENT"],
          };
          const priceId = prices[body.product];
          if (!priceId) throw new Error("Price not configured");
          const origin = new URL(request.url).origin;
          const session = await createCheckout({
            customerEmail: user.email,
            priceId,
            successUrl: `${origin}/dashboard?payment=success`,
            cancelUrl: `${origin}/dashboard?payment=cancelled`,
            metadata: { user_id: user.id, product: body.product },
          });
          return Response.json({ url: session.url, id: session.id });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
