create policy "assessments via case" on public.assessments for select to authenticated using (public.can_access_case(case_id));

revoke all on public.integration_idempotency from authenticated;

revoke execute on function public.can_access_case(uuid) from public;
revoke execute on function public.has_role(public.case_role) from public;
revoke execute on function public.is_case_manager(uuid) from public;
revoke execute on function public.is_org_member(uuid) from public;
grant execute on function public.can_access_case(uuid) to authenticated, service_role;
grant execute on function public.has_role(public.case_role) to authenticated, service_role;
grant execute on function public.is_case_manager(uuid) to authenticated, service_role;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;