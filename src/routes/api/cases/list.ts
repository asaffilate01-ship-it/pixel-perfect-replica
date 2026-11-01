import { createFileRoute } from "@tanstack/react-router";

import { errorResponse, requireUser } from "@/lib/domureva/security/apiAuth.server";

export const Route = createFileRoute("/api/cases/list")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireUser(request);
          const [properties, memberships] = await Promise.all([
            supabaseAdmin.from("properties").select("id")
              .eq("created_by", user.id).limit(200),
            supabaseAdmin.from("case_members").select("case_id,role")
              .eq("user_id", user.id).limit(200),
          ]);
          if (properties.error || memberships.error) throw new Error("CASE_DIRECTORY_UNAVAILABLE");

          const propertyIds = (properties.data ?? []).map((item) => item.id);
          const ownCases = propertyIds.length
            ? await supabaseAdmin.from("cases").select("id")
                .in("property_id", propertyIds).limit(200)
            : { data: [], error: null };
          if (ownCases.error) throw new Error("CASE_DIRECTORY_UNAVAILABLE");

          const ownedIds = new Set((ownCases.data ?? []).map((item) => item.id));
          const membershipsByCase = new Map(
            (memberships.data ?? []).map((item) => [item.case_id, item.role]),
          );
          const ids = [...new Set([...ownedIds, ...membershipsByCase.keys()])].slice(0, 200);
          if (!ids.length) {
            return Response.json({ cases: [], limitedTo: 200, scope: "owned_or_explicit_member" },
              { headers: { "Cache-Control": "private, no-store" } });
          }

          const { data: records, error } = await supabaseAdmin.from("cases")
            .select("id,status,created_at,properties(address_line,postcode)")
            .in("id", ids)
            .order("created_at", { ascending: false })
            .limit(200);
          if (error) throw error;

          const cases = (records ?? []).map((item) => ({
            id: item.id,
            status: item.status,
            created_at: item.created_at,
            properties: Array.isArray(item.properties) ? item.properties[0] ?? null : item.properties,
            caseRole: ownedIds.has(item.id) ? "owner" : membershipsByCase.get(item.id) ?? "member",
          }));

          return Response.json({
            cases,
            scope: "owned_or_explicit_member",
            limitedTo: 200,
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
