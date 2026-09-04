create table if not exists public.application_pack_exports (id uuid primary key default gen_random_uuid(), case_id uuid not null, requested_by uuid, status text not null default 'queued', storage_path text, sha256 text, created_at timestamptz default now(), completed_at timestamptz);
create table if not exists public.provider_offers (id uuid primary key default gen_random_uuid(), opportunity_id uuid not null, provider_org_id uuid not null, offer_type text not null check (offer_type in ('lease_repair','purchase_repair','management')), headline_terms jsonb not null default '{}'::jsonb, status text not null default 'draft', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.notification_preferences (user_id uuid primary key, email boolean default true, push boolean default true, funding_changes boolean default true, quote_updates boolean default true, project_updates boolean default true, updated_at timestamptz default now());
create table if not exists public.data_subject_requests (id uuid primary key default gen_random_uuid(), user_id uuid not null, request_type text not null check(request_type in ('access','rectification','erasure','restriction','portability')), status text not null default 'received', due_at timestamptz not null default now()+interval '30 days', created_at timestamptz default now(), completed_at timestamptz);
create table if not exists public.security_events (id uuid primary key default gen_random_uuid(), actor_id uuid, event_type text not null, severity text not null default 'info', ip_hash text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.funding_source_health (source_key text primary key, last_success_at timestamptz, last_failure_at timestamptz, consecutive_failures int not null default 0, status text not null default 'unknown', metadata jsonb not null default '{}'::jsonb);
create index if not exists idx_pack_exports_case on public.application_pack_exports(case_id);
create index if not exists idx_provider_offers_opp on public.provider_offers(opportunity_id);
create index if not exists idx_dsr_user on public.data_subject_requests(user_id);

create table if not exists public.case_documents (id uuid primary key default gen_random_uuid(), case_id uuid not null, owner_id uuid not null, category text not null, filename text not null, storage_path text not null, mime_type text, byte_size bigint, sha256 text, evidence_provider text not null default 'domureva', external_evidence_id text, verified_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.funding_work_items (id uuid primary key default gen_random_uuid(), case_id uuid not null, code text not null, description text not null, estimated_cost numeric(12,2) not null default 0, category text not null, created_at timestamptz default now());
create table if not exists public.funding_allocations (id uuid primary key default gen_random_uuid(), case_id uuid not null, funding_scheme_id uuid, work_item_id uuid not null, allocated_amount numeric(12,2) not null check (allocated_amount >= 0), allocation_reason text, status text not null default 'proposed', created_at timestamptz default now(), unique(case_id, funding_scheme_id, work_item_id));
create table if not exists public.integration_jobs (id uuid primary key default gen_random_uuid(), case_id uuid, integration text not null, job_type text not null, status text not null default 'queued', request_payload jsonb not null default '{}'::jsonb, response_payload jsonb, attempts int not null default 0, next_attempt_at timestamptz default now(), last_error text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.council_targets (id uuid primary key default gen_random_uuid(), organisation_id uuid not null, period_start date not null, period_end date not null, homes_returned_target int default 0, funding_deployed_target numeric(14,2) default 0, carbon_improvement_target numeric(14,2) default 0, created_at timestamptz default now());
create table if not exists public.case_assignments (id uuid primary key default gen_random_uuid(), case_id uuid not null, assigned_user_id uuid not null, assignment_role text not null default 'case_officer', assigned_at timestamptz default now(), released_at timestamptz);
create table if not exists public.provider_offer_events (id uuid primary key default gen_random_uuid(), offer_id uuid not null, event_type text not null, actor_id uuid, payload jsonb not null default '{}'::jsonb, created_at timestamptz default now());
create table if not exists public.contract_awards (id uuid primary key default gen_random_uuid(), quote_request_id uuid not null, quote_id uuid not null, case_id uuid not null, contractor_org_id uuid, contract_value numeric(12,2) not null, status text not null default 'proposed', awarded_at timestamptz, completion_due_at timestamptz, created_at timestamptz default now());
create table if not exists public.release_acceptance_runs (id uuid primary key default gen_random_uuid(), environment text not null, release_version text not null, status text not null default 'running', checks jsonb not null default '{}'::jsonb, started_at timestamptz default now(), completed_at timestamptz);
create index if not exists idx_case_documents_case on public.case_documents(case_id);
create index if not exists idx_funding_allocations_case on public.funding_allocations(case_id);
create index if not exists idx_integration_jobs_status on public.integration_jobs(status, next_attempt_at);
create index if not exists idx_case_assignments_case on public.case_assignments(case_id);
create index if not exists idx_contract_awards_case on public.contract_awards(case_id);

create table if not exists public.council_sources (id uuid primary key default gen_random_uuid(), authority_code text not null, authority_name text not null, nation text not null, source_url text not null, source_type text not null, last_checked_at timestamptz, last_success_at timestamptz, source_hash text, status text not null default 'pending', metadata jsonb not null default '{}'::jsonb, unique(authority_code, source_url));
create table if not exists public.scheme_ingestion_runs (id uuid primary key default gen_random_uuid(), source_id uuid not null, started_at timestamptz default now(), finished_at timestamptz, status text not null default 'running', discovered_count int not null default 0, changed_count int not null default 0, review_required_count int not null default 0, error text);
create table if not exists public.application_pack_files (id uuid primary key default gen_random_uuid(), case_id uuid not null, export_id uuid, storage_path text not null, filename text not null, mime_type text not null default 'application/pdf', byte_size bigint, sha256 text, generated_by uuid, generated_at timestamptz default now());
create table if not exists public.case_messages (id uuid primary key default gen_random_uuid(), case_id uuid not null, sender_id uuid, sender_role text, message_type text not null default 'message', body text not null, attachments jsonb not null default '[]'::jsonb, created_at timestamptz default now(), read_at timestamptz);
create table if not exists public.agent_conversations (id uuid primary key default gen_random_uuid(), user_id uuid not null, case_id uuid, title text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.agent_messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null, role text not null check(role in ('user','assistant','system')), content text not null, citations jsonb not null default '[]'::jsonb, agent_name text, created_at timestamptz default now());
create table if not exists public.subscription_entitlements (id uuid primary key default gen_random_uuid(), organisation_id uuid, user_id uuid, plan_key text not null, entitlement_key text not null, status text not null default 'active', source text not null default 'stripe', valid_from timestamptz default now(), valid_until timestamptz, metadata jsonb not null default '{}'::jsonb);
create table if not exists public.notification_deliveries (id uuid primary key default gen_random_uuid(), user_id uuid not null, notification_type text not null, channel text not null, status text not null default 'queued', provider_id text, error text, created_at timestamptz default now(), delivered_at timestamptz);
create table if not exists public.audit_exports (id uuid primary key default gen_random_uuid(), case_id uuid, organisation_id uuid, requested_by uuid not null, export_type text not null, status text not null default 'queued', storage_path text, sha256 text, created_at timestamptz default now(), completed_at timestamptz);
create table if not exists public.risk_register (id uuid primary key default gen_random_uuid(), scope text not null, scope_id uuid, title text not null, severity text not null default 'medium', likelihood text not null default 'possible', mitigation text, owner_user_id uuid, status text not null default 'open', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.incident_records (id uuid primary key default gen_random_uuid(), incident_type text not null, severity text not null, status text not null default 'open', detected_at timestamptz default now(), resolved_at timestamptz, summary text not null, details jsonb not null default '{}'::jsonb);
create index if not exists idx_scheme_ingestion_source on public.scheme_ingestion_runs(source_id, started_at desc);
create index if not exists idx_messages_case on public.case_messages(case_id, created_at desc);
create index if not exists idx_agent_messages_conversation on public.agent_messages(conversation_id, created_at);
create index if not exists idx_entitlements_org on public.subscription_entitlements(organisation_id, entitlement_key, status);
create index if not exists idx_deliveries_user on public.notification_deliveries(user_id, created_at desc);
create index if not exists idx_risk_scope on public.risk_register(scope, scope_id, status);

do $$
declare t text;
begin
  foreach t in array array['application_pack_exports','provider_offers','notification_preferences','data_subject_requests','security_events','funding_source_health','case_documents','funding_work_items','funding_allocations','integration_jobs','council_targets','case_assignments','provider_offer_events','contract_awards','release_acceptance_runs','council_sources','scheme_ingestion_runs','application_pack_files','case_messages','agent_conversations','agent_messages','subscription_entitlements','notification_deliveries','audit_exports','risk_register','incident_records']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "pack exports case access" on public.application_pack_exports for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
create policy "pack files case access" on public.application_pack_files for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
create policy "case documents case access" on public.case_documents for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
create policy "work items case access" on public.funding_work_items for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
create policy "allocations case access" on public.funding_allocations for all using (public.can_access_case(case_id)) with check (public.can_access_case(case_id));
create policy "awards case access" on public.contract_awards for select using (public.can_access_case(case_id));
create policy "assignments case access" on public.case_assignments for select using (public.can_access_case(case_id));
create policy "case messages read" on public.case_messages for select using (public.can_access_case(case_id));
create policy "case messages write" on public.case_messages for insert with check (public.can_access_case(case_id) and sender_id = auth.uid());

create policy "provider offers visible" on public.provider_offers for select using (public.is_org_member(provider_org_id) or public.has_role('admin') or public.has_role('council_officer'));
create policy "provider offers manage" on public.provider_offers for all using (public.is_org_member(provider_org_id)) with check (public.is_org_member(provider_org_id));
create policy "offer events visible" on public.provider_offer_events for select using (exists(select 1 from public.provider_offers o where o.id = offer_id and (public.is_org_member(o.provider_org_id) or public.has_role('admin'))));

create policy "own notification prefs" on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own deliveries" on public.notification_deliveries for select using (user_id = auth.uid() or public.has_role('admin'));
create policy "own privacy requests" on public.data_subject_requests for all using (user_id = auth.uid() or public.has_role('admin')) with check (user_id = auth.uid());
create policy "own conversations" on public.agent_conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own conversation messages" on public.agent_messages for all using (exists(select 1 from public.agent_conversations c where c.id = conversation_id and c.user_id = auth.uid())) with check (exists(select 1 from public.agent_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "own entitlements" on public.subscription_entitlements for select using (user_id = auth.uid() or (organisation_id is not null and public.is_org_member(organisation_id)) or public.has_role('admin'));
create policy "council targets org" on public.council_targets for select using (public.is_org_member(organisation_id) or public.has_role('admin'));
create policy "audit exports requester" on public.audit_exports for all using (requested_by = auth.uid() or public.has_role('admin')) with check (requested_by = auth.uid());

create policy "security events admin" on public.security_events for select using (public.has_role('admin'));
create policy "incidents admin" on public.incident_records for select using (public.has_role('admin'));
create policy "risk register admin" on public.risk_register for select using (public.has_role('admin'));
create policy "integration jobs admin" on public.integration_jobs for select using (public.has_role('admin'));
create policy "release runs admin" on public.release_acceptance_runs for select using (public.has_role('admin'));
create policy "council sources reviewers" on public.council_sources for select using (public.has_role('admin') or public.has_role('council_officer'));
create policy "ingestion runs reviewers" on public.scheme_ingestion_runs for select using (public.has_role('admin') or public.has_role('council_officer'));
create policy "source health reviewers" on public.funding_source_health for select using (public.has_role('admin') or public.has_role('council_officer'));

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.organisation_members enable row level security;
alter table public.quotes enable row level security;
alter table public.project_milestones enable row level security;
alter table public.agent_runs enable row level security;
alter table public.learning_outcomes enable row level security;
alter table public.audit_log enable row level security;
alter table public.integration_idempotency enable row level security;

create policy "orgs readable to members" on public.organisations for select using (public.is_org_member(id) or public.has_role('admin') or public.has_role('council_officer'));
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own org memberships" on public.organisation_members for select using (user_id = auth.uid() or public.is_org_member(org_id));
create policy "quotes via case" on public.quotes for select using (exists(select 1 from public.quote_requests qr where qr.id = quote_request_id and public.can_access_case(qr.case_id)) or public.is_org_member(contractor_org_id));
create policy "milestones via case" on public.project_milestones for select using (exists(select 1 from public.projects p where p.id = project_id and public.can_access_case(p.case_id)));
create policy "agent runs via case" on public.agent_runs for select using (case_id is not null and public.can_access_case(case_id));
create policy "learning outcomes via case" on public.learning_outcomes for select using (public.can_access_case(case_id));
create policy "audit log admin" on public.audit_log for select using (public.has_role('admin'));

revoke execute on function public.can_access_case(uuid) from anon;
revoke execute on function public.has_role(public.case_role) from anon;
revoke execute on function public.is_case_manager(uuid) from anon;
revoke execute on function public.is_org_member(uuid) from anon;