import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileCheck2, FilePlus2, ShieldCheck } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/application-pack")({
  head: () => ({
    meta: [
      { title: "Application pack | DOMUREVA" },
      { name: "description", content: "Review verified evidence and download a source-backed case audit manifest." },
    ],
  }),
  component: ApplicationPackPage,
});

type CaseOption = { id: string; properties: { address_line: string | null; postcode: string } | null };
type Preview = {
  status: "preview";
  spec: {
    title: string;
    propertyAddress: string;
    eligibilitySummary: string;
    sections: Array<{ title: string; required: boolean; items: Array<{ label: string; status: "ready" | "missing" | "review" }> }>;
  };
  manifest: { manifestHash: string; generatedAt: string };
  counts: {
    preliminaryMatches: number;
    documentCount: number;
    verifiedDocuments: number;
    costedWorkItems: number;
  };
  requiresHumanReview: true;
  readyForSubmission: false;
};
type StoredDocument = {
  id: string;
  filename: string;
  category: string;
  byte_size: number | null;
  verified_at: string | null;
  created_at: string;
};

async function authorisedRequest(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please sign in again to continue.");
  const response = await fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: "Bearer " + session.access_token,
    },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(detail.error ?? "Request could not be completed.");
  }
  return response;
}

function ApplicationPackPage() {
  const queryClient = useQueryClient();
  const [caseId, setCaseId] = useState("none");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("property_evidence");

  const cases = useQuery({
    queryKey: ["pack", "case-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cases")
        .select("id,properties(address_line,postcode)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as CaseOption[];
    },
  });

  const documents = useQuery({
    queryKey: ["pack", "documents", caseId],
    enabled: caseId !== "none",
    queryFn: async () => {
      const response = await authorisedRequest("/api/documents/?caseId=" + encodeURIComponent(caseId));
      return (await response.json()) as { documents: StoredDocument[] };
    },
  });

  const makePreview = useMutation({
    mutationFn: async (id: string) => {
      const response = await authorisedRequest("/api/application-pack/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id }),
      });
      return (await response.json()) as Preview;
    },
    onSuccess: setPreview,
    onError: (error: Error) => toast.error("Could not prepare preview", { description: error.message }),
  });

  const exportManifest = useMutation({
    mutationFn: async (id: string) => {
      const response = await authorisedRequest("/api/application-pack/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: id }),
      });
      const content = await response.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.href = url;
      link.download = "domureva-" + id.slice(0, 8) + "-audit.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onSuccess: () => toast.success("Audit manifest downloaded"),
    onError: (error: Error) => toast.error("Could not download audit manifest", { description: error.message }),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!selectedFile || caseId === "none") throw new Error("Choose a case and document.");
      const form = new FormData();
      form.set("caseId", caseId);
      form.set("category", category);
      form.set("file", selectedFile);
      const response = await authorisedRequest("/api/documents/upload", {
        method: "POST",
        body: form,
      });
      return (await response.json()) as { status: "stored_unverified" };
    },
    onSuccess: () => {
      setSelectedFile(null);
      setPreview(null);
      toast.success("Evidence stored privately; verification is still required.");
      void queryClient.invalidateQueries({ queryKey: ["pack", "documents", caseId] });
    },
    onError: (error: Error) => toast.error("Document upload failed", { description: error.message }),
  });

  const switchCase = (id: string) => {
    setCaseId(id);
    setPreview(null);
    setSelectedFile(null);
  };
  const chosen = caseId !== "none";

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Application evidence"
        title="Build a trustworthy case pack."
        description="Choose a property, review the evidence you actually have, then generate a preliminary audit preview. Final funding decisions stay with the administering authority."
      />

      <section className="mt-7 rounded-3xl border border-border bg-card p-6 shadow-card">
        <Label htmlFor="pack-case" className="text-sm font-semibold text-primary">Select a property case</Label>
        {cases.isLoading ? <Skeleton className="mt-3 h-11 w-full max-w-lg" /> : (
          <Select value={caseId} onValueChange={switchCase}>
            <SelectTrigger id="pack-case" className="mt-3 h-11 w-full max-w-lg rounded-xl">
              <SelectValue placeholder="Select a case" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Choose a case</SelectItem>
              {(cases.data ?? []).map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.properties?.address_line || option.properties?.postcode || "Property case"} · {option.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {cases.isError ? <p className="mt-3 text-sm text-destructive" role="alert">Your case list could not be loaded.</p> : null}
        {!cases.isLoading && !cases.isError && cases.data?.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No cases available. Start a property assessment first.</p>
        ) : null}
      </section>

      {chosen ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,.75fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-primary">Case audit preview</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Generated from this case's saved funding matches, source references, evidence and costed works—not user-entered claims.</p>
                </div>
                <Button type="button" disabled={makePreview.isPending} onClick={() => makePreview.mutate(caseId)} className="rounded-full">
                  {makePreview.isPending ? "Checking records…" : "Generate preview"}
                </Button>
              </div>
              {preview ? (
                <div className="mt-6">
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
                      <p className="font-semibold text-primary">Human review still required</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">This preview is not a PDF, an award decision or a submitted application.</p>
                    <p className="mt-2 break-all text-xs text-muted-foreground">Manifest SHA-256: {preview.manifest.manifestHash}</p>
                  </div>
                  <div className="mt-5 divide-y divide-border">
                    {preview.spec.sections.map((section) => (
                      <section key={section.title} className="py-5 first:pt-0">
                        <h3 className="font-display font-semibold text-primary">{section.title}</h3>
                        <div className="mt-3 space-y-3">
                          {section.items.map((item, index) => (
                            <div key={item.label + index} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                              <span className="min-w-0 flex-1 text-muted-foreground">{item.label}</span>
                              <Badge variant={item.status === "missing" ? "destructive" : "secondary"} className="capitalize">
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ) : <p className="mt-5 text-sm text-muted-foreground">Generate a preview to see recorded progress and outstanding reviews.</p>}
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl font-semibold text-primary">Evidence documents</h2>
              <p className="mt-2 text-sm text-muted-foreground">Files are private and not considered verified until checked by an authorised process.</p>
              {documents.isLoading ? <Skeleton className="mt-5 h-24 w-full" /> : documents.isError ? (
                <div className="mt-5" role="alert">
                  <p className="text-sm text-destructive">Documents could not be loaded.</p>
                  <Button type="button" className="mt-3 rounded-full" variant="outline" onClick={() => void documents.refetch()}>Retry</Button>
                </div>
              ) : documents.data?.documents.length ? (
                <ul className="mt-4 divide-y divide-border">
                  {documents.data.documents.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="break-all font-semibold text-primary">{item.filename}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.category.replace(/_/g, " ")}</p>
                      </div>
                      <Badge variant="secondary">{item.verified_at ? "Verified" : "Awaiting review"}</Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-5 text-sm text-muted-foreground">No documents attached to this case.</p>}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2"><FilePlus2 className="size-5 text-accent" /><h2 className="font-display text-xl font-semibold text-primary">Attach evidence</h2></div>
              <Label htmlFor="evidence-category" className="mt-5 block text-sm">Document type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="evidence-category" className="mt-2 h-10 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_evidence">Property evidence</SelectItem>
                  <SelectItem value="ownership">Proof of ownership</SelectItem>
                  <SelectItem value="vacancy">Vacancy evidence</SelectItem>
                  <SelectItem value="epc">Energy performance</SelectItem>
                  <SelectItem value="condition">Condition report</SelectItem>
                  <SelectItem value="quote">Contractor quote</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="evidence-file" className="mt-5 block text-sm">Choose a PDF or image</Label>
              <Input
                id="evidence-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="mt-2 h-11 rounded-xl"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-xs text-muted-foreground">Maximum 20 MB. Requires configured private Supabase Storage; no automatic verification.</p>
              <Button type="button" disabled={!selectedFile || upload.isPending} className="mt-5 w-full rounded-full" onClick={() => upload.mutate()}>
                {upload.isPending ? "Storing securely…" : "Upload document"}
              </Button>
            </section>

            <section className="rounded-3xl bg-navy p-6 text-navy-foreground">
              <FileCheck2 className="size-5 text-leaf-soft" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold">Export the audit trail</h2>
              <p className="mt-2 text-sm leading-6 text-navy-foreground/75">Download a JSON audit package with recorded sources, evidence states, works and a deterministic manifest hash.</p>
              <Button
                type="button"
                disabled={exportManifest.isPending}
                onClick={() => exportManifest.mutate(caseId)}
                className="mt-5 w-full rounded-full bg-amber text-amber-foreground hover:bg-amber/90"
              >
                <Download className="mr-1 size-4" /> {exportManifest.isPending ? "Preparing export…" : "Download audit JSON"}
              </Button>
              <p className="mt-3 text-xs text-navy-foreground/75">PDF pack assembly and authority submission are not yet available.</p>
            </section>
          </aside>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <ShieldCheck className="mx-auto size-8 text-accent" aria-hidden="true" />
          <p className="mt-4 font-display text-xl font-semibold text-primary">Choose a case to get started</p>
          <p className="mt-2 text-sm text-muted-foreground">All evidence, funding information and exports stay linked to a specific authorised property.</p>
        </div>
      )}
    </Container>
  );
}
