import { publishable, type Provenance } from "./source-provenance";
import { GableyAdapter, type GableyFundingAssessment } from "./gabley";
import { OmniqoraPropertyAdapter } from "./omniqora";

export type ReviewedScheme={
 schemeRef:string;
 name:string;
 fundingType:"grant"|"loan"|"guarantee"|"energy_support"|"other";
 maximumAmount:number|null;
 conditions:string[];
 provenance:Provenance;
};

export function toApprovedGableyAssessment(input:{
 agencyId:string;
 opportunityId:string;
 caseRef:string;
 eligibility:"eligible"|"potentially_eligible"|"ineligible"|"unknown";
 schemes:ReviewedScheme[];
 warnings?:string[];
 fundingSummary?:{totalWorks:number;funded:number;ownerContribution:number};
}):GableyFundingAssessment{
 for(const scheme of input.schemes){
  if(!publishable(scheme.provenance))throw new Error(`Scheme ${scheme.schemeRef} is not approved for publication`);
 }
 return {
  operation:"funding.assessment",agencyId:input.agencyId,opportunityId:input.opportunityId,
  domurevaCaseRef:input.caseRef,checkedAt:new Date().toISOString(),reviewStatus:"approved",
  assessment:{
   eligibility:input.eligibility,
   schemes:input.schemes.map(s=>({
    schemeRef:s.schemeRef,name:s.name,fundingType:s.fundingType,maximumAmount:s.maximumAmount,conditions:s.conditions,
    sourceUrl:s.provenance.sourceUrl,sourceCheckedAt:s.provenance.fetchedAt,
   })),
   ...(input.fundingSummary?{fundingSummary:input.fundingSummary}:{}),
   warnings:input.warnings??[],
  },
 };
}

export async function publishFundingToGabley(input:Parameters<typeof toApprovedGableyAssessment>[0]){
 const payload=toApprovedGableyAssessment(input);
 return new GableyAdapter().pushFundingAssessment(payload);
}

export async function startRegenerationIntelligence(input:{
 tenantId:string;caseRef:string;propertyFacts:Record<string,unknown>;sourceRefs?:string[];
}){
 return new OmniqoraPropertyAdapter().start({
  tenantId:input.tenantId,caseRef:input.caseRef,serviceKey:"domureva.funding-intelligence",
  goal:"Assess the supplied property case against reviewed regeneration/funding evidence. Identify missing facts and conflicts. Do not claim eligibility where a scheme rule or source is unreviewed; the administering authority makes the final decision.",
  context:input.propertyFacts,sourceRefs:input.sourceRefs,
 });
}
