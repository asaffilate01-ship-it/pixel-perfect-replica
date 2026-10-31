import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Search, Sparkles } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities | DOMUREVA" },
      { name: "description", content: "Review recorded property-provider opportunities and transparent prioritisation scores." },
    ],
  }),
  component: OpportunitiesPage,
});

type Opportunity = {
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

function routeLabel(value: string) {
  return ROUTES[value] ?? value.replace(/_/g, " ");
}

function OpportunitiesPage() {
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState("all");

  const opportunities = useQuery({
    queryKey: ["opportunities", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_opportunities")
        .select("id, case_id, route, status, score, created_at, cases(properties(postcode,address_line))")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Opportunity[];
    },
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (opportunities.data ?? []).filter((item) => {
      if (route !== "all" && item.route !== route) return false;
      if (!needle) return true;
      return [
        item.case_id,
        item.cases?.properties?.address_line,
        item.cases?.properties?.postcode,
        routeLabel(item.route),
      ].some((value) => (value ?? "").toLocaleLowerCase().includes(needle));
    });
  }, [opportunities.data, query, route]);

  const routes = [...new Set((opportunities.data ?? []).map((item) => item.route))].sort();

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Regeneration opportunities"
        title="Prioritise promising properties."
        description="Review real opportunity records linked to cases available to your account. Scores support prioritisation, not eligibility or award decisions."
        actions={<Button asChild variant="outline" className="rounded-full"><Link to="/cases">View all cases</Link></Button>}
      />

      <div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-sm leading-6 text-muted-foreground">
          Opportunity scores are decision-support signals. Confirm ownership, consent, funding rules and source provenance before contacting providers or acting on a recommendation.
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-card" aria-label="Provider opportunity directory">
        <div className="grid gap-4 border-b border-border p-5 md:grid-cols-[minmax(0,1fr)_240px] md:items-end md:p-6">
          <div>
            <Label htmlFor="opportunity-search" className="mb-2 block text-xs font-semibold text-muted-foreground">Find an opportunity</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="opportunity-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search postcode, route or case" className="h-11 rounded-xl pl-10" />
            </div>
          </div>
          <div>
            <Label htmlFor="opportunity-route" className="mb-2 block text-xs font-semibold text-muted-foreground">Delivery route</Label>
            <Select value={route} onValueChange={setRoute}>
              <SelectTrigger id="opportunity-route" className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All delivery routes</SelectItem>
                {routes.map((item) => <SelectItem key={item} value={item}>{routeLabel(item)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {opportunities.isLoading ? (
          <div className="grid gap-3 p-6" role="status" aria-label="Loading opportunities">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}
          </div>
        ) : opportunities.isError ? (
          <div className="p-10 text-center" role="alert">
            <h2 className="font-display text-lg font-semibold text-primary">Opportunities could not be loaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" className="mt-5 rounded-full" onClick={() => void opportunities.refetch()}>Retry loading</Button>
          </div>
        ) : (opportunities.data?.length ?? 0) === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto size-9 text-accent" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold text-primary">No provider opportunities recorded</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Opportunity records will appear here once a case has been assessed and a provider route created.
            </p>
            <Button asChild className="mt-5 rounded-full"><Link to="/cases">Review property cases</Link></Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="font-display text-lg font-semibold text-primary">No matching opportunities</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try another postcode, route or case reference.</p>
            <Button variant="outline" className="mt-5 rounded-full" onClick={() => { setQuery(""); setRoute("all"); }}>Clear filters</Button>
          </div>
        ) : (
          <div>
            <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "record" : "records"} shown · Latest 100 opportunity records
            </p>
            <ul className="divide-y divide-border">
              {filtered.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/cases/$caseId"
                    params={{ caseId: item.case_id }}
                    className="group flex flex-wrap items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold text-primary">
                          {item.cases?.properties?.address_line || item.cases?.properties?.postcode || "Property case"}
                        </h3>
                        <Badge variant="secondary">{routeLabel(item.route)}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.cases?.properties?.postcode || "Postcode unavailable"} · {item.status.replace(/_/g, " ")} · Case {item.case_id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="font-display text-xl font-semibold text-primary">{item.score == null ? "—" : Math.round(item.score * 100)}</p>
                        <p className="text-xs text-muted-foreground">Priority score / 100</p>
                      </div>
                      <ArrowRight className="size-5 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </Container>
  );
}
