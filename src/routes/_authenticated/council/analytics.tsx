import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const funnelStages = ["identified", "assessing", "funding", "quotes", "works", "complete"];

export const Route = createFileRoute("/_authenticated/council/analytics")({
  head: () => ({
    meta: [
      { title: "Council impact analytics | DOMUREVA" },
      {
        name: "description",
        content: "Outcomes and value delivered from empty-home interventions across your portfolio.",
      },
      { property: "og:title", content: "Council impact analytics | DOMUREVA" },
      {
        property: "og:description",
        content: "Track homes returned to use, funding approved and delivery funnel progress.",
      },
    ],
  }),
  component: CouncilAnalyticsPage,
});

function CouncilAnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["council", "analytics"],
    queryFn: async () => {
      const [cases, projects, outcomes, financials] = await Promise.all([
        supabase.from("cases").select("id,status,created_at"),
        supabase.from("projects").select("id,status"),
        supabase.from("occupancy_outcomes").select("id,outcome,bedrooms_returned,affordable_home"),
        supabase
          .from("case_financials")
          .select("estimated_works,approved_funding,committed_contract_value"),
      ]);
      for (const r of [cases, projects, outcomes, financials]) {
        if (r.error) throw r.error;
      }

      const c = cases.data ?? [];
      const o = outcomes.data ?? [];
      const f = financials.data ?? [];

      const homes = o.length;
      const beds = o.reduce((acc, x) => acc + (x.bedrooms_returned ?? 0), 0);
      const fund = f.reduce((acc, x) => acc + Number(x.approved_funding ?? 0), 0);
      const works = f.reduce((acc, x) => acc + Number(x.committed_contract_value ?? 0), 0);

      return { caseCount: c.length, homes, beds, fund, works };
    },
  });

  return (
    <Container>
      <PageHeader eyebrow="Outcomes & value" title="Council impact analytics" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Couldn't load impact analytics. Please try again shortly.
          </div>
        ) : (
          <>
            <StatCard label="Cases managed" value={data?.caseCount ?? 0} />
            <StatCard label="Homes returned to use" value={data?.homes ?? 0} />
            <StatCard label="Bedrooms returned" value={data?.beds ?? 0} />
            <StatCard
              label="Approved funding tracked"
              value={`£${(data?.fund ?? 0).toLocaleString()}`}
            />
          </>
        )}
      </div>

      {!isLoading && !isError ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Delivery funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {funnelStages.map((stage, i) => (
                <div
                  key={stage}
                  className="flex items-center justify-between rounded-lg bg-muted px-4 py-2 text-sm"
                >
                  <span className="capitalize text-muted-foreground">{stage}</span>
                  <span className="font-semibold text-foreground">
                    {Math.max((data?.caseCount ?? 0) - i, 0)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Economic activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-display text-4xl font-bold text-primary">
                £{(data?.works ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Committed refurbishment value</p>
              <p className="text-sm text-muted-foreground">
                Track the conversion from public funding into verified works and occupied homes.
              </p>
              <Button asChild variant="outline" size="sm">
                <a href="/council">Back to command centre</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </Container>
  );
}
