import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { runFundingAgent } from "@/lib/domureva/agents/orchestrator";
import { evaluateSchemeGeography } from "@/lib/domureva/funding/geography";
import { isSchemeCurrentlyActive } from "@/lib/domureva/funding/scheme-validity";
import { hasRecentSourceCheck } from "@/lib/domureva/funding/source-freshness";
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
            .select("id,name,status,authority,max_amount,min_empty_months,eligible_owner_types,eligible_uses,source_id,geography,reviewed_at,valid_from,valid_to")
            .eq("status", "reviewed")
            .limit(500);
          if (schemeError) throw schemeError;

          const now = new Date();
          const today = now.toISOString().slice(0, 10);
          const dateActive = (schemes ?? []).filter((scheme) => isSchemeCurrentlyActive(scheme, today));
          const sourceIds = [...new Set(dateActive.map((scheme) => scheme.source_id))];
          const sourceResult = sourceIds.length
            ? await supabaseAdmin.from("source_records")
                .select("id,last_checked_at,source_url").in("id", sourceIds).limit(500)
            : { data: [], error: null };
          if (sourceResult.error) throw sourceResult.error;

          const sourceById = new Map((sourceResult.data ?? []).map((source) => [source.id, source]));
          const { resolvePostcodeContext } = await import("@/lib/domureva/funding/postcode.server");
          const location = dateActive.length ? await resolvePostcodeContext(property.postcode) : null;

          const reviewQueue: Array<{ schemeId: string; reason: string }> = [];
          let geographicalExclusions = 0;
          const eligibleForScreen = dateActive.filter((scheme) => {
            if (!scheme.reviewed_at) {
              reviewQueue.push({ schemeId: scheme.id, reason: "Human review date is missing" });
              return false;
            }
            if (!hasRecentSourceCheck(sourceById.get(scheme.source_id)?.last_checked_at ?? null, now)) {
              reviewQueue.push({ schemeId: scheme.id, reason: "Source check is missing or older than 90 days" });
              return false;
            }
            const geography = evaluateSchemeGeography(scheme.geography, location);
            if (geography.status === "excluded") {
              geographicalExclusions++;
              return false;
            }
            if (geography.status === "review_required") {
              reviewQueue.push({ schemeId: scheme.id, reason: geography.reason });
              return false;
            }
            return true;
          });

          const decision = runFundingAgent({
            emptyMonths: monthsSince(property.empty_since),
            ownerType: property.owner_type,
            intendedUse: property.intended_use,
          }, eligibleForScreen.map((scheme) => ({
            id: scheme.id,
            status: "reviewed" as const,
            authority: scheme.authority,
            maxAmount: scheme.max_amount,
            minimumEmptyMonths: scheme.min_empty_months,
            eligibleOwnerTypes: scheme.eligible_owner_types,
            eligibleUses: scheme.eligible_uses,
            sourceId: scheme.source_id,
          })));

          const screenedIds = new Set(decision.output.map((match) => match.schemeId));
          const { data: previous, error: previousError } = await supabaseAdmin.from("funding_matches")
            .select("id,scheme_id").eq("case_id", caseId);
          if (previousError) throw previousError;

          // A previously positive result cannot remain visible once source,
          // geographic scope, review state or validity has become uncertain.
          for (const record of previous ?? []) {
            if (screenedIds.has(record.scheme_id)) continue;
            const { error } = await supabaseAdmin.from("funding_matches")
              .update({
                eligible: false,
                confidence: null,
                explanation: {
                  status: "review_required",
                  reason: "Scheme no longer meets freshness, review, geographic or validity requirements.",
                },
              }).eq("id", record.id);
            if (error) throw error;
          }

          for (const match of decision.output) {
            const { error } = await supabaseAdmin.from("funding_matches").upsert({
              case_id: caseId,
              scheme_id: match.schemeId,
              eligible: match.eligible,
              confidence: null,
              explanation: {
                agent: decision.agent,
                reasons: decision.reasons,
                modelVersion: decision.modelVersion,
                assessmentType: "preliminary",
                sourceChecked: true,
                postcodeAuthorityChecked: true,
                requiresHumanReview: true,
                checkedAt: now.toISOString(),
              },
            }, { onConflict: "case_id,scheme_id" });
            if (error) throw error;
          }

          const { error: runError } = await supabaseAdmin.from("agent_runs").insert({
            case_id: caseId,
            agent: decision.agent,
            input: {
              postcode: property.postcode,
              localAuthorityCode: location?.localAuthorityCode ?? null,
              ownerType: property.owner_type,
              intendedUse: property.intended_use,
              vacancyMonths: monthsSince(property.empty_since),
            },
            output: {
              matches: decision.output,
              reviewQueue,
              geographicalExclusions,
            },
            confidence: null,
            requires_human_review: true,
            model_version: decision.modelVersion,
            sources: decision.sourceIds,
          });
          if (runError) throw runError;

          if (decision.output.some((match) => match.eligible)) {
            const { error: stageError } = await supabaseAdmin.from("cases")
              .update({ status: "funding" })
              .eq("id", caseId).in("status", ["intake", "assessment"]);
            if (stageError) throw stageError;
          }

          return Response.json({
            ...decision,
            status: reviewQueue.length || (!location && dateActive.length)
              ? "review_required"
              : "preliminary_screen",
            postcodeAuthority: location
              ? { name: location.authorityName, code: location.localAuthorityCode, nation: location.nation }
              : null,
            screenedSchemes: eligibleForScreen.length,
            excludedInactiveSchemes: (schemes ?? []).length - dateActive.length,
            excludedByGeography: geographicalExclusions,
            awaitingSourceOrGeographyReview: reviewQueue,
            sourceFreshnessDays: 90,
            note: "These are preliminary matches only; source freshness and postcode boundaries do not constitute grant approval or full scheme eligibility.",
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
