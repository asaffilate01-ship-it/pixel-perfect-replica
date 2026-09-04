import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/domureva/security/apiAuth.server";

const schema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  fundingChanges: z.boolean().optional(),
  quoteUpdates: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
});

export const Route = createFileRoute("/api/notifications/preferences")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        try {
          const { user, supabaseAdmin } = await requireApiUser(request);
          const body = schema.parse(await request.json());
          const clean = {
            email: body.email !== false,
            push: body.push !== false,
            funding_changes: body.fundingChanges !== false,
            quote_updates: body.quoteUpdates !== false,
            project_updates: body.projectUpdates !== false,
          };
          const { error } = await supabaseAdmin
            .from("notification_preferences")
            .upsert({ user_id: user.id, ...clean } as never, { onConflict: "user_id" });
          if (error) throw error;
          return Response.json({
            status: "saved",
            userId: user.id,
            preferences: {
              email: clean.email,
              push: clean.push,
              fundingChanges: clean.funding_changes,
              quoteUpdates: clean.quote_updates,
              projectUpdates: clean.project_updates,
            },
          });
        } catch (e) {
          if (e instanceof Response) return e;
          return Response.json({ error: e instanceof Error ? e.message : "bad request" }, { status: 400 });
        }
      },
    },
  },
});
