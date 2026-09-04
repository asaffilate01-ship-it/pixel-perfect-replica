import {AgentDecision} from './types';
export type SchemeRule={id:string;status:'draft'|'reviewed'|'retired';authority:string;maxAmount:number|null;minimumEmptyMonths:number|null;eligibleOwnerTypes:string[];eligibleUses:string[];sourceId:string};
export type PropertyFacts={emptyMonths:number;ownerType:string;intendedUse:string};
export function evaluateFunding(f:PropertyFacts,rules:SchemeRule[]):AgentDecision<{schemeId:string;eligible:boolean;maxAmount:number|null}[]>{
 const reviewed=rules.filter(r=>r.status==='reviewed');
 const output=reviewed.map(r=>({schemeId:r.id,eligible:(r.minimumEmptyMonths==null||f.emptyMonths>=r.minimumEmptyMonths)&&r.eligibleOwnerTypes.includes(f.ownerType)&&r.eligibleUses.includes(f.intendedUse),maxAmount:r.maxAmount}));
 return {agent:'Reva Fund',output,confidence:reviewed.length?'high':'low',reasons:['Only human-reviewed rules were evaluated.'],sourceIds:reviewed.map(r=>r.sourceId),requiresHumanReview:false,modelVersion:'rules-v1'};
}
