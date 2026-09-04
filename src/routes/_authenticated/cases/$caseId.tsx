import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CASE_STAGES, progressFor, type CaseStage } from "@/lib/domureva/workflow/stages";

export const Route = createFileRoute("/_authenticated/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case | DOMUREVA" },
      {
        name: "description",
        content: "Track a single property delivery case: journey progress, Reva's recommendation and governance notes.",
      },
      { property: "og:title", content: "Case | DOMUREVA" },
      { property: "og:description", content: "Journey progress and next actions for one property case." },
    ],
  }),
  component: CaseDetailPage,
});

type CaseRow = {
  id: string;
  status: string;
  created_at: string;
  properties: { postcode: string; address_line: string | null } | null;
};

function resolveStage(status: string): CaseStage {
  return (CASE_STAGES as readonly string[]).includes(status) ? (status as CaseStage) : "funding";
}

function CaseDetailPage() {
  const { caseId } = Route.useParams();

  const caseQuery = useQuery({
    queryKey: ["cases", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, status, created_at, properties(postcode, address_line)")
        .eq("id", caseId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CaseRow | null;
    },
  });

  if (caseQuery.isLoading) {
    return (
      <Container>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </Container>
    );
  }

  if (caseQuery.isError || !caseQuery.data) {
    return (
      <Container>
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <p className="font-display text-lg font-bold text-primary">Case not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been removed, or you don't have access to it.
          </p>
          <Button asChild className="mt-5">
            <Link to="/cases">Back to cases</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const record = caseQuery.data;
  const stage = resolveStage(record.status);
  const progress = progressFor(stage);

  return (
    <Container>
      <PageHeader
        eyebrow={`Case ${record.id.slice(0, 8).toUpperCase()}`}
        title="Property delivery case"
        description={record.properties?.address_line ?? record.properties?.postcode ?? undefined}
      />

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-primary">Journey progress</p>
          <span className="text-sm font-semibold text-accent">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-3" />
        <div className="mt-4 flex flex-wrap gap-2">
          {CASE_STAGES.map((s) => (
            <span
              key={s}
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                s === stage
                  ? "border-transparent bg-navy text-navy-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-primary">Reva recommendation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Funding rules have been matched. Verify the evidence pack and prepare the application
            before opening contractor quotes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-amber text-amber-foreground hover:bg-amber/90">
              <Link to="/application-pack">Prepare application</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/applications">Review evidence</Link>
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" />
            <h2 className="font-display text-lg font-bold text-primary">Governance</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Funding decisions use reviewed source rules only. AI rankings can improve from outcomes,
            but statutory eligibility cannot be changed by learning agents.
          </p>
        </aside>
      </div>
    </Container>
  );
}
