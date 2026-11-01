import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { craftvaroLive } from "@/lib/domureva/integrations/craftvaroLive";

const schema = z.object({ quoteRequestId: z.string().uuid() });

export const Route = createFileRoute("/api/integrations/publish-quotes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await requireUser(request);
          const body = schema.parse(await request.json());
          const { data: q } = await supabaseAdmin
            .from("quote_requests")
            .select("id,case_id,work_scope,status")
            .eq("id", body.quoteRequestId)
            .single();
          if (!q) return Response.json({ error: "QUOTE_REQUEST_NOT_FOUND" }, { status: 404 });
          await requireCaseAction(request, q.case_id, "request_quotes");
          if (q.status !== "open") return Response.json({ error: "QUOTE_REQUEST_NOT_OPEN" }, { status: 409 });

          const quoteRequest = q as { id: string; case_id: string; work_scope: unknown; status: string };
          const result = await craftvaroLive.publishOpportunity({
            domureva_quote_request_id: quoteRequest.id,
            case_id: quoteRequest.case_id,
            work_scope: quoteRequest.work_scope,
            callback_url: `${new URL(request.url).origin}/api/public/integrations/craftvaro-webhook`,
          });
          const { error: statusError } = await supabaseAdmin.from("quote_requests").update({ status: "published" }).eq("id", quoteRequest.id);
          if (statusError) throw statusError;
          return Response.json(result);
        } catch (e) {
          if (e instanceof Response) return e;
          return errorResponse(e, 400);
        }
      },
    },
  },
});
