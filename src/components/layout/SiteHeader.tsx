import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const PLATFORM_LINKS = [
  { to: "/funding", label: "Funding", copy: "Reviewed grants, loans and funding routes" },
  { to: "/applications", label: "Applications", copy: "Build evidence-backed application packs" },
  { to: "/opportunities", label: "Opportunities", copy: "Empty homes and delivery opportunities" },
  { to: "/projects", label: "Projects", copy: "Manage restoration through to occupation" },
] as const;

const AUDIENCE_LINKS = [
  { to: "/properties/new", label: "Property owners" },
  { to: "/council", label: "Councils" },
  { to: "/providers", label: "Housing providers" },
  { to: "/contractors", label: "Contractors" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[82px] max-w-[1240px] items-center justify-between gap-6 px-5 lg:px-7">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-semibold text-foreground/75 lg:flex">
          <a href="/#how-it-works" className="rounded-full px-4 py-2 transition-colors hover:bg-secondary hover:text-primary">How it works</a>
          <div className="relative" onMouseEnter={() => setPlatformOpen(true)} onMouseLeave={() => setPlatformOpen(false)}>
            <button type="button" onClick={() => setPlatformOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-full px-4 py-2 transition-colors hover:bg-secondary hover:text-primary" aria-expanded={platformOpen}>Platform <ChevronDown className="size-4" /></button>
            {platformOpen ? (
              <div className="absolute left-1/2 top-full w-[610px] -translate-x-1/2 pt-3">
                <div className="grid grid-cols-2 gap-2 rounded-3xl border border-border bg-card p-3 shadow-lift">
                  {PLATFORM_LINKS.map((item) => (
                    <Link key={item.to} to={item.to} className="rounded-2xl p-4 transition-colors hover:bg-secondary">
                      <span className="block font-display text-base font-bold text-primary">{item.label}</span>
                      <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{item.copy}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <a href="/#who-we-help" className="rounded-full px-4 py-2 transition-colors hover:bg-secondary hover:text-primary">Who we help</a>
          <a href="/#reva" className="rounded-full px-4 py-2 transition-colors hover:bg-secondary hover:text-primary">Reva AI</a>
          <a href="/#impact" className="rounded-full px-4 py-2 transition-colors hover:bg-secondary hover:text-primary">Impact</a>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
          <Button asChild size="sm" className="rounded-full bg-amber px-5 text-amber-foreground hover:bg-amber/90"><Link to="/properties/new">Check a property</Link></Button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="grid size-11 place-items-center rounded-full border border-border bg-card lg:hidden" aria-label="Toggle navigation" aria-expanded={open}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {open ? (
        <div className="border-t border-border bg-background px-5 py-5 lg:hidden">
          <nav className="mx-auto grid max-w-[1240px] gap-1 text-sm font-semibold">
            <a href="/#how-it-works" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 hover:bg-secondary">How it works</a>
            {PLATFORM_LINKS.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 hover:bg-secondary">{item.label}</Link>)}
            <div className="my-2 border-t border-border" />
            {AUDIENCE_LINKS.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 hover:bg-secondary">{item.label}</Link>)}
            <div className="mt-3 grid grid-cols-2 gap-2"><Button asChild variant="outline"><Link to="/login">Sign in</Link></Button><Button asChild className="bg-amber text-amber-foreground"><Link to="/properties/new">Check property</Link></Button></div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
