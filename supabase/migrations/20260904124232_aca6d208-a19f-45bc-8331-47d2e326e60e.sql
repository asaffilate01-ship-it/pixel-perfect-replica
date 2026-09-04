create table if not exists public.property_answers (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases(id) on delete cascade,
  question_key text not null, answer jsonb not null default '{}'::jsonb, source text not null default 'owner',
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(case_id,question_key)
);
create table if not exists public.application_requirements (
  id uuid primary key default gen_random_uuid(), funding_application_id uuid not null references public.funding_applications(id) on delete cascade,
  requirement_key text not null, label text not null, status text not null default 'missing' check(status in ('missing','provided','verified','waived')),
  evidence_item_id uuid references public.evidence_items(id), required boolean not null default true, notes text,
  unique(funding_application_id,requirement_key)
);
create table if not exists public.contractor_profiles (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  craftvaro_external_id text, trades text[] not null default '{}', coverage_outcodes text[] not null default '{}',
  verified boolean not null default false, verification_expires_at timestamptz, public_liability_verified boolean not null default false,
  professional_indemnity_verified boolean not null default false, gas_safe_number text, niceic_number text, retrofit_accreditations text[] not null default '{}',
  rating numeric(3,2), completed_projects int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.case_status_events (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases(id) on delete cascade,
  from_status text, to_status text not null, reason text, actor_user_id uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.occupancy_outcomes (
  id uuid primary key default gen_random_uuid(), case_id uuid not null unique references public.cases(id) on delete cascade,
  outcome text not null check(outcome in ('owner_occupied','private_rented','social_rented','affordable_rented','sold','other')),
  occupied_at date, bedrooms_returned int, affordable_home boolean not null default false, notes text, verified_at timestamptz, verified_by uuid references auth.users(id)
);
create table if not exists public.case_financials (
  id uuid primary key default gen_random_uuid(), case_id uuid not null unique references public.cases(id) on delete cascade,
  estimated_works numeric(12,2), approved_funding numeric(12,2), owner_contribution numeric(12,2), committed_contract_value numeric(12,2),
  paid_to_date numeric(12,2), currency text not null default 'GBP', updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.property_answers, public.application_requirements, public.contractor_profiles, public.case_status_events, public.occupancy_outcomes, public.case_financials to authenticated;
grant all on public.property_answers, public.application_requirements, public.contractor_profiles, public.case_status_events, public.occupancy_outcomes, public.case_financials to service_role;
grant select on public.contractor_profiles to anon;

create index if not exists idx_property_answers_case on public.property_answers(case_id);
create index if not exists idx_application_requirements_app on public.application_requirements(funding_application_id,status);
create index if not exists idx_contractor_profiles_coverage on public.contractor_profiles using gin(coverage_outcodes);
create index if not exists idx_case_status_events_case on public.case_status_events(case_id,created_at desc);

alter table public.property_answers enable row level security;
alter table public.application_requirements enable row level security;
alter table public.contractor_profiles enable row level security;
alter table public.case_status_events enable row level security;
alter table public.occupancy_outcomes enable row level security;
alter table public.case_financials enable row level security;

create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.organisation_members om where om.org_id=target_org and om.user_id=auth.uid())
    or exists(select 1 from public.user_roles ur where ur.org_id=target_org and ur.user_id=auth.uid());
$$;

drop policy if exists property_answers_case_access on public.property_answers;
create policy property_answers_case_access on public.property_answers for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
drop policy if exists application_requirements_case_access on public.application_requirements;
create policy application_requirements_case_access on public.application_requirements for all using (
  exists(select 1 from public.funding_applications a where a.id=funding_application_id and public.can_access_case(a.case_id))
) with check (exists(select 1 from public.funding_applications a where a.id=funding_application_id and public.can_access_case(a.case_id)));
drop policy if exists case_status_events_access on public.case_status_events;
create policy case_status_events_access on public.case_status_events for select using (public.can_access_case(case_id));
drop policy if exists occupancy_outcomes_case_access on public.occupancy_outcomes;
create policy occupancy_outcomes_case_access on public.occupancy_outcomes for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
drop policy if exists case_financials_case_access on public.case_financials;
create policy case_financials_case_access on public.case_financials for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
drop policy if exists contractor_profiles_read on public.contractor_profiles;
create policy contractor_profiles_read on public.contractor_profiles for select using (verified=true or public.is_org_member(organisation_id));
drop policy if exists contractor_profiles_manage on public.contractor_profiles;
create policy contractor_profiles_manage on public.contractor_profiles for all using (public.is_org_member(organisation_id)) with check (public.is_org_member(organisation_id));