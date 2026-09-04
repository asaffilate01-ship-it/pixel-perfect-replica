import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const required = [
  "migrations",
  "rls",
  "typecheck",
  "tests",
  "build",
  "owasp",
  "accessibility",
  "backup_restore",
  "integrations",
] as const;

const schema = z.object({
  releaseVersion: z.string().optional(),
  checks: z.record(z.string(), z.string()).optional(),
});

export const Route = createFileRoute("/api/release/acceptance")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireApiUser(request);
          const body = schema.parse(await request.json());
          const checks = body.checks || {};
          const missing = required.filter((k) => checks[k] !== "pass");
          return Response.json({
            releaseVersion: body.releaseVersion || "rc",
            ready: missing.length === 0,
            missing,
            required,
          });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
