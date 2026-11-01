import { describe, expect, test } from "bun:test";
import { isSchemeCurrentlyActive } from "../src/lib/domureva/funding/scheme-validity";

describe("Reviewed scheme effective dates", () => {
  const date = "2026-10-31";
  test("a scheme with no published boundary remains provisional", () => {
    expect(isSchemeCurrentlyActive({ valid_from: null, valid_to: null }, date)).toBe(true);
  });
  test("includes inclusive first and final date", () => {
    const scheme = { valid_from: "2026-10-31", valid_to: "2026-10-31" };
    expect(isSchemeCurrentlyActive(scheme, date)).toBe(true);
  });
  test("excludes future, expired, and invalid date conditions", () => {
    expect(isSchemeCurrentlyActive({ valid_from: "2027-01-01", valid_to: null }, date)).toBe(false);
    expect(isSchemeCurrentlyActive({ valid_from: null, valid_to: "2025-12-31" }, date)).toBe(false);
    expect(isSchemeCurrentlyActive({ valid_from: "not-a-date", valid_to: null }, date)).toBe(false);
  });
});
