import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

const S = z.object({
  caseId: z.string().uuid(),
  outcome: z.enum(["owner_occupied", "private_rented", "social_rented", "affordable_rented", "sold", "other"]),
  occupiedAt: z.string().optional(),
  bedroomsReturned: z.number().int().min(0).optional(),
  affordableHome: z.boolean().default(false),
});

export const Route = createFileRoute("/api/cases/outcome")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = S.safeParse(await request.json());
        if (!b.success) return Response.json({ error: b.error.flatten() }, { status: 400 });
        let access;
        try {
          access = await requireCaseAction(request, b.data.caseId, "record_outcome");
        } catch (e) {
          return errorResponse(e, 400);
        }
        const { user, supabaseAdmin } = access;
        const { data, error } = await supabaseAdmin
          .from("occupancy_outcomes")
          .upsert(
            {
              case_id: b.data.caseId,
              outcome: b.data.outcome,
              occupied_at: b.data.occupiedAt || null,
              bedrooms_returned: b.data.bedroomsReturned || null,
              affordable_home: b.data.affordableHome,
              verified_at: new Date().toISOString(),
              verified_by: user.id,
            },
            { onConflict: "case_id" },
          )
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 400 });

        await supabaseAdmin.from("learning_outcomes").insert({
          case_id: b.data.caseId,
          event: "property_returned_to_use",
          features: { ...b.data },
        });

        return Response.json({ data });
      },
    },
  },
});
