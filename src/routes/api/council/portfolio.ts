import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { groupCouncilPortfolio, outwardCode } from "@/lib/domureva/council/portfolio";

export const Route = createFileRoute("/api/council/portfolio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireUser(request);

          // Council organisation roles by themselves are not authority over
          // another owner's home. Use explicit case-level invitations only.
          const { data: memberRows, error: memberError } = await supabaseAdmin
            .from("case_members").select("case_id")
            .eq("user_id", user.id).eq("role", "council_officer")
            .limit(100);
          if (memberError) throw memberError;
          const caseIds = [...new Set((memberRows ?? []).map((member) => member.case_id))];
          if (!caseIds.length) {
            return Response.json({
              portfolio: { total: 0, byStatus: {}, byArea: [] },
              cases: [],
              scope: "explicit_case_membership",
              limitedTo: 100,
              note: "No council case assignments found for this account.",
            }, { headers: { "Cache-Control": "private, no-store" } });
          }

          const { data: rows, error: caseError } = await supabaseAdmin.from("cases")
            .select("id,status,created_at,properties(postcode,empty_since)")
            .in("id", caseIds).order("created_at", { ascending: false }).limit(100);
          if (caseError) throw caseError;
          const cases = (rows ?? []).map((record) => {
            const property = Array.isArray(record.properties) ? record.properties[0] : record.properties;
            return {
              id: record.id,
              status: record.status,
              created_at: record.created_at,
              postcode: property?.postcode ?? "",
              empty_since: property?.empty_since ?? null,
            };
          });
          const portfolio = groupCouncilPortfolio(cases);
          return Response.json({
            portfolio,
            cases: cases.map((record) => ({
              caseId: record.id,
              status: record.status,
              outcode: outwardCode(record.postcode),
              openedAt: record.created_at,
              emptySince: record.empty_since,
            })),
            scope: "explicit_case_membership",
            limitedTo: 100,
            note: "Council portfolio aggregates assigned cases only. Full property locations, geotags and owner identities are omitted.",
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
