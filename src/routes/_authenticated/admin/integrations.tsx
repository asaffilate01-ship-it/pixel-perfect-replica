import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, RefreshCw, Webhook } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  head: () => ({
    meta: [
      { title: "Integration control centre | DOMUREVA" },
      {
        name: "description",
        content:
          "Monitor health, failures, replay-safe webhooks and manual-review queues across LeadLens, Dokuvera, Gabley, Craftvaro, Stripe and Resend.",
      },
      { property: "og:title", content: "Integration control centre | DOMUREVA" },
      {
        property: "og:description",
        content: "Health, last success, failures and retry queues for every DOMUREVA integration.",
      },
    ],
  }),
  component: IntegrationsPage,
});

const SYSTEMS = [
  { key: "leadlens", label: "LeadLens" },
  { key: "dokuvera", label: "Dokuvera" },
  { key: "gabley", label: "Gabley" },
  { key: "gabley_retrofit", label: "Gabley Retrofit" },
  { key: "craftvaro", label: "Craftvaro" },
  { key: "stripe", label: "Stripe" },
  { key: "resend", label: "Resend" },
] as const;

type EventRow = {
  id: string;
  provider: string;
  event_type: string;
  status: string;
  error: string | null;
  created_at: string;
};

type ProviderSummary = {
  provider: string;
  lastEvent?: EventRow | undefined;
  lastSuccess?: EventRow | undefined;
  failureCount: number;
};

function summarise(provider: string, events: EventRow[]): ProviderSummary {
  const providerEvents = events.filter((event) => event.provider === provider);
  const lastEvent = providerEvents[0];
  const lastSuccess = providerEvents.find((event) => event.status === "processed");
  const failureCount = providerEvents.filter((event) => event.status === "failed").length;
  return { provider, lastEvent, lastSuccess, failureCount };
}

function IntegrationsPage() {
  const queryClient = useQueryClient();

  const events = useQuery({
    queryKey: ["admin", "integration-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_events")
        .select("id, provider, event_type, status, error, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const triggerSync = useMutation({
    mutationFn: async (integration: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ integration, jobType: "sync" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Sync failed");
      return body as { status: string; integration: string };
    },
    onSuccess: (data) => {
      toast.success(`${data.integration} sync ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "integration-events"] });
    },
    onError: (error: Error) => toast.error("Could not queue sync", { description: error.message }),
  });

  const summaries = events.data ? SYSTEMS.map((system) => summarise(system.key, events.data)) : [];

  return (
    <Container>
      <PageHeader
        eyebrow="Admin"
        title="Integration control centre"
        description="Monitor health, failures, replay-safe webhooks and manual-review queues."
        actions={<Webhook className="size-5 text-accent" />}
      />

      <div className="mt-8">
        {events.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : events.isError ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-center gap-2 p-6 text-sm text-destructive">
              <AlertTriangle className="size-4" /> Could not load integration events.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SYSTEMS.map((system) => {
              const summary = summaries.find((s) => s.provider === system.key);
              const canSync = ["leadlens", "dokuvera", "gabley", "gabley_retrofit", "craftvaro"].includes(
                system.key,
              );
              return (
                <Card key={system.key} className="shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base">{system.label}</CardTitle>
                    {summary && summary.failureCount > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" /> {summary.failureCount} failing
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-success text-success-foreground">
                        <CheckCircle2 className="size-3" /> Healthy
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      Last event:{" "}
                      {summary?.lastEvent
                        ? new Date(summary.lastEvent.created_at).toLocaleString()
                        : "none recorded"}
                    </p>
                    <p>
                      Last success:{" "}
                      {summary?.lastSuccess
                        ? new Date(summary.lastSuccess.created_at).toLocaleString()
                        : "none recorded"}
                    </p>
                    <p>Retry queue: {summary?.failureCount ?? 0} item(s)</p>
                    {canSync ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 gap-1"
                        disabled={triggerSync.isPending}
                        onClick={() => triggerSync.mutate(system.key)}
                      >
                        <RefreshCw className="size-3" /> Sync now
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="mt-8 shadow-card">
        <CardHeader>
          <CardTitle>Recent integration events</CardTitle>
          <CardDescription>Latest webhook and job activity across all providers.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : events.data && events.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {events.data.slice(0, 20).map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-primary">
                      {event.provider} · {event.event_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                    {event.error ? <p className="text-xs text-destructive">{event.error}</p> : null}
                  </div>
                  <Badge variant={event.status === "failed" ? "destructive" : "secondary"}>
                    {event.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No integration events recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
