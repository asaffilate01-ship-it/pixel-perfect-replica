import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileStack, Handshake } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";
import { WorkspaceNav } from "@/components/workspace/WorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/provider/offers")({
  head: () => ({ meta: [{ title: "Provider offers | DOMUREVA" }] }),
  component: ProviderOffersPage,
});

const TYPES: Record<string, string> = {
  lease_repair: "Lease & repair",
  purchase_repair: "Purchase & repair",
  management: "Management proposal",
};

function ProviderOffersPage() {
  const queryClient = useQueryClient();
  const offers = useQuery({
    queryKey: ["provider", "offers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("provider_offers")
        .select("id,offer_type,status,opportunity_id,updated_at")
        .order("updated_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const withdraw = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to manage offers.");
      const response = await fetch("/api/provider-offers/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ offerId, action: "withdraw" }),
      });
      const json = await response.json() as { status?: string; error?: string };
      if (!response.ok) throw new Error(json.error ?? "Offer could not be withdrawn.");
      return json;
    },
    onSuccess: () => {
      toast.success("Offer withdrawal recorded.");
      void queryClient.invalidateQueries({ queryKey: ["provider", "offers"] });
    },
    onError: (error: Error) => toast.error("Could not withdraw offer", { description: error.message }),
  });

  return (
    <Container className="pt-7">
      <WorkspaceNav />
      <PageHeader
        eyebrow="Provider proposals"
        title="Keep every offer accountable."
        description="Monitor saved lease-and-repair, purchase-and-repair and management proposals from organisations you can access. A recorded acceptance is not a signed contract."
        actions={<Button asChild className="rounded-full" variant="outline"><Link to="/opportunities">View opportunities</Link></Button>}
      />
      <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-6">
          <h2 className="font-display text-xl font-semibold text-primary">Recorded offers</h2>
          <p className="mt-2 text-sm text-muted-foreground">Only offers permitted by the database's organisation policies are shown.</p>
        </div>
        {offers.isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> :
          offers.isError ? <div className="p-8 text-center" role="alert">
            <p className="text-sm text-destructive">Offers could not be loaded.</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => void offers.refetch()}>Retry</Button>
          </div> : offers.data?.length ? <ul className="divide-y divide-border">
            {offers.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div className="flex items-start gap-3">
                  <Handshake className="mt-1 size-5 text-accent" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-primary">{TYPES[item.offer_type] ?? item.offer_type}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Offer {item.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Opportunity {item.opportunity_id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize">{item.status.replace(/_/g, " ")}</Badge>
                  {["draft", "submitted", "countered"].includes(item.status) ? (
                    <Button type="button" variant="outline" size="sm" disabled={withdraw.isPending}
                      onClick={() => {
                        if (window.confirm("Withdraw this provider offer? The action will be logged.")) withdraw.mutate(item.id);
                      }}>
                      Withdraw
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul> : <div className="p-12 text-center">
            <FileStack className="mx-auto size-9 text-accent" aria-hidden="true" />
            <h3 className="mt-4 font-display text-xl font-semibold text-primary">No provider offers recorded</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Offers will appear when they are created and made available to your organisation.</p>
            <Button asChild className="mt-5 rounded-full"><Link to="/opportunities">Review opportunities</Link></Button>
          </div>}
      </section>
    </Container>
  );
}
