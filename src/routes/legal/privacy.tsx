import { Link, createFileRoute } from "@tanstack/react-router";

import { Container, PageHeader, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy notice | DOMUREVA" },
      {
        name: "description",
        content:
          "How DOMUREVA collects, uses, shares and protects personal data across empty home cases, funding applications and evidence records.",
      },
      { property: "og:title", content: "Privacy notice | DOMUREVA" },
      {
        property: "og:description",
        content: "How DOMUREVA handles your personal data and your UK GDPR rights.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "Who we are",
    body: "DOMUREVA is the data controller for the platform that helps owners, councils, contractors and housing providers bring empty homes back into use.",
  },
  {
    title: "What we collect",
    body: "Account details, property and case records, funding application answers, uploaded evidence documents, quotes and contract records, and technical logs needed to keep the service secure.",
  },
  {
    title: "Why we use it",
    body: "To assess funding eligibility against human-reviewed scheme rules, coordinate assessments and works, share the minimum necessary information with the administering authority, and maintain an auditable evidence trail.",
  },
  {
    title: "Who we share it with",
    body: "Administering authorities and funders you apply to, contractors and housing providers you engage, and our verified processing partners for discovery, retrofit assessment, contractor sourcing and evidence verification.",
  },
  {
    title: "How long we keep it",
    body: "Case and evidence records are retained for the period required by the relevant funding scheme audit obligations, then deleted or anonymised.",
  },
  {
    title: "Your rights",
    body: "You can request access, rectification, erasure, restriction or portability of your data at any time. We respond within one month.",
  },
];

function PrivacyPage() {
  return (
    <PageShell>
      <Container className="max-w-[820px]">
        <PageHeader
          eyebrow="Trust"
          title="Privacy notice"
          description="How DOMUREVA collects, uses and protects personal data."
        />
        <div className="mt-8 grid gap-7">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-lg font-bold text-primary">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-primary">Exercise your rights</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit and track a data request from your account.
          </p>
          <Link
            to="/settings/privacy"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Open privacy settings
          </Link>
        </div>
      </Container>
    </PageShell>
  );
}
