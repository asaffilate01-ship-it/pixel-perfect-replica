export type Rule = {key:string; op:'eq'|'gte'|'lte'|'in'; value:unknown; sourceUrl:string; reviewed:boolean};
export type EligibilityResult={eligible:boolean; matched:string[]; failed:string[]; unreviewed:string[]};

export function evaluateEligibility(facts:Record<string,unknown>, rules:Rule[]):EligibilityResult{
  const matched:string[]=[]; const failed:string[]=[]; const unreviewed:string[]=[];
  for(const r of rules){
    if(!r.reviewed){unreviewed.push(r.key); continue;}
    const actual=facts[r.key];
    let ok=false;
    if(r.op==='eq') ok=actual===r.value;
    if(r.op==='gte') ok=Number(actual)>=Number(r.value);
    if(r.op==='lte') ok=Number(actual)<=Number(r.value);
    if(r.op==='in') ok=Array.isArray(r.value)&&r.value.includes(actual);
    (ok?matched:failed).push(r.key);
  }
  return {eligible:failed.length===0&&unreviewed.length===0,matched,failed,unreviewed};
}
