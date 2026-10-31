import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requirePlatformAdmin } from "@/lib/domureva/security/platform-admin.server";

const required = [
  "migrations", "rls", "typecheck", "tests", "build",
  "owasp", "accessibility", "backup_restore", "integrations",
] as const;
const schema = z.object({
  releaseVersion: z.string().trim().min(1).max(60).optional(),
  checks: z.record(z.string(), z.string()).optional(),
});

export const Route = createFileRoute("/api/release/acceptance")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requirePlatformAdmin(request);
          const input = schema.parse(await request.json());
          const reportedChecks = input.checks ?? {};
          // User-submitted pass flags are *never* proof of successful CI,
          // a security assessment, backup-restore or live acceptance testing.
          return Response.json({
            releaseVersion: input.releaseVersion ?? "unversioned",
            ready: false,
            status: "verification_required",
            required,
            missing: required,
            reportedChecks,
            verifiedChecks: [],
            note: "The deployment gate needs independent server-side evidence and authorised sign-off.",
          });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
