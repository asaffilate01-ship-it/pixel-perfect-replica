import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";

import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/layout/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/applications/")({
  head: () => ({ meta: [{ title: "Application readiness | DOMUREVA" }, { name: "description", content: "Track funding application readiness and verified evidence." }] }),
  component: ApplicationsPage,
});

type DocStatus = "Verified" | "Provided" | "Missing";
const INITIAL_DOCS: [string, DocStatus][] = [
  ["Proof of ownership", "Verified"], ["Evidence property is empty", "Provided"], ["Initial condition photographs", "Verified"],
  ["Schedule of works", "Missing"], ["Contractor quotation", "Missing"], ["EPC / energy evidence", "Provided"], ["Owner contribution evidence", "Missing"],
];

function ApplicationsPage() {
  const [docs] = useState(INITIAL_DOCS);
  const done = useMemo(() => docs.filter(([, s]) => s !== "Missing").length, [docs]);
  const verified = useMemo(() => docs.filter(([, s]) => s === "Verified").length, [docs]);
  const pct = Math.round((done / docs.length) * 100);

  return <Container>
    <WorkspaceNav />
    <PageHeader eyebrow="Application pack" title="Submission readiness" description="See exactly what is ready, what still needs evidence and what Reva Verify has confirmed." />

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Pack complete" value={`${pct}%`} icon={FileCheck2} hint="Across required evidence" />
      <StatCard label="Outstanding" value={docs.length - done} hint="Items still needed" />
      <StatCard label="Verified" value={verified} icon={ShieldCheck} hint="Provenance checked" />
      <StatCard label="Matched schemes" value={1} icon={CheckCircle2} hint="Reviewed funding route" />
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div><p className="eyebrow text-accent">Required evidence</p><h2 className="mt-1 font-display text-xl font-bold text-primary">Your application checklist</h2></div>
          <Badge variant="secondary">{done}/{docs.length} ready</Badge>
        </div>
        {docs.map(([name,status]) => <div key={name} className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-0">
          <div><p className="font-semibold text-primary">{name}</p><p className="mt-1 text-xs text-muted-foreground">Evidence remains attached to the case audit trail.</p></div>
          <div className="flex items-center gap-3"><Badge variant={status === "Missing" ? "destructive" : "secondary"}>{status}</Badge><Button size="sm" variant="outline">{status === "Missing" ? "Add evidence" : "View"}</Button></div>
        </div>)}
      </section>

      <aside className="h-fit rounded-3xl bg-navy p-6 text-navy-foreground shadow-lift">
        <p className="eyebrow text-leaf-soft">Reva Verify</p>
        <h2 className="mt-3 font-display text-2xl font-bold">Next best action</h2>
        <p className="mt-3 text-sm leading-6 text-navy-foreground/70">Complete the schedule of works first. It unlocks the contractor quotation and strengthens the funding pack.</p>
        <Button className="mt-6 w-full rounded-full bg-amber text-amber-foreground hover:bg-amber/90">Continue application</Button>
      </aside>
    </div>
  </Container>;
}
