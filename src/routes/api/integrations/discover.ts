import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { leadLensLive } from "@/lib/domureva/integrations/leadlensLive";

const schema = z.object({
  caseId: z.string().uuid(),
  postcode: z.string().min(5).optional(),
});

export const Route = createFileRoute("/api/integrations/discover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = schema.parse(await request.json());

          const { supabaseAdmin, property } = await requireCaseAccess(request, body.caseId);
          const job = await leadLensLive.discover({
            case_id: body.caseId,
            postcode: property.postcode,
            categories: ["empty_homes_funding", "retrofit_funding", "registered_providers", "contractors"],
          });
          return Response.json({ job });
        } catch (e) {
          if (e instanceof Response) return e;
          return errorResponse(e, 400);
        }
      },
    },
  },
});
