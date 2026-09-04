export const CASE_STAGES = ['intake','assessment','funding','application','quotes','works','evidence','complete'] as const;
export type CaseStage = typeof CASE_STAGES[number];
export function nextStage(stage: CaseStage): CaseStage {
  const i = CASE_STAGES.indexOf(stage);
  return CASE_STAGES[Math.min(i + 1, CASE_STAGES.length - 1)]!;
}
export function progressFor(stage: CaseStage) {
  const i = CASE_STAGES.indexOf(stage);
  return Math.round((i / (CASE_STAGES.length - 1)) * 100);
}
