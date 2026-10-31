import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAction } from "@/lib/domureva/security/caseAction.server";
import {
  EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_BYTES,
  cleanEvidenceFilename,
  isEvidenceMime,
  matchesFileSignature,
} from "@/lib/domureva/documents/validation";

const fields = z.object({
  caseId: z.string().uuid(),
  category: z.string().regex(/^[a-z][a-z0-9_-]*$/).min(2).max(50),
});

const toHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

export const Route = createFileRoute("/api/documents/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const fieldsResult = fields.safeParse({
            caseId: String(form.get("caseId") ?? ""),
            category: String(form.get("category") ?? "other"),
          });
          if (!fieldsResult.success) {
            return Response.json({ error: "A valid case and document category are required." }, { status: 400 });
          }
          const file = form.get("file");
          if (!(file instanceof File) || file.size === 0) {
            return Response.json({ error: "Please select a non-empty document." }, { status: 400 });
          }
          if (!isEvidenceMime(file.type)) {
            return Response.json({ error: "Only PDF, JPEG, PNG and WebP evidence is accepted." }, { status: 415 });
          }
          if (file.size > MAX_EVIDENCE_BYTES) {
            return Response.json({ error: "Evidence files must be 20 MB or smaller." }, { status: 413 });
          }

          const { user, supabaseAdmin } = await requireCaseAction(request, fieldsResult.data.caseId, "upload_document");
          const bucketName = process.env["DOMUREVA_EVIDENCE_BUCKET"];
          if (!bucketName) {
            return Response.json({ error: "PRIVATE_EVIDENCE_STORAGE_NOT_CONFIGURED" }, { status: 503 });
          }

          const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket(bucketName);
          if (bucketError || !bucket || bucket.public) {
            return Response.json({ error: "PRIVATE_EVIDENCE_STORAGE_UNAVAILABLE" }, { status: 503 });
          }

          const buffer = await file.arrayBuffer();
          if (!matchesFileSignature(file.type, new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)))) {
            return Response.json({ error: "The file contents do not match its declared format." }, { status: 415 });
          }

          const sha256 = toHex(await crypto.subtle.digest("SHA-256", buffer));
          const suffix = EVIDENCE_MIME_TYPES[file.type];
          const filename = cleanEvidenceFilename(file.name);
          const objectPath = `${fieldsResult.data.caseId}/${crypto.randomUUID()}.${suffix}`;

          // Never put client-provided filenames in object paths. Private uploads
          // are unverified until a separate trusted review/malware scan succeeds.
          const { error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(objectPath, new Blob([buffer], { type: file.type }), {
              cacheControl: "0",
              contentType: file.type,
              upsert: false,
            });
          if (uploadError) {
            return Response.json({ error: "Document could not be stored securely." }, { status: 503 });
          }

          const { data: document, error: saveError } = await supabaseAdmin
            .from("case_documents")
            .insert({
              case_id: fieldsResult.data.caseId,
              owner_id: user.id,
              filename,
              category: fieldsResult.data.category,
              storage_path: objectPath,
              mime_type: file.type,
              byte_size: buffer.byteLength,
              sha256,
              evidence_provider: "domureva_pending_review",
              verified_at: null,
            })
            .select("id,case_id,filename,category,byte_size,sha256,created_at,verified_at")
            .single();

          if (saveError || !document) {
            // Do not leave orphaned private files after a failed metadata write.
            await supabaseAdmin.storage.from(bucketName).remove([objectPath]);
            return Response.json({ error: "Document metadata could not be saved." }, { status: 500 });
          }

          return Response.json(
            {
              status: "stored_unverified",
              document,
              note: "Your document was stored privately. It is not verified, virus-scanned or included in a submitted pack.",
            },
            { status: 201 },
          );
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
