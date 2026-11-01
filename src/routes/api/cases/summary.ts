import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { canPerformCaseAction } from "@/lib/domureva/security/casePermissions";

export const Route = createFileRoute("/api/cases/summary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const caseId = z.string().uuid().parse(new URL(request.url).searchParams.get("caseId"));
          const { caseRole, supabaseAdmin, record, property } = await requireCaseAccess(request, caseId);
          const [matches, docs, evidence, projects, financials, quotes, tasks, activity] = await Promise.all([
            supabaseAdmin.from("funding_matches")
              .select("id,scheme_id,eligible,created_at").eq("case_id", caseId).limit(100),
            supabaseAdmin.from("case_documents")
              .select("id,verified_at").eq("case_id", caseId).limit(100),
            supabaseAdmin.from("evidence_items")
              .select("id,verified").eq("case_id", caseId).limit(100),
            supabaseAdmin.from("projects")
              .select("id,status,budget,start_date,target_completion").eq("case_id", caseId).maybeSingle(),
            supabaseAdmin.from("case_financials")
              .select("estimated_works,owner_contribution,approved_funding,committed_contract_value,paid_to_date,currency").eq("case_id", caseId).maybeSingle(),
            supabaseAdmin.from("quote_requests")
              .select("id,status").eq("case_id", caseId).limit(100),
            supabaseAdmin.from("case_tasks")
              .select("id,status,blocking").eq("case_id", caseId).limit(100),
            supabaseAdmin.from("case_status_events")
              .select("id,from_status,to_status,reason,created_at")
              .eq("case_id", caseId).order("created_at", { ascending: false }).limit(10),
          ]);
          for (const result of [matches, docs, evidence, projects, financials, quotes, tasks, activity]) {
            if (result.error) throw result.error;
          }

          const savedTasks = tasks.data ?? [];
          const savedEvidence = evidence.data ?? [];
          const savedDocs = docs.data ?? [];
          const matched = matches.data ?? [];
          return Response.json({
            caseId,
            status: record.status,
            postcode: property.postcode,
            address: property.address_line,
            openedAt: record.created_at,
            role: caseRole,
            permissions: {
              canManageTasks: canPerformCaseAction(caseRole, "manage_tasks"),
              canRequestQuotes: canPerformCaseAction(caseRole, "request_quotes"),
              canViewPack: canPerformCaseAction(caseRole, "preview_pack"),
              canMatchFunding: canPerformCaseAction(caseRole, "match_funding"),
            },
            counts: {
              preliminaryFundingMatches: matched.filter((m) => m.eligible === true).length,
              evidenceRecords: savedEvidence.length + savedDocs.length,
              evidenceVerified: savedEvidence.filter((e) => e.verified).length + savedDocs.filter((d) => !!d.verified_at).length,
              openTasks: savedTasks.filter((t) => t.status === "open").length,
              blockers: savedTasks.filter((t) => t.status === "open" && t.blocking).length,
              quoteRequests: (quotes.data ?? []).length,
            },
            project: projects.data,
            finances: financials.data,
            recentActivity: activity.data ?? [],
            countLimitPerDataset: 100,
            notes: [
              "Funding matches are preliminary, not award decisions.",
              "Verified records count only existing evidence, not all evidence required by a scheme.",
              "Saved financial figures are not independently checked against an administering authority here.",
            ],
          }, { headers: { "Cache-Control": "private, no-store" } });
        } catch (error) {
          return errorResponse(error, 400);
        }
      },
    },
  },
});
