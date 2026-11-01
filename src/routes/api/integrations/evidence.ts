import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { dokuveraLive } from "@/lib/domureva/integrations/dokuveraLive";

const schema = z.object({
  caseId: z.string().uuid(),
  kinds: z.array(z.string().min(1)).min(1).max(50),
});

export const Route = createFileRoute("/api/integrations/evidence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = schema.parse(await request.json());

          const { user, supabaseAdmin } = await requireCaseAccess(request, body.caseId);

          const callbackUrl = `${new URL(request.url).origin}/api/public/integrations/dokuvera-webhook`;
          const requestId = crypto.randomUUID();

          const result = await dokuveraLive.createCase({
            request_id: requestId,
            domureva_case_id: body.caseId,
            user_id: user.id,
            required_evidence: body.kinds,
            callback_url: callbackUrl,
          });

          await supabaseAdmin.from("integration_events").insert({
            provider: "dokuvera",
            event_type: "evidence.requested",
            external_id: requestId,
            case_id: body.caseId,
            payload: {
              required_evidence: body.kinds,
              callback_url: callbackUrl,
            } as never,
            status: "processed",
            processed_at: new Date().toISOString(),
          } as never);

          return Response.json({ requestId, result });
        } catch (e) {
          if (e instanceof Response) return e;
          return errorResponse(e, 400);
        }
      },
    },
  },
});
