import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";

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

type RuleChangeRow = {
  id: string;
  change_type: string;
  status: string;
  created_at: string;
  funding_schemes: { authority: string; name: string } | null;
};

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [
      { title: "Funding rule review queue | DOMUREVA" },
      {
        name: "description",
        content: "Review Reva Discover funding rule changes before they go live in matching.",
      },
      { property: "og:title", content: "Funding rule review queue | DOMUREVA" },
      {
        property: "og:description",
        content: "Material funding rule changes await authorised reviewer approval.",
      },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["review", "rule-change-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rule_change_queue")
        .select("id,change_type,status,created_at,funding_schemes(authority,name)")
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as RuleChangeRow[];
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Admin"
        title="Funding rule review queue"
        description="Material changes discovered by Reva Discover stay out of production matching until an authorised reviewer approves them."
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-destructive">
            Couldn't load the review queue. Please try again shortly.
          </div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Authority</TableHead>
                <TableHead>Scheme</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.funding_schemes?.authority ?? "—"}
                  </TableCell>
                  <TableCell>{row.funding_schemes?.name ?? "—"}</TableCell>
                  <TableCell className="capitalize">
                    {row.change_type.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-warning/40 text-warning">
                      Awaiting review
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <ShieldAlert className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No funding rule changes are awaiting review right now.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
