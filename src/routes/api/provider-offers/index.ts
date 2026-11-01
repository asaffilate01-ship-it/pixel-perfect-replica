import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

import { ApiAuthError, errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";

const schema = z.object({
  opportunityId: z.string().uuid(),
  providerOrgId: z.string().uuid(),
  offerType: z.enum(["lease_repair", "purchase_repair", "management"]),
  headlineTerms: z.record(z.string(), z.unknown()).default({}),
});

export const Route = createFileRoute("/api/provider-offers/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          if (JSON.stringify(input.headlineTerms).length > 8000) {
            return Response.json({ error: "OFFER_TERMS_TOO_LARGE" }, { status: 413 });
          }
          const { user, supabaseAdmin } = await requireUser(request);
          const { data: membership, error: membershipError } = await supabaseAdmin
            .from("organisation_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("org_id", input.providerOrgId)
            .maybeSingle();
          if (membershipError) throw membershipError;
          if (!membership || !["housing_provider", "admin"].includes(membership.role)) {
            throw new ApiAuthError("NOT_A_PROVIDER_ORG_MEMBER", 403);
          }

          const { data: opportunity, error: opportunityError } = await supabaseAdmin
            .from("provider_opportunities")
            .select("id,case_id,provider_org_id,status")
            .eq("id", input.opportunityId)
            .maybeSingle();
          if (opportunityError) throw opportunityError;
          if (!opportunity || ["closed", "withdrawn", "rejected"].includes(opportunity.status)) {
            throw new ApiAuthError("OPPORTUNITY_NOT_AVAILABLE", 404);
          }
          if (opportunity.provider_org_id && opportunity.provider_org_id !== input.providerOrgId) {
            throw new ApiAuthError("OPPORTUNITY_NOT_ASSIGNED_TO_PROVIDER", 403);
          }
          if (!opportunity.provider_org_id) {
            const access = await requireCaseAccess(request, opportunity.case_id);
            if (!["housing_provider", "admin"].includes(access.caseRole)) {
              throw new ApiAuthError("CASE_PROVIDER_INVITATION_REQUIRED", 403);
            }
          }

          const { data: current, error: duplicateError } = await supabaseAdmin
            .from("provider_offers")
            .select("id")
            .eq("opportunity_id", input.opportunityId)
            .eq("provider_org_id", input.providerOrgId)
            .in("status", ["draft", "submitted", "countered", "accepted_for_review"])
            .limit(1)
            .maybeSingle();
          if (duplicateError) throw duplicateError;
          if (current) return Response.json({ error: "OPEN_OFFER_ALREADY_EXISTS" }, { status: 409 });

          const { data: offer, error: offerError } = await supabaseAdmin
            .from("provider_offers")
            .insert({
              opportunity_id: input.opportunityId,
              provider_org_id: input.providerOrgId,
              offer_type: input.offerType,
              headline_terms: JSON.parse(JSON.stringify(input.headlineTerms)) as Json,
              status: "submitted",
            })
            .select("id,opportunity_id,provider_org_id,offer_type,status,created_at")
            .single();
          if (offerError) throw offerError;

          const { error: eventError } = await supabaseAdmin.from("provider_offer_events").insert({
            offer_id: offer.id,
            actor_id: user.id,
            event_type: "submitted",
            payload: { offerType: input.offerType },
          });
          if (eventError) {
            return Response.json({ error: "OFFER_SAVED_BUT_AUDIT_FAILED", offerId: offer.id }, { status: 500 });
          }
          return Response.json({ offer }, { status: 201 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
