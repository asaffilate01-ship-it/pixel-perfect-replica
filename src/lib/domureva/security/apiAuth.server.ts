import type { User } from "@supabase/supabase-js";

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function getBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1];
}

type SupabaseAdmin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

export async function requireUser(
  request: Request,
): Promise<{ user: User; supabaseAdmin: SupabaseAdmin }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = getBearerToken(request);
  if (!token) throw new ApiAuthError("UNAUTHENTICATED", 401);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new ApiAuthError("UNAUTHENTICATED", 401);
  return { user: data.user, supabaseAdmin };
}

export async function requireRole(
  request: Request,
  roles: string[] | string,
): Promise<{ user: User; supabaseAdmin: SupabaseAdmin }> {
  const wanted = Array.isArray(roles) ? roles : [roles];
  const { user, supabaseAdmin } = await requireUser(request);
  const { data: rows, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (error) throw new ApiAuthError(error.message, 400);
  const hasRole = (rows ?? []).some((r) => wanted.includes(r.role));
  if (!hasRole) throw new ApiAuthError("FORBIDDEN", 403);
  return { user, supabaseAdmin };
}

export function errorResponse(e: unknown, fallbackStatus = 400): Response {
  if (e instanceof ApiAuthError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  const message = e instanceof Error ? e.message : "Invalid request";
  return Response.json({ error: message }, { status: fallbackStatus });
}

export const requireApiUser = requireUser;
export const requireApiRole = requireRole;
