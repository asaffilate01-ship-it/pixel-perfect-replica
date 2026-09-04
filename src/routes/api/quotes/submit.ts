import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  quoteRequestId: z.string().uuid(),
  contractorOrgId: z.string().uuid(),
  amount: z.number().positive(),
  details: z.record(z.any()).default({}),
});

export const Route = createFileRoute("/api/quotes/submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const b = schema.parse(await request.json());
          const { user } = await requireUser(request);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: m } = await supabaseAdmin
            .from("organisation_members")
            .select("role")
            .eq("org_id", b.contractorOrgId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (!m || !["contractor", "admin"].includes(m.role)) {
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });
          }

          const { data, error } = await supabaseAdmin
            .from("quotes")
            .insert({
              quote_request_id: b.quoteRequestId,
              contractor_org_id: b.contractorOrgId,
              amount: b.amount,
              details: b.details,
              status: "submitted",
            })
            .select()
            .single();
          if (error) throw error;

          return Response.json({ quote: data }, { status: 201 });
        } catch (e) {
          return errorResponse(e, 400);
        }
      },
    },
  },
});
