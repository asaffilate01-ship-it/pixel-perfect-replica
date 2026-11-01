import { ApiAuthError, requireUser } from "@/lib/domureva/security/apiAuth.server";

/**
 * Authorise a case before using the service-role Supabase client.
 * Service-role queries bypass RLS, so every case-scoped endpoint must check
 * the property's creator or an explicit case membership first.
 */
export async function requireCaseAccess(request: Request, caseId: string) {
  const { user, supabaseAdmin } = await requireUser(request);
  const { data: record, error } = await supabaseAdmin
    .from("cases")
    .select("id, property_id, status, created_at, properties!inner(created_by, address_line, postcode, empty_since, owner_type, intended_use)")
    .eq("id", caseId)
    .maybeSingle();

  if (error) throw new ApiAuthError("CASE_LOOKUP_FAILED", 500);
  if (!record) throw new ApiAuthError("CASE_NOT_FOUND", 404);

  const property = Array.isArray(record.properties) ? record.properties[0] : record.properties;
  if (!property) throw new ApiAuthError("CASE_NOT_FOUND", 404);

  let caseRole = "owner";
  if (property.created_by !== user.id) {
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("case_members")
      .select("role")
      .eq("case_id", caseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) throw new ApiAuthError("CASE_ACCESS_CHECK_FAILED", 500);
    if (!membership) throw new ApiAuthError("FORBIDDEN", 403);
    caseRole = membership.role;
  }

  return { user, supabaseAdmin, record, property, caseRole };
}
