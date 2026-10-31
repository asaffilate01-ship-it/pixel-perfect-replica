import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ApiAuthError, errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  opportunityId: z.string().uuid(),
  providerOrgId: z.string().uuid(),
  response: z.enum(["interested", "declined", "request_info"]),
  note: z.string().trim().max(2000).optional(),
});

export const Route = createFileRoute("/api/provider/respond")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          const { user, supabaseAdmin } = await requireUser(request);
          const { data: membership, error: membershipError } = await supabaseAdmin
            .from("organisation_members")
            .select("role")
            .eq("org_id", input.providerOrgId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (membershipError) throw membershipError;
          if (!membership || !["housing_provider", "admin"].includes(membership.role)) {
            throw new ApiAuthError("NOT_A_PROVIDER_ORG_MEMBER", 403);
          }

          // Invitation is attached to a specific provider organisation; a random
          // authenticated provider must not be able to respond to another's lead.
          const { data: opportunity, error: opportunityError } = await supabaseAdmin
            .from("provider_opportunities")
            .select("id,provider_org_id,status")
            .eq("id", input.opportunityId)
            .maybeSingle();
          if (opportunityError) throw opportunityError;
          if (!opportunity || opportunity.provider_org_id !== input.providerOrgId) {
            throw new ApiAuthError("OPPORTUNITY_NOT_ASSIGNED_TO_PROVIDER", 404);
          }
          if (["withdrawn", "closed", "rejected"].includes(opportunity.status)) {
            return Response.json({ error: "OPPORTUNITY_CLOSED" }, { status: 409 });
          }

          const { data: response, error: responseError } = await supabaseAdmin
            .from("provider_responses")
            .upsert(
              {
                opportunity_id: input.opportunityId,
                provider_org_id: input.providerOrgId,
                responder_id: user.id,
                response: input.response,
                note: input.note ?? null,
              },
              { onConflict: "opportunity_id,provider_org_id" },
            )
            .select("id,opportunity_id,provider_org_id,response,created_at")
            .single();
          if (responseError) throw responseError;
          return Response.json({ response });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
