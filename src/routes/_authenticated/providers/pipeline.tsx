import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2 } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type ProviderOpportunity = {
  id: string;
  case_id: string;
  route: string;
  status: string;
  score: number | null;
  created_at: string;
  cases: {
    properties: { postcode: string; address_line: string | null } | null;
  } | null;
};

const ROUTES: Record<string, string> = {
  purchase_repair: "Purchase and repair",
  lease_repair: "Lease and repair",
  managed_refurbishment: "Managed refurbishment",
};

export const Route = createFileRoute("/_authenticated/providers/pipeline")({
  head: () => ({
    meta: [
      { title: "Provider opportunities | DOMUREVA" },
      { name: "description", content: "See assigned provider opportunities from real authorised property cases." },
    ],
  }),
  component: ProviderPipelinePage,
});

function ProviderPipelinePage() {
  const opportunities = useQuery({
    queryKey: ["providers", "pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_opportunities")
        .select("id,case_id,route,status,score,created_at,cases(properties(postcode,address_line))")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as ProviderOpportunity[];
    },
  });

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Provider operations"
        title="Your property opportunities"
        description="View real opportunities accessible to your organisation. Scores assist prioritisation but are not evidence of funding approval or a guaranteed contract."
      />

      <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card" aria-label="Provider pipeline">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-display text-xl font-semibold text-primary">Current pipeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">Latest 100 accessible records; no demonstration amounts or invented opportunities.</p>
        </div>

        {opportunities.isLoading ? (
          <div className="grid gap-3 p-6" role="status" aria-label="Loading opportunities">
            <Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-4/5" />
          </div>
        ) : opportunities.isError ? (
          <div className="p-10 text-center" role="alert">
            <h3 className="font-display text-lg font-semibold text-primary">Pipeline could not be loaded</h3>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection or permissions and try again.</p>
            <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={() => void opportunities.refetch()}>Retry loading</Button>
          </div>
        ) : !opportunities.data?.length ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto size-9 text-accent" aria-hidden="true" />
            <h3 className="mt-5 font-display text-xl font-semibold text-primary">No assigned opportunities</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your pipeline will populate when a real property opportunity has been made available to your organisation.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full"><Link to="/opportunities">Explore accessible opportunities</Link></Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {opportunities.data.map((item) => (
              <li key={item.id}>
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: item.case_id }}
                  className="group flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold text-primary">
                      {item.cases?.properties?.address_line || item.cases?.properties?.postcode || "Property case"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.cases?.properties?.postcode || "Location held privately"} · {item.case_id.slice(0, 8).toUpperCase()}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{ROUTES[item.route] ?? item.route.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline" className="capitalize">{item.status.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-primary">{item.score == null ? "—" : Math.round(item.score * 100)}</p>
                      <p className="text-xs text-muted-foreground">Priority / 100</p>
                    </div>
                    <ArrowRight className="size-5 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
