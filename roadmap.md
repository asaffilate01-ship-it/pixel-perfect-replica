# DOMUREVA port — Next.js → TanStack Start + Lovable Cloud

## Foundations
- [x] Enable Lovable Cloud
- [ ] Apply all 7 SQL migrations (schema, RLS, grants)
- [ ] Brand assets: logo + app icon via lovable-assets; favicon
- [ ] Design system in src/styles.css from brand board (navy #0d2b3e, teal #1f7f92, greens #5aab3f/#9ed36a, amber #f0b429, stone)
- [ ] Root layout: topbar + nav + head metadata

## Domain logic (port ~verbatim)
- [ ] lib/funding, lib/agents, lib/application-pack, lib/applications
- [ ] lib/integrations (+ job queue, webhook store, provenance)
- [ ] lib/security, lib/billing, lib/reports, lib/workflow, lib/national
- [ ] lib/notifications, lib/payments
- [ ] Supabase server/admin client adapters + auth helpers

## API (Next route handlers → TanStack server routes / server fns)
- [ ] workflow, funding, application-pack, cases, contracts, quotes
- [ ] integrations + webhooks (public routes, signature verified)
- [ ] payments, notifications, privacy, reports, review, release, billing, agent

## Pages (app/*/page.tsx → src/routes)
- [ ] Public: /, /login, /auth callback, /legal/*
- [ ] Core: dashboard, properties/new, cases/$id, funding, funding/stack,
      applications, application-pack, projects, opportunities, notifications
- [ ] Council: council, cases, map, analytics, reporting
- [ ] Providers/contractors: providers, pipeline, provider/offers, contractors, profile
- [ ] Admin: integrations, release, security; review; copilot; settings/privacy

## Finish
- [ ] Per-route head() metadata
- [ ] Build green, preview verified
