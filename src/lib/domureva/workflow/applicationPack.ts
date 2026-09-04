export type Requirement={status:'missing'|'provided'|'verified'|'waived',required:boolean};
export function readiness(items:Requirement[]){const required=items.filter(x=>x.required);if(!required.length)return 100;const done=required.filter(x=>x.status==='provided'||x.status==='verified'||x.status==='waived').length;return Math.round(done/required.length*100)}
export function canSubmit(items:Requirement[]){return items.filter(x=>x.required).every(x=>x.status==='provided'||x.status==='verified'||x.status==='waived')}
