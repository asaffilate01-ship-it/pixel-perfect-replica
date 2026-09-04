create table if not exists public.user_roles(
 user_id uuid references auth.users on delete cascade,
 role public.case_role not null,
 org_id uuid references public.organisations on delete cascade,
 primary key(user_id,role,org_id)
);
create table if not exists public.push_subscriptions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 endpoint text not null unique, p256dh text not null, auth text not null, created_at timestamptz not null default now(), last_used_at timestamptz
);
create table if not exists public.billing_events(
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, org_id uuid references public.organisations,
 provider text not null default 'stripe', external_id text not null unique, event_type text not null, amount numeric, currency text,
 status text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.integration_idempotency(
 key text primary key, provider text not null, event_id text not null, received_at timestamptz not null default now(), processed_at timestamptz, outcome jsonb
);
create table if not exists public.provider_responses(
 id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.provider_opportunities on delete cascade,
 provider_org_id uuid not null references public.organisations, responder_id uuid not null references auth.users,
 response text not null check(response in ('interested','declined','request_info')), note text, created_at timestamptz not null default now(), unique(opportunity_id,provider_org_id)
);
create table if not exists public.case_tasks(
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 title text not null, task_type text not null, status text not null default 'open', assigned_to uuid references auth.users,
 due_at timestamptz, blocking boolean not null default false, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.consent_log(
 id bigint generated always as identity primary key, user_id uuid references auth.users, purpose text not null, granted boolean not null,
 policy_version text not null, ip_hash text, user_agent text, created_at timestamptz not null default now()
);
create table if not exists public.learning_weights(
 id uuid primary key default gen_random_uuid(), scope text not null, feature text not null, weight numeric not null default 1,
 sample_size int not null default 0, updated_at timestamptz not null default now(), unique(scope,feature)
);
create table if not exists public.integration_accounts(
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organisations on delete cascade,
 provider text not null, external_org_id text not null, verification_status text not null default 'pending', metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), unique(provider,external_org_id)
);

grant select, insert, update, delete on public.user_roles, public.push_subscriptions, public.billing_events, public.integration_idempotency, public.provider_responses, public.case_tasks, public.consent_log, public.learning_weights, public.integration_accounts to authenticated;
grant all on public.user_roles, public.push_subscriptions, public.billing_events, public.integration_idempotency, public.provider_responses, public.case_tasks, public.consent_log, public.learning_weights, public.integration_accounts to service_role;
grant usage, select on sequence public.consent_log_id_seq to authenticated, service_role;

alter table public.user_roles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.provider_responses enable row level security;
alter table public.case_tasks enable row level security;
alter table public.consent_log enable row level security;
alter table public.learning_weights enable row level security;
alter table public.integration_accounts enable row level security;

create or replace function public.has_role(target public.case_role) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role=target)
    or exists(select 1 from public.organisation_members om where om.user_id=auth.uid() and om.role=target);
$$;
create or replace function public.is_case_manager(target_case uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.can_access_case(target_case) and (
   public.has_role('admin') or public.has_role('council_officer') or public.has_role('housing_provider')
   or exists(select 1 from public.properties p join public.cases c on c.property_id=p.id where c.id=target_case and p.created_by=auth.uid())
 );
$$;

create policy "own roles" on public.user_roles for select using(user_id=auth.uid());
create policy "own push subscriptions" on public.push_subscriptions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "provider response own org" on public.provider_responses for select using(responder_id=auth.uid() or public.has_role('admin') or public.has_role('council_officer'));
create policy "provider response insert" on public.provider_responses for insert with check(responder_id=auth.uid() and public.has_role('housing_provider'));
create policy "case tasks read" on public.case_tasks for select using(public.can_access_case(case_id));
create policy "case tasks manage" on public.case_tasks for all using(public.is_case_manager(case_id)) with check(public.is_case_manager(case_id));
create policy "own consent" on public.consent_log for select using(user_id=auth.uid());
create policy "learning weights readable" on public.learning_weights for select using(auth.uid() is not null);
create policy "integration account org members" on public.integration_accounts for select using(exists(select 1 from public.organisation_members om where om.org_id=integration_accounts.org_id and om.user_id=auth.uid()) or public.has_role('admin'));

create policy "case owner insert" on public.cases for insert with check(exists(select 1 from public.properties p where p.id=property_id and p.created_by=auth.uid()));
create policy "properties update own" on public.properties for update using(created_by=auth.uid()) with check(created_by=auth.uid());
create policy "applications manage via case" on public.funding_applications for all using(public.can_access_case(case_id)) with check(public.can_access_case(case_id));
create policy "evidence via case" on public.evidence_items for all using(public.can_access_case(case_id)) with check(public.can_access_case(case_id));
create policy "quotes requests via case" on public.quote_requests for all using(public.can_access_case(case_id)) with check(public.can_access_case(case_id));
create policy "projects via case" on public.projects for select using(public.can_access_case(case_id));
create policy "notifications update own" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());

alter table public.rule_change_queue enable row level security;
alter table public.integration_events enable row level security;
alter table public.billing_events enable row level security;
alter table public.funding_schemes enable row level security;
alter table public.source_records enable row level security;
create unique index if not exists uq_evidence_dokuvera on public.evidence_items(external_dokuvera_id) where external_dokuvera_id is not null;
create unique index if not exists uq_quotes_craftvaro on public.quotes(external_craftvaro_id) where external_craftvaro_id is not null;
create policy "reviewed funding visible" on public.funding_schemes for select using(status='reviewed' or public.has_role('admin') or public.has_role('council_officer'));
create policy "sources reviewers only" on public.source_records for select using(public.has_role('admin') or public.has_role('council_officer'));
create policy "rule queue reviewers" on public.rule_change_queue for select using(public.has_role('admin') or public.has_role('council_officer'));
create policy "rule queue review update" on public.rule_change_queue for update using(public.has_role('admin') or public.has_role('council_officer')) with check(public.has_role('admin') or public.has_role('council_officer'));
create policy "integration events admin" on public.integration_events for select using(public.has_role('admin'));
create policy "billing own or admin" on public.billing_events for select using(user_id=auth.uid() or public.has_role('admin'));