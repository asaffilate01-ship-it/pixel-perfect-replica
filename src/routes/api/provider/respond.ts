import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  opportunityId: z.string().uuid(),
  providerOrgId: z.string().uuid(),
  response: z.enum(["interested", "declined", "request_info"]),
  note: z.string().max(2000).optional(),
});

export const Route = createFileRoute("/api/provider/respond")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          const { data: membership } = await supabaseAdmin
            .from("organisation_members")
            .select("role")
            .eq("org_id", body.providerOrgId)
            .eq("user_id", user.id)
            .maybeSingle();
          const role = (membership as { role: string } | null)?.role;
          if (!role || !["housing_provider", "admin"].includes(role)) {
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });
          }
          const { data, error } = await supabaseAdmin
            .from("provider_responses")
            .upsert(
              {
                opportunity_id: body.opportunityId,
                provider_org_id: body.providerOrgId,
                responder_id: user.id,
                response: body.response,
                note: body.note || null,
              } as never,
              { onConflict: "opportunity_id,provider_org_id" },
            )
            .select()
            .single();
          if (error) throw error;
          return Response.json({ response: data });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
