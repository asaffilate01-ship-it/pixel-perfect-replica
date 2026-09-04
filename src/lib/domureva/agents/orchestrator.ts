import { evaluateFunding, PropertyFacts, SchemeRule } from './funding';

export type AgentTask = 'discover'|'fund'|'assess'|'retrofit'|'match'|'verify'|'learn';
export type OrchestrationResult = {
  next: AgentTask[];
  blockers: string[];
  humanReviewRequired: boolean;
};

export function planAgents(input:{hasProperty:boolean;hasReviewedSchemes:boolean;hasAssessment:boolean;hasFundingMatch:boolean;hasEvidence:boolean;hasQuoteRequest:boolean;}):OrchestrationResult {
  const next:AgentTask[]=[]; const blockers:string[]=[];
  if(!input.hasProperty) blockers.push('Property facts are required before agents can run.');
  if(input.hasProperty && !input.hasReviewedSchemes) next.push('discover');
  if(input.hasProperty && input.hasReviewedSchemes) next.push('fund');
  if(input.hasProperty && !input.hasAssessment) next.push('assess');
  if(input.hasAssessment) next.push('retrofit');
  if(input.hasFundingMatch && !input.hasQuoteRequest) next.push('match');
  if(input.hasEvidence) next.push('verify');
  if(input.hasFundingMatch || input.hasQuoteRequest) next.push('learn');
  return { next:[...new Set(next)], blockers, humanReviewRequired: !input.hasReviewedSchemes };
}

export function runFundingAgent(facts:PropertyFacts,rules:SchemeRule[]){return evaluateFunding(facts,rules);}
