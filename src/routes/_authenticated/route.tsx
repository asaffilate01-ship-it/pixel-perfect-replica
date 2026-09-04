import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (loading || session || redirected.current) return;
    redirected.current = true;
    const next = `${window.location.pathname}${window.location.search}`;
    navigate({ to: "/login", search: { next }, replace: true });
  }, [loading, session, navigate]);

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
