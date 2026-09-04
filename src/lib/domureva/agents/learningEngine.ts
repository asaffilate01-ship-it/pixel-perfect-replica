export type WeightedOutcome={event:string;features:Record<string,string|number|boolean>};
const POSITIVE=new Set(['funding_approved','quote_accepted','provider_interested','project_completed']);
const NEGATIVE=new Set(['funding_rejected','quote_rejected','provider_declined','project_failed']);
export function learnWeights(outcomes:WeightedOutcome[]){
 const stats=new Map<string,{pos:number;neg:number}>();
 for(const o of outcomes){const delta=POSITIVE.has(o.event)?1:NEGATIVE.has(o.event)?-1:0;if(!delta)continue;for(const [k,v] of Object.entries(o.features)){const key=`${k}:${String(v)}`;const s=stats.get(key)||{pos:0,neg:0};if(delta>0)s.pos++;else s.neg++;stats.set(key,s)}}
 return [...stats.entries()].map(([feature,s])=>{const n=s.pos+s.neg;const probability=(s.pos+2)/(n+4);return {feature,weight:Number((0.5+probability).toFixed(4)),sampleSize:n}});
}
export function scoreWithWeights(base:number,features:Record<string,string|number|boolean>,weights:Map<string,number>){let score=base;let count=0;for(const [k,v] of Object.entries(features)){const w=weights.get(`${k}:${String(v)}`);if(w){score*=w;count++}}return Math.max(0,Math.min(1,count?score:base));}
