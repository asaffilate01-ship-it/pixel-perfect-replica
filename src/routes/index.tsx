import { Link, createFileRoute } from "@tanstack/react-router";
import { BarChart3, Coins, Home, Leaf, Search, Sprout, Users, Wrench } from "lucide-react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DOMUREVA | Bringing empty homes back to life" },
      {
        name: "description",
        content:
          "DOMUREVA finds empty homes, matches verified funding, assesses retrofit, sources trusted contractors and preserves the evidence trail to occupation.",
      },
      { property: "og:title", content: "DOMUREVA | Bringing empty homes back to life" },
      {
        property: "og:description",
        content:
          "Find, fund, restore and verify empty home projects with human-reviewed funding rules and a complete audit trail.",
      },
    ],
  }),
  component: Home_,
});

const JOURNEY = [
  { icon: Search, label: "Find", copy: "Discover empty homes and live funding routes." },
  { icon: Coins, label: "Fund", copy: "Match human-reviewed grant and loan schemes." },
  { icon: Wrench, label: "Restore", copy: "Assess, retrofit and appoint verified contractors." },
  { icon: Home, label: "Home", copy: "Prove completion and return the home to use." },
];

const AGENTS = [
  {
    name: "Reva Discover",
    copy: "LeadLens-powered scheme, provider and property opportunity discovery.",
  },
  {
    name: "Reva Fund",
    copy: "Evidence-backed eligibility matching against human-reviewed rules only.",
  },
  { name: "Reva Match", copy: "Craftvaro contractor and housing-provider matching and ranking." },
  { name: "Reva Verify", copy: "Dokuvera evidence, certificates, audit trail and completion proof." },
];

const PILLARS = [
  { icon: Leaf, title: "Sustainable homes", copy: "Retrofit-first plans with an EPC improvement roadmap." },
  { icon: Users, title: "Stronger communities", copy: "Homes returned to owners, tenants and local families." },
  { icon: Sprout, title: "Greener futures", copy: "Measured carbon improvement on every completed project." },
  { icon: BarChart3, title: "Real impact", copy: "Council-grade reporting on homes, bedrooms and funding." },
];

function Home_() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-[1180px] px-5 pt-8">
        <div className="overflow-hidden rounded-[28px] bg-gradient-hero px-7 py-14 text-navy-foreground shadow-lift md:px-14 md:py-20">
          <span className="inline-flex rounded-full bg-navy-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-leaf-soft">
            AI-powered empty homes platform
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] font-bold md:text-6xl">
            Bringing empty homes <span className="text-leaf-soft">back to life.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-navy-foreground/75 md:text-lg">
            Discover opportunities, identify verified funding routes, assess the property, source
            trusted contractors, manage retrofit and preserve the evidence trail from first
            inspection to occupation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-amber text-amber-foreground hover:bg-amber/90">
              <Link to="/properties/new">Check a property</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-navy-foreground/25 bg-transparent text-navy-foreground hover:bg-navy-foreground/10"
            >
              <Link to="/funding">Explore funding</Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ icon: Icon, label, copy }) => (
              <div
                key={label}
                className="rounded-2xl border border-navy-foreground/12 bg-navy-foreground/6 p-5"
              >
                <Icon className="size-5 text-leaf-soft" />
                <p className="mt-3 font-display text-lg font-bold">{label}.</p>
                <p className="mt-1 text-sm text-navy-foreground/70">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-16">
        <p className="eyebrow text-accent">The Reva agents</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold text-primary">
          Seven specialist agents, one auditable case file.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => (
            <article
              key={agent.name}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <h3 className="font-display text-lg font-bold text-primary">{agent.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{agent.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-14 md:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, copy }) => (
            <div key={title}>
              <Icon className="size-6 text-leaf" />
              <h3 className="mt-3 font-display text-base font-bold text-primary">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 py-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-border bg-gradient-brand px-8 py-10 text-navy-foreground">
          <div>
            <h2 className="font-display text-2xl font-bold">More than properties. Possibilities.</h2>
            <p className="mt-2 max-w-xl text-sm text-navy-foreground/80">
              Start a case in minutes and see which verified schemes your property qualifies for.
            </p>
          </div>
          <Button asChild size="lg" className="bg-navy text-navy-foreground hover:bg-navy/90">
            <Link to="/properties/new">Start a case</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
