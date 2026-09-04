import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/release")({
  head: () => ({
    meta: [
      { title: "Release acceptance | DOMUREVA" },
      {
        name: "description",
        content:
          "Track every mandatory release gate — migrations, RLS tests, typecheck, unit tests, build, OWASP, accessibility, backup/restore and external integrations.",
      },
      { property: "og:title", content: "Release acceptance | DOMUREVA" },
      {
        property: "og:description",
        content: "No DOMUREVA release is production-ready until every mandatory gate passes.",
      },
    ],
  }),
  component: ReleasePage,
});

const CHECKS: { key: string; label: string }[] = [
  { key: "migrations", label: "Migrations" },
  { key: "rls", label: "RLS adversarial tests" },
  { key: "typecheck", label: "Typecheck" },
  { key: "tests", label: "Unit/integration tests" },
  { key: "build", label: "Production build" },
  { key: "owasp", label: "OWASP checks" },
  { key: "accessibility", label: "WCAG 2.2 AA" },
  { key: "backup_restore", label: "Backup/restore" },
  { key: "integrations", label: "External integrations" },
];

type AcceptanceResult = {
  releaseVersion: string;
  ready: boolean;
  missing: string[];
  required: string[];
};

function ReleasePage() {
  const [checks, setChecks] = useState<Record<string, "pass" | "pending">>(
    Object.fromEntries(CHECKS.map((check) => [check.key, "pending"])) as Record<string, "pass" | "pending">,
  );
  const [result, setResult] = useState<AcceptanceResult | null>(null);

  const runAcceptance = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/release/acceptance", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ releaseVersion: "rc", checks }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Acceptance check failed");
      return body as AcceptanceResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.ready) toast.success("Release is ready for production");
      else toast.warning("Release blocked", { description: `${data.missing.length} gate(s) outstanding` });
    },
    onError: (error: Error) => toast.error("Could not run acceptance check", { description: error.message }),
  });

  function toggleCheck(key: string) {
    setChecks((prev) => ({ ...prev, [key]: prev[key] === "pass" ? "pending" : "pass" }));
  }

  return (
    <Container>
      <PageHeader
        eyebrow="Admin"
        title="Release acceptance"
        description="No DOMUREVA release is production-ready until every mandatory gate passes."
        actions={
          <Button onClick={() => runAcceptance.mutate()} disabled={runAcceptance.isPending}>
            {runAcceptance.isPending ? "Checking…" : "Run acceptance check"}
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Mandatory gates</CardTitle>
            <CardDescription>Mark each gate as it is verified, then run the acceptance check.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {CHECKS.map((check) => {
                const status = checks[check.key];
                const missing = result?.missing.includes(check.key);
                return (
                  <li key={check.key} className="flex items-center justify-between gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleCheck(check.key)}
                      className="flex items-center gap-2 text-left text-sm"
                    >
                      {status === "pass" ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <CircleDashed className="size-4 text-muted-foreground" />
                      )}
                      <span className="text-primary">{check.label}</span>
                    </button>
                    {missing ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="size-3" /> Blocking
                      </Badge>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-card">
          <CardHeader>
            <CardTitle>Latest result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Run the acceptance check to see whether this release candidate is ready.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Release {result.releaseVersion}</p>
                  <Badge
                    className={
                      result.ready
                        ? "gap-1 bg-success text-success-foreground"
                        : "gap-1"
                    }
                    variant={result.ready ? "default" : "destructive"}
                  >
                    {result.ready ? "Ready" : "Blocked"}
                  </Badge>
                </div>
                {result.missing.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Outstanding gates
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-destructive">
                      {result.missing.map((key) => (
                        <li key={key}>
                          {CHECKS.find((c) => c.key === key)?.label ?? key}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-success">All mandatory gates have passed.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
