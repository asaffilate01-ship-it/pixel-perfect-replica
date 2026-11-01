import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Coins, Layers3, Plus } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { loadCaseDirectory } from "@/lib/domureva/cases/directory";

export const Route = createFileRoute("/_authenticated/funding/stack")({
  head: () => ({
    meta: [
      { title: "Funding stack | DOMUREVA" },
      {
        name: "description",
        content: "Compare costed property works against potential reviewed funding routes and inspect unverified assumptions.",
      },
    ],
  }),
  component: FundingStackPage,
});

type CaseOption = {
  id: string;
  properties: { address_line: string | null; postcode: string } | null;
};
type FundingPreview = {
  caseId: string;
  status: "preliminary_estimate";
  requiresHumanReview: true;
  workItems: Array<{ id: string; description: string; category: string; estimatedCost: number }>;
  schemes: Array<{ id: string; name: string; maxAward: number; eligibleWorks: string[] }>;
  excluded: Array<{ schemeId: string; reason: string }>;
  allocations: Array<{ schemeId: string; workItemId: string; amount: number }>;
  summary: { totalWorks: number; funded: number; ownerContribution: number };
  warnings: string[];
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const WORK_CATEGORIES = [
  ["roof", "Roof repairs"],
  ["insulation", "Insulation"],
  ["heating", "Heating"],
  ["electrical", "Electrical work"],
  ["structural", "Structural works"],
  ["kitchen", "Kitchen"],
  ["bathroom", "Bathroom"],
  ["general", "General refurbishment"],
] as const;

async function callCaseApi(path: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in again to use the funding planner.");
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + session.access_token,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "The funding request could not be completed.");
  return data;
}

