create table if not exists public.case_members(
  case_id uuid references public.cases on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role public.case_role not null,
  primary key(case_id,user_id)
);
create table if not exists public.funding_applications(
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
  scheme_id uuid not null references public.funding_schemes, status text not null default 'draft',
  requested_amount numeric, submitted_at timestamptz, decision_at timestamptz, awarded_amount numeric,
  decision_reason text, application_payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.rule_change_queue(
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.source_records,
  scheme_id uuid references public.funding_schemes, change_type text not null, before jsonb, proposed jsonb not null,
  confidence numeric check(confidence between 0 and 1), status public.review_status not null default 'draft',
  reviewed_by uuid references auth.users, reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.provider_opportunities(
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
  provider_org_id uuid references public.organisations, route text not null check(route in ('purchase_repair','lease_repair','managed_refurbishment')),
  score numeric check(score between 0 and 1), rationale jsonb not null default '{}'::jsonb, status text not null default 'suggested', created_at timestamptz not null default now()
);
create table if not exists public.notifications(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  case_id uuid references public.cases on delete cascade, channel text not null default 'in_app', type text not null,
  title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.integration_events(
  id uuid primary key default gen_random_uuid(), provider text not null, event_type text not null, external_id text,
  case_id uuid references public.cases on delete cascade, payload jsonb not null default '{}'::jsonb,
  status text not null default 'received', error text, created_at timestamptz not null default now(), processed_at timestamptz
);

grant select, insert, update, delete on public.case_members, public.funding_applications, public.rule_change_queue, public.provider_opportunities, public.notifications, public.integration_events to authenticated;
grant all on public.case_members, public.funding_applications, public.rule_change_queue, public.provider_opportunities, public.notifications, public.integration_events to service_role;

alter table public.case_members enable row level security;
alter table public.funding_applications enable row level security;
alter table public.notifications enable row level security;
alter table public.provider_opportunities enable row level security;

create or replace function public.can_access_case(target_case uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from public.cases c join public.properties p on p.id=c.property_id
   where c.id=target_case and (p.created_by=auth.uid() or exists(select 1 from public.case_members cm where cm.case_id=c.id and cm.user_id=auth.uid()))
 );
$$;

create policy "case members read" on public.case_members for select using(public.can_access_case(case_id));
create policy "applications via case" on public.funding_applications for select using(public.can_access_case(case_id));
create policy "opportunities via case" on public.provider_opportunities for select using(public.can_access_case(case_id));
create policy "own notifications" on public.notifications for select using(user_id=auth.uid());

create index if not exists idx_cases_property on public.cases(property_id);
create index if not exists idx_funding_status on public.funding_schemes(status,authority);
create index if not exists idx_funding_matches_case on public.funding_matches(case_id,eligible);
create index if not exists idx_evidence_case on public.evidence_items(case_id);
create index if not exists idx_quote_request_case on public.quote_requests(case_id);
create index if not exists idx_agent_runs_case on public.agent_runs(case_id,created_at desc);
create index if not exists idx_learning_case on public.learning_outcomes(case_id,event);