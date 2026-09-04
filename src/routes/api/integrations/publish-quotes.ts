import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";
import { craftvaroLive } from "@/lib/domureva/integrations/craftvaroLive";

const schema = z.object({ quoteRequestId: z.string().uuid() });

export const Route = createFileRoute("/api/integrations/publish-quotes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          const { data: q } = await supabaseAdmin
            .from("quote_requests")
            .select("id,case_id,work_scope,status")
            .eq("id", body.quoteRequestId)
            .single();
          if (!q) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

          const quoteRequest = q as { id: string; case_id: string; work_scope: unknown; status: string };
          const result = await craftvaroLive.publishOpportunity({
            domureva_quote_request_id: quoteRequest.id,
            case_id: quoteRequest.case_id,
            work_scope: quoteRequest.work_scope,
            callback_url: `${new URL(request.url).origin}/api/public/integrations/craftvaro-webhook`,
          });
          await supabaseAdmin.from("quote_requests").update({ status: "published" } as never).eq("id", quoteRequest.id);
          return Response.json(result);
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
