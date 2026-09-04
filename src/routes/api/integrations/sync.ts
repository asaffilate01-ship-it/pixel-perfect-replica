import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const supported = new Set(["leadlens", "dokuvera", "gabley", "gabley_retrofit", "craftvaro"]);

const schema = z.object({
  integration: z.string(),
  jobType: z.string().optional(),
  caseId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/api/integrations/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          if (!supported.has(body.integration)) {
            return Response.json({ error: "Unsupported integration" }, { status: 400 });
          }
          return Response.json(
            {
              status: "queued",
              integration: body.integration,
              jobType: body.jobType || "sync",
              caseId: body.caseId || null,
              requestedBy: user.id,
            },
            { status: 202 },
          );
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
