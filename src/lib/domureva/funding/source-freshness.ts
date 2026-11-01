/** Editorial review freshness gate, not a statutory scheme-expiry rule. */
export function hasRecentSourceCheck(
  timestamp: string | null,
  now = new Date(),
  maxDays = 90,
): boolean {
  if (!timestamp || !Number.isInteger(maxDays) || maxDays < 1) return false;
  const checked = Date.parse(timestamp);
  if (!Number.isFinite(checked)) return false;
  const elapsed = now.getTime() - checked;
  return elapsed >= 0 && elapsed <= maxDays * 86_400_000;
}
