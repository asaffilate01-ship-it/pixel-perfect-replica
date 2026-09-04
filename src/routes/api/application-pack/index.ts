import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/application-pack/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { user } = await requireUser(request);
          const url = new URL(request.url);
          const caseId = url.searchParams.get("caseId");
          if (!caseId) return Response.json({ error: "caseId required" }, { status: 400 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: apps, error } = await supabaseAdmin
            .from("funding_applications")
            .select("id,status,scheme_id,application_requirements(*)")
            .eq("case_id", caseId);
          if (error) return Response.json({ error: error.message }, { status: 400 });

          return Response.json({ caseId, applications: apps, requestedBy: user.id });
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
