/** Aggregate only explicitly assigned council cases; no private owner data or coordinates. */
export type CouncilCaseRecord = {
  id: string;
  status: string;
  created_at: string;
  postcode: string;
  empty_since: string | null;
};

export type CouncilArea = { outcode: string; cases: number; byStatus: Record<string, number> };
export type CouncilPortfolio = {
  total: number;
  byStatus: Record<string, number>;
  byArea: CouncilArea[];
};

export function outwardCode(postcode: string): string {
  const compact = postcode.toUpperCase().replace(/\s+/g, "");
  if (!/^(GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(compact)) return "UNKNOWN";
  return compact.slice(0, -3);
}

export function groupCouncilPortfolio(records: CouncilCaseRecord[]): CouncilPortfolio {
  const seen = new Set<string>();
  const byStatus: Record<string, number> = {};
  const grouped = new Map<string, CouncilArea>();
  let total = 0;

  for (const record of records) {
    if (!record.id || seen.has(record.id)) continue;
    seen.add(record.id);
    total++;
    const status = record.status.trim() || "unknown";
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const outcode = outwardCode(record.postcode);
    const group = grouped.get(outcode) ?? { outcode, cases: 0, byStatus: {} };
    group.cases += 1;
    group.byStatus[status] = (group.byStatus[status] ?? 0) + 1;
    grouped.set(outcode, group);
  }
  return {
    total,
    byStatus,
    byArea: [...grouped.values()].sort((a, b) => b.cases - a.cases || a.outcode.localeCompare(b.outcode)),
  };
}
