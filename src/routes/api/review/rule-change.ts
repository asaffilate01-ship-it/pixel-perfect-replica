import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireRole, errorResponse } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({ id: z.string().uuid(), decision: z.enum(["reviewed", "rejected"]) });

const allowedFields = [
  "authority",
  "name",
  "scheme_type",
  "max_amount",
  "min_empty_months",
  "eligible_owner_types",
  "eligible_uses",
  "eligible_works",
  "geography",
  "valid_from",
  "valid_to",
] as const;

export const Route = createFileRoute("/api/review/rule-change")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = schema.parse(await request.json());
          const { user } = await requireRole(request, ["admin", "council_officer"]);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: queued, error: qe } = await supabaseAdmin
            .from("rule_change_queue")
            .select("*")
            .eq("id", body.id)
            .single();
          if (qe) throw qe;
          if (queued.status !== "draft") {
            return Response.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
          }

          if (body.decision === "reviewed" && queued.scheme_id) {
            const proposed = (queued.proposed ?? {}) as Record<string, unknown>;
            const patch: Record<string, unknown> = {
              status: "reviewed" as const,
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
            };
            for (const f of allowedFields) {
              if (proposed[f] !== undefined) patch[f] = proposed[f];
            }
            const { error } = await supabaseAdmin
              .from("funding_schemes")
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .update(patch as any)
              .eq("id", queued.scheme_id);
            if (error) throw error;
          }

          const { data: change, error } = await supabaseAdmin
            .from("rule_change_queue")
            .update({ status: body.decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
            .eq("id", body.id)
            .select()
            .single();
          if (error) throw error;

          return Response.json({ change });
        } catch (e) {
          return errorResponse(e, 400);
        }
      },
    },
  },
});
