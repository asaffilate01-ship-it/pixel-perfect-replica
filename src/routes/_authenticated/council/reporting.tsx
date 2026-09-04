import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const cards = [
  "Homes returned to use",
  "Bedrooms returned",
  "Funding approved",
  "Refurbishment value",
  "Average days to occupation",
  "Cases by stage",
] as const;

export const Route = createFileRoute("/_authenticated/council/reporting")({
  head: () => ({
    meta: [
      { title: "Council impact reporting | DOMUREVA" },
      {
        name: "description",
        content: "Operational and public-value outcomes from empty-home interventions.",
      },
      { property: "og:title", content: "Council impact reporting | DOMUREVA" },
      {
        property: "og:description",
        content: "Live metrics from your authorised council portfolio.",
      },
    ],
  }),
  component: CouncilReportingPage,
});

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function CouncilReportingPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["council", "reporting"],
    queryFn: async () => {
      const [outcomes, financials, cases] = await Promise.all([
        supabase.from("occupancy_outcomes").select("bedrooms_returned,occupied_at,case_id"),
        supabase.from("case_financials").select("approved_funding,committed_contract_value"),
        supabase.from("cases").select("id,status,created_at"),
      ]);
      for (const r of [outcomes, financials, cases]) {
        if (r.error) throw r.error;
      }

      const o = outcomes.data ?? [];
      const f = financials.data ?? [];
      const c = cases.data ?? [];

      const casesById = new Map(c.map((x) => [x.id, x]));
      const occupationDays = o
        .map((x) => {
          const created = casesById.get(x.case_id)?.created_at;
          return created && x.occupied_at ? daysBetween(created, x.occupied_at) : null;
        })
        .filter((x): x is number => x !== null);
      const avgDays = occupationDays.length
        ? Math.round(occupationDays.reduce((a, b) => a + b, 0) / occupationDays.length)
        : 0;

      const byStage = c.reduce<Record<string, number>>((acc, x) => {
        acc[x.status] = (acc[x.status] ?? 0) + 1;
        return acc;
      }, {});

      return {
        homes: o.length,
        beds: o.reduce((a, x) => a + (x.bedrooms_returned ?? 0), 0),
        fund: f.reduce((a, x) => a + Number(x.approved_funding ?? 0), 0),
        value: f.reduce((a, x) => a + Number(x.committed_contract_value ?? 0), 0),
        avgDays,
        byStage,
      };
    },
  });

  const metricFor = (label: (typeof cards)[number]): string => {
    if (!data) return "—";
    switch (label) {
      case "Homes returned to use":
        return String(data.homes);
      case "Bedrooms returned":
        return String(data.beds);
      case "Funding approved":
        return `£${data.fund.toLocaleString()}`;
      case "Refurbishment value":
        return `£${data.value.toLocaleString()}`;
      case "Average days to occupation":
        return data.avgDays ? `${data.avgDays} days` : "No data yet";
      case "Cases by stage":
        return Object.entries(data.byStage).length
          ? Object.entries(data.byStage)
              .map(([stage, count]) => `${stage}: ${count}`)
              .join(" · ")
          : "No cases yet";
      default:
        return "—";
    }
  };

  return (
    <Container>
      <PageHeader
        eyebrow="Council operations"
        title="Council impact reporting"
        description="Track operational and public-value outcomes from empty-home interventions."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Couldn't load reporting metrics. Please try again shortly.
          </div>
        ) : (
          cards.map((label) => (
            <Card key={label} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl font-bold text-primary">{metricFor(label)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Live metric from authorised council portfolio data.
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
}
