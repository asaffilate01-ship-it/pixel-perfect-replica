import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CircleDashed, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/release")({
  head: () => ({
    meta: [
      { title: "Release acceptance | DOMUREVA" },
      { name: "description", content: "Review independent Domureva release gates and unresolved deployment dependencies." },
    ],
  }),
  component: ReleasePage,
});

const CHECKS = [
  ["migrations", "Database migrations", "Verify the correct Domureva Supabase project, schema, indexes and rollback."],
  ["rls", "Tenant and case isolation", "Run cross-tenant and unauthorised role tests against every privileged operation."],
  ["typecheck", "TypeScript", "Link a successful build run to the release commit."],
  ["tests", "Unit and integration tests", "Verify negative security tests and authenticated database workflows."],
  ["build", "Production build", "Confirm output for the exact release commit, not only a development branch."],
  ["owasp", "Security assessment", "Review webhooks, IDOR, CSRF, scanning, tokens, rate limits and incident response."],
  ["accessibility", "Accessibility", "Test keyboard, screen reader, zoom and 360/768/1440px layouts."],
  ["backup_restore", "Backup and restore", "Verify a controlled restore procedure and recovery objective."],
  ["integrations", "External integration checks", "Exercise Dokuvera, Craftvaro, Gabley, LeadLens, Stripe and notifications."],
] as const;

type AcceptanceResult = {
  releaseVersion: string;
  ready: boolean;
  missing: string[];
  required: string[];
  status: string;
  note: string;
};

function ReleasePage() {
  const acceptance = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again to inspect release controls.");
      const response = await fetch("/api/release/acceptance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ releaseVersion: "rc", checks: {} }),
      });
      const data = await response.json() as AcceptanceResult & { error?: string };
      if (response.status === 403) throw new Error("Only configured platform operators can inspect release gates.");
      if (!response.ok) throw new Error(data.error ?? "Release status could not be checked.");
      return data;
    },
    onSuccess: (result) => {
      if (!result.ready) toast.warning("Release remains blocked", { description: "Independent release evidence is required." });
    },
    onError: (error: Error) => toast.error("Could not inspect release gates", { description: error.message }),
  });

  return (
    <Container className="pt-7">
      <PageHeader
        eyebrow="Platform governance"
        title="Release evidence, not checkboxes."
        description="A production release must be supported by independent checks. User-entered pass flags cannot certify a build, security assessment or authority approval."
        actions={<Button type="button" className="rounded-full" disabled={acceptance.isPending}
          onClick={() => acceptance.mutate()}>{acceptance.isPending ? "Checking…" : "Review release gates"}</Button>}
      />

      <div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-sm leading-6 text-muted-foreground">
          The server currently blocks production readiness unless release evidence is independently verified. Passing CI on a draft GitHub branch is not equivalent to deploying a tested tenant-safe SaaS.
        </p>
      </div>

      {acceptance.isError ? <div className="mt-6 rounded-2xl border border-destructive/30 bg-card p-5" role="alert">
        <p className="text-sm text-destructive">{acceptance.error.message}</p>
      </div> : acceptance.data ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Release {acceptance.data.releaseVersion}</p>
              <p className="mt-1 text-sm text-muted-foreground">{acceptance.data.note}</p>
            </div>
            <Badge variant={acceptance.data.ready ? "secondary" : "destructive"}>
              {acceptance.data.ready ? "Verified" : "Not approved for deployment"}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{acceptance.data.missing.length} independent gates outstanding</p>
        </div>
      ) : null}

      <section className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-card" aria-labelledby="release-gates-heading">
        <div className="flex items-center gap-2">
          <CircleDashed className="size-5 text-accent" aria-hidden="true" />
          <h2 id="release-gates-heading" className="font-display text-xl font-semibold text-primary">Mandatory release checks</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">These items are not marked complete until supporting evidence is attached and verified by a trusted release process.</p>
        <ul className="mt-5 divide-y divide-border">
          {CHECKS.map(([key, label, instruction]) => (
            <li key={key} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="max-w-2xl">
                <p className="font-semibold text-primary">{label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{instruction}</p>
              </div>
              <Badge variant="secondary"><AlertTriangle className="mr-1 size-3" /> Evidence required</Badge>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
