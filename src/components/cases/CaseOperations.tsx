import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Check, CircleAlert, ClipboardList, FileText, MessageSquare, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Task = {
  id: string;
  title: string;
  task_type: string;
  status: string;
  blocking: boolean;
  due_at: string | null;
  created_at: string;
  assigned_to: string | null;
};
type TaskResult = {
  caseId: string;
  tasks: Task[];
  viewerId: string;
  canManage: boolean;
  limitedTo: number;
};
type CaseMessage = {
  id: string;
  body: string;
  sender_id: string | null;
  sender_role: string | null;
  created_at: string | null;
};
type MessageResult = { messages: CaseMessage[]; viewerId: string; limitedTo: number };
type CaseSummary = {
  status: string;
  role: string;
  counts: {
    preliminaryFundingMatches: number;
    evidenceRecords: number;
    evidenceVerified: number;
    openTasks: number;
    blockers: number;
    quoteRequests: number;
  };
  permissions: {
    canManageTasks: boolean;
    canRequestQuotes: boolean;
    canViewPack: boolean;
    canMatchFunding: boolean;
  };
  project: { status: string; budget: number | null; target_completion: string | null } | null;
  finances: {
    currency: string;
    estimated_works: number | null;
    approved_funding: number | null;
    owner_contribution: number | null;
    committed_contract_value: number | null;
    paid_to_date: number | null;
  } | null;
  recentActivity: Array<{
    id: string;
    from_status: string | null;
    to_status: string;
    reason: string | null;
    created_at: string;
  }>;
  notes: string[];
};

async function authorisedJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session has expired. Sign in again.");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", "Bearer " + session.access_token);
  const response = await fetch(path, { ...init, headers });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result;
}

function shortDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not set";
}

function ResultError({ label, retry }: { label: string; retry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-card p-6" role="alert">
      <p className="text-sm font-semibold text-primary">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection or case permissions, then try again.</p>
      <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={retry}>Retry</Button>
    </div>
  );
}

const TASK_TYPES = [
  ["evidence", "Evidence"],
  ["funding", "Funding review"],
  ["survey", "Survey"],
  ["quote", "Quotation"],
  ["works", "Works"],
  ["review", "Internal review"],
  ["other", "Other"],
] as const;

