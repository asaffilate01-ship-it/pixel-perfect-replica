import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { buildPackSpec } from "@/lib/domureva/applications/pdf-spec";

export const Route = createFileRoute("/api/application-pack/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireUser(request);
          const b = await request.json();
          if (!b.caseId || !b.propertyAddress || !b.schemeTitle) {
            return Response.json({ error: "Missing pack data" }, { status: 400 });
          }
          const spec = buildPackSpec({
            caseId: b.caseId,
            propertyAddress: b.propertyAddress,
            schemeTitle: b.schemeTitle,
            eligibilitySummary: b.eligibilitySummary || "",
            sections: b.sections || [],
          });
          return Response.json({
            status: spec.complete ? "ready" : "incomplete",
            requestedBy: user.id,
            spec,
            pdfGeneration: "queued",
          });
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
