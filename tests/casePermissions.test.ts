import { describe, expect, test } from "bun:test";
import { canPerformCaseAction, type CaseAction } from "../src/lib/domureva/security/casePermissions";

describe("Case action permissions", () => {
  test("a contractor cannot propose a contract award or change financial approvals", () => {
    expect(canPerformCaseAction("contractor", "propose_award")).toBe(false);
    expect(canPerformCaseAction("contractor", "set_approved_funding")).toBe(false);
    expect(canPerformCaseAction("contractor", "complete_milestone")).toBe(true);
    expect(canPerformCaseAction("contractor", "submit_quote")).toBe(true);
  });

  test("a property owner can request quotes but cannot certify grant funding", () => {
    expect(canPerformCaseAction("owner", "request_quotes")).toBe(true);
    expect(canPerformCaseAction("owner", "set_approved_funding")).toBe(false);
  });

  test("council officers can approve funding amounts only when joined to that case", () => {
    expect(canPerformCaseAction("council_officer", "set_approved_funding")).toBe(true);
    expect(canPerformCaseAction("council_officer", "record_outcome")).toBe(true);
  });

  test("only case managers can create and govern tasks", () => {
    expect(canPerformCaseAction("owner", "manage_tasks")).toBe(true);
    expect(canPerformCaseAction("council_officer", "manage_tasks")).toBe(true);
    expect(canPerformCaseAction("housing_provider", "manage_tasks")).toBe(true);
    expect(canPerformCaseAction("contractor", "manage_tasks")).toBe(false);
    expect(canPerformCaseAction("surveyor", "manage_tasks")).toBe(false);
    expect(canPerformCaseAction("investor", "manage_tasks")).toBe(false);
    expect(canPerformCaseAction("contractor", "send_message")).toBe(true);
  });

  test("unknown roles are always denied", () => {
    const actions: CaseAction[] = [
      "match_funding", "request_quotes", "submit_quote", "complete_milestone", "edit_financials",
      "set_approved_funding", "record_outcome", "propose_award", "upload_document",
      "read_documents", "preview_pack", "export_pack", "send_message", "manage_tasks",
    ];
    for (const action of actions) {
      expect(canPerformCaseAction("anonymous", action)).toBe(false);
      expect(canPerformCaseAction("", action)).toBe(false);
    }
  });
});
