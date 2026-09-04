import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileStack, Handshake, Home, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/provider/offers")({
  head:()=>({meta:[{title:"Provider offers | DOMUREVA"},{name:"description",content:"Create and track lease-and-repair, purchase-and-repair and management proposals."},{property:"og:title",content:"Provider offers | DOMUREVA"},{property:"og:description",content:"Manage proposals for suitable empty homes from a single workspace."}]}),
  component:ProviderOffersPage,
});

function ProviderOffersPage(){return <Container className="max-w-[1180px]">
  <div className="overflow-hidden rounded-[30px] bg-navy p-7 text-navy-foreground shadow-lift md:p-9"><p className="eyebrow text-leaf-soft">Provider offers</p><h1 className="mt-3 max-w-3xl font-display text-3xl font-bold md:text-5xl">Move from matched opportunity to a structured offer.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-navy-foreground/68">Create lease-and-repair, purchase-and-repair and management proposals while keeping every decision linked to the underlying DOMUREVA case.</p></div>
  <div className="mt-6 grid gap-4 md:grid-cols-3">{[[Handshake,"Lease & repair","Propose lease terms alongside an agreed works route."],[Home,"Purchase & repair","Structure acquisition and refurbishment around the same case."],[Sparkles,"Management route","Record provider-led management proposals where appropriate."]].map(([Icon,title,copy])=>{const I=Icon as typeof Handshake;return <div key={String(title)} className="rounded-3xl border border-border bg-card p-6 shadow-card"><I className="size-5 text-accent"/><h2 className="mt-5 font-display text-xl font-bold text-primary">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(copy)}</p></div>})}</div>
  <div className="mt-8 rounded-[30px] border border-dashed border-border bg-card p-10 text-center shadow-card"><FileStack className="mx-auto size-9 text-accent"/><h2 className="mt-4 font-display text-2xl font-bold text-primary">No offers yet</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Start from a ranked provider opportunity. Once an offer is created, its status, counters and eventual acceptance will stay visible here.</p><div className="mt-6 flex justify-center"><Button asChild className="rounded-full bg-amber text-amber-foreground"><Link to="/providers">Review opportunities <ArrowRight className="ml-1 size-4"/></Link></Button></div></div>
 </Container>}
