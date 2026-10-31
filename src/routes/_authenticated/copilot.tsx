import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, RotateCcw, ShieldCheck, Sparkles, User } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({
    meta: [
      { title: "Reva Copilot | DOMUREVA" },
      { name: "description", content: "Ask Reva about your own property case, reviewed funding schemes, evidence and next steps." },
    ],
  }),
  component: CopilotPage,
});

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type CaseOption = { id: string; properties: { postcode: string; address_line: string | null } | null };
type ChatResponse = { status: string; answer: string; conversationId: string; answerMode: "case-grounded" | "general-guidance" };

const STARTER_PROMPTS = [
  "Which evidence is still missing?",
  "What do the reviewed funding matches tell us?",
  "What is the next practical action?",
];

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={"flex gap-3 " + (isUser ? "flex-row-reverse" : "")}>
      <div className={"flex size-9 shrink-0 items-center justify-center rounded-full " + (isUser ? "bg-navy text-navy-foreground" : "bg-secondary text-accent")}>
        {isUser ? <User className="size-4" aria-hidden="true" /> : <Bot className="size-4" aria-hidden="true" />}
      </div>
      <div className={"max-w-[88%] rounded-2xl px-4 py-3 text-sm sm:max-w-[78%] " + (isUser ? "bg-navy text-navy-foreground" : "border border-border bg-card")}>
        <p className="whitespace-pre-wrap break-words leading-6">{message.content}</p>
      </div>
    </div>
  );
}

function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedCase, setSelectedCase] = useState("general");
  const conversationId = useRef<string | null>(null);

  const cases = useQuery({
    queryKey: ["reva", "available-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, properties(postcode, address_line)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CaseOption[];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again to speak to Reva.");
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({
          message,
          ...(selectedCase !== "general" ? { caseId: selectedCase } : {}),
          ...(conversationId.current ? { conversationId: conversationId.current } : {}),
        }),
      });
      const body = await response.json() as Partial<ChatResponse> & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Reva could not respond.");
      if (!body.answer || !body.conversationId) throw new Error("Reva returned an incomplete response.");
      return body as ChatResponse;
    },
    onSuccess: (data) => {
      conversationId.current = data.conversationId;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.answer },
      ]);
    },
    onError: (error: Error) => toast.error("Reva could not respond", { description: error.message }),
  });

  function switchCase(next: string) {
    conversationId.current = null;
    setSelectedCase(next);
    setMessages([]);
    setDraft("");
  }

  function startFresh() {
    conversationId.current = null;
    setMessages([]);
    setDraft("");
  }

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sendMessage.isPending || trimmed.length > 2400) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setDraft("");
    sendMessage.mutate(trimmed);
  }

  const hasCase = selectedCase !== "general";

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Reva AI"
        title="Your property copilot"
        description="Ask about real case evidence, reviewed scheme matches, delivery tasks and the next action. Select a case to ground Reva in its records."
        actions={<Badge variant="secondary" className="gap-1"><ShieldCheck className="size-3 text-accent" /> Human-reviewed funding rules</Badge>}
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden rounded-3xl border-border shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-secondary/30 px-5 py-4 sm:px-6">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="reva-case" className="text-xs font-semibold text-muted-foreground">Case context</Label>
              {cases.isLoading ? <Skeleton className="mt-2 h-10 w-full max-w-xs" /> : (
                <Select value={selectedCase} onValueChange={switchCase} disabled={sendMessage.isPending}>
                  <SelectTrigger id="reva-case" className="mt-2 h-10 w-full max-w-sm rounded-xl bg-card">
                    <SelectValue placeholder="Choose a case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General guidance (no case selected)</SelectItem>
                    {(cases.data ?? []).map((item) => (
                      <SelectItem value={item.id} key={item.id}>
                        {item.properties?.address_line || item.properties?.postcode || "Unnamed property"} · {item.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {cases.isError ? <p className="mt-2 text-xs text-destructive">Case options could not be loaded. General guidance remains available.</p> : null}
            </div>
            <Button type="button" size="sm" variant="outline" className="gap-2 rounded-full" onClick={startFresh} disabled={sendMessage.isPending || messages.length === 0}>
              <RotateCcw className="size-3.5" /> New conversation
            </Button>
          </div>

          <CardContent role="log" aria-label="Reva conversation" aria-live="polite" aria-relevant="additions" aria-busy={sendMessage.isPending} className="flex max-h-[560px] min-h-[320px] flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-secondary">
                  <Sparkles className="size-5 text-accent" aria-hidden="true" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-primary">
                  {hasCase ? "Explore this case" : "What would you like to know?"}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  {hasCase
                    ? "Reva will check recorded property facts, reviewed funding matches and open tasks for this case."
                    : "Choose a property case above for grounded answers, or ask about the empty-homes process in general."}
                </p>
              </div>
            ) : messages.map((message) => <ChatBubble key={message.id} message={message} />)}
            {sendMessage.isPending ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Bot className="size-4 animate-pulse text-accent" /> Reva is checking the available information…
              </p>
            ) : null}
          </CardContent>

          <div className="border-t border-border bg-card p-4 sm:p-5">
            <Label htmlFor="reva-prompt" className="sr-only">Your message to Reva</Label>
            <div className="flex items-end gap-3">
              <Textarea
                id="reva-prompt"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSend(); } }}
                maxLength={2400}
                rows={2}
                placeholder={hasCase ? "Ask about this property's next steps…" : "Ask about empty-homes regeneration…"}
                className="min-h-[64px] flex-1 resize-none rounded-xl"
              />
              <Button type="button" onClick={handleSend} disabled={sendMessage.isPending || !draft.trim()} className="rounded-full px-5">Send</Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {hasCase ? "Answer uses accessible case records, not a grant approval." : "General guidance only until a case is selected."}
            </p>
          </div>
        </Card>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-primary">Try a question</h2>
            <div className="mt-4 grid gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sendMessage.isPending}
                  className="rounded-xl border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-accent hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                  onClick={() => setDraft(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl bg-navy p-6 text-navy-foreground">
            <ShieldCheck className="size-5 text-leaf-soft" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold">Clear answers, clear limits.</h2>
            <p className="mt-3 text-sm leading-6 text-navy-foreground/75">
              Reva distinguishes source-backed matches from estimates and missing evidence.
              The relevant authority makes every final funding decision.
            </p>
          </section>
        </aside>
      </div>
    </Container>
  );
}
