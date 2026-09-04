import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Container, PageHeader, StatCard } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/applications/")({
  head: () => ({
    meta: [
      { title: "Application readiness | DOMUREVA" },
      {
        name: "description",
        content: "Track your funding application pack's readiness across required evidence items.",
      },
      { property: "og:title", content: "Application readiness | DOMUREVA" },
      { property: "og:description", content: "See what evidence is verified, provided or still missing." },
    ],
  }),
  component: ApplicationsPage,
});

type DocStatus = "Verified" | "Provided" | "Missing";

const INITIAL_DOCS: [string, DocStatus][] = [
  ["Proof of ownership", "Verified"],
  ["Evidence property is empty", "Provided"],
  ["Initial condition photographs", "Verified"],
  ["Schedule of works", "Missing"],
  ["Contractor quotation", "Missing"],
  ["EPC / energy evidence", "Provided"],
  ["Owner contribution evidence", "Missing"],
];

function ApplicationsPage() {
  const [docs] = useState(INITIAL_DOCS);
  const done = useMemo(
    () => docs.filter(([, status]) => status === "Verified" || status === "Provided").length,
    [docs],
  );
  const verified = useMemo(() => docs.filter(([, status]) => status === "Verified").length, [docs]);
  const pct = Math.round((done / docs.length) * 100);

  return (
    <Container>
      <PageHeader
        eyebrow="Application pack"
        title="Funding application readiness"
        description="Reva Verify checks completeness and provenance. Final submission remains under your control."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pack complete" value={`${pct}%`} />
        <StatCard label="Items outstanding" value={docs.length - done} />
        <StatCard label="Evidence items verified" value={verified} />
        <StatCard label="Matched scheme" value={1} />
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card shadow-card">
        <h2 className="border-b border-border p-6 font-display text-lg font-bold text-primary">
          Required evidence
        </h2>
        <div>
          {docs.map(([name, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-0"
            >
              <p className="font-medium text-primary">{name}</p>
              <div className="flex items-center gap-3">
                <Badge variant={status === "Missing" ? "destructive" : "secondary"}>{status}</Badge>
                <Button size="sm" variant="outline">
                  {status === "Missing" ? "Add" : "View"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="p-6 text-xs text-muted-foreground">
          Reva Verify checks completeness and provenance. Final submission remains under your
          control.
        </p>
      </section>
    </Container>
  );
}
