import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities | DOMUREVA" },
      {
        name: "description",
        content: "DOMUREVA Opportunities is wired to the shared property case model and AI orchestration layer.",
      },
      { property: "og:title", content: "Opportunities | DOMUREVA" },
      { property: "og:description", content: "AI-ranked empty home opportunities awaiting review." },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Discovery"
        title="Opportunities"
        description="AI-surfaced empty homes and funding leads, ranked ahead of human and eligibility review."
      />

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <Badge variant="secondary">Connected workflow</Badge>
        <div className="mt-4 flex items-center gap-2">
          <Sparkles className="size-5 text-accent" />
          <h2 className="font-display text-xl font-bold text-primary">DOMUREVA Opportunities</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This module is wired to the shared property case model and AI orchestration layer.
          Production data appears once Supabase and the relevant adapter credentials are
          configured.
        </p>
      </div>
    </Container>
  );
}
