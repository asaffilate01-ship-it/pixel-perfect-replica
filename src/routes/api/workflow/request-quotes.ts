import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ApiAuthError, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";

const schema = z.object({ caseId: z.string().uuid(), workScope: z.record(z.any()) });

export const Route = createFileRoute("/api/workflow/request-quotes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const b = schema.parse(await request.json());
          const { supabaseAdmin, caseRole } = await requireCaseAccess(request, b.caseId);
          if (!["owner", "council_officer", "housing_provider", "admin"].includes(caseRole)) {
            throw new ApiAuthError("FORBIDDEN", 403);
          }
          const { data, error } = await supabaseAdmin
            .from("quote_requests")
            .insert({ case_id: b.caseId, work_scope: b.workScope, status: "open" })
            .select()
            .single();
          if (error) throw error;
          await supabaseAdmin.from("cases").update({ status: "quotes" }).eq("id", b.caseId);
          return Response.json(data, { status: 201 });
        } catch (e) {
          return errorResponse(e, 400);
        }
      },
    },
  },
});
