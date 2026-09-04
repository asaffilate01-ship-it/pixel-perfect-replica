import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";
import { dokuveraLive } from "@/lib/domureva/integrations/dokuveraLive";

const schema = z.object({
  caseId: z.string().uuid(),
  kinds: z.array(z.string()).min(1),
});

export const Route = createFileRoute("/api/integrations/evidence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          const { data: c } = await supabaseAdmin
            .from("cases")
            .select("id")
            .eq("id", body.caseId)
            .single();
          if (!c) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

          const result = await dokuveraLive.createCase({
            domureva_case_id: body.caseId,
            user_id: user.id,
            required_evidence: body.kinds,
            callback_url: `${new URL(request.url).origin}/api/public/integrations/dokuvera-webhook`,
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
