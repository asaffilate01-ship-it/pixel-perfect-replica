import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";

type RunOutput = { reviewQueue?: Array<{ schemeId: string; reason: string }> };

function httpsSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
function reasonFromExplanation(value: Json | null): string | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const reason = value["reason"];
  return typeof reason === "string" ? reason : null;
}

export const Route = createFileRoute("/api/cases/funding-review")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const caseId = z.string().uuid().parse(new URL(request.url).searchParams.get("caseId"));
          const { supabaseAdmin } = await requireCaseAccess(request, caseId);
          const [matches, latestRun] = await Promise.all([
            supabaseAdmin.from("funding_matches")
              .select("id,scheme_id,eligible,explanation,created_at")
              .eq("case_id", caseId).order("created_at", { ascending: false }).limit(100),
            supabaseAdmin.from("agent_runs")
              .select("output,created_at")
              .eq("case_id", caseId).eq("agent", "Reva Fund")
              .order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ]);
          if (matches.error || latestRun.error) throw new Error("FUNDING_REVIEW_DATA_UNAVAILABLE");

          const ids = [...new Set((matches.data ?? []).map((match) => match.scheme_id))];
          const schemeResult = ids.length
            ? await supabaseAdmin.from("funding_schemes")
              .select("id,name,authority,status,source_id,reviewed_at,valid_from,valid_to")
              .in("id", ids).limit(100)
            : { data: [], error: null };
          if (schemeResult.error) throw schemeResult.error;
          const byScheme = new Map((schemeResult.data ?? []).map((row) => [row.id, row]));

          const sourceIds = [...new Set((schemeResult.data ?? []).map((scheme) => scheme.source_id))];
          const sourceResult = sourceIds.length
            ? await supabaseAdmin.from("source_records")
              .select("id,source_url,last_checked_at")
              .in("id", sourceIds).limit(100)
            : { data: [], error: null };
          if (sourceResult.error) throw sourceResult.error;
          const bySource = new Map((sourceResult.data ?? []).map((source) => [source.id, source]));

          const output = latestRun.data?.output;
          const recordedQueue: RunOutput = output && !Array.isArray(output) && typeof output === "object"
            ? output as RunOutput : {};
          const reviewQueue = Array.isArray(recordedQueue.reviewQueue)
            ? recordedQueue.reviewQueue.filter((entry) =>
              typeof entry?.schemeId === "string" && typeof entry?.reason === "string")
            : [];

          return Response.json({
            caseId,
            reviewedAt: latestRun.data?.created_at ?? null,
            schemes: (matches.data ?? []).map((match) => {
              const scheme = byScheme.get(match.scheme_id);
              const source = scheme ? bySource.get(scheme.source_id) : undefined;
              return {
                id: match.scheme_id,
                name: scheme?.name ?? "Previously recorded scheme",
                authority: scheme?.authority ?? "Authority unavailable",
                status: match.eligible === true ? "preliminary_match" :
                  reasonFromExplanation(match.explanation) ? "review_required" : "not_matched",
                reason: reasonFromExplanation(match.explanation),
                schemeReviewStatus: scheme?.status ?? "unavailable",
                humanReviewedAt: scheme?.reviewed_at ?? null,
                sourceCheckedAt: source?.last_checked_at ?? null,
                sourceUrl: source?.source_url ? httpsSourceUrl(source.source_url) : null,
                validFrom: scheme?.valid_from ?? null,
                validTo: scheme?.valid_to ?? null,
              };
            }),
            awaitingReview: reviewQueue,
            note: "Matches are preliminary only; neither this record nor a source URL is an authority funding decision.",
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
