import { createFileRoute } from "@tanstack/react-router";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requirePlatformAdmin } from "@/lib/domureva/security/platform-admin.server";

export const Route = createFileRoute("/api/admin/security")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { supabaseAdmin } = await requirePlatformAdmin(request);
          const [risks, failures, activity, incidents] = await Promise.all([
            supabaseAdmin.from("risk_register")
              .select("id,title,severity,likelihood,status,scope,updated_at")
              .neq("status", "closed").order("updated_at", { ascending: false }).limit(50),
            supabaseAdmin.from("integration_events")
              .select("id,provider,event_type,status,created_at")
              .eq("status", "failed").order("created_at", { ascending: false }).limit(30),
            supabaseAdmin.from("audit_log")
              .select("id,action,entity_type,created_at")
              .order("created_at", { ascending: false }).limit(50),
            supabaseAdmin.from("incident_records")
              .select("id,incident_type,summary,status,severity,detected_at")
              .neq("status", "resolved").order("detected_at", { ascending: false }).limit(30),
          ]);
          for (const result of [risks, failures, activity, incidents]) {
            if (result.error) throw result.error;
          }
          return Response.json({
            risks: risks.data ?? [],
            failedEvents: failures.data ?? [],
            activity: activity.data ?? [],
            incidents: incidents.data ?? [],
            countsAreLimited: true,
            note: "Recent recorded events only. Empty logs do not prove a system is secure or compliant.",
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
