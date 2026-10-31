import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

const bodySchema = z.object({
  postcode: z.string().min(5).max(10),
  addressLine: z.string().min(3),
  emptySince: z.string().optional(),
  ownerType: z.string().min(2),
  intendedUse: z.string().min(2),
  condition: z.enum(["light_works", "moderate_refurbishment", "major_refurbishment", "structural_concerns"]).optional(),
});

export const Route = createFileRoute("/api/workflow/intake")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = bodySchema.parse(await request.json());
          const { user } = await requireUser(request);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: p, error: pe } = await supabaseAdmin
            .from("properties")
            .insert({
              created_by: user.id,
              postcode: body.postcode.toUpperCase().replace(/\s+/g, " ").trim(),
              address_line: body.addressLine,
              empty_since: body.emptySince || null,
              owner_type: body.ownerType,
              intended_use: body.intendedUse,
            })
            .select()
            .single();
          if (pe) throw pe;

          const { data: c, error: ce } = await supabaseAdmin
            .from("cases")
            .insert({ property_id: p.id, status: "intake" })
            .select()
            .single();
          if (ce) throw ce;

          let conditionSaved = true;
          if (body.condition) {
            const { error: conditionError } = await supabaseAdmin.from("property_answers").insert({
              case_id: c.id,
              created_by: user.id,
              question_key: "property_condition",
              answer: body.condition,
              source: "intake",
            });
            conditionSaved = !conditionError;
          }

          return Response.json({ property: p, case: c, conditionSaved }, { status: 201 });
        } catch (e) {
          return errorResponse(e, 400);
        }
      },
    },
  },
});
