import { createFileRoute } from "@tanstack/react-router";
import { Filter } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const filters = [
  "Authority",
  "Postcode",
  "Empty period",
  "Application stage",
  "Funding source",
  "Assigned officer",
  "Overdue tasks",
  "Evidence gaps",
];

export const Route = createFileRoute("/_authenticated/council/cases")({
  head: () => ({
    meta: [
      { title: "Council case queue | DOMUREVA" },
      {
        name: "description",
        content: "Prioritise long-term empty homes by funding fit, readiness and risk.",
      },
      { property: "og:title", content: "Council case queue | DOMUREVA" },
      {
        property: "og:description",
        content: "Filter and prioritise the council empty-homes case queue.",
      },
    ],
  }),
  component: CouncilCasesPage,
});

function CouncilCasesPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Council operations"
        title="Council case queue"
        description="Prioritise long-term empty homes by funding fit, readiness, risk and expected homes returned to use."
      />

      <Card className="mt-8 shadow-card">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Filter className="size-4 text-accent" />
          <CardTitle>Queue controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge key={filter} variant="outline" className="text-xs font-medium">
                {filter}
              </Badge>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Case queue filtering and sorting is coming online as council data sources are
            connected. Filters shown above reflect the planned queue controls.
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
