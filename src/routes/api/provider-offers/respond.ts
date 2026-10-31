import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ApiAuthError, errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const schema = z.object({
  offerId: z.string().uuid(),
  action: z.enum(["accept", "decline", "counter", "withdraw"]),
  counterTerms: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/provider-offers/respond")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          if (input.action === "counter" && (!input.counterTerms || Object.keys(input.counterTerms).length === 0)) {
            return Response.json({ error: "COUNTER_TERMS_REQUIRED" }, { status: 400 });
          }
          if (JSON.stringify(input.counterTerms ?? {}).length > 6000) {
            return Response.json({ error: "COUNTER_TERMS_TOO_LARGE" }, { status: 413 });
          }

          const { user, supabaseAdmin } = await requireUser(request);
          const { data: offer, error: offerError } = await supabaseAdmin
            .from("provider_offers")
            .select("id,opportunity_id,provider_org_id,status")
            .eq("id", input.offerId)
            .maybeSingle();
          if (offerError) throw offerError;
          if (!offer) throw new ApiAuthError("OFFER_NOT_FOUND", 404);

          const { data: opportunity, error: opportunityError } = await supabaseAdmin
            .from("provider_opportunities")
            .select("id,case_id,provider_org_id")
            .eq("id", offer.opportunity_id)
            .maybeSingle();
          if (opportunityError) throw opportunityError;
          if (!opportunity) throw new ApiAuthError("OPPORTUNITY_NOT_FOUND", 404);
          if (opportunity.provider_org_id && opportunity.provider_org_id !== offer.provider_org_id) {
            throw new ApiAuthError("INVALID_PROVIDER_OFFER", 403);
          }

          const providerAction = input.action === "counter" || input.action === "withdraw";
          if (providerAction) {
            const { data: membership, error: memberError } = await supabaseAdmin
              .from("organisation_members")
              .select("role")
              .eq("org_id", offer.provider_org_id)
              .eq("user_id", user.id)
              .maybeSingle();
            if (memberError) throw memberError;
            if (!membership || !["housing_provider", "admin"].includes(membership.role)) {
              throw new ApiAuthError("FORBIDDEN", 403);
            }
          } else {
            // Only someone explicitly authorised on this property case may
            // accept or decline a provider's proposal.
            await requireCaseAction(request, opportunity.case_id, "propose_award");
          }

          const validCurrentStates = providerAction
            ? ["draft", "submitted", "countered"]
            : ["submitted", "countered"];
          if (!validCurrentStates.includes(offer.status)) {
            return Response.json({ error: "OFFER_NOT_OPEN_FOR_RESPONSE" }, { status: 409 });
          }

          const nextStatus: Record<typeof input.action, string> = {
            accept: "accepted_for_review",
            decline: "declined",
            counter: "countered",
            withdraw: "withdrawn",
          };

          const { data: changed, error: changeError } = await supabaseAdmin
            .from("provider_offers")
            .update({ status: nextStatus[input.action], updated_at: new Date().toISOString() })
            .eq("id", offer.id)
            .eq("status", offer.status)
            .select("id,status,updated_at")
            .maybeSingle();
          if (changeError) throw changeError;
          if (!changed) return Response.json({ error: "OFFER_CHANGED_PLEASE_REFRESH" }, { status: 409 });

          const { error: eventError } = await supabaseAdmin
            .from("provider_offer_events")
            .insert({
              offer_id: offer.id,
              event_type: input.action,
              actor_id: user.id,
              payload: { previousStatus: offer.status, currentStatus: changed.status, counterTerms: input.counterTerms ?? null },
            });
          if (eventError) {
            // Status may already have changed. Do not claim a complete audited transition.
            return Response.json({ error: "OFFER_UPDATED_BUT_AUDIT_FAILED", status: changed.status }, { status: 500 });
          }

          return Response.json({
            offerId: offer.id,
            status: changed.status,
            note: input.action === "accept"
              ? "Recorded for review; this is not a signed agreement or contract award."
              : "Response saved to the offer history.",
          });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
