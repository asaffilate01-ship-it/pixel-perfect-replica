import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";
import { gableyRetrofitLive } from "@/lib/domureva/integrations/gableyRetrofitLive";

const schema = z.object({ caseId: z.string().uuid() });

export const Route = createFileRoute("/api/integrations/retrofit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          const { data: c } = await supabaseAdmin
            .from("cases")
            .select("id,property_id")
            .eq("id", body.caseId)
            .single();
          if (!c) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

          const result = await gableyRetrofitLive.requestAssessment({
            case_id: body.caseId,
            property_id: (c as { property_id: string | null }).property_id,
            callback_url: `${new URL(request.url).origin}/api/public/integrations/gabley-retrofit-webhook`,
          });
          return Response.json(result);
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
