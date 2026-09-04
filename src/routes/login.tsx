import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type LoginSearch = { next?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    next: typeof search["next"] === "string" ? search["next"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in | DOMUREVA" },
      {
        name: "description",
        content:
          "Secure passwordless sign-in to DOMUREVA for property owners, contractors, councils and housing providers.",
      },
      { property: "og:title", content: "Sign in | DOMUREVA" },
      { property: "og:description", content: "Secure passwordless access to your DOMUREVA cases." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const redirect = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-hero px-5 py-16">
      <section className="w-full max-w-[480px] rounded-3xl border border-border bg-card p-8 shadow-lift md:p-10">
        <Logo />
        <h1 className="mt-7 font-display text-2xl font-bold text-primary">Sign in to DOMUREVA</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Secure passwordless access for owners, contractors, councils and housing providers.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
            Check your email for the secure sign-in link.
          </div>
        ) : (
          <form onSubmit={login} className="mt-6 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.co.uk"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="mt-1 bg-amber text-amber-foreground hover:bg-amber/90"
            >
              {busy ? "Sending…" : "Email me a sign-in link"}
            </Button>
            {error ? (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </form>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/legal/privacy" className="font-semibold text-accent underline">
            privacy notice
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
