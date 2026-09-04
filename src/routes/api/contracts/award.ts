import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/contracts/award")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireUser(request);
          const b = await request.json();
          if (!b.caseId || !b.quoteId || !b.quoteRequestId || !(Number(b.contractValue) > 0)) {
            return Response.json({ error: "Incomplete award" }, { status: 400 });
          }
          return Response.json({ status: "proposed", ...b, awardedBy: user.id }, { status: 201 });
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
