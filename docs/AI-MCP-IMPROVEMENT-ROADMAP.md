# DOMUREVA — AI, MCP, product design and implementation roadmap

Audit scope: repository `asaffilate01-ship-it/pixel-perfect-replica`, examined on 31 October 2026. This is a **curated compatibility review**, not a claim that every GitHub repository has been scanned. Third-party links are candidates, not already installed integrations; check licences, maintenance and security before adding dependencies.

## What has already been built on the upgrade branch

- Case-scoped authentication before privileged Supabase reads/writes in critical funding, quotation, milestone, integration, finance, messages and case-pack operations.
- Reva context comes from the server's authorised case facts and human-reviewed scheme records instead of browser-supplied claims; conversation ownership is checked and history is retained.
- Property intake calls a persisted server workflow and then attempts a preliminary reviewed funding match, without losing the case when matching fails.
- Searchable case and provider opportunity workspaces with honest loading, empty and error states. Fixed invalid dashboard schema fields and opportunity-score units.
- A versioned `DESIGN.md` with real brand colours, typographic decisions, usability and accessibility guidelines.

## Decision table — GitHub resources evaluated

| Project | Suitable use in DOMUREVA | Adoption status |
|---|---|---|
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Art direction for public marketing; stricter app-screen discipline for operational views | Principles applied, not imported into production bundle |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Design QA for keyboard states, contrast, typography, responsive layouts and empty/error states | Review guidance applied; browser launcher not executed |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Agent-readable design specification; reference systems without copying competitors | DOMUREVA-specific `DESIGN.md` added |
| [microsoft/playwright](https://github.com/microsoft/playwright) | Cross-browser journeys for owner, council and provider roles, including unauthorised case tests | Proposed P1 |
| [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | Automated accessibility checks with Playwright and manual keyboard checks | Proposed P1 |
| [TanStack/table](https://github.com/TanStack/table) | Larger server-paginated cases, evidence and opportunity tables with stable sorting/filters | Proposed P2; keep simple lists until scale warrants |
| [maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) | Council case maps with appropriate permissions, postcode aggregation and clustering | Proposed P2; never publicly expose private coordinates |
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Scoped MCP tools for reviewed funding sources, cases, Dokuvera evidence, Gabley and Craftvaro | Proposed P2; require tool input schema and server-side authorisation |
| [openai/openai-agents-js](https://github.com/openai/openai-agents-js) | One candidate orchestrator for Reva's explicit typed tools and approved, auditable action traces | Evaluate alongside LangGraphJS, do not install both by default |
| [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | Alternative for durable, review-gated multi-stage assessment workflows | Evaluate as alternative to Agents SDK |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | AI traceability, prompt/evaluation versioning and grounded-answer quality checks | Proposed P2; redact owners' and residents' data |
| [getsentry/sentry-javascript](https://github.com/getsentry/sentry-javascript) | Capture actionable JS/server errors, alert on crashes, and trace slow screens | Proposed P1; redact tokens, addresses and evidence |
| [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) | Retryable grant source discovery, document assembly, integration synchronisation and scheduled checks | Evaluate P2 against existing job tables; no duplicate queue |
| [pdfme/pdfme](https://github.com/pdfme/pdfme) | Evidence-backed generated application documents and pack layouts | Proposed P2 after real storage, provenance and authorised export |
| [pgvector/pgvector](https://github.com/pgvector/pgvector) | Retrieval over source-text chunks, with strict document, tenant and review metadata | Proposed P3; never use vector similarity as an eligibility rule |

## Architecture: keep grant decisions governed

```text
Authenticated person + selected case
  -> case access and tenant/membership verification
  -> structured, minimal property facts and recorded tasks
  -> human-reviewed rules + source links + validity metadata
  -> deterministic preliminary eligibility and funding-stack calculations
  -> Reva explanation (grounded in above facts; cites evidence, uncertainty)
  -> human approval for external publication, award and irreversible actions
  -> audit event + source provenance + idempotent integration job
```

MCP tools should be narrow, read-only by default and explicitly consented to for writes. Candidate tools: `case.get_authorised`, `funding.list_reviewed`, `funding.check_geography`, `evidence.list_verified`, `case.tasks`, `providers.find_verified`, `application.preview`. Each tool validates the caller on the server and returns limited fields. Client-supplied roles and AI-generated authorities are not security controls.

Data sources to integrate next: official UK/Scottish/Welsh/Northern Irish government scheme pages, council programme terms, postcode-to-authority resolution, EPC/retrofit sources under appropriate licences, permitted public procurement feeds and local authority approvals. Store checked-at dates and provenance, deduplicate changes and queue human review before a rule becomes live.

## Immediate P0 / P1

1. **Finish service-role authorization audit.** Review every `src/routes/api/**` endpoint, especially all application-pack generation/export, contracts, review controls, provider responses, admin and privacy operations. Make case authorisation and org membership explicit.
2. **Stop fake success states.** Existing documents upload, application export/generation, contract award and certain offer/notification flows contain response stubs. Either implement real storage/jobs or mark them unavailable; never imply persistence.
3. **Verify baseline CI and user journeys.** Typecheck, lint, production build, owner intake → funding review → case view, direct HTTP access to another user's case (403/404), conversation-ID ownership, expired session and document permissions.
4. **Funding correctness.** Review scheme geography, valid-from/valid-to, authority jurisdiction, funding compatibility, source freshness, eligible works and award limits before calling a match eligible. Current deterministic screen only covers some fields and must remain preliminary.
5. **Security and data privacy.** Review RLS for every tenant table and storage bucket; test for IDOR, service-role bypass, leaked addresses/geotags, webhook replay, rate limits and secrets exposure. Validate UK GDPR retention and lawful authority access.

## Next P2

- **Council operations:** MapLibre clustering, district summaries, privacy-preserving maps, stage/empty-duration filters, CSV/PDF exports, reports and property portfolio assignments.
- **Case command centre:** section-level evidence completeness, source freshness, funding estimates vs awards, decisions, contractor offers, overdue tasks and a readable chronology.
- **Contractors/providers:** verified directory, scope/quote comparison, consented messaging, procurement audit, acceptance and handover.
- **Integration network:** finish existing Gabley / Omniqora pull request separately; keep Dokuvera immutable evidence, Craftvaro verified quotes and LeadLens source ingestion behind case-specific API contracts.
- **Resilient jobs:** idempotency keys, retry/backoff, dead-letter reporting, signed webhooks and admin-side reprocessing.
- **Document creation:** private evidence storage + malware scanning, manifests/hashes, generated application packs and signed/attributed exports.
- **Analytics:** measurable returns-to-use and council outcomes from real records, not mock dashboards.

## Quality bar and release

The repository is attached to Lovable. Keep main untouched until reviewed; do not force-push or rewrite published history. Check `PORTING.md` and `DESIGN.md` before making changes. Do not treat an open PR, an integration adapter, a route shell, or a UI button as proof of a production-ready feature.

Release checks: authenticated feature flows, real database persistence, failed/retry paths, per-case authorisation and RLS, WCAG AA, mobile and tablet layouts, AI hallucination/source provenance tests, performance budgets, dependable audit logs and incident monitoring.
