import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { runFundingAgent } from "@/lib/domureva/agents/orchestrator";

const schema = z.object({ caseId: z.string().uuid() });

function monthsSince(d: string | null): number {
  if (!d) return 0;
  const x = new Date(d);
  const n = new Date();
  return Math.max(0, (n.getFullYear() - x.getFullYear()) * 12 + n.getMonth() - x.getMonth());
}

export const Route = createFileRoute("/api/workflow/match-funding")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { caseId } = schema.parse(await request.json());
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: c, error } = await supabaseAdmin
            .from("cases")
            .select("id,property_id,properties(empty_since,owner_type,intended_use,postcode)")
            .eq("id", caseId)
            .single();
          if (error) throw error;

          const p = Array.isArray(c.properties) ? c.properties[0] : c.properties;
          if (!p) throw new Error("Property not found");

          const { data: schemes, error: se } = await supabaseAdmin
            .from("funding_schemes")
            .select("*")
            .eq("status", "reviewed");
          if (se) throw se;

          const rules = (schemes || []).map((s) => ({
            id: s.id,
            status: s.status as "draft" | "reviewed" | "retired",
            authority: s.authority,
            maxAmount: s.max_amount == null ? null : Number(s.max_amount),
            minimumEmptyMonths: s.min_empty_months,
            eligibleOwnerTypes: s.eligible_owner_types || [],
            eligibleUses: s.eligible_uses || [],
            sourceId: s.source_id,
          }));

          const decision = runFundingAgent(
            {
              emptyMonths: monthsSince(p.empty_since),
              ownerType: p.owner_type || "",
              intendedUse: p.intended_use || "",
            },
            rules,
          );

          for (const m of decision.output) {
            await supabaseAdmin.from("funding_matches").upsert(
              {
                case_id: caseId,
                scheme_id: m.schemeId,
                eligible: m.eligible,
                confidence: m.eligible ? 0.95 : 0.9,
                explanation: { agent: decision.agent, reasons: decision.reasons, modelVersion: decision.modelVersion },
              },
              { onConflict: "case_id,scheme_id" },
            );
          }

          await supabaseAdmin.from("agent_runs").insert({
            case_id: caseId,
            agent: decision.agent,
            input: { property: p },
            output: decision.output,
            confidence: decision.confidence === "high" ? 0.95 : decision.confidence === "medium" ? 0.7 : 0.4,
            requires_human_review: decision.requiresHumanReview,
            model_version: decision.modelVersion,
            sources: decision.sourceIds,
          });

          await supabaseAdmin.from("cases").update({ status: "funding" }).eq("id", caseId);

          return Response.json(decision);
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
        }
      },
    },
  },
});
