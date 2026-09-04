import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderKanban, Search } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cases/")({
  head: () => ({ meta: [{ title: "Cases | DOMUREVA" }] }),
  component: CasesPage,
});

type CaseRow = { id:string; status:string; created_at:string; properties:{ postcode:string; address_line:string|null }|null };

function CasesPage() {
  const cases=useQuery({ queryKey:["cases","list"], queryFn:async()=>{const {data,error}=await supabase.from("cases").select("id, status, created_at, properties(postcode, address_line)").order("created_at",{ascending:false}); if(error) throw error; return (data??[]) as unknown as CaseRow[];} });
  return <Container className="pt-7">
    <WorkspaceNav />
    <PageHeader eyebrow="Case workspace" title="Every property, one clear journey." description="Track what is open, what needs action and where each property sits between first assessment and occupation." actions={<Button asChild className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90"><Link to="/properties/new">Check a property</Link></Button>} />

    <div className="mt-8 rounded-3xl border border-border bg-card p-3 shadow-card">
      <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground"><Search className="size-4"/><span>Use the case view to inspect funding, evidence, quotes, providers and delivery status for each property.</span></div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        {cases.isLoading ? <div className="grid gap-3 p-6"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-4/5"/></div> : cases.isError ? <div className="p-10 text-center"><p className="font-display text-lg font-bold text-primary">Couldn’t load your cases</p><p className="mt-1 text-sm text-muted-foreground">Please refresh and try again.</p></div> : (cases.data?.length??0)===0 ? <div className="p-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary"><FolderKanban className="size-6 text-accent"/></div><p className="mt-4 font-display text-xl font-bold text-primary">No cases yet</p><p className="mt-2 text-sm text-muted-foreground">Start with a property and DOMUREVA will build the case around it.</p><Button asChild className="mt-5 rounded-full"><Link to="/properties/new">Check a property</Link></Button></div> : <div className="divide-y divide-border">{cases.data?.map(c=><Link key={c.id} to="/cases/$caseId" params={{caseId:c.id}} className="group grid gap-4 bg-background px-5 py-5 transition-colors hover:bg-secondary/45 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><p className="font-display text-lg font-bold text-primary">{c.properties?.address_line??"Unnamed property"}</p><Badge variant="secondary" className="capitalize">{c.status??"open"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{c.properties?.postcode??"No postcode"} · Opened {new Date(c.created_at).toLocaleDateString()}</p></div><span className="inline-flex items-center gap-2 text-sm font-bold text-accent">Open case <ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/></span></Link>)}</div>}
      </div>
    </div>
  </Container>;
}
