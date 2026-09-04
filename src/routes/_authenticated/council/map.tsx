import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPinned, MapPin, Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Container, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type GeoCase = {
  id: string;
  case_id: string;
  latitude: number;
  longitude: number;
  cases: {
    status: string;
    properties: { postcode: string; empty_since: string | null } | null;
  } | null;
};

export const Route = createFileRoute("/_authenticated/council/map")({
  head: () => ({
    meta: [
      { title: "Empty homes map | DOMUREVA" },
      {
        name: "description",
        content: "Geolocated empty-home cases for authorised council users.",
      },
      { property: "og:title", content: "Empty homes map | DOMUREVA" },
      {
        property: "og:description",
        content: "Cluster cases by postcode, empty period, status and delivery readiness.",
      },
    ],
  }),
  component: CouncilMapPage,
});

function CouncilMapPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["council", "map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence_items")
        .select("id,case_id,latitude,longitude,cases(status,properties(postcode,empty_since))")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as GeoCase[];
    },
  });

  return (
    <Container>
      <PageHeader
        eyebrow="Council operations"
        title="Empty homes map"
        description="Operational view for authorised council users: cluster cases by postcode, empty period, case status, funding fit and delivery readiness. Private owner identity is never exposed on public map views."
      />

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        <MapPinned className="size-4 shrink-0 text-accent" />
        The interactive map layer is pending. In the meantime, geolocated cases with evidence
        coordinates are listed below.
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : isError ? (
          <div className="col-span-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Couldn't load geolocated cases. Please try again shortly.
          </div>
        ) : data && data.length > 0 ? (
          data.map((item) => (
            <Card key={item.id} className="shadow-card">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Case {item.case_id.slice(0, 8)}</CardTitle>
                {item.cases?.status ? (
                  <Badge variant="secondary">{item.cases.status}</Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="size-3.5 text-accent" />
                  {item.cases?.properties?.postcode ?? "Postcode withheld"}
                </p>
                <p className="text-muted-foreground">
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </p>
                {item.cases?.properties?.empty_since ? (
                  <p className="text-xs text-muted-foreground">
                    Empty since {new Date(item.cases.properties.empty_since).toLocaleDateString()}
                  </p>
                ) : null}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" /> Owner identity withheld
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center">
            <MapPinned className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No geolocated cases are available yet. Coordinates appear once evidence capture is
              geotagged.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
