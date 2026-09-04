import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  milestoneId: z.string().uuid(),
  evidenceIds: z.array(z.string().uuid()).default([]),
});

export const Route = createFileRoute("/api/workflow/complete-milestone")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const b = schema.parse(await request.json());
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: m, error } = await supabaseAdmin
            .from("project_milestones")
            .select("*")
            .eq("id", b.milestoneId)
            .single();
          if (error) throw error;

          if ((m.evidence_required || []).length && !b.evidenceIds.length) {
            return Response.json(
              { error: "Evidence is required before this milestone can be completed." },
              { status: 409 },
            );
          }

          const { data, error: ue } = await supabaseAdmin
            .from("project_milestones")
            .update({ status: "complete", completed_at: new Date().toISOString() })
            .eq("id", b.milestoneId)
            .select()
            .single();
          if (ue) throw ue;

          return Response.json(data);
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
        }
      },
    },
  },
});
