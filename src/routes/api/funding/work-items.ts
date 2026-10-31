import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const requestSchema = z.object({
  caseId: z.string().uuid(),
  description: z.string().trim().min(5).max(300),
  category: z.string().trim().regex(/^[a-z][a-z0-9_-]*$/).min(2).max(60),
  estimatedCost: z.number().finite().positive().max(100_000_000),
}).strict();

export const Route = createFileRoute("/api/funding/work-items")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = requestSchema.parse(await request.json());
          const { user, supabaseAdmin } = await requireCaseAction(request, input.caseId, "match_funding");
          const { data: item, error } = await supabaseAdmin.from("funding_work_items")
            .insert({
              case_id: input.caseId,
              description: input.description,
              category: input.category,
              code: input.category + "-" + crypto.randomUUID().slice(0, 8),
              estimated_cost: Math.round(input.estimatedCost * 100) / 100,
            })
            .select("id,description,category,estimated_cost,created_at")
            .single();
          if (error) throw error;
          const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
            actor_id: user.id,
            entity_type: "funding_work_item",
            entity_id: item.id,
            action: "estimate_created",
            after: {
              caseId: input.caseId,
              estimatedCost: item.estimated_cost,
              category: item.category,
            },
          });
          if (auditError) {
            return Response.json({ error: "WORK_SAVED_AUDIT_PENDING", item }, { status: 500 });
          }

          return Response.json({
            item,
            status: "recorded_estimate",
            note: "This amount is an estimate, not an approved grant or contractor quotation.",
          }, { status: 201 });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
