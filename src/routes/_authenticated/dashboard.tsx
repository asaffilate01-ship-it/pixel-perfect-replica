import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Coins, FileCheck2, Hammer } from "lucide-react";

import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | DOMUREVA" },
      {
        name: "description",
        content:
          "Your DOMUREVA dashboard: live cases, funding matches, active projects and the next action on every empty home.",
      },
      { property: "og:title", content: "Dashboard | DOMUREVA" },
      { property: "og:description", content: "Track cases, funding and projects in one place." },
    ],
  }),
  component: DashboardPage,
});

type CaseRow = {
  id: string;
  stage: string | null;
  status: string | null;
  created_at: string;
  properties: { address_line1: string | null; postcode: string | null } | null;
};

function DashboardPage() {
  const cases = useQuery({
    queryKey: ["dashboard", "cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, stage, status, created_at, properties(address_line1, postcode)")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as unknown as CaseRow[];
    },
  });

  const counts = useQuery({
    queryKey: ["dashboard", "counts"],
    queryFn: async () => {
      const [properties, matches, projects, evidence] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("funding_matches").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("evidence_items").select("id", { count: "exact", head: true }),
      ]);
      return {
        properties: properties.count ?? 0,
        matches: matches.count ?? 0,
        projects: projects.count ?? 0,
        evidence: evidence.count ?? 0,
      };
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Overview"
        title="Your empty homes pipeline"
        description="Everything in flight across discovery, funding, works and evidence."
        actions={
          <Button asChild className="bg-amber text-amber-foreground hover:bg-amber/90">
            <Link to="/properties/new">Check a property</Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Properties"
          value={counts.data?.properties ?? "—"}
          hint="Registered in your account"
        />
        <StatCard
          icon={Coins}
          label="Funding matches"
          value={counts.data?.matches ?? "—"}
          hint="Against reviewed schemes"
        />
        <StatCard
          icon={Hammer}
          label="Projects"
          value={counts.data?.projects ?? "—"}
          hint="Works in delivery"
        />
        <StatCard
          icon={FileCheck2}
          label="Evidence items"
          value={counts.data?.evidence ?? "—"}
          hint="Verified audit trail"
        />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-primary">Recent cases</h2>
          <Link
            to="/cases"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent"
          >
            All cases <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {cases.isLoading ? (
            <div className="grid gap-3 p-5">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-3/5" />
            </div>
          ) : (cases.data?.length ?? 0) === 0 ? (
            <div className="p-10 text-center">
              <p className="font-display text-lg font-bold text-primary">No cases yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a property to see which verified funding schemes it qualifies for.
              </p>
              <Button asChild className="mt-5">
                <Link to="/properties/new">Check a property</Link>
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="px-5 py-3 font-semibold text-primary">Property</th>
                  <th className="px-5 py-3 font-semibold text-primary">Stage</th>
                  <th className="px-5 py-3 font-semibold text-primary">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {cases.data?.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">
                      {c.properties?.address_line1 ?? "Unnamed property"}
                      <span className="ml-2 text-muted-foreground">{c.properties?.postcode}</span>
                    </td>
                    <td className="px-5 py-4 capitalize text-muted-foreground">{c.stage ?? "—"}</td>
                    <td className="px-5 py-4 capitalize text-muted-foreground">
                      {c.status ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/cases/$caseId"
                        params={{ caseId: c.id }}
                        className="font-semibold text-accent"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Container>
  );
}
