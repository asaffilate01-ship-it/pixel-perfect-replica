import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, ShieldCheck, Sparkles, User } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/layout/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "Reva Copilot | DOMUREVA" }, { name: "description", content: "Ask Reva about funding, evidence, quotes, offers and next actions." }] }),
  component: CopilotPage,
});

type ChatMessage = { id:string; role:"user"|"assistant"; content:string };
function ChatBubble({message}:{message:ChatMessage}) {
  const isUser=message.role==="user";
  return <div className={`flex gap-3 ${isUser?"flex-row-reverse":""}`}><div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isUser?"bg-navy text-navy-foreground":"bg-gradient-brand text-accent-foreground"}`}>{isUser?<User className="size-4"/>:<Bot className="size-4"/>}</div><div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${isUser?"bg-navy text-navy-foreground":"border border-border bg-card"}`}><p className="whitespace-pre-wrap leading-6">{message.content}</p></div></div>;
}

function CopilotPage(){
  const [messages,setMessages]=useState<ChatMessage[]>([]); const [draft,setDraft]=useState(""); const conversationId=useRef<string>(crypto.randomUUID());
  const sendMessage=useMutation({mutationFn:async(message:string)=>{const{data:{session}}=await supabase.auth.getSession();const res=await fetch("/api/agent/chat",{method:"POST",headers:{"content-type":"application/json",Authorization:`Bearer ${session?.access_token??""}`},body:JSON.stringify({message,conversationId:conversationId.current,role:"owner"})});const body=await res.json();if(!res.ok)throw new Error(body?.error??"Reva could not respond");return body as {answer?:string;instruction?:string;status:string};},onSuccess:(data)=>setMessages(prev=>[...prev,{id:crypto.randomUUID(),role:"assistant",content:data.answer??data.instruction??"Reva has grounded the next action in your case data."}]),onError:(error:Error)=>{toast.error("Reva could not respond",{description:error.message});setMessages(prev=>[...prev,{id:crypto.randomUUID(),role:"assistant",content:"I couldn't reach the copilot service. Please try again shortly."}]);}});
  function handleSend(){const trimmed=draft.trim();if(!trimmed||sendMessage.isPending)return;setMessages(prev=>[...prev,{id:crypto.randomUUID(),role:"user",content:trimmed}]);setDraft("");sendMessage.mutate(trimmed);}
  return <Container>
    <WorkspaceNav />
    <PageHeader eyebrow="Reva AI" title="Your case copilot" description="Ask what is eligible, what is missing, what changed and what to do next — with reviewed rules and case evidence kept distinct from estimates." actions={<Badge variant="secondary" className="gap-1"><ShieldCheck className="size-3 text-accent"/> Grounded by design</Badge>} />
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="flex h-[640px] flex-col overflow-hidden rounded-3xl shadow-card">
        <div className="border-b border-border bg-secondary/40 px-6 py-4"><p className="text-sm font-semibold text-primary">Reva Copilot</p><p className="mt-1 text-xs text-muted-foreground">Reviewed rules · verified facts · explicit estimates</p></div>
        <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">{messages.length===0?<div className="flex flex-1 flex-col items-center justify-center text-center"><div className="grid size-14 place-items-center rounded-2xl bg-secondary"><Sparkles className="size-6 text-accent"/></div><h2 className="mt-5 font-display text-xl font-bold text-primary">What should we work on?</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Ask about a funding match, evidence gap, quote, provider offer or the next best action on a case.</p></div>:messages.map(m=><ChatBubble key={m.id} message={m}/>)}{sendMessage.isPending?<div className="flex items-center gap-2 text-xs text-muted-foreground"><Bot className="size-4 animate-pulse text-accent"/> Reva is checking the case…</div>:null}</CardContent>
        <div className="border-t border-border p-4"><div className="flex items-end gap-2"><Textarea value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}} placeholder="Ask Reva about this case…" className="min-h-[54px] flex-1 resize-none rounded-2xl"/><Button onClick={handleSend} disabled={sendMessage.isPending||!draft.trim()} className="rounded-full px-5">Send</Button></div></div>
      </Card>
      <aside className="space-y-4">
        <div className="rounded-3xl bg-navy p-6 text-navy-foreground shadow-lift"><p className="eyebrow text-leaf-soft">Why you can trust the answer</p><h2 className="mt-3 font-display text-2xl font-bold">Reva shows its boundaries.</h2><p className="mt-3 text-sm leading-6 text-navy-foreground/70">Material funding-rule conflicts are escalated instead of guessed. Missing evidence becomes an explicit task.</p></div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card"><p className="text-sm font-semibold text-primary">Useful prompts</p><div className="mt-4 grid gap-2 text-sm text-muted-foreground"><button className="rounded-xl border border-border p-3 text-left hover:bg-secondary" onClick={()=>setDraft("What evidence is still missing?")}>What evidence is still missing?</button><button className="rounded-xl border border-border p-3 text-left hover:bg-secondary" onClick={()=>setDraft("Which funding route is strongest and why?")}>Which funding route is strongest?</button><button className="rounded-xl border border-border p-3 text-left hover:bg-secondary" onClick={()=>setDraft("What should I do next on this case?")}>What should I do next?</button></div></div>
      </aside>
    </div>
  </Container>;
}
