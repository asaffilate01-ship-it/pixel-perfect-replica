import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import {
  optimiseFundingStack,
  fundingSummary,
  type WorkItem,
  type Scheme,
} from "@/lib/domureva/funding/stack-optimizer";

const requestSchema = z.object({ caseId: z.string().uuid() }).strict();

export const Route = createFileRoute("/api/funding/optimise")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { caseId } = requestSchema.parse(await request.json());
          const { supabaseAdmin } = await requireCaseAction(request, caseId, "match_funding");
          const [workResult, matchResult] = await Promise.all([
            supabaseAdmin.from("funding_work_items")
              .select("id,description,category,estimated_cost").eq("case_id", caseId).limit(100),
            supabaseAdmin.from("funding_matches")
              .select("scheme_id,eligible").eq("case_id", caseId).eq("eligible", true).limit(100),
          ]);
          if (workResult.error || matchResult.error) throw new Error("FUNDING_CASE_DATA_UNAVAILABLE");

          const today = new Date().toISOString().slice(0, 10);
          const matchedIds = [...new Set((matchResult.data ?? []).map((item) => item.scheme_id))];
          const source = matchedIds.length
            ? await supabaseAdmin.from("funding_schemes")
                .select("id,name,authority,max_amount,eligible_works,status,valid_from,valid_to,source_id")
                .eq("status", "reviewed").in("id", matchedIds).limit(100)
            : { data: [], error: null };
          if (source.error) throw new Error("REVIEWED_SCHEMES_UNAVAILABLE");

          const excluded: Array<{ schemeId: string; reason: string }> = [];
          const candidateSchemes: Scheme[] = [];
          const schemeNames: Record<string, string> = {};
          for (const record of source.data ?? []) {
            if (record.valid_from && record.valid_from > today) {
              excluded.push({ schemeId: record.id, reason: "Scheme is not active yet" });
            } else if (record.valid_to && record.valid_to < today) {
              excluded.push({ schemeId: record.id, reason: "Scheme validity date has passed" });
            } else if (record.max_amount == null || !Number.isFinite(Number(record.max_amount)) || Number(record.max_amount) <= 0) {
              excluded.push({ schemeId: record.id, reason: "No usable documented scheme cap" });
            } else if (!record.eligible_works.length) {
              excluded.push({ schemeId: record.id, reason: "Eligible work categories are not recorded" });
            } else {
              schemeNames[record.id] = record.name;
              candidateSchemes.push({
                id: record.id,
                maxAward: Number(record.max_amount),
                eligibleCategories: record.eligible_works,
                contributionRate: 1, // A scheme-specific contribution rate is not present in the DB schema.
              });
            }
          }

          const recordedWork: WorkItem[] = (workResult.data ?? []).map((item) => ({
            id: item.id,
            category: item.category,
            cost: Number(item.estimated_cost),
          }));
          const allocations = optimiseFundingStack(recordedWork, candidateSchemes);
          const summary = fundingSummary(recordedWork, allocations);

          return Response.json({
            caseId,
            status: "preliminary_estimate",
            workItems: (workResult.data ?? []).map((item) => ({
              id: item.id,
              description: item.description,
              category: item.category,
              estimatedCost: Number(item.estimated_cost),
            })),
            schemes: candidateSchemes.map((scheme) => ({
              id: scheme.id,
              name: schemeNames[scheme.id] ?? "Reviewed scheme",
              maxAward: scheme.maxAward,
              eligibleWorks: scheme.eligibleCategories,
            })),
            excluded,
            allocations,
            summary,
            requiresHumanReview: true,
            warnings: [
              "Illustrative allocation only. This does not confirm funding eligibility or approval.",
              "Scheme geography, subsidy controls, overlapping grants, eligible costs and source freshness are not fully validated.",
              "Contribution rates are not stored in the current scheme schema; calculations assume up to 100% until verified.",
              "Any changes to scheme conditions require an authorised human reviewer.",
            ],
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
