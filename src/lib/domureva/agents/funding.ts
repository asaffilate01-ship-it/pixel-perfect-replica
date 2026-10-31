import type { AgentDecision } from "./types";

export type SchemeRule = {
  id: string;
  status: "draft" | "reviewed" | "retired";
  authority: string;
  maxAmount: number | null;
  minimumEmptyMonths: number | null;
  eligibleOwnerTypes: string[];
  eligibleUses: string[];
  sourceId: string;
};

export type PropertyFacts = {
  emptyMonths: number;
  ownerType: string;
  intendedUse: string;
};

/**
 * Preliminary screening only: this evaluator does NOT check geography,
 * scheme start/end dates, eligible works or discretionary conditions.
 * An administering authority must confirm any grant or loan decision.
 */
export function evaluateFunding(
  facts: PropertyFacts,
  rules: SchemeRule[],
): AgentDecision<Array<{ schemeId: string; eligible: boolean; maxAmount: number | null }>> {
  const reviewed = rules.filter((rule) => rule.status === "reviewed");
  const output = reviewed.map((rule) => ({
    schemeId: rule.id,
    eligible:
      (rule.minimumEmptyMonths == null || facts.emptyMonths >= rule.minimumEmptyMonths) &&
      rule.eligibleOwnerTypes.includes(facts.ownerType) &&
      rule.eligibleUses.includes(facts.intendedUse),
    maxAmount: rule.maxAmount,
  }));

  return {
    agent: "Reva Fund",
    output,
    confidence: reviewed.length > 0 ? "medium" : "low",
    reasons: [
      "Preliminary screen uses only human-reviewed ownership, use and vacancy-duration criteria.",
      "Geography, scheme validity dates, eligible work categories and discretionary requirements still need verification.",
      "A preliminary match is not eligibility confirmation or an approved grant.",
    ],
    sourceIds: reviewed.map((rule) => rule.sourceId),
    requiresHumanReview: true,
    modelVersion: "rules-preliminary-v2",
  };
}
