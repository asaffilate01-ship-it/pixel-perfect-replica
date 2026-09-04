import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  offerId: z.string(),
  action: z.enum(["accept", "decline", "counter", "withdraw"]),
  counterTerms: z.unknown().optional(),
});

export const Route = createFileRoute("/api/provider-offers/respond")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { user } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          return Response.json(
            {
              status: "recorded",
              offerId: body.offerId,
              action: body.action,
              actor: user.id,
              counterTerms: body.counterTerms ?? null,
            },
            { status: 201 },
          );
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: "Invalid offer response" }, { status: 400 });
        }
      },
    },
  },
});
