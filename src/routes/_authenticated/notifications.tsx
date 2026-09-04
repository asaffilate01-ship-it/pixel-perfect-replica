import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notification centre | DOMUREVA" },
      {
        name: "description",
        content:
          "Control email and in-app notifications for funding changes, evidence requests, decisions, offers, quotes and milestones, and review recent delivery history.",
      },
      { property: "og:title", content: "Notification centre | DOMUREVA" },
      {
        property: "og:description",
        content: "Manage notification channels and see your delivery history.",
      },
    ],
  }),
  component: NotificationsPage,
});

type Preferences = {
  user_id: string;
  email: boolean | null;
  push: boolean | null;
  funding_changes: boolean | null;
  project_updates: boolean | null;
  quote_updates: boolean | null;
  updated_at: string | null;
};

type Delivery = {
  id: string;
  notification_type: string;
  channel: string;
  status: string;
  error: string | null;
  created_at: string | null;
  delivered_at: string | null;
};

const TOGGLES: { key: keyof Preferences; label: string; description: string }[] = [
  {
    key: "funding_changes",
    label: "Funding changes",
    description: "Scheme updates, new matches and eligibility changes.",
  },
  {
    key: "project_updates",
    label: "Project & evidence updates",
    description: "Evidence requests, application decisions and project milestones.",
  },
  {
    key: "quote_updates",
    label: "Provider & quote updates",
    description: "Provider offers and contractor quote activity.",
  },
];

const CHANNELS: { key: "email" | "push"; label: string; description: string }[] = [
  { key: "email", label: "Email", description: "Send notifications to your registered email address." },
  { key: "push", label: "In-app", description: "Show notifications inside DOMUREVA while you work." },
];

function statusBadge(status: string) {
  if (status === "delivered") {
    return (
      <Badge className="gap-1 bg-success text-success-foreground">
        <CheckCircle2 className="size-3" /> Delivered
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="size-3" /> {status}
    </Badge>
  );
}

function NotificationsPage() {
  const queryClient = useQueryClient();

  const preferences = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("user_id, email, push, funding_changes, project_updates, quote_updates, updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ??
        {
          user_id: session.user.id,
          email: true,
          push: true,
          funding_changes: true,
          project_updates: true,
          quote_updates: true,
          updated_at: null,
        }) as Preferences;
    },
  });

  const deliveries = useQuery({
    queryKey: ["notifications", "deliveries"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [] as Delivery[];
      const { data, error } = await supabase
        .from("notification_deliveries")
        .select("id, notification_type, channel, status, error, created_at, delivered_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return (data ?? []) as Delivery[];
    },
  });

  const updatePreference = useMutation({
    mutationFn: async (patch: Partial<Preferences>) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: session.user.id, ...patch, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      toast.success("Preference updated");
    },
    onError: (error: Error) => {
      toast.error("Could not update preference", { description: error.message });
    },
  });

  const prefs = preferences.data;

  return (
    <Container>
      <PageHeader
        eyebrow="Notifications"
        title="Notification centre"
        description="Funding changes, evidence requests, application decisions, provider offers, quote updates and project milestones appear here."
        actions={<Bell className="size-5 text-accent" />}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Channels & topics</CardTitle>
            <CardDescription>Choose how and when DOMUREVA reaches you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {preferences.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : preferences.isError ? (
              <p className="text-sm text-destructive">Could not load your notification preferences.</p>
            ) : (
              <>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Channels
                  </p>
                  <div className="space-y-4">
                    {CHANNELS.map((channel) => (
                      <div key={channel.key} className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-sm font-medium text-primary">{channel.label}</Label>
                          <p className="text-xs text-muted-foreground">{channel.description}</p>
                        </div>
                        <Switch
                          checked={Boolean(prefs?.[channel.key])}
                          disabled={updatePreference.isPending}
                          onCheckedChange={(checked) =>
                            updatePreference.mutate({ [channel.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Topics
                  </p>
                  <div className="space-y-4">
                    {TOGGLES.map((toggle) => (
                      <div key={toggle.key} className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-sm font-medium text-primary">{toggle.label}</Label>
                          <p className="text-xs text-muted-foreground">{toggle.description}</p>
                        </div>
                        <Switch
                          checked={Boolean(prefs?.[toggle.key])}
                          disabled={updatePreference.isPending}
                          onCheckedChange={(checked) =>
                            updatePreference.mutate({ [toggle.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Delivery history</CardTitle>
            <CardDescription>Recent notifications sent to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : deliveries.isError ? (
              <p className="text-sm text-destructive">Could not load delivery history.</p>
            ) : deliveries.data && deliveries.data.length > 0 ? (
              <ul className="space-y-3">
                {deliveries.data.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-primary">{item.notification_type}</p>
                      <p className="text-xs text-muted-foreground">
                        via {item.channel} ·{" "}
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "unknown time"}
                      </p>
                      {item.error ? (
                        <p className="mt-1 text-xs text-destructive">{item.error}</p>
                      ) : null}
                    </div>
                    {statusBadge(item.status)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No notifications have been sent yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
