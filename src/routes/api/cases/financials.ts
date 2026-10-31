import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ApiAuthError, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { canPerformCaseAction } from "@/lib/domureva/security/casePermissions";

const S = z.object({
  caseId: z.string().uuid(),
  estimatedWorks: z.number().nonnegative().optional(),
  approvedFunding: z.number().nonnegative().optional(),
  ownerContribution: z.number().nonnegative().optional(),
  committedContractValue: z.number().nonnegative().optional(),
  paidToDate: z.number().nonnegative().optional(),
});

export const Route = createFileRoute("/api/cases/financials")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = S.safeParse(await request.json());
        if (!b.success) return Response.json({ error: b.error.flatten() }, { status: 400 });
        let access;
        try {
          access = await requireCaseAction(request, b.data.caseId, "edit_financials");
          if (b.data.approvedFunding !== undefined && !canPerformCaseAction(access.caseRole, "set_approved_funding")) {
            throw new ApiAuthError("ONLY_AUTHORISED_REVIEWERS_CAN_SET_APPROVED_FUNDING", 403);
          }
        } catch (e) {
          return errorResponse(e, 400);
        }
        const { supabaseAdmin } = access;
        const x = b.data;
        const { data, error } = await supabaseAdmin
          .from("case_financials")
          .upsert(
            {
              case_id: x.caseId,
              estimated_works: x.estimatedWorks ?? null,
              approved_funding: x.approvedFunding ?? null,
              owner_contribution: x.ownerContribution ?? null,
              committed_contract_value: x.committedContractValue ?? null,
              paid_to_date: x.paidToDate ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "case_id" },
          )
          .select()
          .single();
        return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ data });
      },
    },
  },
});
