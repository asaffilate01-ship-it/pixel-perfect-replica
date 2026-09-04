import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

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
        try {
          await requireUser(request);
        } catch (e) {
          return errorResponse(e, 401);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
