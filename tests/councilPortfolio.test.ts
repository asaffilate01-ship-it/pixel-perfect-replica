import { describe, expect, test } from "bun:test";
import { groupCouncilPortfolio, outwardCode } from "../src/lib/domureva/council/portfolio";

describe("Council postcode-district portfolio", () => {
  test("shows only district-level information", () => {
    expect(outwardCode("lu1 2aa")).toBe("LU1");
    expect(outwardCode("SW1A 1AA")).toBe("SW1A");
    expect(outwardCode("bad data")).toBe("UNKNOWN");
  });

  test("aggregates unique authorised case IDs without leaking property addresses", () => {
    const records = [
      { id: "case-1", status: "funding", created_at: "2026-10-01", postcode: "LU1 2AA", empty_since: null },
      { id: "case-2", status: "works", created_at: "2026-10-02", postcode: "LU1 2AB", empty_since: null },
      { id: "case-3", status: "intake", created_at: "2026-10-03", postcode: "LU4 3AB", empty_since: null },
      { id: "case-1", status: "funding", created_at: "2026-10-01", postcode: "LU1 2AA", empty_since: null },
    ];
    const portfolio = groupCouncilPortfolio(records);
    expect(portfolio.total).toBe(3);
    expect(portfolio.byStatus).toEqual({ funding: 1, works: 1, intake: 1 });
    expect(portfolio.byArea).toEqual([
      { outcode: "LU1", cases: 2, byStatus: { funding: 1, works: 1 } },
      { outcode: "LU4", cases: 1, byStatus: { intake: 1 } },
    ]);
    expect(JSON.stringify(portfolio)).not.toContain("2AA");
  });

  test("returns a genuine zero-data portfolio", () => {
    expect(groupCouncilPortfolio([])).toEqual({ total: 0, byStatus: {}, byArea: [] });
  });
});
