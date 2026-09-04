import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { councilImpact } from "@/lib/domureva/reports/council-impact";

export const Route = createFileRoute("/api/reports/council")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireUser(request);
          const b = await request.json();
          return Response.json(councilImpact(Array.isArray(b.cases) ? b.cases : []));
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
