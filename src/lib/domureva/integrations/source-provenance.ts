export type Provenance={sourceUrl:string; fetchedAt:string; sourceHash:string; confidence:number; reviewStatus:"pending"|"approved"|"rejected"};
export function publishable(p:Provenance){return p.reviewStatus==="approved"&&p.confidence>=0.75&&Boolean(p.sourceUrl&&p.sourceHash);}
