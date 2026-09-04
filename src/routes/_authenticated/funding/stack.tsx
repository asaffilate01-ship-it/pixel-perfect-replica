import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Layers } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";

export const Route = createFileRoute("/_authenticated/funding/stack")({
  head: () => ({
    meta: [
      { title: "Funding Stack Optimiser | DOMUREVA" },
      {
        name: "description",
        content: "Reva Fund proposes the best compatible allocation of eligible works across reviewed schemes.",
      },
      { property: "og:title", content: "Funding Stack Optimiser | DOMUREVA" },
      {
        property: "og:description",
        content: "See how eligible works can be funded across reviewed schemes without double-funding.",
      },
    ],
  }),
  component: FundingStackPage,
});

function FundingStackPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Reva Fund"
        title="Funding Stack Optimiser"
        description="Reva Fund proposes the best compatible allocation of eligible works across reviewed schemes without allocating the same cost twice."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-accent" />
            <h2 className="font-display text-lg font-bold text-primary">How the stack is built</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Costed work items are matched against reviewed scheme rules in priority order. Each
            scheme's contribution rate and remaining award cap are respected, and no work item can
            be double-counted across schemes.
          </p>
        </section>

        <aside className="rounded-2xl border border-warning/40 bg-warning/10 p-6 shadow-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-warning" />
            <h2 className="font-display text-base font-bold text-primary">Human review required</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Proposed stacks are not grant approval and must be checked against scheme-specific
            subsidy and double-funding conditions before submission.
          </p>
        </aside>
      </div>
    </Container>
  );
}
