import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type CallbackSearch = { next?: string };

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>): CallbackSearch => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Signing you in | DOMUREVA" },
      { name: "description", content: "Completing your secure DOMUREVA sign-in." },
      { property: "og:title", content: "Signing you in | DOMUREVA" },
      { property: "og:description", content: "Completing your secure DOMUREVA sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const { data, error: err } = await supabase.auth.getSession();
      if (cancelled) return;
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        navigate({ to: next ?? "/dashboard", replace: true });
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session && !cancelled) navigate({ to: next ?? "/dashboard", replace: true });
    });

    void finish();
    const timer = window.setTimeout(() => {
      if (!cancelled) setError("This sign-in link has expired or was already used.");
    }, 6000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate, next]);

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-hero px-5">
      <div className="rounded-3xl border border-border bg-card px-8 py-10 text-center shadow-lift">
        <h1 className="font-display text-xl font-bold text-primary">
          {error ? "We couldn't sign you in" : "Signing you in…"}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {error || "Hold tight while we verify your secure link."}
        </p>
        {error ? (
          <a
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Request a new link
          </a>
        ) : null}
      </div>
    </main>
  );
}
