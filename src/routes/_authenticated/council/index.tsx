import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ClipboardList, FolderKanban, Hammer, MapPinned, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/layout/WorkspaceNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const steps = ["Identify", "Contact", "Fund", "Works", "Evidence", "Occupied"];

export const Route = createFileRoute("/_authenticated/council/")({
  head: () => ({ meta: [{ title: "Council command centre | DOMUREVA" }, { name: "description", content: "Manage empty homes cases, funding reviews and delivery outcomes." }] }),
  component: CouncilPage,
});

function CouncilPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["council", "overview"],
    queryFn: async () => {
      const [cases, apps, projects, reviews] = await Promise.all([
        supabase.from("cases").select("*", { count: "exact", head: true }),
        supabase.from("funding_applications").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("rule_change_queue").select("*", { count: "exact", head: true }).eq("status", "draft"),
      ]);
      for (const r of [cases, apps, projects, reviews]) if (r.error) throw r.error;
      return { cases: cases.count ?? 0, apps: apps.count ?? 0, projects: projects.count ?? 0, reviews: reviews.count ?? 0 };
    },
  });

  return <Container>
    <WorkspaceNav />
    <PageHeader eyebrow="Council operations" title="Empty homes command centre" description="One operational view for prioritisation, funding, works, evidence and measurable outcomes across authorised cases." actions={<Button asChild className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90"><a href="/council/map">Open map</a></Button>} />

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading ? Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28 rounded-3xl"/>) : isError ? <div className="col-span-full rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">Couldn't load council metrics. Please try again shortly.</div> : <>
        <StatCard label="Cases" value={data?.cases ?? 0} icon={ClipboardList} hint="Authorised portfolio" />
        <StatCard label="Applications" value={data?.apps ?? 0} icon={FolderKanban} hint="Funding in progress" />
        <StatCard label="Projects" value={data?.projects ?? 0} icon={Hammer} hint="Works in delivery" />
        <StatCard label="Rule reviews" value={data?.reviews ?? 0} icon={ShieldCheck} hint="Human review required" />
      </>}
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-3xl border border-border bg-card p-7 shadow-card">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-accent">Case progression</p><h2 className="mt-2 font-display text-2xl font-bold text-primary">From identification to occupation</h2></div><div className="grid size-12 place-items-center rounded-2xl bg-secondary"><MapPinned className="size-5 text-accent"/></div></div>
        <div className="mt-8 grid gap-3 md:grid-cols-6">{steps.map((step,i)=><div key={step} className={`rounded-2xl border p-4 ${i===0?"border-accent/30 bg-secondary":"border-border bg-background"}`}><p className="text-xs font-bold tracking-[0.16em] text-muted-foreground">0{i+1}</p><p className="mt-3 font-display font-bold text-primary">{step}</p></div>)}</div>
        <div className="mt-7 rounded-2xl border border-border bg-secondary/40 p-5"><p className="text-sm font-semibold text-primary">Governance built in</p><p className="mt-2 text-sm leading-6 text-muted-foreground">No AI-discovered material funding change becomes live until an authorised reviewer approves it. Every case keeps source provenance and evidence history.</p></div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-navy p-6 text-navy-foreground shadow-lift"><p className="eyebrow text-leaf-soft">Priority actions</p><h2 className="mt-3 font-display text-2xl font-bold">Keep decisions moving.</h2><div className="mt-5 grid gap-2"><Button asChild variant="outline" className="justify-start rounded-xl border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"><a href="/review">Review funding changes</a></Button><Button asChild variant="outline" className="justify-start rounded-xl border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"><a href="/projects">Open delivery projects</a></Button></div></div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card"><BarChart3 className="size-5 text-accent"/><h3 className="mt-4 font-display text-xl font-bold text-primary">Impact reporting</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Track homes returned, funding deployed, delivery speed and evidence completeness.</p><Button asChild variant="outline" className="mt-5 w-full rounded-full"><a href="/council/analytics">Open analytics</a></Button></div>
      </aside>
    </div>
  </Container>;
}
