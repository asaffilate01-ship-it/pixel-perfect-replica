import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, FolderKanban, Search, SlidersHorizontal, X } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cases/")({
  head: () => ({
    meta: [
      { title: "Cases | DOMUREVA" },
      { name: "description", content: "Search your authorised property cases, review progress and act on the next stage." },
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const cases = useQuery({
    queryKey: ["cases", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, status, created_at, properties(postcode, address_line)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as CaseRow[];
    },
  });

  const statuses = useMemo(
    () => [...new Set((cases.data ?? []).map((item) => item.status).filter(Boolean))].sort(),
    [cases.data],
  );
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (cases.data ?? []).filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!needle) return true;
      return [
        item.id,
        item.properties?.address_line,
        item.properties?.postcode,
        item.status,
      ].some((value) => (value ?? "").toLocaleLowerCase().includes(needle));
    });
  }, [cases.data, search, status]);
  const filtersApplied = search.trim().length > 0 || status !== "all";

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Case workspace"
        title="Every property, one clear journey."
        description="Find authorised cases by property, postcode or stage. Open a record to review funding, evidence, quotations and delivery."
        actions={<Button asChild className="rounded-full bg-amber text-amber-foreground hover:bg-amber/90"><Link to="/properties/new">Check a property</Link></Button>}
      />

      <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card" aria-label="Case directory">
        <div className="border-b border-border p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Property cases</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search and filter the 200 most recently opened cases available to your account.
              </p>
            </div>
            {!cases.isLoading && !cases.isError ? (
              <Badge variant="secondary" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? "case" : "cases"} shown
              </Badge>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_210px_auto] sm:items-end">
            <div>
              <Label htmlFor="case-search" className="mb-2 block text-xs font-semibold text-muted-foreground">Find a case</Label>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="case-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Address, postcode or case reference" className="h-11 rounded-xl pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="case-status" className="mb-2 block text-xs font-semibold text-muted-foreground">Stage / status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="case-status" className="h-11 w-full rounded-xl">
                  <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map((value) => <SelectItem key={value} value={value} className="capitalize">{value.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {filtersApplied ? (
              <Button type="button" variant="ghost" className="h-11 gap-2 rounded-xl" onClick={() => { setSearch(""); setStatus("all"); }}>
                <X className="size-4" aria-hidden="true" /> Clear
              </Button>
            ) : <div className="hidden sm:block" />}
          </div>
        </div>

        {cases.isLoading ? (
          <div className="grid gap-3 p-6" role="status" aria-label="Loading cases">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-4/5" />
          </div>
        ) : cases.isError ? (
          <div className="p-10 text-center" role="alert">
            <p className="font-display text-lg font-semibold text-primary">Cases could not be loaded</p>
            <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={() => void cases.refetch()}>Retry loading</Button>
          </div>
        ) : (cases.data?.length ?? 0) === 0 ? (
          <div className="p-10 text-center sm:p-12">
            <FolderKanban className="mx-auto size-9 text-accent" aria-hidden="true" />
            <h3 className="mt-5 font-display text-xl font-semibold text-primary">No property cases yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Start with a property assessment and Domureva will create its case record.</p>
            <Button asChild className="mt-5 rounded-full"><Link to="/properties/new">Check a property</Link></Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Search className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 font-display text-lg font-semibold text-primary">No matching cases</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try a different postcode, reference or status.</p>
            <Button type="button" variant="outline" className="mt-5 rounded-full" onClick={() => { setSearch(""); setStatus("all"); }}>Clear filters</Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  to="/cases/$caseId"
                  params={{ caseId: item.id }}
                  className="group flex flex-wrap items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-semibold text-primary">
                        {item.properties?.address_line ?? item.properties?.postcode ?? "Unnamed property"}
                      </h3>
                      <Badge variant="secondary" className="capitalize">{item.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.properties?.postcode || "No postcode"} · Opened {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Case {item.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent">
                    Open case <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
