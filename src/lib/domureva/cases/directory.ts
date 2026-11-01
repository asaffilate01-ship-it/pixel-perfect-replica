import { supabase } from "@/integrations/supabase/client";

export type CaseDirectoryItem = {
  id: string;
  status: string;
  created_at: string;
  properties: { postcode: string; address_line: string | null } | null;
  caseRole: string;
};
export type CaseDirectory = {
  cases: CaseDirectoryItem[];
  limitedTo: number;
  scope: "owned_or_explicit_member";
};

/** Authorised owner and invited participant case selector. No direct service-key access in clients. */
export async function loadCaseDirectory(): Promise<CaseDirectory> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your session has expired. Sign in again.");
  const response = await fetch("/api/cases/list", {
    headers: { Authorization: "Bearer " + session.access_token },
  });
  const data = await response.json() as CaseDirectory & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Cases could not be loaded.");
  return data;
}
