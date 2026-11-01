import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const amount = z.number().finite().nonnegative().max(1_000_000_000);
const schema = z.object({
  caseId: z.string().uuid(),
  estimatedWorks: amount.optional(),
  ownerContribution: amount.optional(),
}).strict().refine(
  (input) => input.estimatedWorks !== undefined || input.ownerContribution !== undefined,
  "At least one estimate must be provided",
);

/**
 * Users may record estimates; they may not self-certify approved grants,
 * executed contracts or paid balances through this endpoint. Those values
 * must be reconciled from authoritative funding, award and payment records.
 */
export const Route = createFileRoute("/api/cases/financials")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          const { user, supabaseAdmin } = await requireCaseAction(request, input.caseId, "edit_financials");
          const patch = {
            case_id: input.caseId,
            ...(input.estimatedWorks === undefined
              ? {} : { estimated_works: Math.round(input.estimatedWorks * 100) / 100 }),
            ...(input.ownerContribution === undefined
              ? {} : { owner_contribution: Math.round(input.ownerContribution * 100) / 100 }),
            updated_at: new Date().toISOString(),
          };
          // Update only fields actually supplied so a partial estimate cannot
          // reset an existing council decision or paid balance to null.
          const { data, error } = await supabaseAdmin.from("case_financials").upsert(
            patch,
            { onConflict: "case_id" },
          ).select("id,case_id,estimated_works,owner_contribution,approved_funding,committed_contract_value,paid_to_date,updated_at").single();
          if (error) throw error;

          const audit = await supabaseAdmin.from("audit_log").insert({
            actor_id: user.id,
            entity_type: "case_financials",
            entity_id: data.id,
            action: "financial_estimates_updated",
            after: {
              caseId: input.caseId,
              ...(input.estimatedWorks === undefined ? {} : { estimatedWorks: data.estimated_works }),
              ...(input.ownerContribution === undefined ? {} : { ownerContribution: data.owner_contribution }),
            },
          });
          if (audit.error) return Response.json({ error: "ESTIMATES_SAVED_AUDIT_FAILED" }, { status: 500 });

          return Response.json({
            status: "estimates_saved",
            data,
            note: "Amounts entered here are estimates. Approved funding, awarded contracts and payments cannot be changed using this API.",
          });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
