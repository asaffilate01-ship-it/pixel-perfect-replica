import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ApiAuthError, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const schema = z.object({
  caseId: z.string().uuid(),
  quoteRequestId: z.string().uuid(),
  quoteId: z.string().uuid(),
  contractValue: z.number().finite().positive().max(1_000_000_000),
});

export const Route = createFileRoute("/api/contracts/award")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          const { supabaseAdmin } = await requireCaseAction(request, input.caseId, "propose_award");

          // Check every relationship server-side, not only the supplied UUIDs.
          const { data: quoteRequest, error: requestError } = await supabaseAdmin
            .from("quote_requests")
            .select("id,case_id,status")
            .eq("id", input.quoteRequestId)
            .maybeSingle();
          if (requestError) throw requestError;
          if (!quoteRequest || quoteRequest.case_id !== input.caseId) {
            throw new ApiAuthError("QUOTE_REQUEST_NOT_FOUND", 404);
          }
          if (quoteRequest.status !== "open") {
            return Response.json({ error: "QUOTE_REQUEST_NOT_OPEN" }, { status: 409 });
          }

          const { data: quote, error: quoteError } = await supabaseAdmin
            .from("quotes")
            .select("id,quote_request_id,contractor_org_id,status,amount")
            .eq("id", input.quoteId)
            .maybeSingle();
          if (quoteError) throw quoteError;
          if (!quote || quote.quote_request_id !== quoteRequest.id || !quote.contractor_org_id) {
            throw new ApiAuthError("QUOTE_NOT_FOUND_FOR_REQUEST", 404);
          }
          if (quote.status !== "submitted" || quote.amount == null) {
            return Response.json({ error: "QUOTE_NOT_SUBMITTED" }, { status: 409 });
          }
          if (Math.round(quote.amount * 100) !== Math.round(input.contractValue * 100)) {
            return Response.json({ error: "PROPOSED_VALUE_MUST_MATCH_QUOTE" }, { status: 409 });
          }

          const { data: existing, error: existingError } = await supabaseAdmin
            .from("contract_awards")
            .select("id,quote_id,status")
            .eq("quote_request_id", input.quoteRequestId)
            .in("status", ["proposed", "accepted", "awarded"])
            .limit(1)
            .maybeSingle();
          if (existingError) throw existingError;
          if (existing) {
            return Response.json(
              { error: "A proposal already exists for this request", existingProposalId: existing.id },
              { status: 409 },
            );
          }

          // A proposal is not a signed award, financial commitment or payment.
          const { data: proposal, error: proposalError } = await supabaseAdmin
            .from("contract_awards")
            .insert({
              case_id: input.caseId,
              quote_request_id: quoteRequest.id,
              quote_id: quote.id,
              contractor_org_id: quote.contractor_org_id,
              contract_value: quote.amount,
              status: "proposed",
              awarded_at: null,
            })
            .select("id,case_id,quote_id,quote_request_id,contract_value,status,created_at")
            .single();
          if (proposalError) throw proposalError;

          return Response.json(
            {
              status: "proposed",
              proposal,
              note: "Proposal recorded. No contract has been executed or funding disbursed.",
            },
            { status: 201 },
          );
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
