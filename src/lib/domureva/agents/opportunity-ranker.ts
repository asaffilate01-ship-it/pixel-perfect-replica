export type OpportunitySignal={fundingFit:number; vacancyConfidence:number; deliveryReadiness:number; providerDemand:number; learnedOutcomeWeight:number};
export function rankOpportunity(s:OpportunitySignal){ const bounded=(n:number)=>Math.max(0,Math.min(1,n)); const score=100*(.30*bounded(s.fundingFit)+.20*bounded(s.vacancyConfidence)+.20*bounded(s.deliveryReadiness)+.15*bounded(s.providerDemand)+.15*bounded(s.learnedOutcomeWeight)); return Math.round(score); }
// Learning affects ranking only. It must never alter statutory funding eligibility rules.