function FundingStackPage() {
  const [caseId, setCaseId] = useState("none");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [cost, setCost] = useState("");
  const [preview, setPreview] = useState<FundingPreview | null>(null);

  const cases = useQuery({
    queryKey: ["funding", "case-options"],
    queryFn: async () => (await loadCaseDirectory()).cases,
  });

  const optimise = useMutation({
    mutationFn: async (id: string) => await callCaseApi("/api/funding/optimise", { caseId: id }) as FundingPreview,
    onSuccess: (result) => setPreview(result),
    onError: (error: Error) => toast.error("Funding preview failed", { description: error.message }),
  });

  const addWork = useMutation({
    mutationFn: async () => {
      if (caseId === "none") throw new Error("Select a property case.");
      const estimatedCost = Number(cost);
      if (!description.trim() || !(estimatedCost > 0) || !Number.isFinite(estimatedCost)) {
        throw new Error("Enter a work description and a positive estimate.");
      }
      return callCaseApi("/api/funding/work-items", {
        caseId, description: description.trim(), category, estimatedCost,
      });
    },
    onSuccess: () => {
      toast.success("Estimated work item recorded.");
      setDescription("");
      setCost("");
      setPreview(null);
      optimise.mutate(caseId);
    },
    onError: (error: Error) => toast.error("Could not add work", { description: error.message }),
  });

  const switchCase = (id: string) => {
    setCaseId(id);
    setPreview(null);
    setDescription("");
    setCost("");
  };
  const isSelected = caseId !== "none";
  const selectedLabel = cases.data?.find((item) => item.id === caseId)?.properties?.postcode;
  const assumptions = preview?.warnings ?? [];

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Reva Fund"
        title="Model a preliminary funding stack."
        description="Build a costed schedule, inspect potential scheme allocations and understand what still requires formal review. Calculations use your authorised case records."
      />

      <div className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-card">
        <Label htmlFor="stack-case" className="text-sm font-semibold text-primary">Property case</Label>
        {cases.isLoading ? <Skeleton className="mt-2 h-11 w-full max-w-lg" /> : (
          <Select value={caseId} onValueChange={switchCase}>
            <SelectTrigger id="stack-case" className="mt-2 h-11 w-full max-w-lg rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Choose a property</SelectItem>
              {(cases.data ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.properties?.address_line || item.properties?.postcode || "Property"} · {item.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {cases.isError ? <p className="mt-2 text-sm text-destructive" role="alert">Could not load your property cases.</p> : null}
        {isSelected ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" className="rounded-full" disabled={optimise.isPending} onClick={() => optimise.mutate(caseId)}>
              <Layers3 className="size-4" /> {optimise.isPending ? "Calculating…" : "Calculate indicative stack"}
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/cases/$caseId" params={{ caseId }}>View case {selectedLabel ?? ""}</Link>
            </Button>
          </div>
        ) : <p className="mt-4 text-sm text-muted-foreground">Select a case to create work items and compare the reviewed funding routes.</p>}
      </div>

      {isSelected ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(310px,.7fr)]">
          <section className="space-y-6">
            {preview ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Estimated works", preview.summary.totalWorks],
                    ["Potential allocation", preview.summary.funded],
                    ["Unallocated balance", preview.summary.ownerContribution],
                  ].map(([label, amount]) => (
                    <div key={label} className="rounded-2xl border border-border bg-card p-5">
                      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                      <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-primary">{GBP.format(Number(amount))}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold text-primary">Costed work items</h2>
                    <Badge variant="secondary">{preview.workItems.length} items</Badge>
                  </div>
                  {preview.workItems.length ? (
                    <ul className="mt-4 divide-y divide-border">
                      {preview.workItems.map((item) => (
                        <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                          <div>
                            <p className="font-semibold text-primary">{item.description}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{item.category.replace(/_/g, " ")}</p>
                          </div>
                          <p className="font-semibold tabular-nums text-foreground">{GBP.format(item.estimatedCost)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-4 text-sm text-muted-foreground">No costed works have been recorded. Add one using the form.</p>}
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-xl font-semibold text-primary">Indicative allocations</h2>
                  {preview.allocations.length ? (
                    <ul className="mt-4 divide-y divide-border">
                      {preview.allocations.map((entry, index) => (
                        <li key={entry.schemeId + entry.workItemId + index} className="flex flex-wrap items-center justify-between gap-3 py-4">
                          <div>
                            <p className="font-semibold text-primary">
                              {preview.schemes.find((scheme) => scheme.id === entry.schemeId)?.name ?? "Reviewed scheme"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {preview.workItems.find((item) => item.id === entry.workItemId)?.description ?? "Work item"}
                            </p>
                          </div>
                          <p className="font-semibold tabular-nums text-foreground">{GBP.format(entry.amount)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-4 text-sm text-muted-foreground">No preliminary allocations are possible from the costed works and current reviewed scheme data.</p>}
                  {preview.excluded.length ? (
                    <div className="mt-5 border-t border-border pt-4">
                      <h3 className="font-semibold text-primary">Schemes excluded from calculation</h3>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {preview.excluded.map((item) => <li key={item.schemeId}>{item.reason} · {item.schemeId.slice(0, 8)}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </>
            ) : optimise.isPending ? <Skeleton className="h-52 w-full rounded-3xl" /> : (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <Coins className="mx-auto size-8 text-accent" aria-hidden="true" />
                <h2 className="mt-4 font-display text-xl font-semibold text-primary">Your funding workspace</h2>
                <p className="mt-2 text-sm text-muted-foreground">Calculate a preview to see recorded works, potential allocations and unsupported scheme assumptions.</p>
                <Button variant="outline" className="mt-5 rounded-full" onClick={() => optimise.mutate(caseId)}>Calculate funding preview</Button>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2"><Plus className="size-5 text-accent" /><h2 className="font-display text-lg font-semibold text-primary">Add costed works</h2></div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Record an estimate against the case; this is not a contractor quote.</p>
              <div className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="work-description">Description</Label>
                  <Input id="work-description" className="mt-2 h-11 rounded-xl" value={description}
                    onChange={(event) => setDescription(event.target.value)} maxLength={300} placeholder="e.g. Replace damaged roof tiles"/>
                </div>
                <div>
                  <Label htmlFor="work-category">Work category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="work-category" className="mt-2 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{WORK_CATEGORIES.map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="work-cost">Estimated cost (£)</Label>
                  <Input id="work-cost" className="mt-2 h-11 rounded-xl" type="number" inputMode="decimal" min="0.01" max="100000000" step="0.01" value={cost}
                    onChange={(event) => setCost(event.target.value)} placeholder="2500.00"/>
                </div>
                <Button type="button" className="w-full rounded-full" disabled={addWork.isPending || !description.trim() || !(Number(cost) > 0)} onClick={() => addWork.mutate()}>
                  {addWork.isPending ? "Saving estimate…" : "Save estimated work"}
                </Button>
              </div>
            </section>

            <section className="rounded-3xl bg-navy p-6 text-navy-foreground">
              <div className="flex items-center gap-2"><AlertTriangle className="size-5 text-leaf-soft"/><h2 className="font-display text-lg font-semibold">Human verification required</h2></div>
              <p className="mt-3 text-sm leading-6 text-navy-foreground/75">
                The preview is an indicative calculation. It cannot award a grant or confirm the administering authority's eligibility decision.
              </p>
              {assumptions.length ? (
                <ul className="mt-4 space-y-3 text-sm text-navy-foreground/80">
                  {assumptions.map((note) => <li key={note} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-soft"/>{note}</li>)}
                </ul>
              ) : null}
            </section>
          </aside>
        </div>
      ) : null}
    </Container>
  );
}
