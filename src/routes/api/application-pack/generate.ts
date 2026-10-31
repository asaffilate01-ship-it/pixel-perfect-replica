import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { buildCasePackPreview } from "@/lib/domureva/application-pack/preview.server";

const schema = z.object({ caseId: z.string().uuid() });

export const Route = createFileRoute("/api/application-pack/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { caseId } = schema.parse(await request.json());
          const { supabaseAdmin, property } = await requireCaseAction(request, caseId, "preview_pack");
          const preview = await buildCasePackPreview(supabaseAdmin, caseId, property);
          return Response.json(preview, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
