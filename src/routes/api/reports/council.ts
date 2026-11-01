import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { councilImpact, type CouncilCaseMetric } from "@/lib/domureva/reports/council-impact";

const schema = z.object({
  caseIds: z.array(z.string().uuid()).min(1).max(30),
});

export const Route = createFileRoute("/api/reports/council")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { caseIds } = schema.parse(await request.json());
          const ids = [...new Set(caseIds)];
          const { supabaseAdmin } = await requireUser(request);

          // Verify every case independently. Client-supplied financial and
          // occupancy figures are not trusted inputs to an official report.
          for (const caseId of ids) {
            await requireCaseAction(request, caseId, "record_outcome");
          }

          const [cases, financials, outcomes, projects] = await Promise.all([
            supabaseAdmin.from("cases").select("id,status,created_at").in("id", ids),
            supabaseAdmin.from("case_financials").select("case_id,approved_funding").in("case_id", ids),
            supabaseAdmin.from("occupancy_outcomes").select("case_id,bedrooms_returned,occupied_at,verified_at").in("case_id", ids),
            supabaseAdmin.from("projects").select("case_id,budget").in("case_id", ids),
          ]);
          for (const response of [cases, financials, outcomes, projects]) if (response.error) throw response.error;

          const finances = new Map((financials.data ?? []).map((item) => [item.case_id, item]));
          const outcomesByCase = new Map((outcomes.data ?? []).map((item) => [item.case_id, item]));
          const projectsByCase = new Map((projects.data ?? []).map((item) => [item.case_id, item]));
          const metrics: CouncilCaseMetric[] = (cases.data ?? []).map((record) => {
            const outcome = outcomesByCase.get(record.id);
            const finance = finances.get(record.id);
            const project = projectsByCase.get(record.id);
            const occupied = Boolean(outcome?.occupied_at && outcome?.verified_at);
            const elapsed = occupied && outcome?.occupied_at
              ? Math.max(0, Math.round((Date.parse(outcome.occupied_at) - Date.parse(record.created_at)) / 86_400_000))
              : undefined;

            return {
              status: record.status,
              fundingApproved: finance?.approved_funding ?? 0,
              refurbValue: project?.budget ?? 0,
              bedroomsReturned: occupied ? (outcome?.bedrooms_returned ?? 0) : 0,
              completed: occupied,
              ...(elapsed === undefined ? {} : { daysToOccupation: elapsed }),
            };
          });

          return Response.json({
            ...councilImpact(metrics),
            scope: { authorisedCases: metrics.length },
            note: "Calculated from recorded case outcomes and approved financial entries; not independently audited.",
          }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
