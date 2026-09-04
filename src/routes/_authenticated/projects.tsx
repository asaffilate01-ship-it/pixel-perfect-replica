import { createFileRoute } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects | DOMUREVA" },
      {
        name: "description",
        content: "DOMUREVA Projects is wired to the shared property case model and AI orchestration layer.",
      },
      { property: "og:title", content: "Projects | DOMUREVA" },
      { property: "og:description", content: "Track works in delivery across your empty homes." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Works in progress once a case moves from application into delivery."
      />

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <Badge variant="secondary">Connected workflow</Badge>
        <div className="mt-4 flex items-center gap-2">
          <Hammer className="size-5 text-accent" />
          <h2 className="font-display text-xl font-bold text-primary">DOMUREVA Projects</h2>
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
