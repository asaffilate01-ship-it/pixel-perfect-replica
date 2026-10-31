# DOMUREVA — private evidence storage setup

The evidence-upload endpoint now performs a real server-authorised upload and creates a `case_documents` record. It intentionally does **not** describe new files as verified, virus scanned, or ready for an official application.

## Deployment requirements

1. In **DOMUREVA's own Supabase project**, create a Storage bucket, e.g. `domureva-evidence`. Set **Public = off** and a 20 MB maximum object size. Allow only `application/pdf`, `image/jpeg`, `image/png` and `image/webp` (with the usual awareness that MIME checks are not a malware scan).
2. Set the server-only secret `DOMUREVA_EVIDENCE_BUCKET=domureva-evidence`, alongside the already-required `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never add these values to `VITE_*` variables or commit secret credentials.
3. Only the authorised `/api/documents/upload` handler writes objects via the privileged server client. Do **not** grant a public read policy on this bucket. Keep objects private, and do not expose Storage URLs from the metadata listing endpoint.
4. Use the `/api/documents/?caseId=...` endpoint to list only the filename, document ID, size, category, hash, capture date and verification date of files belonging to an authorised case.
5. Integrate a real malware scanner and Dokuvera review workflow before any document becomes `verified_at != null`. A matching file signature and SHA-256 hash demonstrate integrity, not safety or authority.
6. Configure storage quotas, retention, audit access, privacy notices and deletion controls before inviting external owner, provider or council users.

## API contract

- `POST /api/documents/upload`: authenticated multipart form fields `caseId` (UUID), `category` (short safe key) and `file` (PDF/JPEG/PNG/WebP, max 20 MB). An authorised case participant receives HTTP 201 with `stored_unverified` after both object storage and the database record succeed.
- `GET /api/documents/?caseId=<uuid>`: authenticated metadata listing, no public URLs.
- `POST /api/application-pack/generate`: returns a read-only, server-derived preview (not a PDF) with missing and reviewed items.
- `POST /api/application-pack/export`: returns a downloadable JSON audit package. The export is logged in `audit_log`. A real PDF generator, signing workflow and final submission remain future work.

## Acceptance checks

- An unrelated user cannot upload or list documents for another person's case.
- A case member's role must include `upload_document` to upload. Investor-only case access is insufficient.
- File type spoofing is rejected; max-size enforcement works; no file is marked verified.
- A private bucket that is missing, public, or misconfigured returns an error instead of inventing success.
- Storage and metadata writes both succeed; if metadata fails, the object cleanup path is attempted.
- A case audit preview clearly distinguishes source-review needs from verified documents, and never implies a funding award.

Domureva's production Supabase project is not connected in this chat; these live checks remain prerequisites for merging.
