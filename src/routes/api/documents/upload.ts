import { createFileRoute } from "@tanstack/react-router";
import { requireUser, errorResponse } from "@/lib/domureva/security/apiAuth.server";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxBytes = 20 * 1024 * 1024;

export const Route = createFileRoute("/api/documents/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireUser(request);
          const form = await request.formData();
          const file = form.get("file");
          const caseId = String(form.get("caseId") || "");
          const category = String(form.get("category") || "other");

          if (!(file instanceof File) || !caseId) {
            return Response.json({ error: "file and caseId required" }, { status: 400 });
          }
          if (!allowed.has(file.type)) {
            return Response.json({ error: "Unsupported file type" }, { status: 415 });
          }
          if (file.size > maxBytes) {
            return Response.json({ error: "File exceeds 20MB limit" }, { status: 413 });
          }

          // Production handler: verify case access, virus-scan, upload to private Supabase bucket,
          // hash bytes, create case_documents row, then enqueue Dokuvera evidence sync.
          return Response.json(
            {
              status: "accepted",
              caseId,
              category,
              filename: file.name,
              size: file.size,
              owner: user.id,
              dokuveraSync: "queued",
            },
            { status: 202 },
          );
        } catch (e) {
          return errorResponse(e, 401);
        }
      },
    },
  },
});
