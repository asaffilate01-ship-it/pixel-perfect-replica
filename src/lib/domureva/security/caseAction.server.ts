import { ApiAuthError } from "@/lib/domureva/security/apiAuth.server";
import { requireCaseAccess } from "@/lib/domureva/security/caseAccess.server";
import { canPerformCaseAction, type CaseAction } from "@/lib/domureva/security/casePermissions";

/** Always authorize before invoking service-role Supabase queries or external APIs. */
export async function requireCaseAction(request: Request, caseId: string, action: CaseAction) {
  const access = await requireCaseAccess(request, caseId);
  if (!canPerformCaseAction(access.caseRole, action)) {
    throw new ApiAuthError("FORBIDDEN", 403);
  }
  return access;
}
