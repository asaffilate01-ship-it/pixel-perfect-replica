import {LearningOutcome} from './types';
// Learning is deliberately limited to ranking/priority weights. It never mutates statutory scheme rules.
export function rankSignal(outcomes:LearningOutcome[]){
 const approved=outcomes.filter(o=>o.event==='funding_approved').length;
 const rejected=outcomes.filter(o=>o.event==='funding_rejected').length;
 const completion=outcomes.filter(o=>o.event==='project_completed').length;
 return {approvalSignal:(approved+1)/(approved+rejected+2),completionSignal:(completion+1)/(outcomes.length+2),sampleSize:outcomes.length};
}
