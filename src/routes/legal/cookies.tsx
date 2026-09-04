import { createFileRoute } from "@tanstack/react-router";

import { Container, PageHeader, PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie policy | DOMUREVA" },
      {
        name: "description",
        content:
          "The cookies and local storage DOMUREVA uses for secure sign-in, session continuity and service reliability.",
      },
      { property: "og:title", content: "Cookie policy | DOMUREVA" },
      {
        property: "og:description",
        content: "Which cookies DOMUREVA sets, why they exist and how to control them.",
      },
    ],
  }),
  component: CookiesPage,
});

const COOKIES = [
  {
    name: "Authentication session",
    purpose: "Keeps you signed in securely between visits and protects your case records.",
    type: "Strictly necessary",
  },
  {
    name: "Security tokens",
    purpose: "Protects form submissions and server actions against cross-site request forgery.",
    type: "Strictly necessary",
  },
  {
    name: "Interface preferences",
    purpose: "Remembers layout and notification choices you set inside the platform.",
    type: "Functional",
  },
];

function CookiesPage() {
  return (
    <PageShell>
      <Container className="max-w-[820px]">
        <PageHeader
          eyebrow="Trust"
          title="Cookie policy"
          description="DOMUREVA uses a small number of cookies. We do not run advertising trackers."
        />

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="px-5 py-3 font-semibold text-primary">Cookie</th>
                <th className="px-5 py-3 font-semibold text-primary">Purpose</th>
                <th className="px-5 py-3 font-semibold text-primary">Type</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.name} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{c.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{c.purpose}</td>
                  <td className="px-5 py-4 text-muted-foreground">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          You can clear or block cookies in your browser settings. Blocking the strictly necessary
          cookies will prevent you from signing in.
        </p>
      </Container>
    </PageShell>
  );
}
