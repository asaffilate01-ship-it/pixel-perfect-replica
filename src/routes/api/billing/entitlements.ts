import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/billing/entitlements")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireUser(request);
          const { data, error } = await supabaseAdmin
            .from("subscription_entitlements")
            .select("id,plan_key,entitlement_key,status,valid_from,valid_until")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(200);
          if (error) throw error;
          const now = Date.now();
          const entitlements = (data ?? []).filter((entry) => {
            if (entry.valid_from && Date.parse(entry.valid_from) > now) return false;
            if (entry.valid_until && Date.parse(entry.valid_until) <= now) return false;
            return true;
          });
          return Response.json({ userId: user.id, entitlements }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
