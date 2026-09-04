import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, FileStack, Hammer, ShieldCheck } from "lucide-react";

import { Container, PageHeader } from "@/components/layout/PageShell";

export const Route = createFileRoute("/_authenticated/application-pack")({
  head: () => ({
    meta: [
      { title: "Application pack | DOMUREVA" },
      {
        name: "description",
        content: "Build a submission-ready funding application pack from reviewed rules and verified evidence.",
      },
      { property: "og:title", content: "Application pack | DOMUREVA" },
      { property: "og:description", content: "Eligibility, evidence, works and audit trail in one pack." },
    ],
  }),
  component: ApplicationPackPage,
});

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: "1. Eligibility",
    body: "Reviewed scheme rules, matched facts, exceptions and source links.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Property evidence",
    body: "Ownership, vacancy evidence, photographs, EPC, surveys and quotations.",
  },
  {
    icon: Hammer,
    title: "3. Works & funding stack",
    body: "Costed works with proposed funding allocations and owner contribution.",
  },
  {
    icon: FileStack,
    title: "4. Audit manifest",
    body: "Hashes, source timestamps and verification status for every pack item.",
  },
];

function ApplicationPackPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Application pack"
        title="Application pack"
        description="Build a submission-ready pack from reviewed funding rules, property facts and verified evidence."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <section.icon className="size-5 text-accent" />
            <h2 className="mt-3 font-display text-lg font-bold text-primary">{section.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
