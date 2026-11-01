import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { gableyRetrofitLive } from "@/lib/domureva/integrations/gableyRetrofitLive";

const schema = z.object({ caseId: z.string().uuid() });

export const Route = createFileRoute("/api/integrations/retrofit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = schema.parse(await request.json());
          const { record } = await requireCaseAction(request, body.caseId, "match_funding");

          const result = await gableyRetrofitLive.requestAssessment({
            case_id: body.caseId,
            property_id: record.property_id,
            callback_url: `${new URL(request.url).origin}/api/public/integrations/gabley-retrofit-webhook`,
          });
          return Response.json(result);
        } catch (e) {
          if (e instanceof Response) return e;
          return errorResponse(e, 400);
        }
      },
    },
  },
});
