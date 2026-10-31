import { createFileRoute } from "@tanstack/react-router";
import { learnWeights, type WeightedOutcome } from "@/lib/domureva/agents/learningEngine";
import { safeEqual } from "@/lib/domureva/security/webhook";

export const Route = createFileRoute("/api/agents/learn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env["CRON_SECRET"];
        const presented = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!cronSecret || !presented || !safeEqual(cronSecret, presented)) {
          return Response.json({ error: "unauthorised" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("learning_outcomes")
          .select("event,features")
          .order("occurred_at", { ascending: false })
          .limit(5000);
        if (error) throw error;

        const outcomes = (data || []) as WeightedOutcome[];
        const weights = learnWeights(outcomes);
        for (const w of weights) {
          await supabaseAdmin.from("learning_weights").upsert(
            {
              scope: "global",
              feature: w.feature,
              weight: w.weight,
              sample_size: w.sampleSize,
              updated_at: new Date().toISOString(),
            } as never,
            { onConflict: "scope,feature" },
          );
        }

        return Response.json({ updated: weights.length, samples: outcomes.length });
      },
    },
  },
});
