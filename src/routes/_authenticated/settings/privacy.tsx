import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileCheck2,
  FileDown,
  ScrollText,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy centre | DOMUREVA" },
      {
        name: "description",
        content:
          "Manage consent, review your notification preferences and submit data access, correction, portability or deletion requests.",
      },
      { property: "og:title", content: "Privacy centre | DOMUREVA" },
      {
        property: "og:description",
        content: "Control your consent record and exercise your data protection rights.",
      },
    ],
  }),
  component: PrivacyCentrePage,
});

type ConsentRow = {
  id: number;
  purpose: string;
  granted: boolean;
  policy_version: string;
  created_at: string;
};

const REQUEST_TYPES = [
  {
    key: "access",
    label: "Access",
    description: "Receive a copy of the personal data DOMUREVA holds about you.",
    icon: FileDown,
  },
  {
    key: "rectification",
    label: "Rectification",
    description: "Ask us to correct inaccurate or incomplete data.",
    icon: FileCheck2,
  },
  {
    key: "erasure",
    label: "Erasure",
    description: "Request deletion of your personal data where no legal basis remains.",
    icon: Trash2,
  },
  {
    key: "restriction",
    label: "Restriction",
    description: "Limit how your data is processed while a query is resolved.",
    icon: ShieldCheck,
  },
  {
    key: "portability",
    label: "Portability",
    description: "Receive your data in a structured, machine-readable format.",
    icon: ScrollText,
  },
] as const;

function PrivacyCentrePage() {
  const [pendingType, setPendingType] = useState<string | null>(null);

  const consent = useQuery({
    queryKey: ["privacy", "consent-log"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [] as ConsentRow[];
      const { data, error } = await supabase
        .from("consent_log")
        .select("id, purpose, granted, policy_version, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ConsentRow[];
    },
  });

  const submitRequest = useMutation({
    mutationFn: async (requestType: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/privacy/requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ requestType }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Request failed");
      return body as { status: string; requestType: string; dueWithinDays: number };
    },
    onMutate: (requestType) => setPendingType(requestType),
    onSuccess: (data) => {
      toast.success(`${data.requestType} request received`, {
        description: `We will respond within ${data.dueWithinDays} days.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Could not submit request", { description: error.message });
    },
    onSettled: () => setPendingType(null),
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Privacy"
        title="Privacy centre"
        description="Manage consent, notification preferences, and your rights to access, correct, restrict, port or delete your data."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Exercise a data protection right</CardTitle>
            <CardDescription>
              Submit a formal request. DOMUREVA aims to respond to every request within 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {REQUEST_TYPES.map((type) => {
              const Icon = type.icon;
              const isPending = pendingType === type.key && submitRequest.isPending;
              return (
                <div
                  key={type.key}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-accent" />
                      <p className="font-display text-sm font-semibold text-primary">{type.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submitRequest.isPending}
                    onClick={() => submitRequest.mutate(type.key)}
                  >
                    {isPending ? "Submitting…" : `Request ${type.label.toLowerCase()}`}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Consent history</CardTitle>
            <CardDescription>A record of consent decisions tied to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {consent.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : consent.isError ? (
              <p className="text-sm text-destructive">
                Could not load your consent history. Please try again shortly.
              </p>
            ) : consent.data && consent.data.length > 0 ? (
              <ul className="space-y-3">
                {consent.data.map((row, index) => (
                  <li key={row.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-primary">{row.purpose}</p>
                        <p className="text-xs text-muted-foreground">
                          Policy v{row.policy_version} ·{" "}
                          {new Date(row.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={row.granted ? "default" : "secondary"}>
                        {row.granted ? "Granted" : "Withdrawn"}
                      </Badge>
                    </div>
                    {index < consent.data.length - 1 ? <Separator className="mt-3" /> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No consent decisions recorded yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
