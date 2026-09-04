import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";
import { leadLensLive } from "@/lib/domureva/integrations/leadlensLive";

const schema = z.object({
  caseId: z.string().uuid(),
  postcode: z.string().min(5),
});

export const Route = createFileRoute("/api/integrations/discover")({
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

          void user;
          const job = await leadLensLive.discover({
            case_id: body.caseId,
            postcode: body.postcode,
            categories: ["empty_homes_funding", "retrofit_funding", "registered_providers", "contractors"],
          });
          return Response.json({ job });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
