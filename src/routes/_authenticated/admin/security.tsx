import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertOctagon, ShieldAlert, ShieldCheck } from "lucide-react";

import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({
    meta: [
      { title: "Security & risk | DOMUREVA" },
      {
        name: "description",
        content:
          "Review integration failures, open risks, audit activity and release security gates in one control view.",
      },
      { property: "og:title", content: "Security & risk | DOMUREVA" },
      {
        property: "og:description",
        content: "Incidents, high-risk events, integration failures and open risks at a glance.",
      },
    ],
  }),
  component: SecurityPage,
});

type RiskRow = {
  id: string;
  title: string;
  severity: string;
  likelihood: string;
  status: string;
  scope: string;
  updated_at: string | null;
};

type FailureRow = {
  id: string;
  provider: string;
  event_type: string;
  error: string | null;
  created_at: string;
};

type AuditRow = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

function severityVariant(severity: string): "destructive" | "secondary" | "default" {
  if (severity === "high" || severity === "critical") return "destructive";
  if (severity === "medium") return "secondary";
  return "default";
}

function SecurityPage() {
  const risks = useQuery({
    queryKey: ["admin", "risk-register"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_register")
        .select("id, title, severity, likelihood, status, scope, updated_at")
        .neq("status", "closed")
        .order("updated_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as RiskRow[];
    },
  });

  const failures = useQuery({
    queryKey: ["admin", "integration-failures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_events")
        .select("id, provider, event_type, error, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data ?? []) as FailureRow[];
    },
  });

  const audit = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const highRisk = risks.data?.filter((r) => r.severity === "high" || r.severity === "critical").length ?? 0;

  return (
    <Container>
      <PageHeader
        eyebrow="Admin"
        title="Security & risk"
        description="Review incidents, high-risk events, integration failures, open risks and release security gates."
        actions={<ShieldAlert className="size-5 text-accent" />}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open risks"
          value={risks.data?.length ?? 0}
          hint={`${highRisk} high or critical`}
          icon={ShieldAlert}
        />
        <StatCard
          label="Integration failures"
          value={failures.data?.length ?? 0}
          hint="Last 15 recorded"
          icon={AlertOctagon}
        />
        <StatCard label="Audit events" value={audit.data?.length ?? 0} hint="Most recent" icon={ShieldCheck} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Open risk register</CardTitle>
            <CardDescription>Risks awaiting mitigation or closure.</CardDescription>
          </CardHeader>
          <CardContent>
            {risks.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : risks.isError ? (
              <p className="text-sm text-destructive">Could not load the risk register.</p>
            ) : risks.data && risks.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {risks.data.map((risk) => (
                  <li key={risk.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-primary">{risk.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {risk.scope} · likelihood {risk.likelihood}
                      </p>
                    </div>
                    <Badge variant={severityVariant(risk.severity)}>{risk.severity}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No open risks recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Integration failures</CardTitle>
            <CardDescription>Recent failed webhook or job events.</CardDescription>
          </CardHeader>
          <CardContent>
            {failures.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : failures.isError ? (
              <p className="text-sm text-destructive">Could not load integration failures.</p>
            ) : failures.data && failures.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {failures.data.map((failure) => (
                  <li key={failure.id} className="py-3 text-sm">
                    <p className="font-medium text-primary">
                      {failure.provider} · {failure.event_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(failure.created_at).toLocaleString()}
                    </p>
                    {failure.error ? <p className="text-xs text-destructive">{failure.error}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No integration failures recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle>Recent audit activity</CardTitle>
          <CardDescription>The latest sensitive actions recorded across DOMUREVA.</CardDescription>
        </CardHeader>
        <CardContent>
          {audit.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : audit.isError ? (
            <p className="text-sm text-destructive">Could not load the audit log.</p>
          ) : audit.data && audit.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {audit.data.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-primary">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.entity_type}
                      {entry.entity_id ? ` · ${entry.entity_id}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
