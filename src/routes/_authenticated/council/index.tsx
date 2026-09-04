import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FolderKanban, Hammer, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const steps = ["Identify", "Contact", "Fund", "Works", "Evidence", "Occupied"];

export const Route = createFileRoute("/_authenticated/council/")({
  head: () => ({
    meta: [
      { title: "Council command centre | DOMUREVA" },
      {
        name: "description",
        content: "A role-gated operational view of empty homes cases your council can access.",
      },
      { property: "og:title", content: "Council command centre | DOMUREVA" },
      {
        property: "og:description",
        content: "Cases, applications, projects and funding reviews in one command centre.",
      },
    ],
  }),
  component: CouncilPage,
});

function CouncilPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["council", "overview"],
    queryFn: async () => {
      const [cases, apps, projects, reviews] = await Promise.all([
        supabase.from("cases").select("*", { count: "exact", head: true }),
        supabase.from("funding_applications").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase
          .from("rule_change_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", "draft"),
      ]);
      for (const r of [cases, apps, projects, reviews]) {
        if (r.error) throw r.error;
      }
      return {
        cases: cases.count ?? 0,
        apps: apps.count ?? 0,
        projects: projects.count ?? 0,
        reviews: reviews.count ?? 0,
      };
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Council operations"
        title="Empty homes command centre"
        description="A role-gated operational view for cases your organisation is authorised to access."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Couldn't load council metrics. Please try again shortly.
          </div>
        ) : (
          <>
            <StatCard label="Cases" value={data?.cases ?? 0} icon={ClipboardList} />
            <StatCard label="Applications" value={data?.apps ?? 0} icon={FolderKanban} />
            <StatCard label="Projects" value={data?.projects ?? 0} icon={Hammer} />
            <StatCard
              label="Rule changes to review"
              value={data?.reviews ?? 0}
              icon={ShieldCheck}
            />
          </>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Priority workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {steps.map((step, i) => (
                <span
                  key={step}
                  className={
                    i === 0
                      ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
                  }
                >
                  {step}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              No AI-discovered funding change becomes live until an authorised reviewer approves
              it.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start">
              <a href="/review">Review funding changes</a>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <a href="/projects">Open projects</a>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <a href="/council/analytics">Impact analytics</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
