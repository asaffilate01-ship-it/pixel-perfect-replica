import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Coins,
  FileCheck2,
  Home,
  Leaf,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
  Wrench,
} from "lucide-react";

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
  { icon: Search, label: "Find", copy: "Identify the property, authority, opportunity and relevant support." },
  { icon: Coins, label: "Fund", copy: "Match reviewed grants, loans and compatible funding routes." },
  { icon: Wrench, label: "Restore", copy: "Assess works, plan retrofit and appoint trusted delivery partners." },
  { icon: Home, label: "Home", copy: "Evidence completion and return the property to meaningful use." },
];

const SUPPORT = [
  { icon: Search, n: "01", title: "Opportunity discovery", copy: "LeadLens continuously finds funding, provider and delivery opportunities relevant to each case." },
  { icon: Coins, n: "02", title: "Funding intelligence", copy: "Reva Fund compares reviewed rules against verified property facts and explains every match or gap." },
  { icon: Leaf, n: "03", title: "Retrofit planning", copy: "Gabley Retrofit supports EPC-led measures, costed plans and smarter energy improvement pathways." },
  { icon: Users, n: "04", title: "Delivery network", copy: "Craftvaro connects suitable projects with verified contractors and housing-provider routes." },
  { icon: FileCheck2, n: "05", title: "Evidence & compliance", copy: "Dokuvera keeps documents, site evidence, certificates and completion proof together." },
  { icon: BarChart3, n: "06", title: "Impact reporting", copy: "Councils and providers can measure funding, homes returned, bedrooms created and delivery speed." },
];

const AUDIENCES = [
  { icon: Home, title: "Property owners", copy: "Understand the route from empty property to funded, managed restoration.", to: "/properties/new", cta: "Check your property" },
  { icon: Building2, title: "Councils", copy: "Prioritise cases, review schemes, coordinate delivery and evidence public value.", to: "/council", cta: "Explore council tools" },
  { icon: Users, title: "Housing providers", copy: "Find suitable lease-and-repair and purchase-and-repair opportunities.", to: "/providers", cta: "View provider pipeline" },
  { icon: Wrench, title: "Contractors", copy: "Receive matched refurbishment opportunities and manage quotes through to completion.", to: "/contractors", cta: "See contractor journey" },
] as const;

const TRUST = [
  "Human-reviewed funding rules",
  "Source provenance on material decisions",
  "Evidence-gated project milestones",
  "Role-based access and audit trails",
];

