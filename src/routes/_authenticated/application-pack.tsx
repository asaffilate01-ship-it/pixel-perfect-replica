import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, FileStack, Hammer, ShieldCheck } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/layout/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/application-pack")({
  head: () => ({ meta: [{ title: "Application pack | DOMUREVA" }, { name: "description", content: "Build a submission-ready funding application pack from reviewed rules and verified evidence." }] }),
  component: ApplicationPackPage,
});

const SECTIONS = [
  { icon: ShieldCheck, title: "Eligibility", body: "Reviewed scheme rules, matched facts, exceptions and source links.", status: "Ready" },
  { icon: ClipboardCheck, title: "Property evidence", body: "Ownership, vacancy evidence, photographs, EPC, surveys and quotations.", status: "In progress" },
  { icon: Hammer, title: "Works & funding stack", body: "Costed works, proposed allocations and owner contribution.", status: "Needs input" },
  { icon: FileStack, title: "Audit manifest", body: "Hashes, source timestamps and verification status for every pack item.", status: "Automatic" },
] as const;

function ApplicationPackPage() {
  return <Container>
    <WorkspaceNav />
    <PageHeader eyebrow="Application pack" title="Build the submission pack" description="One organised pack containing reviewed eligibility, verified property evidence, costed works and the full audit trail." actions={<Button className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90">Generate pack</Button>} />

    <div className="mt-8 grid gap-5 md:grid-cols-2">
      {SECTIONS.map(({icon:Icon,title,body,status}, index) => <section key={title} className="group rounded-3xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
        <div className="flex items-start justify-between gap-4"><div className="grid size-12 place-items-center rounded-2xl bg-secondary"><Icon className="size-5 text-accent" /></div><Badge variant="secondary">{status}</Badge></div>
        <p className="mt-7 text-xs font-bold tracking-[0.16em] text-muted-foreground">0{index+1}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      </section>)}
    </div>

    <section className="mt-8 rounded-3xl bg-navy p-7 text-navy-foreground md:flex md:items-center md:justify-between md:gap-8">
      <div><p className="eyebrow text-leaf-soft">Submission control</p><h2 className="mt-2 font-display text-2xl font-bold">Nothing is submitted without your approval.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-navy-foreground/70">Reva prepares and verifies the pack, but final submission remains a deliberate human action.</p></div>
      <Button variant="outline" className="mt-6 rounded-full border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10 md:mt-0">Preview pack</Button>
    </section>
  </Container>;
}
