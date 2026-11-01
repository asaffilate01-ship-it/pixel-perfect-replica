import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Coins, FileCheck2, Hammer, Sparkles } from "lucide-react";

import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { loadCaseDirectory } from "@/lib/domureva/cases/directory";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | DOMUREVA" }] }),
  component: DashboardPage,
});

type CaseRow = { id: string; status: string | null; created_at: string; properties: { address_line: string | null; postcode: string | null } | null };

function DashboardPage() {
  const cases = useQuery({
    queryKey:["dashboard","cases"],
    queryFn: async()=> (await loadCaseDirectory()).cases.slice(0, 6),
  });
  const counts = useQuery({
    queryKey:["dashboard","counts"],
    queryFn: async()=>{ const [properties,matches,projects,evidence]=await Promise.all([
      supabase.from("properties").select("id",{count:"exact",head:true}),
      supabase.from("funding_matches").select("id",{count:"exact",head:true}),
      supabase.from("projects").select("id",{count:"exact",head:true}),
      supabase.from("evidence_items").select("id",{count:"exact",head:true}),
    ]); for (const result of [properties, matches, projects, evidence]) { if (result.error) throw result.error; } return {properties:properties.count??0,matches:matches.count??0,projects:projects.count??0,evidence:evidence.count??0}; },
  });

  return <Container className="pt-7">
    <WorkspaceNav />
    <div className="overflow-hidden rounded-[28px] bg-gradient-hero px-7 py-8 text-navy-foreground shadow-lift md:px-10 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-navy-foreground/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-leaf-soft"><Sparkles className="size-3.5"/>Workspace</span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight md:text-5xl">Your empty homes pipeline.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-navy-foreground/70">See what is moving, what needs evidence and where funding or delivery action is required next.</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Button asChild className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90"><Link to="/properties/new">Check a property</Link></Button>
          <Button asChild variant="outline" className="rounded-full border-navy-foreground/20 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"><Link to="/copilot">Ask Reva</Link></Button>
        </div>
      </div>
    </div>

    {counts.isError ? <div className="mt-6 rounded-xl border border-destructive/30 p-4 text-sm text-destructive" role="alert">Dashboard totals could not be loaded. <Button type="button" variant="outline" size="sm" onClick={() => void counts.refetch()}>Retry</Button></div> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Building2} label="Properties" value={counts.data?.properties??"—"} hint="Registered properties" />
      <StatCard icon={Coins} label="Funding matches" value={counts.data?.matches??"—"} hint="Against reviewed schemes" />
      <StatCard icon={Hammer} label="Projects" value={counts.data?.projects??"—"} hint="In delivery" />
      <StatCard icon={FileCheck2} label="Evidence" value={counts.data?.evidence??"—"} hint="Attached to case records" />
    </div>

    <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <section>
        <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold text-primary">Recent cases</h2><Link to="/cases" className="inline-flex items-center gap-1 text-sm font-bold text-accent">All cases <ArrowRight className="size-4"/></Link></div>
        <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          {cases.isLoading ? <div className="grid gap-3 p-6"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-4/5"/></div> : cases.isError ? <div className="p-8 text-center" role="alert"><p className="font-semibold text-primary">Could not load recent cases.</p><Button variant="outline" className="mt-4 rounded-full" onClick={() => void cases.refetch()}>Try again</Button></div> : (cases.data?.length??0)===0 ? <div className="p-10 text-center"><p className="font-display text-xl font-bold text-primary">No cases yet</p><p className="mt-2 text-sm text-muted-foreground">Start with a property and DOMUREVA will create the case journey around it.</p><Button asChild className="mt-5"><Link to="/properties/new">Check a property</Link></Button></div> : <div className="divide-y divide-border">{cases.data?.map(c=><Link key={c.id} to="/cases/$caseId" params={{caseId:c.id}} className="group grid gap-2 px-5 py-5 transition-colors hover:bg-secondary/50 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold text-primary">{c.properties?.address_line??"Unnamed property"}</p><p className="mt-1 text-xs text-muted-foreground">{c.properties?.postcode??"No postcode"} · {c.status??"assessment"}</p></div><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></Link>)}</div>}
        </div>
      </section>
      <aside className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <p className="eyebrow text-accent">Next best action</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-primary">Keep every case moving.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Use Reva to identify missing evidence, stale funding checks, quotes awaiting action or project milestones that need attention.</p>
        <Button asChild variant="outline" className="mt-6 w-full rounded-full"><Link to="/copilot">Open Reva Copilot</Link></Button>
      </aside>
    </div>
  </Container>;
}
