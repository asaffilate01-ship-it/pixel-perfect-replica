import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProviderOpportunity = {
  id: string;
  route: string;
  score: number | null;
  status: string;
  case_id: string;
};

export const Route = createFileRoute("/_authenticated/providers/")({
  head: () => ({
    meta: [
      { title: "Housing provider opportunities | DOMUREVA" },
      {
        name: "description",
        content: "Ranked purchase & repair and lease & repair opportunities for housing providers.",
      },
      { property: "og:title", content: "Housing provider opportunities | DOMUREVA" },
      {
        property: "og:description",
        content: "Score-ranked empty home opportunities for authorised housing providers.",
      },
    ],
  }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["providers", "opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_opportunities")
        .select("id,route,score,status,case_id")
        .order("score", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ProviderOpportunity[];
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Housing providers"
        title="Purchase & repair / lease & repair"
        description="Ranked opportunities are suggestions only; acquisition and funding decisions remain with authorised people."
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-destructive">
            Couldn't load provider opportunities. Please try again shortly.
          </div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{x.case_id.slice(0, 8)}</TableCell>
                  <TableCell className="capitalize">{x.route.replaceAll("_", " ")}</TableCell>
                  <TableCell>{Math.round((x.score ?? 0) * 100)}%</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{x.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Building2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No ranked opportunities yet. New matches appear here as cases progress.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
