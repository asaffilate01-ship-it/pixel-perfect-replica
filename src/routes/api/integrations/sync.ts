import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const schema = z.object({
  integration: z.enum(["leadlens", "dokuvera", "gabley", "gabley_retrofit", "craftvaro"]),
  jobType: z.string().trim().min(1).max(60).default("sync"),
  caseId: z.string().uuid(),
});

export const Route = createFileRoute("/api/integrations/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = schema.parse(await request.json());
          const { user, supabaseAdmin } = await requireCaseAction(request, input.caseId, "match_funding");
          const { data: job, error } = await supabaseAdmin
            .from("integration_jobs")
            .insert({
              case_id: input.caseId,
              integration: input.integration,
              job_type: input.jobType,
              status: "pending_processor",
              request_payload: { requested_by: user.id, requested_at: new Date().toISOString() },
            })
            .select("id,case_id,integration,job_type,status,created_at")
            .single();
          if (error) throw error;
          return Response.json({
            job,
            status: "pending_processor",
            note: "Request saved to the integration job register; execution requires a configured worker.",
          }, { status: 202 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
