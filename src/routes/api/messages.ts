import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireUser(request);
          const b = await request.json();
          if (!b.caseId || !String(b.body || "").trim()) {
            return Response.json({ error: "caseId and body required" }, { status: 400 });
          }
          return Response.json(
            { status: "sent", caseId: b.caseId, sender: user.id, body: String(b.body).trim() },
            { status: 201 },
          );
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
