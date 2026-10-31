import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";

const schema = z.object({
  caseId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = schema.parse(await request.json());
          const { user, supabaseAdmin, caseRole } = await requireCaseAccess(request, body.caseId);

          const { data: message, error } = await supabaseAdmin
            .from("case_messages")
            .insert({
              case_id: body.caseId,
              sender_id: user.id,
              sender_role: caseRole,
              message_type: "message",
              body: body.body,
            })
            .select("id, case_id, body, sender_id, sender_role, created_at")
            .single();
          if (error) throw error;
          return Response.json({ status: "sent", message }, { status: 201 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
