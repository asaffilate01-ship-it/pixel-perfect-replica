import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, ShieldCheck, Sparkles, User } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({
    meta: [
      { title: "Reva Copilot | DOMUREVA" },
      {
        name: "description",
        content:
          "Ask Reva about your property, funding matches, application gaps, contractor quotes, provider offers or next actions — grounded in reviewed rules and verified case facts.",
      },
      { property: "og:title", content: "Reva Copilot | DOMUREVA" },
      {
        property: "og:description",
        content: "A grounded assistant for your empty homes case, escalating conflicts for human review.",
      },
    ],
  }),
  component: CopilotPage,
});

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-navy text-navy-foreground" : "bg-gradient-brand text-accent-foreground"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-card ${
          isUser ? "bg-navy text-navy-foreground" : "border border-border bg-card text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const conversationId = useRef<string>(crypto.randomUUID());

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          message,
          conversationId: conversationId.current,
          role: "owner",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Reva could not respond");
      return body as { instruction?: string; answerMode?: string; status: string };
    },
    onSuccess: (data) => {
      const content =
        data.instruction ??
        "Reva has received your question and will ground the answer in reviewed rules and verified case facts.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content },
      ]);
    },
    onError: (error: Error) => {
      toast.error("Reva could not respond", { description: error.message });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry — I couldn't reach the copilot service. Please try again shortly.",
        },
      ]);
    },
  });

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sendMessage.isPending) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setDraft("");
    sendMessage.mutate(trimmed);
  }

  return (
    <Container>
      <PageHeader
        eyebrow="Copilot"
        title="Reva Copilot"
        description="Ask about your property, funding matches, application gaps, contractor quotes, provider offers or next actions."
        actions={
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3 text-accent" /> Grounded by design
          </Badge>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex h-[600px] flex-col shadow-card">
          <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <Sparkles className="size-8 text-accent" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  Start a conversation with Reva. Ask about funding matches, evidence gaps,
                  contractor quotes or what to do next on a case.
                </p>
              </div>
            ) : (
              messages.map((message) => <ChatBubble key={message.id} message={message} />)
            )}
            {sendMessage.isPending ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bot className="size-4 animate-pulse text-accent" /> Reva is thinking…
              </div>
            ) : null}
          </CardContent>
          <div className="border-t border-border p-4">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Reva about your case…"
                className="min-h-[52px] flex-1 resize-none"
              />
              <Button onClick={handleSend} disabled={sendMessage.isPending || !draft.trim()}>
                Send
              </Button>
            </div>
          </div>
        </Card>

        <Card className="h-fit shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Grounded by design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Reva distinguishes reviewed funding rules, verified case facts and estimates so you
              always know how confident an answer is.
            </p>
            <p>
              Material rule conflicts are escalated for human review rather than answered
              speculatively.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
