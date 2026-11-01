import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, RefreshCw, ShieldCheck, Webhook } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  head: () => ({
    meta: [
      { title: "Integration control centre | DOMUREVA" },
      { name: "description", content: "Platform-authorised view of integration jobs, recent webhook events and source reliability." },
    ],
  }),
  component: IntegrationsPage,
});

const SYSTEMS = [
  ["leadlens", "LeadLens"],
  ["dokuvera", "Dokuvera"],
  ["gabley_retrofit", "Gabley Retrofit"],
  ["craftvaro", "Craftvaro"],
  ["stripe", "Stripe"],
] as const;

type EventRow = {
  id: string;
  provider: string;
  event_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  error: string | null;
};
type IntegrationJob = {
  id: string;
  case_id: string | null;
  integration: string;
  job_type: string;
  status: string;
  attempts: number;
  next_attempt_at: string | null;
  created_at: string | null;
  last_error: string | null;
};
type SourceHealth = {
  source_key: string;
  status: string;
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number;
};
type OperationalData = {
  eventRecords: EventRow[];
  jobs: IntegrationJob[];
  sourceHealth: SourceHealth[];
  note: string;
};

async function loadOperations(): Promise<OperationalData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in again to access platform operations.");
  const response = await fetch("/api/admin/operations", {
    headers: { Authorization: "Bearer " + session.access_token },
  });
  const payload = await response.json() as OperationalData & { error?: string };
  if (!response.ok) {
    if (response.status === 403) throw new Error("This workspace requires platform-operator access.");
    throw new Error(payload.error ?? "Operations data could not be loaded.");
  }
  return payload;
}

function readableDate(date: string | null) {
  return date ? new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
}

function IntegrationsPage() {
  const query = useQuery({ queryKey: ["admin", "platform-operations"], queryFn: loadOperations });
  const events = query.data?.eventRecords ?? [];
  const jobs = query.data?.jobs ?? [];
  const failEvents = events.filter((row) => row.status === "failed");
  const pendingJobs = jobs.filter((row) => ["queued", "pending_processor", "retry", "running"].includes(row.status));

  return (
    <Container className="pt-7">
      <PageHeader
        eyebrow="Platform operations"
        title="Integration control centre"
        description="Review recorded inbound events, pending jobs and source health. These records are not a substitute for real integration tests."
        actions={<Button type="button" variant="outline" className="rounded-full" disabled={query.isFetching}
          onClick={() => void query.refetch()}><RefreshCw className="size-4" /> Refresh records</Button>}
      />

      {query.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-32 rounded-3xl" />
      </div> : query.isError ? (
        <div className="mt-7 rounded-3xl border border-destructive/30 bg-card p-8" role="alert">
          <h2 className="font-display text-xl font-semibold text-primary">Operational records unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{query.error?.message}</p>
          <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={() => void query.refetch()}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              ["Recent events", events.length, "Latest 100 records"],
              ["Failed events", failEvents.length, "Requires investigation"],
              ["Jobs awaiting processing", pendingJobs.length, "Pending is not completed"],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-primary">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-6 text-muted-foreground">{query.data?.note}</p>
          </div>

          <section className="mt-7" aria-labelledby="providers-heading">
            <h2 id="providers-heading" className="font-display text-xl font-semibold text-primary">Integration status by provider</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {SYSTEMS.map(([key, label]) => {
                const relevant = events.filter((item) => item.provider === key);
                const relatedJobs = jobs.filter((item) => item.integration === key);
                const latest = relevant[0];
                const failures = relevant.filter((item) => item.status === "failed").length;
                return (
                  <article key={key} className="rounded-3xl border border-border bg-card p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-primary">{label}</h3>
                      {failures ? <Badge variant="destructive">{failures} failures</Badge> : <Badge variant="secondary">Not verified live</Badge>}
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Last recorded event</dt><dd className="mt-1 text-foreground">{readableDate(latest?.created_at ?? null)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Recorded jobs</dt><dd className="mt-1 tabular-nums text-foreground">{relatedJobs.length}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Most recent state</dt><dd className="mt-1 capitalize text-foreground">{latest?.status ?? "No activity recorded"}</dd></div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-border bg-card p-6" aria-labelledby="jobs-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="jobs-heading" className="font-display text-xl font-semibold text-primary">Integration jobs</h2>
                <Badge variant="secondary">{jobs.length} records</Badge>
              </div>
              {jobs.length ? <ul className="mt-4 divide-y divide-border">
                {jobs.slice(0, 20).map((job) => (
                  <li key={job.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold text-primary">{job.integration} · {job.job_type}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Attempts: {job.attempts} · Created {readableDate(job.created_at)}</p>
                      {job.last_error ? <p className="mt-2 text-xs text-destructive">{job.last_error}</p> : null}
                    </div>
                    <Badge variant={job.status === "failed" ? "destructive" : "secondary"} className="capitalize">{job.status.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul> : <p className="mt-5 text-sm text-muted-foreground">No processing jobs have been recorded.</p>}
            </section>

            <section className="rounded-3xl border border-border bg-card p-6" aria-labelledby="sources-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="sources-heading" className="font-display text-xl font-semibold text-primary">Funding-source checks</h2>
                <Badge variant="secondary">{query.data?.sourceHealth.length ?? 0} tracked</Badge>
              </div>
              {query.data?.sourceHealth.length ? <ul className="mt-4 divide-y divide-border">
                {query.data.sourceHealth.slice(0, 20).map((source) => (
                  <li key={source.source_key} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold text-primary">{source.source_key}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Last success: {readableDate(source.last_success_at)}</p>
                    </div>
                    <Badge variant={source.consecutive_failures > 0 ? "destructive" : "secondary"}>{source.status}</Badge>
                  </li>
                ))}
              </ul> : <p className="mt-5 text-sm text-muted-foreground">No funding-source health checks are recorded yet.</p>}
            </section>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="rounded-full"><Link to="/admin/security">Security & risk <ArrowRight className="size-4"/></Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/admin/release">Release acceptance <ArrowRight className="size-4"/></Link></Button>
          </div>
        </>
      )}
    </Container>
  );
}
