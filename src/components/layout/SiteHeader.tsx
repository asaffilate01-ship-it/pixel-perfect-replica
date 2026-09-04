import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/funding", label: "Funding" },
  { to: "/applications", label: "Applications" },
  { to: "/projects", label: "Projects" },
  { to: "/opportunities", label: "Opportunities" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between gap-6 px-5">
        <Logo />

        <nav className="hidden items-center gap-7 text-sm font-semibold text-foreground/80 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-accent [&.active]:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-amber text-amber-foreground hover:bg-amber/90">
            <Link to="/properties/new">Check a property</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg border border-border md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-card px-5 py-4 md:hidden">
          <nav className="grid gap-3 text-sm font-semibold">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
