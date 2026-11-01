import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, MapPinned, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type Portfolio = {
  portfolio: {
    total: number;
    byStatus: Record<string, number>;
    byArea: Array<{ outcode: string; cases: number; byStatus: Record<string, number> }>;
  };
  cases: Array<{
    caseId: string;
    outcode: string;
    status: string;
    openedAt: string;
    emptySince: string | null;
  }>;
  scope: "explicit_case_membership";
  limitedTo: number;
  note: string;
};

export const Route = createFileRoute("/_authenticated/council/map")({
  head: () => ({
    meta: [
      { title: "Council geographic portfolio | DOMUREVA" },
      { name: "description", content: "View explicitly assigned empty-home cases by postcode district without exposing private coordinates." },
    ],
  }),
  component: CouncilMapPage,
});

async function getAssignedPortfolio(): Promise<Portfolio> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session has expired.");
  const response = await fetch("/api/council/portfolio", {
    headers: { Authorization: "Bearer " + session.access_token },
  });
  const payload = await response.json() as Portfolio & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Council cases could not be loaded.");
  return payload;
}

function CouncilMapPage() {
  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [status, setStatus] = useState("all");
  const query = useQuery({ queryKey: ["council", "assigned-portfolio"], queryFn: getAssignedPortfolio });

  const cases = useMemo(() => (query.data?.cases ?? []).filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    return item.outcode.toUpperCase().includes(postcodeQuery.trim().toUpperCase());
  }), [postcodeQuery, status, query.data]);

  const byArea = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of cases) counts.set(record.outcode, (counts.get(record.outcode) ?? 0) + 1);
    return [...counts.entries()].map(([outcode, count]) => ({ outcode, count }))
      .sort((a, b) => b.count - a.count || a.outcode.localeCompare(b.outcode));
  }, [cases]);
  const maxCount = Math.max(1, ...byArea.map((item) => item.count));
  const stages = Object.keys(query.data?.portfolio.byStatus ?? {}).sort();

  return (
    <Container className="pt-7">
      <PageHeader
        eyebrow="Council operations"
        title="Where your assigned cases are."
        description="A postcode-district view of the empty-home cases explicitly assigned to your council account. Private owner identities and individual evidence coordinates are withheld."
        actions={<Button asChild variant="outline" className="rounded-full"><Link to="/council">Council overview</Link></Button>}
      />

      <div className="mt-7 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-sm leading-6 text-muted-foreground">
          This is a postcode-district distribution, not a street-level map. Exact property geotags are deliberately excluded from this view.
        </p>
      </div>

      {query.isLoading ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-56 rounded-3xl" /></div> :
        query.isError ? <div className="mt-6 rounded-3xl border border-destructive/30 bg-card p-8" role="alert">
          <p className="font-semibold text-primary">Council portfolio could not be loaded</p>
          <p className="mt-2 text-sm text-muted-foreground">You may not have a case assignment or your session may have expired.</p>
          <Button type="button" className="mt-4 rounded-full" variant="outline" onClick={() => void query.refetch()}>Retry</Button>
        </div> : (
          <>
            <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-primary">Assigned portfolio</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Up to {query.data?.limitedTo} explicit case assignments.</p>
                </div>
                <Badge variant="secondary">{query.data?.portfolio.total ?? 0} cases</Badge>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                <div>
                  <Label htmlFor="area-search">Find postcode district</Label>
                  <Input id="area-search" value={postcodeQuery} onChange={(event) => setPostcodeQuery(event.target.value)}
                    placeholder="e.g. LU1" className="mt-2 h-11 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="portfolio-stage">Case stage</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="portfolio-stage" className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stages</SelectItem>
                      {stages.map((stage) => <SelectItem key={stage} value={stage}>{stage.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {!query.data?.portfolio.total ? (
              <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <Building2 className="mx-auto size-9 text-accent" aria-hidden="true" />
                <h2 className="mt-4 font-display text-xl font-semibold text-primary">No council cases assigned</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Your account needs an explicit council-officer case membership before property records appear.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.85fr)]">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center gap-2">
                    <MapPinned className="size-5 text-accent" aria-hidden="true" />
                    <h2 className="font-display text-xl font-semibold text-primary">Coverage by postcode district</h2>
                  </div>
                  {byArea.length ? <ul className="mt-6 space-y-5">
                    {byArea.map((area) => (
                      <li key={area.outcode}>
                        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-primary">{area.outcode}</span>
                          <span className="tabular-nums text-muted-foreground">{area.count} {area.count === 1 ? "case" : "cases"}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-teal" style={{ width: Math.max(5, Math.round(area.count / maxCount * 100)) + "%" }} />
                        </div>
                      </li>
                    ))}
                  </ul> : <p className="mt-5 text-sm text-muted-foreground">No cases match these filters.</p>}
                  <p className="mt-6 text-xs text-muted-foreground">Distribution of saved case records only. This is not a live vacancy census.</p>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold text-primary">Authorised cases</h2>
                    <Badge variant="secondary">{cases.length} shown</Badge>
                  </div>
                  {cases.length ? <ul className="mt-4 divide-y divide-border">
                    {cases.map((record) => (
                      <li key={record.caseId}>
                        <Link to="/cases/$caseId" params={{ caseId: record.caseId }}
                          className="group flex items-center justify-between gap-3 py-4 transition-colors hover:text-accent">
                          <div>
                            <p className="font-semibold text-primary">{record.outcode} · Case {record.caseId.slice(0, 8).toUpperCase()}</p>
                            <p className="mt-1 text-xs capitalize text-muted-foreground">{record.status.replace(/_/g, " ")} · Opened {new Date(record.openedAt).toLocaleDateString("en-GB")}</p>
                          </div>
                          <ArrowRight className="size-4 shrink-0 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul> : <p className="mt-5 text-sm text-muted-foreground">No cases match these filters.</p>}
                </section>
              </div>
            )}
          </>
        )}
    </Container>
  );
}
