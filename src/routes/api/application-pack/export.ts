import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import { buildCasePackPreview } from "@/lib/domureva/application-pack/preview.server";

const schema = z.object({ caseId: z.string().uuid() });

export const Route = createFileRoute("/api/application-pack/export")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { caseId } = schema.parse(await request.json());
          const { user, supabaseAdmin, property } = await requireCaseAction(request, caseId, "export_pack");
          const preview = await buildCasePackPreview(supabaseAdmin, caseId, property);

          // Audit the authenticated download before streaming it to the caller.
          // No PDF renderer or storage worker is configured; deliver the actual
          // auditable JSON artifact rather than falsely claiming a PDF is queued.
          const { error: auditError } = await supabaseAdmin.from("audit_log").insert({
            actor_id: user.id,
            entity_type: "case",
            entity_id: caseId,
            action: "application_pack_audit_json_export",
            after: {
              manifestHash: preview.manifest.manifestHash,
              format: "application/json",
              recordCount: preview.manifest.items.length,
            },
          });
          if (auditError) throw auditError;

          return new Response(JSON.stringify(preview, null, 2), {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Content-Disposition": `attachment; filename="domureva-${caseId.slice(0, 8)}-audit.json"`,
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
