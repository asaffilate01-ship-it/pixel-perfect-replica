import { describe, expect, test } from "bun:test";

import { evaluateFunding, type SchemeRule } from "../src/lib/domureva/agents/funding";
import { rankOpportunity } from "../src/lib/domureva/agents/opportunity-ranker";
import { fundingSummary, optimiseFundingStack } from "../src/lib/domureva/funding/stack-optimizer";

const reviewedRule: SchemeRule = {
  id: "scheme-reviewed",
  status: "reviewed",
  authority: "Test council",
  maxAmount: 15000,
  minimumEmptyMonths: 6,
  eligibleOwnerTypes: ["owner"],
  eligibleUses: ["private_rent"],
  sourceId: "source-reviewed",
};

describe("Reva funding preliminary screening", () => {
  test("matches reviewed rules on property facts, but never grants approval", () => {
    const result = evaluateFunding(
      { emptyMonths: 8, ownerType: "owner", intendedUse: "private_rent" },
      [reviewedRule],
    );

    expect(result.output).toEqual([
      { schemeId: "scheme-reviewed", eligible: true, maxAmount: 15000 },
    ]);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.confidence).not.toBe("high");
    expect(result.sourceIds).toContain("source-reviewed");
    expect(result.reasons.join(" ")).toContain("Geography");
  });

  test("rejects a mismatch on the current preliminary criteria", () => {
    const result = evaluateFunding(
      { emptyMonths: 2, ownerType: "owner", intendedUse: "private_rent" },
      [reviewedRule],
    );

    expect(result.output[0]?.eligible).toBe(false);
    expect(result.requiresHumanReview).toBe(true);
  });

  test("never evaluates unreviewed or retired scheme rules", () => {
    const result = evaluateFunding(
      { emptyMonths: 24, ownerType: "owner", intendedUse: "private_rent" },
      [
        { ...reviewedRule, id: "scheme-draft", status: "draft" },
        { ...reviewedRule, id: "scheme-retired", status: "retired" },
      ],
    );

    expect(result.output).toEqual([]);
    expect(result.confidence).toBe("low");
    expect(result.sourceIds).toEqual([]);
  });
});

describe("Funding stack and opportunity scoring", () => {
  test("does not allocate more than the cost of an eligible work item", () => {
    const work = [{ id: "roof", category: "roof", cost: 1000 }];
    const allocations = optimiseFundingStack(work, [
      { id: "scheme-1", maxAward: 600, eligibleCategories: ["roof"], priority: 2 },
      { id: "scheme-2", maxAward: 900, eligibleCategories: ["roof"], priority: 1 },
    ]);
    expect(allocations.reduce((sum, item) => sum + item.amount, 0)).toBe(1000);
    expect(fundingSummary(work, allocations).ownerContribution).toBe(0);
  });


  test("applies each scheme's percentage to the original cost, not to the remainder", () => {
    const work = [{ id: "roof", category: "roof", cost: 1000 }];
    const allocations = optimiseFundingStack(work, [
      { id: "scheme-a", maxAward: 1000, eligibleCategories: ["roof"], contributionRate: 0.5, priority: 2 },
      { id: "scheme-b", maxAward: 1000, eligibleCategories: ["roof"], contributionRate: 0.5, priority: 1 },
    ]);
    expect(allocations).toEqual([
      { schemeId: "scheme-a", workItemId: "roof", amount: 500 },
      { schemeId: "scheme-b", workItemId: "roof", amount: 500 },
    ]);
    expect(fundingSummary(work, allocations)).toEqual({
      totalWorks: 1000, funded: 1000, ownerContribution: 0,
    });
  });

  test("enforces a scheme award cap across multiple works, including penny rounding", () => {
    const work = [
      { id: "a", category: "roof", cost: 15.01 },
      { id: "b", category: "roof", cost: 20.01 },
    ];
    const allocations = optimiseFundingStack(work, [
      { id: "scheme", maxAward: 20.02, eligibleCategories: ["roof"], contributionRate: 0.75 },
    ]);
    const total = allocations.reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
    expect(total).toBeLessThanOrEqual(2002);
    expect(allocations.filter((item) => item.workItemId === "a")[0]?.amount).toBe(11.25);
  });

  test("rejects non-finite costs, duplicate work identifiers and impossible rates", () => {
    expect(() => optimiseFundingStack([{ id: "bad", category: "roof", cost: Infinity }], [])).toThrow();
    expect(() => optimiseFundingStack([
      { id: "duplicate", category: "roof", cost: 100 },
      { id: "duplicate", category: "roof", cost: 100 },
    ], [])).toThrow();
    expect(() => optimiseFundingStack([], [
      { id: "scheme", maxAward: 100, eligibleCategories: ["roof"], contributionRate: 1.5 },
    ])).toThrow();
  });

  test("bounds source signals before ranking", () => {
    expect(rankOpportunity({
      fundingFit: 2,
      vacancyConfidence: 2,
      deliveryReadiness: 2,
      providerDemand: 2,
      learnedOutcomeWeight: 2,
    })).toBe(100);
    expect(rankOpportunity({
      fundingFit: -1,
      vacancyConfidence: -1,
      deliveryReadiness: -1,
      providerDemand: -1,
      learnedOutcomeWeight: -1,
    })).toBe(0);
  });
});
