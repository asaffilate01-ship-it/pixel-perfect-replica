import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, Hammer, TimerReset } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/layout/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects | DOMUREVA" }, { name: "description", content: "Track restoration works, evidence and milestones across DOMUREVA cases." }] }),
  component: ProjectsPage,
});

const MILESTONES = [
  ["Contract awarded", "Complete", CheckCircle2],
  ["Works started", "In progress", Hammer],
  ["Evidence checkpoint", "Waiting", FileCheck2],
  ["Return to use", "Upcoming", TimerReset],
] as const;

function ProjectsPage() {
  return <Container>
    <WorkspaceNav />
    <PageHeader eyebrow="Delivery" title="Restoration projects" description="Track works, evidence and progress from award through to occupation." actions={<Button variant="outline" className="rounded-full">View all cases</Button>} />

    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-3xl border border-border bg-card p-7 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><Badge variant="secondary">Active project</Badge><h2 className="mt-4 font-display text-2xl font-bold text-primary">Delivery journey</h2><p className="mt-2 text-sm text-muted-foreground">Evidence-gated milestones keep delivery auditable from contractor appointment to completion.</p></div><div className="grid size-12 place-items-center rounded-2xl bg-secondary"><Hammer className="size-5 text-accent" /></div></div>
        <div className="mt-8 grid gap-3">
          {MILESTONES.map(([label,status,Icon], i) => <div key={label} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[44px_1fr_auto] sm:items-center"><div className="grid size-10 place-items-center rounded-xl bg-secondary"><Icon className="size-4 text-accent" /></div><div><p className="font-semibold text-primary">{label}</p><p className="mt-1 text-xs text-muted-foreground">Step 0{i+1} of 04</p></div><Badge variant="secondary">{status}</Badge></div>)}
        </div>
      </section>

      <aside className="h-fit rounded-3xl bg-navy p-6 text-navy-foreground shadow-lift">
        <p className="eyebrow text-leaf-soft">Project control</p>
        <h2 className="mt-3 font-display text-2xl font-bold">Keep evidence ahead of works.</h2>
        <p className="mt-3 text-sm leading-6 text-navy-foreground/70">Required proof should be captured as each milestone happens, not reconstructed at the end.</p>
        <Button className="mt-6 w-full rounded-full bg-amber text-amber-foreground hover:bg-amber/90">Open evidence</Button>
      </aside>
    </div>
  </Container>;
}
