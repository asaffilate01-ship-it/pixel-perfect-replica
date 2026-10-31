import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";

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
          const { supabaseAdmin } = await requireUser(request);

          const { data: m, error } = await supabaseAdmin
            .from("project_milestones")
            .select("*")
            .eq("id", b.milestoneId)
            .single();
          if (error) throw error;

          const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .select("case_id")
            .eq("id", m.project_id)
            .maybeSingle();
          if (projectError || !project) throw new Error("Project not found");
          await requireCaseAccess(request, project.case_id);

          if (b.evidenceIds.length) {
            const { data: evidence, error: evidenceError } = await supabaseAdmin
              .from("evidence_items")
              .select("id, verified")
              .eq("case_id", project.case_id)
              .in("id", b.evidenceIds);
            if (evidenceError) throw evidenceError;
            if (evidence?.length !== new Set(b.evidenceIds).size || evidence.some((item) => !item.verified)) {
              return Response.json({ error: "Evidence must be verified and belong to this case." }, { status: 409 });
            }
          }

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
          return errorResponse(e, 400);
        }
      },
    },
  },
});
