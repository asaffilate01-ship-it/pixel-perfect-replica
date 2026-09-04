export type CouncilCaseMetric={status:string;fundingApproved:number;refurbValue:number;bedroomsReturned:number;completed:boolean;daysToOccupation?:number};
export function councilImpact(items:CouncilCaseMetric[]){
 const completed=items.filter(x=>x.completed);
 const avgDays=completed.length?completed.reduce((a,x)=>a+(x.daysToOccupation||0),0)/completed.length:0;
 return {
  cases:items.length,
  homesReturned:completed.length,
  bedroomsReturned:completed.reduce((a,x)=>a+x.bedroomsReturned,0),
  fundingApproved:round(items.reduce((a,x)=>a+x.fundingApproved,0)),
  refurbishmentValue:round(items.reduce((a,x)=>a+x.refurbValue,0)),
  averageDaysToOccupation:Math.round(avgDays)
 };
}
const round=(n:number)=>Math.round(n*100)/100;
