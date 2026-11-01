import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({
    meta: [
      { title: "Security & risk | DOMUREVA" },
      { name: "description", content: "Platform-operator view of recorded risks, incidents, integration failures and audit events." },
    ],
  }),
  component: SecurityPage,
});

type Risk = {
  id: string;
  title: string;
  severity: string;
  likelihood: string;
  status: string;
  scope: string;
  updated_at: string | null;
};
type Incident = {
  id: string;
  summary: string;
  incident_type: string;
  status: string;
  severity: string;
  detected_at: string | null;
};
type Failure = { id: string; provider: string; event_type: string; status: string; created_at: string };
type Audit = { id: number; action: string; entity_type: string; created_at: string };
type SecurityData = {
  risks: Risk[];
  incidents: Incident[];
  failedEvents: Failure[];
  activity: Audit[];
  countsAreLimited: boolean;
  note: string;
};

async function loadSecurity(): Promise<SecurityData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in again to review platform security.");
  const response = await fetch("/api/admin/security", {
    headers: { Authorization: "Bearer " + session.access_token },
  });
  const payload = await response.json() as SecurityData & { error?: string };
  if (response.status === 403) throw new Error("Platform-operator access is required.");
  if (!response.ok) throw new Error(payload.error ?? "Security records could not be loaded.");
  return payload;
}

function shortDate(value: string | null) {
  return value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
}
function riskVariant(value: string): "destructive" | "secondary" {
  return value === "high" || value === "critical" ? "destructive" : "secondary";
}

function SecurityPage() {
  const query = useQuery({ queryKey: ["admin", "platform-security"], queryFn: loadSecurity });
  const highRisk = (query.data?.risks ?? []).filter((risk) => ["high", "critical"].includes(risk.severity)).length;

  return (
    <Container className="pt-7">
      <PageHeader
        eyebrow="Platform security"
        title="See risks before they escalate."
        description="Only verified platform operators may access this view. Figures reflect stored records, not a completed security assessment."
        actions={<Button variant="outline" className="rounded-full" disabled={query.isFetching}
          onClick={() => void query.refetch()}>Refresh records</Button>}
      />

      {query.isLoading ? <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-3xl" /><Skeleton className="h-28 rounded-3xl" /><Skeleton className="h-28 rounded-3xl" />
      </div> : query.isError ? (
        <div className="mt-7 rounded-3xl border border-destructive/30 bg-card p-8" role="alert">
          <h2 className="font-display text-xl font-semibold text-primary">Security records unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{query.error?.message}</p>
          <Button variant="outline" className="mt-5 rounded-full" onClick={() => void query.refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              ["Open risks", query.data?.risks.length ?? 0, highRisk + " high or critical"],
              ["Open incidents", query.data?.incidents.length ?? 0, "Recent recorded cases"],
              ["Failed integrations", query.data?.failedEvents.length ?? 0, "Latest 30 failed events"],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-primary">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm leading-6 text-muted-foreground">{query.data?.note}</p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-border bg-card p-6" aria-labelledby="open-risks">
              <h2 id="open-risks" className="font-display text-xl font-semibold text-primary">Open risk register</h2>
              {query.data?.risks.length ? <ul className="mt-4 divide-y divide-border">
                {query.data.risks.map((risk) => (
                  <li key={risk.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold text-primary">{risk.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{risk.scope} · {risk.likelihood} · Updated {shortDate(risk.updated_at)}</p>
                    </div>
                    <Badge variant={riskVariant(risk.severity)}>{risk.severity}</Badge>
                  </li>
                ))}
              </ul> : <p className="mt-5 text-sm text-muted-foreground">No open risks recorded within the latest 50 entries.</p>}
            </section>

            <section className="rounded-3xl border border-border bg-card p-6" aria-labelledby="open-incidents">
              <h2 id="open-incidents" className="font-display text-xl font-semibold text-primary">Unresolved incidents</h2>
              {query.data?.incidents.length ? <ul className="mt-4 divide-y divide-border">
                {query.data.incidents.map((incident) => (
                  <li key={incident.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold text-primary">{incident.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{incident.incident_type} · {shortDate(incident.detected_at)}</p>
                    </div>
                    <Badge variant={riskVariant(incident.severity)}>{incident.status}</Badge>
                  </li>
                ))}
              </ul> : <p className="mt-5 text-sm text-muted-foreground">No unresolved incidents recorded within the latest 30 entries.</p>}
            </section>

            <section className="rounded-3xl border border-border bg-card p-6" aria-labelledby="integration-failures">
              <h2 id="integration-failures" className="font-display text-xl font-semibold text-primary">Recent integration failures</h2>
              {query.data?.failedEvents.length ? <ul className="mt-4 divide-y divide-border">
                {query.data.failedEvents.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-start gap-3 py-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-primary">{event.provider} · {event.event_type}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{shortDate(event.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul> : <p className="mt-5 text-sm text-muted-foreground">No failed events in the latest 30 records.</p>}
            </section>

            <section className="rounded-3xl border border-border bg-card p-6" aria-labelledby="recent-audit">
              <h2 id="recent-audit" className="font-display text-xl font-semibold text-primary">Recent audit activity</h2>
              {query.data?.activity.length ? <ul className="mt-4 divide-y divide-border">
                {query.data.activity.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.entity_type}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{shortDate(item.created_at)}</span>
                  </li>
                ))}
              </ul> : <p className="mt-5 text-sm text-muted-foreground">No audit activity recorded within the latest 50 entries.</p>}
            </section>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full"><Link to="/admin/integrations">Integration records <ArrowRight className="size-4" /></Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/admin/release">Release acceptance <ArrowRight className="size-4" /></Link></Button>
          </div>
        </>
      )}
    </Container>
  );
}
