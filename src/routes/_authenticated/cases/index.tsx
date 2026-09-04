import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderKanban } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cases/")({
  head: () => ({
    meta: [
      { title: "Cases | DOMUREVA" },
      {
        name: "description",
        content: "Every property delivery case you're running, from first assessment to completed works.",
      },
      { property: "og:title", content: "Cases | DOMUREVA" },
      { property: "og:description", content: "Track every empty home case in one list." },
    ],
  }),
  component: CasesPage,
});

type CaseRow = {
  id: string;
  status: string;
  created_at: string;
  properties: { postcode: string; address_line: string | null } | null;
};

function CasesPage() {
  const cases = useQuery({
    queryKey: ["cases", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, status, created_at, properties(postcode, address_line)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CaseRow[];
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Delivery"
        title="Your cases"
        description="Every property moving through discovery, funding, works and evidence."
        actions={
          <Button asChild className="bg-amber text-amber-foreground hover:bg-amber/90">
            <Link to="/properties/new">Check a property</Link>
          </Button>
        }
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {cases.isLoading ? (
          <div className="grid gap-3 p-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </div>
        ) : cases.isError ? (
          <div className="p-10 text-center">
            <p className="font-display text-lg font-bold text-primary">Couldn't load your cases</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh the page and try again.</p>
          </div>
        ) : (cases.data?.length ?? 0) === 0 ? (
          <div className="p-10 text-center">
            <FolderKanban className="mx-auto size-8 text-accent" />
            <p className="mt-3 font-display text-lg font-bold text-primary">No cases yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a property to open your first case and see matched funding schemes.
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
                <th className="px-5 py-3 font-semibold text-primary">Status</th>
                <th className="px-5 py-3 font-semibold text-primary">Opened</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {cases.data?.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-4 font-medium text-primary">
                    {c.properties?.address_line ?? "Unnamed property"}
                    <span className="ml-2 text-muted-foreground">{c.properties?.postcode}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary" className="capitalize">
                      {c.status ?? "open"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/cases/$caseId"
                      params={{ caseId: c.id }}
                      className="inline-flex items-center gap-1 font-semibold text-accent"
                    >
                      Open <ArrowRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}
