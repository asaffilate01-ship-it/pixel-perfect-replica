import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Gauge, Handshake, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ProviderOpportunity = { id:string; route:string; score:number|null; status:string; case_id:string };

export const Route = createFileRoute("/_authenticated/providers/")({
  head: () => ({ meta: [
    { title: "Housing provider opportunities | DOMUREVA" },
    { name: "description", content: "Ranked purchase & repair and lease & repair opportunities for housing providers." },
    { property: "og:title", content: "Housing provider opportunities | DOMUREVA" },
    { property: "og:description", content: "Score-ranked empty home opportunities for authorised housing providers." },
  ]}),
  component: ProvidersPage,
});

function ProvidersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["providers", "opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("provider_opportunities").select("id,route,score,status,case_id").order("score", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as ProviderOpportunity[];
    },
  });

  const highFit = data?.filter((x) => (x.score ?? 0) >= 0.75).length ?? 0;

  return (
    <Container className="max-w-[1240px]">
      <div className="overflow-hidden rounded-[30px] bg-navy p-7 text-navy-foreground shadow-lift md:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow text-leaf-soft">Housing provider workspace</p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight md:text-5xl">Turn suitable empty homes into a ranked acquisition pipeline.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-navy-foreground/68">Review purchase-and-repair and lease-and-repair opportunities with clear fit scores, case context and human-controlled decisions.</p>
          </div>
          <Button asChild className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90"><Link to="/provider/offers">Manage offers</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[ [Building2, "Open opportunities", data?.length ?? "—"], [Gauge, "High-fit matches", isLoading ? "—" : highFit], [Handshake, "Decision model", "Human-led"] ].map(([Icon,label,value]) => { const I=Icon as typeof Building2; return <div key={String(label)} className="rounded-3xl border border-border bg-card p-5 shadow-card"><I className="size-5 text-accent"/><p className="mt-4 text-sm text-muted-foreground">{String(label)}</p><p className="mt-1 font-display text-3xl font-bold text-primary">{String(value)}</p></div> })}
      </div>

      <section className="mt-8">
        <PageHeader eyebrow="Ranked pipeline" title="Opportunities" description="Reva Match ranks fit; acquisition, lease and funding decisions remain with authorised people." />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-56 rounded-3xl"/>) : isError ? (
            <div className="col-span-full rounded-3xl border border-destructive/30 bg-destructive/5 p-7 text-sm text-destructive">Couldn't load provider opportunities. Please try again shortly.</div>
          ) : data && data.length ? data.map((x)=>(
            <article key={x.id} className="group rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between gap-4"><div className="grid size-11 place-items-center rounded-2xl bg-secondary"><Sparkles className="size-5 text-accent"/></div><Badge variant="secondary" className="capitalize">{x.status}</Badge></div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Case {x.case_id.slice(0,8)}</p>
              <h2 className="mt-2 font-display text-2xl font-bold capitalize text-primary">{x.route.replaceAll("_", " ")}</h2>
              <div className="mt-5 flex items-end justify-between border-t border-border pt-5"><div><p className="text-xs text-muted-foreground">Reva fit</p><p className="font-display text-3xl font-bold text-primary">{Math.round((x.score ?? 0)*100)}%</p></div><ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1"/></div>
            </article>
          )) : <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center"><Building2 className="mx-auto size-8 text-accent"/><p className="mt-3 font-display text-lg font-bold text-primary">No ranked opportunities yet</p><p className="mt-1 text-sm text-muted-foreground">New matches will appear as eligible cases progress.</p></div>}
        </div>
      </section>
    </Container>
  );
}
