import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ApiAuthError, errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const schema = z.object({
  quoteRequestId: z.string().uuid(),
  contractorOrgId: z.string().uuid(),
  amount: z.number().finite().positive().max(1_000_000_000),
  details: z.record(z.string(), z.unknown()).default({}),
});

export const Route = createFileRoute("/api/quotes/submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          const { user, supabaseAdmin } = await requireUser(request);

          const { data: membership, error: memberError } = await supabaseAdmin
            .from("organisation_members")
            .select("role")
            .eq("org_id", input.contractorOrgId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (memberError) throw memberError;
          if (!membership || !["contractor", "admin"].includes(membership.role)) {
            throw new ApiAuthError("NOT_A_CONTRACTOR_ORG_MEMBER", 403);
          }

          const { data: profile, error: profileError } = await supabaseAdmin
            .from("contractor_profiles")
            .select("verified")
            .eq("organisation_id", input.contractorOrgId)
            .maybeSingle();
          if (profileError) throw profileError;
          if (!profile?.verified) throw new ApiAuthError("CONTRACTOR_VERIFICATION_REQUIRED", 403);

          const { data: target, error: targetError } = await supabaseAdmin
            .from("quote_requests")
            .select("id,case_id,status")
            .eq("id", input.quoteRequestId)
            .maybeSingle();
          if (targetError) throw targetError;
          if (!target) throw new ApiAuthError("QUOTE_REQUEST_NOT_FOUND", 404);

          // Direct in-app quotes require an explicit invitation onto the case.
          // The external Craftvaro channel follows its separate signed integration contract.
          await requireCaseAction(request, target.case_id, "submit_quote");

          if (target.status !== "open") {
            return Response.json({ error: "QUOTE_REQUEST_NOT_OPEN" }, { status: 409 });
          }
          const { data: previous, error: previousError } = await supabaseAdmin
            .from("quotes")
            .select("id")
            .eq("quote_request_id", input.quoteRequestId)
            .eq("contractor_org_id", input.contractorOrgId)
            .neq("status", "withdrawn")
            .limit(1)
            .maybeSingle();
          if (previousError) throw previousError;
          if (previous) return Response.json({ error: "QUOTE_ALREADY_SUBMITTED" }, { status: 409 });

          const { data: quote, error: quoteError } = await supabaseAdmin
            .from("quotes")
            .insert({
              quote_request_id: input.quoteRequestId,
              contractor_org_id: input.contractorOrgId,
              amount: Math.round(input.amount * 100) / 100,
              details: input.details,
              status: "submitted",
            })
            .select("id,quote_request_id,contractor_org_id,amount,status,created_at")
            .single();
          if (quoteError) throw quoteError;
          return Response.json({ quote }, { status: 201 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
