import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const allowed = ["access", "rectification", "erasure", "restriction", "portability"] as const;

const schema = z.object({
  requestType: z.enum(allowed),
});

export const Route = createFileRoute("/api/privacy/requests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          return Response.json(
            {
              status: "received",
              userId: user.id,
              requestType: body.requestType,
              dueWithinDays: 30,
            },
            { status: 201 },
          );
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
      },
    },
  },
});
