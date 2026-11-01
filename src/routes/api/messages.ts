import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const postSchema = z.object({
  caseId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
}).strict();

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const caseId = z.string().uuid().parse(new URL(request.url).searchParams.get("caseId"));
          const { supabaseAdmin, user } = await requireCaseAccess(request, caseId);
          const { data, error } = await supabaseAdmin.from("case_messages")
            .select("id,case_id,sender_id,sender_role,body,created_at")
            .eq("case_id", caseId)
            .order("created_at", { ascending: false })
            .limit(100);
          if (error) throw error;
          return Response.json({
            messages: (data ?? []).reverse(),
            viewerId: user.id,
            limitedTo: 100,
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = postSchema.parse(await request.json());
          const { user, supabaseAdmin, caseRole } = await requireCaseAction(request, body.caseId, "send_message");
          const { data: message, error } = await supabaseAdmin.from("case_messages")
            .insert({
              case_id: body.caseId,
              sender_id: user.id,
              sender_role: caseRole,
              message_type: "message",
              body: body.body,
            })
            .select("id,case_id,body,sender_id,sender_role,created_at")
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
