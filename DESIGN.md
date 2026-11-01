# DOMUREVA visual and interaction system

This document describes the **existing** Domureva visual identity and the quality bar for new UI. It is a working contract for design and coding agents, not permission to clone another brand.

## Product

DOMUREVA helps owners, councils, providers and contractors return empty UK properties to useful occupation. It connects property intake, reviewed funding schemes, evidence, applications, quotes, delivery and measurable outcomes. Reva is its AI assistant. **A possible funding match is not an authority's eligibility or award decision.**

### Surface modes

- **Public marketing:** persuasive and editorial. Lead with property regeneration, trustworthy real-world visuals and one clear path to “Check a property”. Public marketing can use the existing navy gradients and brand colours.
- **Authenticated workspace:** operational and calm. Put the actual case, status, evidence gaps and next action ahead of hero graphics or decorative KPI tiles. Use compact navigation, legible tables and quiet boundaries.
- **Council and admin views:** show sources, timestamps, review queues, exceptions, permissions and auditability. Never display record identifiers or property geolocation to unauthorised users.

## Brand (preserve existing tokens)

Use semantic classes already defined in `src/styles.css`; do not scatter raw hex codes or manually override the shared theme.

| Token | Direction | Usage |
|---|---|---|
| `navy` | dark architectural blue, approximately #0B364A | anchored headers, high-priority surfaces |
| `teal` / `accent` | approximately #13727B | links, selected data, actions and focus |
| `leaf` | approximately #5E9F44 | progress and verified positive states |
| `leaf-soft` | approximately #ADCB75 | supporting text on navy, selective data |
| `amber` | approximately #EDB03A | primary actions, clear attention |
| `stone` | approximately #DCD8D0 | neutral support backgrounds |
| `background`, `foreground`, `card`, `border`, `muted` | theme-specific neutral values | ordinary workspace surfaces |

**Type:** Outfit (`font-display`) for purposeful headings; Figtree (`font-sans` or body default) for reading, forms, tables and navigation. Maintain native font fallbacks. No decorative monospace or gradient text.

**Shape and depth:** existing variable radius scale, approximately 12–30 px for major surfaces; smaller controls inside. Prefer subtle 1 px dividers and surface differences in dense apps. Keep `shadow-card` subtle, `shadow-lift` exceptional.

**Spacing:** 4/8/12/16/24/32/48 px scale. Align fields, labels, table columns and controls to a consistent rhythm. In case views, preserve a clear information hierarchy and adequate white space.

## DOMUREVA signature

A **case journey** is the visual organising principle: property identification → condition → reviewed funding → required evidence → quotes → delivery → occupation. Give each stage a truthful completion or pending state. Do not imply a scheme was approved because the model has ranked it.

Create a consistent case header with address/postcode, status, case reference and next action; tabs should make evidence, funding, tasks and messages easy to find. Show source records and `reviewed_at` where available.

## Interaction contract

1. Every data component must distinguish **loading**, **empty**, **error**, **success**, **permission denied** and **stale/pending verification** states. Provide actionable recovery.
2. Every visible action must work. Do not report “sent”, “queued”, “approved”, “exported” or “verified” unless the corresponding persisted operation succeeded.
3. Present numbers with units: opportunity scores are 0–1 in storage and 0–100 in UI; estimates and approved funding must never be conflated.
4. Property and funding forms must validate user inputs, avoid silent data loss, preserve partially completed answers and support keyboard operation.
5. In narrow layouts, use responsive stacked case information without hiding essential actions. Validate at 360px, 768px and 1440px and at 200% browser zoom.
6. Visible focus rings, labelled inputs, meaningful headings, touch targets around 44px, announced errors, reduced-motion support and WCAG AA text contrast are required.
7. Respect light/dark tokens and avoid raw light/dark colour utilities inside functional components.
8. Use purpose-built icons from `lucide-react` with consistent stroke; charts must carry a real finding and understandable labels.
9. Treat AI output as advisory. Identify verified case facts, human-reviewed scheme data, assumptions and missing evidence separately.

## References used for design QA

- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) — separate public-page art direction from task-oriented application screens.
- [pbakaus/impeccable](https://github.com/pbakaus/impeccable) — interaction state quality, typography, spacing, contrast, responsive and keyboard checks.
- [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — structured design documentation and consistency across coding agents; use reference patterns without copying other brands.

## Definition of done

Run lint, typecheck and production build. Verify a real browser at desktop/tablet/mobile sizes; inspect empty, populated, error and permission-denied states. Test authenticated and unauthorised case access, review scheme-source provenance, and confirm real persistence before claiming workflow completion.
