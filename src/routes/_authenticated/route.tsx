import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login", search: { next: pathname }, replace: true });
    }
  }, [loading, session, navigate, pathname]);

  if (loading || !session) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-[1180px] items-center justify-center px-5 py-24">
          <p className="text-sm text-muted-foreground">Checking your DOMUREVA session…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}
