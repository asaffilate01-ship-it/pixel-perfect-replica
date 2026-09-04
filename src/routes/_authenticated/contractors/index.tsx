import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Hammer, ArrowRight } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type QuoteRequest = {
  id: string;
  case_id: string;
  status: string;
  work_scope: unknown;
  created_at: string;
};

function workScopeSummary(workScope: unknown): string {
  if (
    workScope &&
    typeof workScope === "object" &&
    Array.isArray((workScope as { works?: unknown }).works)
  ) {
    return ((workScope as { works: unknown[] }).works as unknown[])
      .map(String)
      .join(" • ");
  }
  return "Refurbishment scope available";
}

export const Route = createFileRoute("/_authenticated/contractors/")({
  head: () => ({
    meta: [
      { title: "Contractor opportunities | DOMUREVA" },
      {
        name: "description",
        content:
          "Verified refurbishment opportunities for Craftvaro-linked contractor organisations.",
      },
      { property: "og:title", content: "Contractor opportunities | DOMUREVA" },
      {
        property: "og:description",
        content: "Role-controlled quote access for verified contractor organisations.",
      },
    ],
  }),
  component: ContractorsPage,
});

function ContractorsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["contractors", "quote-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id,case_id,status,work_scope,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as QuoteRequest[];
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Craftvaro network"
        title="Verified refurbishment opportunities"
        description="Quote access is role-controlled; verified Craftvaro identities can be linked to DOMUREVA contractor organisations."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Couldn't load quote requests. Please try again shortly.
          </div>
        ) : data && data.length > 0 ? (
          data.map((x) => (
            <Card key={x.id} className="shadow-card">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Case {x.case_id.slice(0, 8)}</CardTitle>
                <Badge variant="secondary">{x.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{workScopeSummary(x.work_scope)}</p>
                <Button asChild variant="outline" size="sm">
                  <a href={`/cases/${x.case_id}`}>
                    View opportunity <ArrowRight className="ml-1 size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
            <Hammer className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No refurbishment opportunities are open right now. Check back soon.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
