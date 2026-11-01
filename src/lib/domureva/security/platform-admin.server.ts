import { ApiAuthError, requireUser } from "@/lib/domureva/security/apiAuth.server";

/**
 * Global funding-rule and release controls must NOT use organisation-scoped
 * "admin" roles. The platform operator allowlist is server configuration.
 * If missing, the endpoint fails closed until provisioned by an operator.
 */
export async function requirePlatformAdmin(request: Request) {
  const session = await requireUser(request);
  const allowed = process.env["DOMUREVA_PLATFORM_ADMIN_USER_IDS"];
  const ids = (allowed ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);

  if (!ids.length || !ids.includes(session.user.id)) {
    throw new ApiAuthError("PLATFORM_ADMIN_REQUIRED", 403);
  }
  return session;
}
