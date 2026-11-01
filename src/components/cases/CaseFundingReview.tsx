import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type FundingRecord = {
  id: string;
  name: string;
  authority: string;
  status: "preliminary_match" | "not_matched" | "review_required";
  reason: string | null;
  schemeReviewStatus: string;
  humanReviewedAt: string | null;
  sourceCheckedAt: string | null;
  sourceUrl: string | null;
  validFrom: string | null;
  validTo: string | null;
};
type FundingReview = {
  caseId: string;
  reviewedAt: string | null;
  schemes: FundingRecord[];
  awaitingReview: Array<{ schemeId: string; reason: string }>;
  note: string;
};
type MatchResult = {
  status: string;
  screenedSchemes: number;
  awaitingSourceOrGeographyReview: Array<{ schemeId: string; reason: string }>;
};

async function authorisedFundingRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session has expired. Sign in again.");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", "Bearer " + session.access_token);
  const response = await fetch(path, { ...init, headers });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Funding review could not be loaded.");
  return data;
}

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CaseFundingReview({ caseId, canMatchFunding }: {
  caseId: string;
  canMatchFunding: boolean;
}) {
  const client = useQueryClient();
  const review = useQuery({
    queryKey: ["case", "funding-review", caseId],
    queryFn: () => authorisedFundingRequest<FundingReview>("/api/cases/funding-review?caseId=" + encodeURIComponent(caseId)),
  });
  const refresh = useMutation({
    mutationFn: () => authorisedFundingRequest<MatchResult>("/api/workflow/match-funding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
    }),
    onSuccess: (result) => {
      toast.success(result.status === "review_required"
        ? "Funding check recorded; outstanding sources need review"
        : "Preliminary funding check recorded");
      void client.invalidateQueries({ queryKey: ["case", "funding-review", caseId] });
      void client.invalidateQueries({ queryKey: ["case", "summary", caseId] });
    },
    onError: (error: Error) => toast.error("Could not check funding", { description: error.message }),
  });

  return (
    <section className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card" aria-labelledby="case-funding-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="case-funding-heading" className="font-display text-xl font-semibold text-primary">Funding source review</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            See human-review dates, source checks and preliminary matches. Geography, funding conditions and source changes may still require authority confirmation.
          </p>
        </div>
        {canMatchFunding ? (
          <Button type="button" variant="outline" className="rounded-full" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
            <RefreshCw className="size-4" /> {refresh.isPending ? "Checking…" : "Recheck sources"}
          </Button>
        ) : <Badge variant="secondary">Read-only role</Badge>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Rechecking may send the property postcode to Postcodes.io for geographic authority resolution; no street address or case ID is sent.
      </p>

      {review.isLoading ? <div className="mt-5 space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> :
        review.isError ? <div className="mt-5 rounded-2xl border border-destructive/30 p-5" role="alert">
          <p className="text-sm text-destructive">{review.error?.message ?? "Funding sources could not be loaded."}</p>
          <Button variant="outline" className="mt-3 rounded-full" onClick={() => void review.refetch()}>Retry</Button>
        </div> : (
          <>
            <p className="mt-5 text-xs text-muted-foreground">Last screening: {dateLabel(review.data?.reviewedAt ?? null)}</p>
            {review.data?.schemes.length ? (
              <ul className="mt-4 divide-y divide-border">
                {review.data.schemes.map((item) => (
                  <li key={item.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-primary">{item.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.authority}</p>
                      </div>
                      <Badge variant={item.status === "review_required" ? "destructive" : "secondary"} className="capitalize">
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {item.reason ? <p className="mt-3 text-sm text-muted-foreground">{item.reason}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span>Human reviewed: {dateLabel(item.humanReviewedAt)}</span>
                      <span>Source checked: {dateLabel(item.sourceCheckedAt)}</span>
                      <span>Scheme status: {item.schemeReviewStatus}</span>
                    </div>
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        Review source document <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : <p className="mt-3 text-xs text-muted-foreground">Verified source URL unavailable.</p>}
                  </li>
                ))}
              </ul>
            ) : <div className="mt-5 rounded-2xl border border-dashed border-border p-7 text-center">
              <ShieldCheck className="mx-auto size-7 text-accent" aria-hidden="true" />
              <p className="mt-3 font-semibold text-primary">No recorded funding matches</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Run a preliminary check or review the pending scheme-source requirements below.
              </p>
            </div>}

            {(review.data?.awaitingReview.length ?? 0) > 0 ? (
              <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-accent" aria-hidden="true" />
                  <h4 className="font-semibold text-primary">Schemes requiring source or location review</h4>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {review.data?.awaitingReview.map((item) => (
                    <li key={item.schemeId}>{item.reason} · {item.schemeId.slice(0, 8)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">{review.data?.note}</p>
          </>
        )}
    </section>
  );
}
