-- DOMUREVA: REVIEW-ONLY SECURITY PATCH
-- Do NOT run against DISHBEE or any other project.
-- This file is NOT an applied migration. Review with Supabase CLI/advisors and
-- apply only to the correctly connected Domureva database after backup.
-- Existing policies use public.has_role('admin') across all organisations,
-- which can expose unrelated tenants' sensitive global records.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);
alter table private.platform_admins enable row level security;
revoke all on private.platform_admins from anon, authenticated;

create or replace function private.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from private.platform_admins p where p.user_id = (select auth.uid()));
$$;
revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

-- Operator-only global audit, risk, integration and release records.
drop policy if exists "integration events admin" on public.integration_events;
create policy "integration events platform operators" on public.integration_events
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "integration jobs admin" on public.integration_jobs;
create policy "integration jobs platform operators" on public.integration_jobs
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "audit log admin" on public.audit_log;
create policy "audit log platform operators" on public.audit_log
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "security events admin" on public.security_events;
create policy "security events platform operators" on public.security_events
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "incidents admin" on public.incident_records;
create policy "incidents platform operators" on public.incident_records
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "risk register admin" on public.risk_register;
create policy "risk register platform operators" on public.risk_register
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "release runs admin" on public.release_acceptance_runs;
create policy "release runs platform operators" on public.release_acceptance_runs
  for select to authenticated using (private.is_platform_admin());

-- Funding-source ingestion and material rule reviews are operator-wide.
drop policy if exists "sources reviewers only" on public.source_records;
create policy "sources platform reviewers" on public.source_records
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "rule queue reviewers" on public.rule_change_queue;
create policy "rule queue platform reviewers" on public.rule_change_queue
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "rule queue review update" on public.rule_change_queue;
create policy "rule queue platform review update" on public.rule_change_queue
  for update to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists "reviewed funding visible" on public.funding_schemes;
create policy "reviewed schemes or platform reviewer" on public.funding_schemes
  for select to authenticated
  using (status = 'reviewed' or private.is_platform_admin());

drop policy if exists "council sources reviewers" on public.council_sources;
create policy "council sources platform reviewers" on public.council_sources
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "ingestion runs reviewers" on public.scheme_ingestion_runs;
create policy "ingestion runs platform reviewers" on public.scheme_ingestion_runs
  for select to authenticated using (private.is_platform_admin());

drop policy if exists "source health reviewers" on public.funding_source_health;
create policy "source health platform reviewers" on public.funding_source_health
  for select to authenticated using (private.is_platform_admin());

-- A tenant administrator must not inspect other tenants' billing or privacy.
drop policy if exists "billing own or admin" on public.billing_events;
create policy "billing account owner or platform" on public.billing_events
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "own privacy requests" on public.data_subject_requests;
create policy "privacy requester only" on public.data_subject_requests
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own deliveries" on public.notification_deliveries;
create policy "notification recipient only" on public.notification_deliveries
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "own entitlements" on public.subscription_entitlements;
create policy "entitlements account or organisation" on public.subscription_entitlements
  for select to authenticated
  using (
    user_id = (select auth.uid()) or
    (organisation_id is not null and public.is_org_member(organisation_id)) or
    private.is_platform_admin()
  );

drop policy if exists "audit exports requester" on public.audit_exports;
create policy "audit exports own requester" on public.audit_exports
  for all to authenticated
  using (requested_by = (select auth.uid()))
  with check (requested_by = (select auth.uid()));

drop policy if exists "orgs readable to members" on public.organisations;
create policy "organisations member only" on public.organisations
  for select to authenticated using (public.is_org_member(id) or private.is_platform_admin());

drop policy if exists "integration account org members" on public.integration_accounts;
create policy "integration account own organisation" on public.integration_accounts
  for select to authenticated
  using (public.is_org_member(org_id) or private.is_platform_admin());

drop policy if exists "council targets org" on public.council_targets;
create policy "council targets assigned organisation" on public.council_targets
  for select to authenticated
  using (public.is_org_member(organisation_id) or private.is_platform_admin());

drop policy if exists "learning weights readable" on public.learning_weights;
create policy "learning weights platform operators" on public.learning_weights
  for select to authenticated using (private.is_platform_admin());

-- Providers only see their organisation's offers or cases they are assigned to;
-- neither being an unrelated council officer nor a tenant admin is a global pass.
drop policy if exists "provider offers visible" on public.provider_offers;
create policy "provider offers organisation or case" on public.provider_offers
  for select to authenticated
  using (
    public.is_org_member(provider_org_id) or private.is_platform_admin() or
    exists (
      select 1 from public.provider_opportunities o
      where o.id = opportunity_id and public.can_access_case(o.case_id)
    )
  );

drop policy if exists "offer events visible" on public.provider_offer_events;
create policy "offer events organisation or case" on public.provider_offer_events
  for select to authenticated using (
    exists (
      select 1 from public.provider_offers o where o.id = offer_id
    ) or private.is_platform_admin()
  );

drop policy if exists "provider response own org" on public.provider_responses;
create policy "provider responses organisation or case" on public.provider_responses
  for select to authenticated
  using (
    responder_id = (select auth.uid()) or
    public.is_org_member(provider_org_id) or
    private.is_platform_admin() or
    exists (
      select 1 from public.provider_opportunities o
      where o.id = opportunity_id and public.can_access_case(o.case_id)
    )
  );

drop policy if exists "provider response insert" on public.provider_responses;
create policy "provider response valid own organisation" on public.provider_responses
  for insert to authenticated with check (
    responder_id = (select auth.uid())
    and public.is_org_member(provider_org_id)
    and exists (
      select 1 from public.provider_opportunities o
      where o.id = opportunity_id and o.provider_org_id = provider_org_id
    )
  );

commit;

-- AFTER APPLY:
-- 1. Seed only verified platform-operator user UUIDs into private.platform_admins
--    using a privileged connection. Keep in sync with server-only
--    DOMUREVA_PLATFORM_ADMIN_USER_IDS.
-- 2. Test two unrelated tenant admins, owner, provider, council and operator.
-- 3. Run Supabase security advisors and verify no policy broadens access.
-- 4. Check public grants on sensitive tables and revoke unnecessary writes.
-- 5. Record this as a real migration in the CORRECT Domureva project.
