export type WorkItem = { id: string; category: string; cost: number };
export type Scheme = {
  id: string;
  maxAward: number;
  eligibleCategories: string[];
  contributionRate?: number;
  priority?: number;
};
export type Allocation = { schemeId: string; workItemId: string; amount: number };

const pennies = (amount: number) => Math.round(amount * 100);
const money = (pence: number) => pence / 100;

/**
 * Preliminary allocation over *known costed work items* only.
 * Integer-penny arithmetic prevents rounding from overcommitting a work item
 * or an award cap. Scheme rate is a fraction of the ORIGINAL item cost, not
 * a fraction of the amount left after another scheme's allocation.
 *
 * This does not certify geography, subsidy compliance or double-funding
 * compatibility and must never be treated as an award decision.
 */
export function optimiseFundingStack(work: WorkItem[], schemes: Scheme[]): Allocation[] {
  const remaining = new Map<string, number>();
  const itemCost = new Map<string, number>();
  for (const item of work) {
    if (!item.id || !item.category || !Number.isFinite(item.cost) || item.cost < 0 || remaining.has(item.id)) {
      throw new Error("INVALID_OR_DUPLICATE_WORK_ITEM");
    }
    const cost = pennies(item.cost);
    remaining.set(item.id, cost);
    itemCost.set(item.id, cost);
  }

  const caps = new Map<string, number>();
  for (const scheme of schemes) {
    if (
      !scheme.id ||
      caps.has(scheme.id) ||
      !Number.isFinite(scheme.maxAward) ||
      scheme.maxAward < 0 ||
      !Number.isFinite(scheme.contributionRate ?? 1) ||
      (scheme.contributionRate ?? 1) < 0 ||
      (scheme.contributionRate ?? 1) > 1
    ) {
      throw new Error("INVALID_OR_DUPLICATE_SCHEME");
    }
    caps.set(scheme.id, pennies(scheme.maxAward));
  }

  const allocations: Allocation[] = [];
  const ranked = [...schemes].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id));
  for (const scheme of ranked) {
    const rate = scheme.contributionRate ?? 1;
    for (const item of work) {
      if (!scheme.eligibleCategories.includes(item.category)) continue;
      const left = remaining.get(item.id) ?? 0;
      const capLeft = caps.get(scheme.id) ?? 0;
      const rateCap = Math.floor((itemCost.get(item.id) ?? 0) * rate + 1e-8);
      const amount = Math.min(left, capLeft, rateCap);
      if (amount <= 0) continue;
      allocations.push({ schemeId: scheme.id, workItemId: item.id, amount: money(amount) });
      remaining.set(item.id, left - amount);
      caps.set(scheme.id, capLeft - amount);
    }
  }
  return allocations;
}

export function fundingSummary(work: WorkItem[], allocations: Allocation[]) {
  const total = work.reduce((sum, item) => sum + pennies(item.cost), 0);
  const allocated = allocations.reduce((sum, item) => sum + pennies(item.amount), 0);
  return {
    totalWorks: money(total),
    funded: money(allocated),
    ownerContribution: money(Math.max(0, total - allocated)),
  };
}
