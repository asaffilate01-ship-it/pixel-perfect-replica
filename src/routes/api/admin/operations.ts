import { createFileRoute } from "@tanstack/react-router";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requirePlatformAdmin } from "@/lib/domureva/security/platform-admin.server";

export const Route = createFileRoute("/api/admin/operations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { supabaseAdmin } = await requirePlatformAdmin(request);
          const [events, jobs, sourceHealth] = await Promise.all([
            supabaseAdmin.from("integration_events")
              .select("id,provider,event_type,status,created_at,processed_at,error")
              .order("created_at", { ascending: false }).limit(100),
            supabaseAdmin.from("integration_jobs")
              .select("id,case_id,integration,job_type,status,attempts,next_attempt_at,created_at,last_error")
              .order("created_at", { ascending: false }).limit(100),
            supabaseAdmin.from("funding_source_health")
              .select("source_key,status,last_success_at,last_failure_at,consecutive_failures")
              .order("source_key", { ascending: true }).limit(100),
          ]);
          for (const result of [events, jobs, sourceHealth]) {
            if (result.error) throw result.error;
          }

          return Response.json({
            eventRecords: events.data ?? [],
            jobs: jobs.data ?? [],
            sourceHealth: sourceHealth.data ?? [],
            limits: { events: 100, jobs: 100, sources: 100 },
            note: "Historical records only. The absence of failures is not proof an integration is healthy or its credentials are configured.",
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
