/**
 * Case actions must be permitted by an explicit membership on the case.
 * Platform-wide roles never imply access to a particular owner's record.
 */
export type CaseRole =
  | "owner"
  | "investor"
  | "contractor"
  | "surveyor"
  | "housing_provider"
  | "council_officer"
  | "admin";

export type CaseAction =
  | "match_funding"
  | "request_quotes"
  | "submit_quote"
  | "complete_milestone"
  | "edit_financials"
  | "set_approved_funding"
  | "record_outcome"
  | "propose_award"
  | "upload_document"
  | "read_documents"
  | "preview_pack"
  | "export_pack"
  | "send_message"
  | "manage_tasks";

const ACTION_ROLES: Record<CaseAction, readonly CaseRole[]> = {
  match_funding: ["owner", "council_officer", "housing_provider", "admin"],
  request_quotes: ["owner", "council_officer", "housing_provider", "admin"],
  submit_quote: ["contractor", "admin"],
  complete_milestone: ["contractor", "surveyor", "council_officer", "admin"],
  edit_financials: ["owner", "council_officer", "housing_provider", "admin"],
  set_approved_funding: ["council_officer", "admin"],
  record_outcome: ["council_officer", "housing_provider", "admin"],
  propose_award: ["owner", "council_officer", "housing_provider", "admin"],
  upload_document: ["owner", "contractor", "surveyor", "housing_provider", "council_officer", "admin"],
  read_documents: ["owner", "investor", "contractor", "surveyor", "housing_provider", "council_officer", "admin"],
  preview_pack: ["owner", "investor", "housing_provider", "council_officer", "admin"],
  export_pack: ["owner", "housing_provider", "council_officer", "admin"],
  send_message: ["owner", "investor", "contractor", "surveyor", "housing_provider", "council_officer", "admin"],
  manage_tasks: ["owner", "housing_provider", "council_officer", "admin"],
};

export function canPerformCaseAction(role: string, action: CaseAction): boolean {
  return ACTION_ROLES[action].some((allowed) => allowed === role);
}
