import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";

export const Route = createFileRoute("/api/documents/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const parsed = z.string().uuid().safeParse(new URL(request.url).searchParams.get("caseId"));
          if (!parsed.success) return Response.json({ error: "A valid caseId is required." }, { status: 400 });

          const { supabaseAdmin } = await requireCaseAction(request, parsed.data, "read_documents");
          const { data: documents, error } = await supabaseAdmin
            .from("case_documents")
            .select("id,case_id,category,filename,mime_type,byte_size,sha256,verified_at,created_at")
            .eq("case_id", parsed.data)
            .order("created_at", { ascending: false })
            .limit(100);
          if (error) throw error;
          // Do not return Storage paths or signed URLs for unverified files.
          return Response.json({ caseId: parsed.data, documents: documents ?? [] });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
