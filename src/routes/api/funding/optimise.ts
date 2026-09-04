import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { optimiseFundingStack, fundingSummary, type WorkItem, type Scheme } from "@/lib/domureva/funding/stack-optimizer";

export const Route = createFileRoute("/api/funding/optimise")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireUser(request);
          const body = await request.json();
          const work: WorkItem[] = Array.isArray(body.work) ? body.work : [];
          const schemes: Scheme[] = Array.isArray(body.schemes) ? body.schemes : [];
          const allocations = optimiseFundingStack(work, schemes);
          return Response.json({
            allocations,
            summary: fundingSummary(work, allocations),
            warning:
              "Proposed allocation only. Scheme rules and double-funding restrictions must be reviewed before submission.",
          });
        } catch (e) {
          return errorResponse(e, 400);
        }
      },
    },
  },
});
