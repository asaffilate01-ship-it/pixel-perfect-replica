import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  requestType: z.enum(["access", "rectification", "erasure", "restriction", "portability"]),
});

export const Route = createFileRoute("/api/privacy/requests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { requestType } = schema.parse(await request.json());
          const { user, supabaseAdmin } = await requireUser(request);
          const { data: existing, error: lookupError } = await supabaseAdmin
            .from("data_subject_requests")
            .select("id,status,due_at")
            .eq("user_id", user.id)
            .eq("request_type", requestType)
            .in("status", ["received", "in_review", "processing"])
            .limit(1)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (existing) {
            return Response.json({ status: existing.status, requestId: existing.id, dueAt: existing.due_at });
          }

          const { data: created, error: saveError } = await supabaseAdmin
            .from("data_subject_requests")
            .insert({ user_id: user.id, request_type: requestType, status: "received" })
            .select("id,status,due_at")
            .single();
          if (saveError) throw saveError;

          return Response.json(
            { status: created.status, requestId: created.id, requestType, dueAt: created.due_at },
            { status: 201 },
          );
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
