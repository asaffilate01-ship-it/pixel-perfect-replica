export type Entitlement={key:string;status:'active'|'inactive';validUntil?:string|null};
export function hasEntitlement(items:Entitlement[],key:string,now=new Date()){
 return items.some(x=>x.key===key&&x.status==='active'&&(!x.validUntil||new Date(x.validUntil)>now));
}
export const PLAN_ENTITLEMENTS={
 owner_free:['funding_basic'],
 owner_plus:['funding_basic','application_pack','priority_support'],
 contractor_pro:['contractor_quotes','opportunity_alerts'],
 provider:['provider_pipeline','provider_offers','portfolio_reporting'],
 council:['council_cases','council_map','council_reporting','rule_review']
} as const;
