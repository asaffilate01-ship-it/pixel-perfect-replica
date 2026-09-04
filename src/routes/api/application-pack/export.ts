import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/application-pack/export")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireUser(request);
          const { caseId } = await request.json();
          if (!caseId) return Response.json({ error: "caseId required" }, { status: 400 });
          return Response.json(
            {
              status: "queued",
              caseId,
              requestedBy: user.id,
              message: "Application pack export queued. Export must contain source provenance and evidence manifest.",
            },
            { status: 202 },
          );
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
