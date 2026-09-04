import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Hammer, MapPin } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type QuoteRequest = { id:string; case_id:string; status:string; work_scope:unknown; created_at:string };
function workScopeSummary(workScope:unknown){if(workScope&&typeof workScope==="object"&&Array.isArray((workScope as {works?:unknown}).works)){return ((workScope as {works:unknown[]}).works).map(String).join(" • ")}return "Refurbishment scope available"}

export const Route = createFileRoute("/_authenticated/contractors/")({
  head:()=>({meta:[{title:"Contractor opportunities | DOMUREVA"},{name:"description",content:"Verified refurbishment opportunities for Craftvaro-linked contractor organisations."},{property:"og:title",content:"Contractor opportunities | DOMUREVA"},{property:"og:description",content:"Role-controlled quote access for verified contractor organisations."}]}),
  component:ContractorsPage,
});

function ContractorsPage(){
  const {data,isLoading,isError}=useQuery({queryKey:["contractors","quote-requests"],queryFn:async()=>{const {data,error}=await supabase.from("quote_requests").select("id,case_id,status,work_scope,created_at").order("created_at",{ascending:false}).limit(20);if(error)throw error;return(data??[]) as QuoteRequest[]}});
  return <Container className="max-w-[1240px]">
    <div className="overflow-hidden rounded-[30px] bg-gradient-hero p-7 text-navy-foreground shadow-lift md:p-9">
      <p className="eyebrow text-leaf-soft">Craftvaro delivery network</p>
      <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight md:text-5xl">Qualified work. Clear scope. Better delivery.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-navy-foreground/70">Verified contractor organisations can review matched refurbishment opportunities, understand the work scope and progress from quote to award within the same case journey.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Button asChild className="rounded-full bg-amber text-amber-foreground"><a href="/contractors/profile">Manage contractor profile</a></Button><Badge variant="secondary" className="gap-1 px-4 py-2"><BadgeCheck className="size-4"/> Verification-led access</Badge></div>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-3">{[[BriefcaseBusiness,"Open requests",data?.length??"—"],[MapPin,"Coverage","Role-based"],[BadgeCheck,"Identity","Craftvaro-linked"]].map(([Icon,label,value])=>{const I=Icon as typeof BriefcaseBusiness;return <div key={String(label)} className="rounded-3xl border border-border bg-card p-5 shadow-card"><I className="size-5 text-accent"/><p className="mt-4 text-sm text-muted-foreground">{String(label)}</p><p className="mt-1 font-display text-2xl font-bold text-primary">{String(value)}</p></div>})}</div>

    <section className="mt-8"><PageHeader eyebrow="Matched work" title="Refurbishment opportunities" description="Access is controlled by role, verification and case eligibility."/>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading?Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-56 rounded-3xl"/>):isError?<div className="col-span-full rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">Couldn't load quote requests.</div>:data&&data.length?data.map((x)=><Card key={x.id} className="group rounded-3xl shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"><CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Case {x.case_id.slice(0,8)}</p><CardTitle className="mt-2 text-lg">Refurbishment request</CardTitle></div><Badge variant="secondary" className="capitalize">{x.status}</Badge></CardHeader><CardContent className="space-y-5"><p className="min-h-12 text-sm leading-6 text-muted-foreground">{workScopeSummary(x.work_scope)}</p><div className="flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">Opened {new Date(x.created_at).toLocaleDateString()}</span><Button asChild variant="outline" size="sm" className="rounded-full"><a href={`/cases/${x.case_id}`}>View <ArrowRight className="ml-1 size-3.5"/></a></Button></div></CardContent></Card>):<div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center"><Hammer className="mx-auto size-8 text-accent"/><p className="mt-3 font-display text-lg font-bold text-primary">No open opportunities</p><p className="mt-1 text-sm text-muted-foreground">New matched scopes will appear when suitable cases reach quoting stage.</p></div>}
      </div>
    </section>
  </Container>
}
