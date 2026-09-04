import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/billing/entitlements")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { user } = await requireApiUser(request);
          // Production: query subscription_entitlements written only by trusted Stripe webhook/service-role code.
          return Response.json({ userId: user.id, entitlements: [] });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: "unauthorised" }, { status: 401 });
        }
      },
    },
  },
});
