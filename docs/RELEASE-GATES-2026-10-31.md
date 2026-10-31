# DOMUREVA — build verification and production release gates

Updated: 31 October 2026. This document describes the upgrade branch, not a claim that production is ready.

## Verified in GitHub CI

- Bun unit tests: funding scheme dates, pence-safe allocation/rate caps, authorisation role matrix, Stripe signature validation, evidence-format validation, safe API errors.
- TanStack/Vite production build and generated routes.
- Strict TypeScript checks after generation, plus incremental non-format lint.
- Review branch is attached to PR #3; no changes have been merged into Lovable-connected `main`.

## Core improvements on this branch

- Reva's server-side case context, conversation ownership, safer message limits and app UX.
- Genuine case and opportunity search, provider pipeline, applications readiness, costed-work intake, preliminary funding stack, case audit preview and JSON evidence manifest export.
- Case-scoped and action-specific permissions for privileged Supabase operations.
- No authenticated user may supply fake approved funding, paid balance or completed-contract amount through the financial-estimates endpoint.
- Stripe signature enforcement with timestamp freshness and failure-aware billing event writes.
- Dokuvera, Craftvaro, Gabley and LeadLens webhooks now validate payloads more strictly and fail closed if persistence fails. Inbound callbacks no longer assume unconfigured uniqueness constraints for external evidence and quote IDs.
- LeadLens drafts new schemes and queues changes to reviewed/retired rules for human review.
- Date-bounded funding matching filters expired/future schemes, invalidates obsolete matches, and does not regress advanced project stages.
- Global funding-rule and release controls require `DOMUREVA_PLATFORM_ADMIN_USER_IDS`, a server-only comma-separated allowlist of authorised operator UUIDs. Organisation-scoped admin membership is **not** sufficient.

## Hard release blockers (not yet verified)

1. **Domureva Supabase project connection.** Only the user's separately named DISHBEE project was discoverable through connected Supabase; no DOMUREVA database was inspected or modified live. Check schema migrations, table constraints, project secrets and permissions on Domureva specifically.
2. **Live role/RLS tests.** Test unrelated owners, case members, external contractors, provider organisations, council officers and platform admins against each API. Ensure service-role bypass is always preceded by case/organisation checks. Run DB security advisors.
3. **Private evidence storage.** Set `DOMUREVA_EVIDENCE_BUCKET` to a private bucket and test genuine uploads, size/MIME checks, object deletion on metadata failures, limits and retention. Connect malware scanning and authorised verification before treating a document as checked.
4. **Signed integration contracts.** Test webhooks from real Dokuvera/Craftvaro/Gabley/LeadLens. Ensure provider signing secrets and retry behaviour match both parties. Callback idempotency currently spans multiple table writes without a database transaction, and the existing schema lacks unique constraints on external evidence and quote identifiers; add and test suitable unique indexes/migrations in the Domureva project before high-volume production.
5. **Funding rule confidence.** Postcode-to-local-authority resolution, scheme geography and authority scope, official source freshness, eligible works, subsidy/double-funding restrictions and per-scheme contribution rates require formal verification. The model explicitly returns a **preliminary estimate**, never an award. The current scheme schema has no contribution-rate field; a 100% illustrative ceiling is therefore not a lawful funding promise.
6. **Application packs.** JSON audit manifest download is real. Authenticated generated PDF, malware-checked evidence attachments, e-signatures and authority submissions are not deployed.
7. **End-to-end browser testing.** Run desktop/tablet/mobile and accessibility tests on public, owner, council, contractor, provider, AI copilot, funding and application journeys. Include stale session, denied role, empty, error and retry states.
8. **Operational readiness.** Configure platform operator identities, production AI/Stripe credentials, notification services, audit log retention, backups and restore testing, incident alerts, scheduled jobs, and privacy controls. The release acceptance route fails closed until externally verified.

## Recommended deployment sequence

1. Run CI green and review PR #3.
2. Connect the correct Domureva Supabase project, check migrations/security advisors, and configure server-only environment variables.
3. Run authenticated integration tests with two owners and two organisations, cross-tenant denial checks, and trusted webhook replay tests.
4. Validate funding scheme provenance and authority review policies, then run the 360/768/1440 px browser + WCAG checks.
5. Complete production backup/restore and sign-off. Only then merge PR #3 to `main` and let Lovable sync. Do not force-push or rewrite history.
6. Separately review Omniqora/Gabley PR #2 for compatibility; it is intentionally not merged into this branch.

## References

- `DESIGN.md` — approved product design language and UX definition of done.
- `docs/AI-MCP-IMPROVEMENT-ROADMAP.md` — proposed agents, MCP services and product backlog.
- `docs/EVIDENCE-STORAGE-SETUP.md` — private storage acceptance.
- `PORTING.md` — TanStack/Lovable constraints and protected files.
