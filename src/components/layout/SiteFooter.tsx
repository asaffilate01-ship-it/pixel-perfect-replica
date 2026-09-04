import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Logo } from "@/components/brand/Logo";

const PLATFORM = [
  ["Funding", "/funding"],
  ["Applications", "/applications"],
  ["Projects", "/projects"],
  ["Opportunities", "/opportunities"],
] as const;

const USERS = [
  ["Property owners", "/properties/new"],
  ["Councils", "/council"],
  ["Housing providers", "/provider/offers"],
  ["Contractors", "/contractors"],
] as const;

const TRUST = [
  ["Privacy", "/legal/privacy"],
  ["Cookies", "/legal/cookies"],
  ["Your data", "/settings/privacy"],
  ["Rule review", "/review"],
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-navy text-navy-foreground">
      <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-7 lg:py-18">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_.65fr_.65fr_.65fr]">
          <div>
            <div className="inline-flex rounded-2xl bg-background px-4 py-2">
              <Logo className="[&_img]:h-10 md:[&_img]:h-10" />
            </div>
            <p className="mt-6 max-w-md font-display text-2xl font-bold leading-tight">Bringing empty homes back to life.</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-navy-foreground/62">One connected platform for discovery, funding, retrofit, delivery, evidence and measurable outcomes.</p>
            <Link to="/properties/new" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-leaf-soft">Check a property <ArrowUpRight className="size-4" /></Link>
          </div>
          <FooterGroup title="Platform" links={PLATFORM} />
          <FooterGroup title="Who we help" links={USERS} />
          <FooterGroup title="Trust" links={TRUST} />
        </div>
        <div className="mt-14 grid gap-5 border-t border-navy-foreground/10 pt-7 text-xs text-navy-foreground/48 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p>© {new Date().getFullYear()} DOMUREVA. All rights reserved.</p>
            <p className="mt-2 max-w-3xl leading-5">Funding matches and estimates are guidance only. Final eligibility and awards remain subject to the administering authority’s rules, review and decision.</p>
          </div>
          <p className="font-semibold uppercase tracking-[0.14em]">Find · Fund · Restore · Home</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div className="text-sm">
      <h2 className="eyebrow text-leaf-soft">{title}</h2>
      <ul className="mt-5 grid gap-3 text-navy-foreground/70">
        {links.map(([label, to]) => <li key={label}><a href={to} className="transition-colors hover:text-navy-foreground">{label}</a></li>)}
      </ul>
    </div>
  );
}
