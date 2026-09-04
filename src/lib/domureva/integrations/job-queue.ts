export type IntegrationName='leadlens'|'dokuvera'|'gabley'|'gabley_retrofit'|'craftvaro';
export type IntegrationJob={integration:IntegrationName;jobType:string;caseId?:string;payload:unknown};
export function nextRetry(attempt:number, now=Date.now()){
 const capped=Math.min(Math.max(attempt,0),8);
 return new Date(now+Math.pow(2,capped)*60_000).toISOString();
}
export function canRetry(attempt:number){return attempt<8;}
