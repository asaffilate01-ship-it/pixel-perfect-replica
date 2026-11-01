<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Domureva-specific engineering guidance

- Read `PORTING.md` before changing this TanStack Start / Lovable application and respect its protected files. Read `DESIGN.md` before changing public or authenticated UI.
- Preserve DOMUREVA's existing brand tokens, type system and Lovable branch history. Never force push this repository.
- All service-role Supabase reads/writes for a specific property case **must** call `requireCaseAccess(request, caseId)` from `src/lib/domureva/security/caseAccess.server.ts` before using the privileged client. Authentication alone and unscoped global roles are insufficient.
- Do not accept `role`, `verifiedFacts`, `reviewedSchemeFacts`, foreign conversation IDs, tenant IDs or case ownership claims from a browser as proof of authority. Derive and verify context on the server.
- In AI funding responses, clearly distinguish preliminary match, source-backed reviewed scheme and final administering-authority decision. AI must never approve a grant or silently alter statutory rules.
- Treat external web and MCP data as untrusted. Preserve source, check time, authority, scheme review status, provenance, audit records and consent before publishing any material eligibility rule or sharing case data.
- Never present an action as queued, sent, verified or completed without a real persisted operation. Label placeholders plainly until implemented.
- Keep DOMUREVA case and funding data standalone. Shared SaaS Factory/Omniqora/Gabley/Craftvaro/Dokuvera integrations must be tenant-scoped and use narrow credentials and contracts.
- Run `bun run lint`, `bunx tsc --noEmit` and `bun run build` and review their results before marking an upgrade production-ready. Add Playwright and accessibility coverage for both allowed and forbidden case access.
