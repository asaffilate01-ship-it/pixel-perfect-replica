import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { runFundingAgent } from "@/lib/domureva/agents/orchestrator";
import { isSchemeCurrentlyActive } from "@/lib/domureva/funding/scheme-validity";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { errorResponse } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({ caseId: z.string().uuid() }).strict();

function monthsSince(date: string): number {
  const since = new Date(date);
  const today = new Date();
  if (Number.isNaN(since.getTime())) throw new Error("INVALID_VACANCY_DATE");
  return Math.max(0, (today.getUTCFullYear() - since.getUTCFullYear()) * 12 + today.getUTCMonth() - since.getUTCMonth());
}

export const Route = createFileRoute("/api/workflow/match-funding")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { caseId } = schema.parse(await request.json());
          const { supabaseAdmin, property } = await requireCaseAction(request, caseId, "match_funding");
          if (!property.empty_since || !property.owner_type || !property.intended_use) {
            return Response.json({ error: "PROPERTY_FACTS_INCOMPLETE" }, { status: 422 });
          }

          const { data: schemes, error: schemeError } = await supabaseAdmin
            .from("funding_schemes")
            .select("id,status,authority,max_amount,min_empty_months,eligible_owner_types,eligible_uses,source_id,valid_from,valid_to")
            .eq("status", "reviewed")
            .limit(500);
          if (schemeError) throw schemeError;

          const today = new Date().toISOString().slice(0, 10);
          const active = (schemes ?? []).filter((scheme) => isSchemeCurrentlyActive(scheme, today));
          const decision = runFundingAgent({
            emptyMonths: monthsSince(property.empty_since),
            ownerType: property.owner_type,
            intendedUse: property.intended_use,
          }, active.map((scheme) => ({
            id: scheme.id,
            status: "reviewed" as const,
            authority: scheme.authority,
            maxAmount: scheme.max_amount,
            minimumEmptyMonths: scheme.min_empty_months,
            eligibleOwnerTypes: scheme.eligible_owner_types,
            eligibleUses: scheme.eligible_uses,
            sourceId: scheme.source_id,
          })));

          const activeIds = new Set(decision.output.map((item) => item.schemeId));
          const { data: stale, error: previousError } = await supabaseAdmin
            .from("funding_matches").select("id,scheme_id").eq("case_id", caseId);
          if (previousError) throw previousError;
          for (const entry of stale ?? []) {
            if (activeIds.has(entry.scheme_id)) continue;
            const { error: invalidateError } = await supabaseAdmin.from("funding_matches")
              .update({
                eligible: false,
                confidence: null,
                explanation: {
                  status: "not_currently_screened",
                  reason: "Scheme is unreviewed, retired, expired or otherwise unavailable for screening.",
                },
              })
              .eq("id", entry.id);
            if (invalidateError) throw invalidateError;
          }

          for (const match of decision.output) {
            const { error: saveError } = await supabaseAdmin.from("funding_matches").upsert({
              case_id: caseId,
              scheme_id: match.schemeId,
              eligible: match.eligible,
              confidence: null,
              explanation: {
                agent: decision.agent,
                reasons: decision.reasons,
                modelVersion: decision.modelVersion,
                assessmentType: "preliminary",
                requiresHumanReview: true,
                checkedAt: new Date().toISOString(),
              },
            }, { onConflict: "case_id,scheme_id" });
            if (saveError) throw saveError;
          }

          const { error: runError } = await supabaseAdmin.from("agent_runs").insert({
            case_id: caseId,
            agent: decision.agent,
            input: {
              postcode: property.postcode,
              ownerType: property.owner_type,
              intendedUse: property.intended_use,
              vacancyMonths: monthsSince(property.empty_since),
            },
            output: decision.output,
            confidence: null,
            requires_human_review: true,
            model_version: decision.modelVersion,
            sources: decision.sourceIds,
          });
          if (runError) throw runError;

          if (decision.output.some((match) => match.eligible)) {
            // Never move a delivery or completed case backwards to funding.
            const { error: stageError } = await supabaseAdmin.from("cases")
              .update({ status: "funding" })
              .eq("id", caseId).in("status", ["intake", "assessment"]);
            if (stageError) throw stageError;
          }

          return Response.json({
            ...decision,
            status: "preliminary_screen",
            screenedSchemes: active.length,
            excludedInactiveSchemes: (schemes ?? []).length - active.length,
            note: "A preliminary rule match is not confirmed geographic eligibility, a grant award or an authority decision.",
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
