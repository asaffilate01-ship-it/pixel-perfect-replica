export type Confidence='low'|'medium'|'high';
export type AgentDecision<T>={agent:string;output:T;confidence:Confidence;reasons:string[];sourceIds:string[];requiresHumanReview:boolean;modelVersion:string};
export type LearningOutcome={caseId:string;event:'funding_approved'|'funding_rejected'|'quote_accepted'|'provider_interested'|'project_completed'|'evidence_failed';features:Record<string,string|number|boolean|null>;target:number;occurredAt:string};
