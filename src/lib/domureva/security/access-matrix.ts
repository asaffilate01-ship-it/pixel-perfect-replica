export const ACCESS_MATRIX={
 owner:['own_cases','own_documents','own_applications','own_quotes','own_messages'],
 contractor:['assigned_opportunities','own_quotes','awarded_projects','own_messages'],
 provider:['provider_opportunities','own_offers','accepted_cases','portfolio_reports','own_messages'],
 council:['authority_cases','authority_applications','authority_reports','rule_review','case_messages'],
 admin:['all_tenants','integrations','rule_review','security','billing','release']
} as const;
export function can(role:keyof typeof ACCESS_MATRIX,capability:string){
 return (ACCESS_MATRIX[role] as readonly string[]).includes(capability);
}
