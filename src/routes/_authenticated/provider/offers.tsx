import { createFileRoute } from "@tanstack/react-router";
import { FileStack } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/provider/offers")({
  head: () => ({
    meta: [
      { title: "Provider offers | DOMUREVA" },
      {
        name: "description",
        content: "Create and track lease-and-repair, purchase-and-repair and management proposals.",
      },
      { property: "og:title", content: "Provider offers | DOMUREVA" },
      {
        property: "og:description",
        content: "Manage proposals for suitable empty homes from a single workspace.",
      },
    ],
  }),
  component: ProviderOffersPage,
});

function ProviderOffersPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Provider offers"
        title="Provider offers"
        description="Create and track lease-and-repair, purchase-and-repair and management proposals for suitable empty homes."
      />

      <Card className="mt-8 shadow-card">
        <CardHeader>
          <CardTitle>No offers yet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <FileStack className="size-8 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">
            Offers you create for empty-home opportunities will appear here so you can track their
            progress from proposal to occupation.
          </p>
          <Button disabled>Draft a new offer</Button>
        </CardContent>
      </Card>
    </Container>
  );
}