export function CaseOperations({ caseId }: { caseId: string }) {
  const client = useQueryClient();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("evidence");
  const [dueOn, setDueOn] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");

  const summary = useQuery({
    queryKey: ["case", "summary", caseId],
    queryFn: () => authorisedJson<CaseSummary>("/api/cases/summary?caseId=" + encodeURIComponent(caseId)),
  });
  const tasks = useQuery({
    queryKey: ["case", "tasks", caseId],
    queryFn: () => authorisedJson<TaskResult>("/api/cases/tasks?caseId=" + encodeURIComponent(caseId)),
  });
  const messages = useQuery({
    queryKey: ["case", "messages", caseId],
    queryFn: () => authorisedJson<MessageResult>("/api/messages?caseId=" + encodeURIComponent(caseId)),
  });

  const createTask = useMutation({
    mutationFn: () => authorisedJson<{ status: string }>("/api/cases/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId,
        title: taskTitle.trim(),
        taskType,
        blocking,
        ...(dueOn ? { dueOn } : {}),
      }),
    }),
    onSuccess: () => {
      toast.success("Task recorded");
      setTaskTitle("");
      setDueOn("");
      setBlocking(false);
      void client.invalidateQueries({ queryKey: ["case", "tasks", caseId] });
      void client.invalidateQueries({ queryKey: ["case", "summary", caseId] });
    },
    onError: (error: Error) => toast.error("Task could not be saved", { description: error.message }),
  });

  const completeTask = useMutation({
    mutationFn: (taskId: string) => authorisedJson<{ status: string }>("/api/cases/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, taskId, action: "complete" }),
    }),
    onSuccess: () => {
      toast.success("Task completed");
      void client.invalidateQueries({ queryKey: ["case", "tasks", caseId] });
      void client.invalidateQueries({ queryKey: ["case", "summary", caseId] });
    },
    onError: (error: Error) => toast.error("Task could not be completed", { description: error.message }),
  });

  const sendMessage = useMutation({
    mutationFn: (body: string) => authorisedJson<{ status: string }>("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, body }),
    }),
    onSuccess: () => {
      toast.success("Message saved to case");
      setMessageDraft("");
      void client.invalidateQueries({ queryKey: ["case", "messages", caseId] });
    },
    onError: (error: Error) => toast.error("Message could not be sent", { description: error.message }),
  });

  return (
    <section className="mt-8" aria-labelledby="case-operations">
      <div className="mb-5">
        <h2 id="case-operations" className="font-display text-2xl font-semibold text-primary">Case command centre</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Live case records, next actions and secure communication. Funding matches remain provisional until authority review.
        </p>
      </div>
      {summary.isLoading ? <Skeleton className="h-32 w-full rounded-3xl" /> : summary.isError ? (
        <ResultError label="Could not load this case summary" retry={() => void summary.refetch()} />
      ) : summary.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Open tasks", summary.data.counts.openTasks, summary.data.counts.blockers + " blocking"],
              ["Funding matches", summary.data.counts.preliminaryFundingMatches, "Preliminary only"],
              ["Recorded evidence", summary.data.counts.evidenceRecords, summary.data.counts.evidenceVerified + " marked verified"],
              ["Quote requests", summary.data.counts.quoteRequests, "Saved requests"],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-primary">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/funding/stack">Costed funding plan <ArrowRight className="size-4" /></Link>
            </Button>
            {summary.data.permissions.canViewPack ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/application-pack">Evidence & application pack <ArrowRight className="size-4" /></Link>
              </Button>
            ) : null}
            <Badge variant="secondary" className="px-3 py-2 capitalize">Role: {summary.data.role.replace(/_/g, " ")}</Badge>
          </div>
        </>
      ) : null}

      <Tabs defaultValue="tasks" className="mt-7">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-secondary/70 p-1 sm:w-fit" aria-label="Case operations">
          <TabsTrigger value="tasks" className="gap-2"><ClipboardList className="size-4" /> Tasks</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2"><MessageSquare className="size-4" /> Messages</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><FileText className="size-4" /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-primary">Case tasks</h3>
                <Badge variant="secondary">{tasks.data?.tasks.length ?? "—"} shown</Badge>
              </div>
              {tasks.isLoading ? <Skeleton className="mt-5 h-32 w-full" /> : tasks.isError ? (
                <div className="mt-5"><ResultError label="Tasks could not be loaded" retry={() => void tasks.refetch()} /></div>
              ) : (tasks.data?.tasks.length ?? 0) === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border p-7 text-center">
                  <ClipboardList className="mx-auto size-7 text-accent" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-primary">No tasks recorded</p>
                  <p className="mt-2 text-sm text-muted-foreground">Tasks will appear here as your case develops.</p>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {tasks.data?.tasks.map((task) => {
                    const actionable = task.status === "open" && (tasks.data.canManage ||
                      (task.assigned_to === tasks.data.viewerId && task.assigned_to !== null));
                    return (
                      <li key={task.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-primary">{task.title}</p>
                            {task.blocking && task.status === "open" ? <Badge variant="destructive">Blocking</Badge> : null}
                            <Badge variant="secondary" className="capitalize">{task.status.replace(/_/g, " ")}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {task.task_type.replace(/_/g, " ")} · Due {shortDate(task.due_at)}
                          </p>
                        </div>
                        {actionable ? (
                          <Button type="button" size="sm" variant="outline" disabled={completeTask.isPending}
                            className="rounded-full" onClick={() => completeTask.mutate(task.id)}>
                            <Check className="size-4" /> Complete
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-primary">Add a follow-up task</h3>
              {tasks.isLoading ? <Skeleton className="mt-4 h-32 w-full" /> : tasks.data?.canManage ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="case-task-title">Task</Label>
                    <Input id="case-task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Obtain updated EPC" maxLength={180} className="mt-2 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="case-task-type">Category</Label>
                    <Select value={taskType} onValueChange={setTaskType}>
                      <SelectTrigger id="case-task-type" className="mt-2 h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="case-task-due">Due date (optional)</Label>
                    <Input id="case-task-due" type="date" value={dueOn}
                      onChange={(e) => setDueOn(e.target.value)} className="mt-2 h-11 rounded-xl" />
                  </div>
                  <label className="flex items-center gap-3 text-sm text-foreground">
                    <Checkbox checked={blocking} onCheckedChange={(v) => setBlocking(v === true)} />
                    This task blocks progression
                  </label>
                  <Button type="button" className="w-full rounded-full" disabled={createTask.isPending || taskTitle.trim().length < 3}
                    onClick={() => createTask.mutate()}>
                    {createTask.isPending ? "Saving task…" : "Add task"}
                  </Button>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Task creation is reserved for authorised case managers. You can still review any assigned tasks.
                </p>
              )}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-xl font-semibold text-primary">Case conversations</h3>
            <p className="mt-2 text-sm text-muted-foreground">Messages are visible to authorised participants on this case. No external message delivery is implied.</p>
            {messages.isLoading ? <Skeleton className="mt-5 h-32 w-full" /> : messages.isError ? (
              <div className="mt-5"><ResultError label="Messages could not be loaded" retry={() => void messages.refetch()} /></div>
            ) : (
              <div role="log" aria-label="Case messages" className="mt-5 max-h-[360px] space-y-3 overflow-y-auto">
                {messages.data?.messages.length ? messages.data.messages.map((message) => {
                  const mine = message.sender_id === messages.data?.viewerId;
                  return <div key={message.id} className={"rounded-2xl border p-4 " +
                    (mine ? "border-accent/30 bg-secondary/40" : "border-border bg-background")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-primary">{mine ? "You" : (message.sender_role ?? "Case participant").replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{shortDate(message.created_at)}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{message.body}</p>
                  </div>;
                }) : <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No messages recorded for this case.</p>}
              </div>
            )}
            <div className="mt-6 border-t border-border pt-5">
              <Label htmlFor="case-message">Write a case message</Label>
              <Textarea id="case-message" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)}
                maxLength={4000} rows={3} placeholder="Share an update or ask a question about this property…" className="mt-2 rounded-xl" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">{messageDraft.length}/4000 characters · Saved to the case only</p>
                <Button type="button" className="rounded-full" disabled={sendMessage.isPending || !messageDraft.trim()}
                  onClick={() => sendMessage.mutate(messageDraft.trim())}>
                  <Send className="size-4" /> {sendMessage.isPending ? "Saving…" : "Send message"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display text-xl font-semibold text-primary">Case activity</h3>
            <p className="mt-2 text-sm text-muted-foreground">Recorded stage transitions; these are not funding award decisions.</p>
            {summary.isLoading ? <Skeleton className="mt-5 h-36 w-full" /> : summary.isError ? (
              <div className="mt-4"><ResultError label="Activity could not be loaded" retry={() => void summary.refetch()} /></div>
            ) : summary.data?.recentActivity.length ? (
              <ol className="mt-5 divide-y divide-border">
                {summary.data.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-4">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-primary capitalize">{item.from_status ?? "Opened"} → {item.to_status.replace(/_/g, " ")}</p>
                      {item.reason ? <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p> : null}
                      <p className="mt-2 text-xs text-muted-foreground">{shortDate(item.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-5 text-sm text-muted-foreground">No stage transition history is recorded yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
