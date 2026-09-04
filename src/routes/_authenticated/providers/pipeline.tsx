import { createFileRoute } from "@tanstack/react-router";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const opportunities: Array<[string, string, string, string]> = [
  ["LU1 3XX", "Lease & repair", "£42k", "92"],
  ["AL10 8XX", "Purchase & repair", "£58k", "87"],
  ["LU4 9XX", "Lease & repair", "£31k", "81"],
];

export const Route = createFileRoute("/_authenticated/providers/pipeline")({
  head: () => ({
    meta: [
      { title: "Registered provider pipeline | DOMUREVA" },
      {
        name: "description",
        content: "Ranked empty-home opportunities queued for registered provider review.",
      },
      { property: "og:title", content: "Registered provider pipeline | DOMUREVA" },
      {
        property: "og:description",
        content: "Reva-ranked empty-home opportunities awaiting provider review.",
      },
    ],
  }),
  component: ProviderPipelinePage,
});

function ProviderPipelinePage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Registered provider pipeline"
        title="Ranked empty-home opportunities"
      />

      <Card className="mt-8 divide-y divide-border p-0 shadow-card">
        {opportunities.length > 0 ? (
          opportunities.map(([postcode, route, works, score]) => (
            <div
              key={postcode}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div>
                <p className="font-semibold text-foreground">{postcode}</p>
                <p className="text-sm text-muted-foreground">{route}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{works}</p>
                <p className="text-sm text-muted-foreground">Estimated works</p>
              </div>
              <Badge className="border-transparent bg-leaf/15 text-leaf-soft">
                Reva {score}/100
              </Badge>
              <Button variant="outline" size="sm">
                Review opportunity
              </Button>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No opportunities are queued for your organisation right now.
          </div>
        )}
      </Card>
    </Container>
  );
}
