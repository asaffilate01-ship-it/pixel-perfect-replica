export type WorkItem = { id:string; category:string; cost:number };
export type Scheme = {
  id:string;
  maxAward:number;
  eligibleCategories:string[];
  contributionRate?:number;
  priority?:number;
};
export type Allocation = {schemeId:string; workItemId:string; amount:number};

export function optimiseFundingStack(work:WorkItem[], schemes:Scheme[]):Allocation[]{
  const remaining = new Map(work.map(w=>[w.id, Math.max(0,w.cost)]));
  const schemeRemaining = new Map(schemes.map(s=>[s.id,Math.max(0,s.maxAward)]));
  const allocations:Allocation[]=[];
  const ordered=[...schemes].sort((a,b)=>(b.priority??0)-(a.priority??0));
  for(const s of ordered){
    for(const w of work){
      if(!s.eligibleCategories.includes(w.category)) continue;
      const workLeft=remaining.get(w.id)??0;
      const schemeLeft=schemeRemaining.get(s.id)??0;
      if(workLeft<=0||schemeLeft<=0) continue;
      const rate=Math.min(1,Math.max(0,s.contributionRate??1));
      const amount=Math.min(workLeft*rate,schemeLeft);
      if(amount<=0) continue;
      allocations.push({schemeId:s.id,workItemId:w.id,amount:Math.round(amount*100)/100});
      remaining.set(w.id,workLeft-amount);
      schemeRemaining.set(s.id,schemeLeft-amount);
    }
  }
  return allocations;
}

export function fundingSummary(work:WorkItem[], allocations:Allocation[]){
  const totalWorks=work.reduce((a,w)=>a+w.cost,0);
  const funded=allocations.reduce((a,x)=>a+x.amount,0);
  return {totalWorks:round(totalWorks), funded:round(funded), ownerContribution:round(Math.max(0,totalWorks-funded))};
}
const round=(n:number)=>Math.round(n*100)/100;
