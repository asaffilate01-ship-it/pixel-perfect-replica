import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  opportunityId: z.string(),
  offerType: z.string(),
}).passthrough();

export const Route = createFileRoute("/api/provider-offers/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          return Response.json({ status: "submitted", actor: user.id, ...body }, { status: 201 });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: "Missing opportunity or offer type" }, { status: 400 });
        }
      },
    },
  },
});
