import { describe, expect, test } from "bun:test";
import { canPerformCaseAction, type CaseAction } from "../src/lib/domureva/security/casePermissions";

describe("Case action permissions", () => {
  test("a contractor cannot propose a contract award or change financial approvals", () => {
    expect(canPerformCaseAction("contractor", "propose_award")).toBe(false);
    expect(canPerformCaseAction("contractor", "set_approved_funding")).toBe(false);
    expect(canPerformCaseAction("contractor", "complete_milestone")).toBe(true);
  });

  test("a property owner can request quotes but cannot certify grant funding", () => {
    expect(canPerformCaseAction("owner", "request_quotes")).toBe(true);
    expect(canPerformCaseAction("owner", "set_approved_funding")).toBe(false);
  });

  test("council officers can approve funding amounts only when joined to that case", () => {
    expect(canPerformCaseAction("council_officer", "set_approved_funding")).toBe(true);
    expect(canPerformCaseAction("council_officer", "record_outcome")).toBe(true);
  });

  test("unknown roles are always denied", () => {
    const actions: CaseAction[] = [
      "match_funding", "request_quotes", "complete_milestone", "edit_financials",
      "set_approved_funding", "record_outcome", "propose_award", "upload_document",
      "read_documents", "preview_pack", "export_pack", "send_message",
    ];
    for (const action of actions) {
      expect(canPerformCaseAction("anonymous", action)).toBe(false);
      expect(canPerformCaseAction("", action)).toBe(false);
    }
  });
});
