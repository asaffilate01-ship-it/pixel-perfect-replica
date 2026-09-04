import { Link, createFileRoute } from "@tanstack/react-router";
import { Coins } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/funding/")({
  head: () => ({
    meta: [
      { title: "Funding | DOMUREVA" },
      {
        name: "description",
        content: "DOMUREVA Funding is wired to the shared property case model and AI orchestration layer.",
      },
      { property: "og:title", content: "Funding | DOMUREVA" },
      { property: "og:description", content: "Explore reviewed funding schemes matched to your cases." },
    ],
  }),
  component: FundingPage,
});

function FundingPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Funding"
        title="Funding"
        description="Match reviewed schemes to your cases and plan how to stack eligible works."
        actions={
          <Button asChild variant="outline">
            <Link to="/funding/stack">Open stack optimiser</Link>
          </Button>
        }
      />

      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-card">
        <Badge variant="secondary">Connected workflow</Badge>
        <div className="mt-4 flex items-center gap-2">
          <Coins className="size-5 text-accent" />
          <h2 className="font-display text-xl font-bold text-primary">DOMUREVA Funding</h2>
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
