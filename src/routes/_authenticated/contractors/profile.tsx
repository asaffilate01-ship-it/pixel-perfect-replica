import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, RefreshCcw } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const checks: Array<[string, string]> = [
  ["Craftvaro identity", "Verified"],
  ["Public liability", "Verified"],
  ["Coverage", "LU · AL · HP"],
  ["Gas Safe", "If applicable"],
  ["NICEIC", "If applicable"],
  ["Retrofit accreditation", "Pending"],
];

export const Route = createFileRoute("/_authenticated/contractors/profile")({
  head: () => ({
    meta: [
      { title: "Contractor qualification profile | DOMUREVA" },
      {
        name: "description",
        content: "Craftvaro-verified delivery eligibility and Reva Match scoring signals.",
      },
      { property: "og:title", content: "Contractor qualification profile | DOMUREVA" },
      {
        property: "og:description",
        content: "Track delivery eligibility checks and your current Reva Match delivery score.",
      },
    ],
  }),
  component: ContractorProfilePage,
});

function ContractorProfilePage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Craftvaro verified delivery"
        title="Contractor qualification profile"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Delivery eligibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {checks.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <Badge
                    variant={value === "Pending" ? "outline" : "secondary"}
                    className={
                      value === "Pending"
                        ? "border-warning/40 text-warning"
                        : "border-transparent bg-leaf/15 text-leaf-soft"
                    }
                  >
                    {value === "Pending" ? (
                      <Clock className="mr-1 size-3" />
                    ) : (
                      <CheckCircle2 className="mr-1 size-3" />
                    )}
                    {value}
                  </Badge>
                </div>
              ))}
            </div>
            <Separator className="my-6" />
            <Button className="gap-2">
              <RefreshCcw className="size-4" />
              Sync Craftvaro profile
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Matching signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reva Match scores by verified trade, location, capacity, accreditation, evidence
              quality, project outcomes and owner/provider requirements.
            </p>
            <p className="font-display text-5xl font-bold text-primary">86</p>
            <p className="text-sm text-muted-foreground">Current delivery score / 100</p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