function Home_() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-[1240px] px-5 pb-16 pt-6 lg:px-7 lg:pb-24 lg:pt-10">
        <div className="relative overflow-hidden rounded-[34px] bg-gradient-hero px-7 py-14 text-navy-foreground shadow-lift md:px-12 md:py-20 lg:px-16 lg:py-24">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-leaf/15 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 size-80 rounded-full bg-amber/10 blur-3xl" />
          <div className="relative grid items-end gap-12 lg:grid-cols-[1.45fr_.75fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/15 bg-navy-foreground/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-leaf-soft">
                <Sparkles className="size-3.5" /> AI-powered empty homes platform
              </span>
              <h1 className="mt-7 max-w-4xl font-display text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.045em]">
                Empty today.
                <span className="block text-leaf-soft">Home tomorrow.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-navy-foreground/74 md:text-lg">
                DOMUREVA brings discovery, funding, retrofit, contractors, evidence and delivery into one auditable journey — so more empty properties can become useful homes again.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-amber px-6 text-amber-foreground hover:bg-amber/90">
                  <Link to="/properties/new">Check a property <ArrowRight className="ml-1 size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-navy-foreground/25 bg-transparent px-6 text-navy-foreground hover:bg-navy-foreground/10">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-3xl border border-navy-foreground/12 bg-navy-foreground/6 p-5 backdrop-blur-sm">
              <p className="eyebrow text-leaf-soft">One connected case file</p>
              {TRUST.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-navy-foreground/10 bg-navy-foreground/5 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf-soft" />
                  <span className="text-sm text-navy-foreground/82">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-[1240px] px-5 py-16 lg:px-7 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-accent">How DOMUREVA works</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight text-primary md:text-5xl">
              One route from vacancy to value.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Instead of sending owners and officers between disconnected websites, spreadsheets and suppliers, DOMUREVA coordinates the entire journey around one property record.
            </p>
          </div>
          <div className="grid border-t border-border">
            {JOURNEY.map(({ icon: Icon, label, copy }, index) => (
              <div key={label} className="grid gap-4 border-b border-border py-7 sm:grid-cols-[70px_1fr_auto] sm:items-center">
                <div className="font-display text-sm font-bold text-muted-foreground">0{index + 1}</div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary">{label}.</h3>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
                <div className="grid size-12 place-items-center rounded-full bg-secondary"><Icon className="size-5 text-accent" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reva" className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-[1240px] px-5 py-18 lg:px-7 lg:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow text-leaf-soft">The intelligence behind the journey</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Everything behind the empty home.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-navy-foreground/68">
              Reva coordinates specialist agents and connected services around each case, while material funding rules remain human-reviewed and auditable.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-navy-foreground/10 md:grid-cols-2 lg:grid-cols-3">
            {SUPPORT.map(({ icon: Icon, n, title, copy }) => (
              <article key={title} className="group bg-navy p-7 transition-colors hover:bg-navy-foreground/5 lg:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.18em] text-leaf-soft">{n}</span>
                  <Icon className="size-5 text-navy-foreground/55 transition-transform group-hover:-translate-y-1" />
                </div>
                <h3 className="mt-8 font-display text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-navy-foreground/65">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="who-we-help" className="mx-auto w-full max-w-[1240px] px-5 py-16 lg:px-7 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow text-accent">Built around the people doing the work</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-primary md:text-5xl">
              Different users. One stronger route back to occupation.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Each role sees the tools, evidence and actions relevant to them, while the property remains the shared source of truth.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {AUDIENCES.map(({ icon: Icon, title, copy, to, cta }) => (
            <article key={title} className="group rounded-3xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift lg:p-9">
              <div className="flex items-start justify-between gap-5">
                <div className="grid size-12 place-items-center rounded-2xl bg-secondary"><Icon className="size-5 text-accent" /></div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-8 font-display text-2xl font-bold text-primary">{title}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{copy}</p>
              <Link to={to} className="mt-7 inline-flex text-sm font-bold text-accent">{cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section id="impact" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 lg:grid-cols-[.85fr_1.15fr] lg:px-7 lg:py-24">
          <div>
            <p className="eyebrow text-accent">Designed for measurable outcomes</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary md:text-5xl">
              Not just activity. Real impact.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              DOMUREVA is designed to show what happened after a case was opened — where funding went, what work was completed and whether a home returned to use.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [ShieldCheck, "Reviewed", "Material funding-rule changes remain quarantined until an authorised human review."],
              [FileCheck2, "Evidenced", "Documents, milestones, certificates and source provenance stay attached to the case."],
              [Sprout, "Improved", "Retrofit measures and EPC-led improvements can be tracked alongside restoration."],
              [BarChart3, "Measured", "Councils and providers can report homes returned, funding deployed and delivery performance."],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof ShieldCheck;
              return <div key={String(title)} className="rounded-3xl border border-border bg-background p-6"><I className="size-5 text-leaf" /><h3 className="mt-5 font-display text-xl font-bold text-primary">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(copy)}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-5 py-16 lg:px-7 lg:py-24">
        <div className="overflow-hidden rounded-[32px] bg-gradient-brand px-7 py-10 text-navy-foreground md:px-10 md:py-14 lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div>
            <p className="eyebrow text-navy-foreground/65">Ready when the property is</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight md:text-4xl">Find the route back to use.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-navy-foreground/75">Start with the property. DOMUREVA will help organise the funding, evidence and delivery journey around it.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0">
            <Button asChild size="lg" className="rounded-full bg-navy px-6 text-navy-foreground hover:bg-navy/90"><Link to="/properties/new">Check a property</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-navy/20 bg-transparent px-6 text-navy hover:bg-navy/5"><Link to="/login">Sign in</Link></Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
