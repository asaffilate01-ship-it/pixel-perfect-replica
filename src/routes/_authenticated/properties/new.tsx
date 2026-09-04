import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, Coins, FileCheck2, MapPin, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head:()=>({meta:[{title:"Check an empty property | DOMUREVA"},{name:"description",content:"Answer a few questions about an empty property so Reva can match it against reviewed funding rules."},{property:"og:title",content:"Check an empty property | DOMUREVA"},{property:"og:description",content:"Reva asks only the facts needed to match reviewed funding rules."}]}),
  component:NewPropertyPage,
});

type FieldKey="postcode"|"emptyMonths"|"relationship"|"intendedUse"|"condition";
type Step={eyebrow:string;key:FieldKey;label:string;helper:string;options?:string[];icon:typeof MapPin};
const STEPS:Step[]=[
 {eyebrow:"Property",key:"postcode",label:"Where is the property?",helper:"We use the postcode to resolve the local authority and geographic funding rules.",icon:MapPin},
 {eyebrow:"Vacancy",key:"emptyMonths",label:"How long has it been empty?",helper:"Many schemes use vacancy duration as a material eligibility rule.",icon:Building2},
 {eyebrow:"Ownership",key:"relationship",label:"What is your relationship to the property?",helper:"This helps Reva distinguish owner, purchaser, landlord and provider routes.",options:["Owner","Purchaser","Landlord","Company","Housing provider"],icon:CheckCircle2},
 {eyebrow:"Plan",key:"intendedUse",label:"What should happen after the works?",helper:"Intended use can affect funding, nomination and provider options.",options:["Owner occupation","Private rent","Affordable rent","Social rent","Sale"],icon:Coins},
 {eyebrow:"Condition",key:"condition",label:"What best describes the condition?",helper:"This gives Reva a first-pass indication of likely delivery complexity.",options:["Light works","Moderate refurbishment","Major refurbishment","Structural concerns"],icon:FileCheck2},
];
const OWNER_TYPE_MAP:Record<string,string>={Owner:"owner",Purchaser:"purchaser",Landlord:"landlord",Company:"company","Housing provider":"housing_provider"};
const INTENDED_USE_MAP:Record<string,string>={"Owner occupation":"owner_occupation","Private rent":"private_rent","Affordable rent":"affordable_rent","Social rent":"social_rent",Sale:"sale"};

function NewPropertyPage(){
 const navigate=useNavigate(); const [step,setStep]=useState(0); const [values,setValues]=useState<Partial<Record<FieldKey,string>>>({}); const current=STEPS[step]!; const progress=useMemo(()=>Math.round(((step+1)/STEPS.length)*100),[step]);
 const submit=useMutation({mutationFn:async()=>{const {data:userData,error:userError}=await supabase.auth.getUser();if(userError||!userData.user)throw new Error("You need to be signed in.");const emptyMonths=Number.parseInt(values.emptyMonths??"0",10)||0;const emptySince=new Date();emptySince.setMonth(emptySince.getMonth()-emptyMonths);const {data:property,error:propertyError}=await supabase.from("properties").insert({postcode:values.postcode??"",empty_since:emptySince.toISOString().slice(0,10),owner_type:values.relationship?(OWNER_TYPE_MAP[values.relationship]??null):null,intended_use:values.intendedUse?(INTENDED_USE_MAP[values.intendedUse]??null):null,created_by:userData.user.id}).select("id").single();if(propertyError||!property)throw propertyError??new Error("Could not save property.");const {data:caseRow,error:caseError}=await supabase.from("cases").insert({property_id:property.id}).select("id").single();if(caseError||!caseRow)throw caseError??new Error("Could not open a case.");return caseRow.id as string},onSuccess:(caseId)=>{toast.success("Property saved. Running the reviewed funding match…");navigate({to:"/cases/$caseId",params:{caseId}})},onError:(e:Error)=>toast.error(e.message||"Something went wrong saving this property.")});
 const value=values[current.key]??""; const setValue=(next:string)=>setValues(prev=>({...prev,[current.key]:next})); const isLast=step===STEPS.length-1; const canContinue=value.trim().length>0; const Icon=current.icon;
 return <Container className="max-w-[1180px]">
  <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
   <section className="overflow-hidden rounded-[30px] border border-border bg-card shadow-lift">
    <div className="bg-navy p-7 text-navy-foreground md:p-9"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow text-leaf-soft">Reva Assess</p><h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Check an empty property</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-navy-foreground/68">Five focused questions give DOMUREVA enough context to open the case and start matching reviewed funding routes.</p></div><Sparkles className="hidden size-8 text-leaf-soft sm:block"/></div><Progress value={progress} className="mt-7"/><p className="mt-2 text-xs text-navy-foreground/55">Step {step+1} of {STEPS.length} · {progress}% complete</p></div>
    <div className="p-7 md:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-secondary"><Icon className="size-5 text-accent"/></div><p className="eyebrow mt-6 text-accent">{current.eyebrow}</p><h2 className="mt-2 font-display text-2xl font-bold text-primary">{current.label}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{current.helper}</p>
     <div className="mt-6">{current.options?<Select value={value} onValueChange={setValue}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select an option"/></SelectTrigger><SelectContent>{current.options.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>:<div><Label htmlFor={current.key} className="sr-only">{current.label}</Label><Input id={current.key} value={value} onChange={e=>setValue(e.target.value)} inputMode={current.key==="emptyMonths"?"numeric":undefined} placeholder={current.key==="postcode"?"e.g. LU1 2AA":"Enter number of months"} className="h-12 rounded-xl"/></div>}</div>
     <div className="mt-8 flex justify-between gap-3">{step>0?<Button variant="outline" className="rounded-full" onClick={()=>setStep(s=>s-1)}>Back</Button>:<span/>}{isLast?<Button className="rounded-full bg-amber px-6 text-amber-foreground hover:bg-amber/90" disabled={!canContinue||submit.isPending} onClick={()=>submit.mutate()}>{submit.isPending?"Opening case…":"Run reviewed funding match"}</Button>:<Button className="rounded-full px-6" disabled={!canContinue} onClick={()=>setStep(s=>s+1)}>Continue</Button>}</div>
    </div>
   </section>
   <aside className="space-y-4"><div className="rounded-[30px] bg-gradient-brand p-7 text-navy-foreground shadow-card"><p className="eyebrow text-navy-foreground/60">What happens next</p><h2 className="mt-3 font-display text-2xl font-bold">From postcode to a usable case.</h2><div className="mt-6 space-y-5">{[["1","Resolve authority","Map the postcode to the correct local authority and geographic rules."],["2","Check reviewed schemes","Only reviewed material rules are allowed into live eligibility."],["3","Build the evidence path","Ask only for evidence relevant to genuine matched routes."]].map(([n,t,b])=><div key={n} className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-navy-foreground">{n}</div><div><p className="font-semibold">{t}</p><p className="mt-1 text-sm leading-5 text-navy-foreground/68">{b}</p></div></div>)}</div></div><div className="rounded-3xl border border-border bg-card p-6 shadow-card"><p className="text-sm font-semibold text-primary">No grant outcome is guaranteed.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">DOMUREVA helps identify and evidence routes. The administering authority makes the final eligibility and award decision.</p></div></aside>
  </div>
 </Container>
}
