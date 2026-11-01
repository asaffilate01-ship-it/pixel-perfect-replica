/** Only date-bounded human-reviewed rules should be considered in a live screen. */
export function isSchemeCurrentlyActive(
  scheme: { valid_from: string | null; valid_to: string | null },
  currentDate = new Date().toISOString().slice(0, 10),
): boolean {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const from = scheme.valid_from;
  const to = scheme.valid_to;
  if (!iso.test(currentDate)) return false;
  if (from && (!iso.test(from) || currentDate < from)) return false;
  if (to && (!iso.test(to) || currentDate > to)) return false;
  return true;
}
