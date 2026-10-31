import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/applications/")({
  head: () => ({ meta: [{ title: "Application readiness | DOMUREVA" }] }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const [caseId, setCaseId] = useState("none");
  const cases = useQuery({
    queryKey: ["applications", "cases"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cases")
        .select("id,properties(postcode,address_line)")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const readiness = useQuery({
    queryKey: ["applications", "readiness", caseId],
    enabled: caseId !== "none",
    queryFn: async () => {
      const [apps, docs, evidence, matches] = await Promise.all([
        supabase.from("funding_applications").select("id,status,scheme_id").eq("case_id", caseId),
        supabase.from("case_documents").select("id,filename,verified_at").eq("case_id", caseId),
        supabase.from("evidence_items").select("id,kind,verified").eq("case_id", caseId),
        supabase.from("funding_matches").select("eligible").eq("case_id", caseId),
      ]);
      for (const row of [apps, docs, evidence, matches]) if (row.error) throw row.error;
      return {
        applications: apps.data ?? [],
        documents: docs.data ?? [],
        evidence: evidence.data ?? [],
        preliminaryMatches: (matches.data ?? []).filter((m) => m.eligible === true).length,
      };
    },
  });
  const total = (readiness.data?.documents.length ?? 0) + (readiness.data?.evidence.length ?? 0);
  const verified = (readiness.data?.documents.filter((x) => !!x.verified_at).length ?? 0)
    + (readiness.data?.evidence.filter((x) => x.verified).length ?? 0);

  return <Container className="pt-7">
    <WorkspaceNav />
    <PageHeader eyebrow="Application readiness" title="Know what is recorded."
      description="Funding application and evidence status is read from your authorised case records. No simulated grants, documents or verification." />
    <section className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-card">
      <Label htmlFor="application-case">Choose a property case</Label>
      {cases.isLoading ? <Skeleton className="mt-3 h-11 w-full max-w-lg" /> :
        <Select value={caseId} onValueChange={setCaseId}>
          <SelectTrigger id="application-case" className="mt-3 h-11 w-full max-w-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Choose a case</SelectItem>
            {(cases.data ?? []).map((c) =>
              <SelectItem key={c.id} value={c.id}>{c.properties?.address_line || c.properties?.postcode || "Property"} · {c.id.slice(0, 8)}</SelectItem>
            )}
          </SelectContent>
        </Select>}
      {cases.isError ? <p role="alert" className="mt-3 text-sm text-destructive">Your case list could not be loaded.</p> : null}
    </section>
    {caseId === "none" ? <p className="mt-7 text-sm text-muted-foreground">Select a case to see real evidence and application data.</p> :
      readiness.isLoading ? <Skeleton className="mt-7 h-36 w-full rounded-3xl" /> :
      readiness.isError ? <div className="mt-7 rounded-3xl border border-border bg-card p-6" role="alert">
        <p className="text-sm text-destructive">The case records could not be loaded.</p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => void readiness.refetch()}>Retry</Button>
      </div> : <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Applications recorded" value={readiness.data?.applications.length ?? 0} hint="Not necessarily submitted" />
          <StatCard label="Evidence records" value={total} hint="Files and capture records" />
          <StatCard label="Verified items" value={verified} hint="Only confirmed evidence" />
          <StatCard label="Potential matches" value={readiness.data?.preliminaryMatches ?? 0} hint="Not approved grants" />
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-primary">Funding applications</h2>
            {!readiness.data?.applications.length ? <p className="mt-3 text-sm text-muted-foreground">No application has been recorded for this case.</p> :
              <ul className="mt-4 divide-y divide-border">{readiness.data.applications.map((item) =>
                <li key={item.id} className="flex items-center justify-between gap-3 py-4">
                  <span className="text-sm text-primary">Application {item.id.slice(0, 8)}</span>
                  <Badge variant="secondary">{item.status}</Badge>
                </li>
              )}</ul>}
          </section>
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold text-primary">Evidence needing review</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {readiness.data?.documents.filter((item) => !item.verified_at).map((item) => <li key={item.id}>{item.filename}</li>)}
              {readiness.data?.evidence.filter((item) => !item.verified).map((item) => <li key={item.id}>{item.kind}</li>)}
            </ul>
            {total === 0 ? <p className="mt-3 text-sm text-muted-foreground">No evidence has been recorded.</p> : null}
            <Button asChild className="mt-5 rounded-full"><Link to="/application-pack">Open case pack</Link></Button>
          </section>
        </div>
      </>}
  </Container>;
}
