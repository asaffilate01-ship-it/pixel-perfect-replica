import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Coins, Layers3, SearchCheck, ShieldCheck } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/funding/")({
  head: () => ({ meta: [{ title: "Funding | DOMUREVA" }] }),
  component: FundingPage,
});

const STEPS = [
  { icon: SearchCheck, title: "Match reviewed schemes", copy: "Reva Fund compares verified property facts against human-reviewed grant and loan rules." },
  { icon: Layers3, title: "Build the funding stack", copy: "Allocate eligible works across compatible routes without funding the same cost twice." },
  { icon: ShieldCheck, title: "Keep the decision auditable", copy: "Sources, confidence, review state and evidence remain attached to the case." },
];

function FundingPage() {
  return <Container className="pt-7">
    <WorkspaceNav />
    <PageHeader eyebrow="Funding intelligence" title="Fund the right works, the right way." description="Move from a possible scheme to a reviewed, explainable funding route attached to the property case." actions={<Button asChild className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90"><Link to="/funding/stack">Open stack optimiser</Link></Button>} />

    <div className="mt-8 grid gap-4 lg:grid-cols-3">
      {STEPS.map(({icon:Icon,title,copy},i)=><article key={title} className="rounded-3xl border border-border bg-card p-6 shadow-card"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[0.16em] text-muted-foreground">0{i+1}</span><div className="grid size-10 place-items-center rounded-2xl bg-secondary"><Icon className="size-5 text-accent"/></div></div><h2 className="mt-7 font-display text-xl font-bold text-primary">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}
    </div>

    <section className="mt-8 overflow-hidden rounded-[28px] bg-navy p-7 text-navy-foreground shadow-lift md:p-9">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="flex items-center gap-2 text-leaf-soft"><Coins className="size-5"/><span className="eyebrow">Reva Fund</span></div><h2 className="mt-3 max-w-2xl font-display text-3xl font-bold">Reviewed funding rules, not guessed eligibility.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-navy-foreground/68">Material scheme changes stay under review until approved. DOMUREVA can explain a match, identify missing facts and propose a funding stack, but the administering authority remains the final decision-maker.</p></div><Button asChild variant="outline" className="rounded-full border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"><Link to="/cases">Choose a case <ArrowRight className="ml-1 size-4"/></Link></Button></div>
    </section>
  </Container>;
}
