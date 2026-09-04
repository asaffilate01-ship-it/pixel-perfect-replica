# DOMUREVA port conventions (TanStack Start + Lovable Cloud)

Source of truth for the original Next.js app: `/tmp/dz` (read-only reference).
Original pages: `/tmp/dz/app/**/page.tsx`. Original API routes: `/tmp/dz/app/api/**/route.ts`.
Original libs already ported to `src/lib/domureva/` (import from there, do NOT re-copy `/tmp/dz/lib`).

## Hard rules

- Project root is `/dev-server`. Write files with the write tool, never shell redirection.
- Never edit: `src/routeTree.gen.ts`, `src/integrations/supabase/*`, `src/styles.css`, `src/routes/__root.tsx`,
  `src/components/layout/*`, `src/components/brand/*`, `src/hooks/useAuth.tsx`, `src/routes/_authenticated/route.tsx`,
  `src/routes/index.tsx`, `src/routes/login.tsx`, `PORTING.md`.
- No Next.js APIs. No `next/*`, no `NextRequest`, no `app/` directory, no `react-helmet`.
- TypeScript is strict with `noPropertyAccessFromIndexSignature` and `exactOptionalPropertyTypes`.
  Use `process.env['NAME']` bracket syntax. Optional object types need `foo?: string | undefined`.
  Index access on arrays needs `!` or a guard.

## Pages

File-based routing in `src/routes/`. Authenticated pages live under `src/routes/_authenticated/`
(the gate + `PageShell` chrome is already applied by the parent — do NOT render `PageShell`,
`SiteHeader` or `SiteFooter` inside an authenticated page). Public pages sit at the top level and
DO wrap their content in `<PageShell>`.

Route path mapping: `app/cases/[id]/page.tsx` -> `src/routes/_authenticated/cases/$caseId.tsx`.
Index of a section: `src/routes/_authenticated/cases/index.tsx`.

Every page file:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHeader } from "@/components/layout/PageShell";

export const Route = createFileRoute("/_authenticated/cases/")({
  head: () => ({
    meta: [
      { title: "Cases | DOMUREVA" },
      { name: "description", content: "<unique, <160 chars>" },
      { property: "og:title", content: "Cases | DOMUREVA" },
      { property: "og:description", content: "<unique>" },
    ],
  }),
  component: CasesPage,
});
```

Data loading: `useQuery` from `@tanstack/react-query` calling either the browser Supabase client
(`import { supabase } from "@/integrations/supabase/client"`) or a server function. Do NOT use
route `loader` for anything requiring auth. Mutations: `useMutation` + `toast` from `sonner`.

## UI

shadcn components in `@/components/ui/*` (button, card, input, label, textarea, select, table,
badge, tabs, dialog, skeleton, separator, sonner, etc. — check the directory before importing).
Icons from `lucide-react`.

Use ONLY semantic tokens — never `text-white`, `bg-black`, or hex classes. Available brand tokens:
`bg-navy text-navy-foreground`, `bg-teal`, `text-accent` (teal), `bg-leaf`, `text-leaf-soft`,
`bg-amber text-amber-foreground`, `bg-stone`, plus standard `primary/secondary/muted/card/border/
destructive/success/warning`. Utilities: `bg-gradient-hero`, `bg-gradient-brand`, `shadow-card`,
`shadow-lift`, `eyebrow`, fonts `font-display` (Outfit) and default sans (Figtree).

Layout helpers: `Container`, `PageHeader({eyebrow,title,description,actions})`,
`StatCard({label,value,hint,icon})` from `@/components/layout/PageShell`.

Every list view needs: loading skeleton, empty state with a CTA, and an error message.

## API routes

`app/api/foo/bar/route.ts` -> `src/routes/api/foo/bar.ts` using:

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/foo/bar")({
  server: {
    handlers: {
      POST: async ({ request }) => { /* ... */ return Response.json({ ok: true }); },
    },
  },
});
```

Externally-called endpoints (webhooks, health, cron) go under `src/routes/api/public/...` and MUST
verify their own caller (HMAC signature via `@/lib/domureva/security/webhook`).

Server-side Supabase: `const { supabaseAdmin } = await import("@/integrations/supabase/client.server")`
inside the handler (never at module scope in a file the client could reach).
For user-scoped API routes, read the `Authorization: Bearer` header and verify it with
`supabaseAdmin.auth.getUser(token)`, returning 401 when absent/invalid.

Validate every body/query with `zod`. Return `Response.json(data, { status })`.
Never leak secrets in responses or logs.

## Database

Tables and columns are already migrated — check the generated types in
`src/integrations/supabase/types.ts` before writing a query. If a column does not exist there,
adapt the query rather than inventing a schema change.
