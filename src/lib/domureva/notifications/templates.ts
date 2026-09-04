export type NotificationTemplateKey='funding_change'|'evidence_request'|'application_update'|'provider_offer'|'quote_received'|'milestone_update';
export function renderNotification(key:NotificationTemplateKey,data:Record<string,string>){
 const m={
  funding_change:['Funding scheme updated',`A funding scheme relevant to ${data.property||'your property'} has changed and is under review.`],
  evidence_request:['Evidence required',`DOMUREVA needs ${data.item||'additional evidence'} to progress your case.`],
  application_update:['Application update',`Your application status is now ${data.status||'updated'}.`],
  provider_offer:['New housing-provider offer',`${data.provider||'A provider'} has made an offer on your DOMUREVA case.`],
  quote_received:['New contractor quote',`A new quote has been received for ${data.property||'your project'}.`],
  milestone_update:['Project milestone updated',`${data.milestone||'A project milestone'} is now ${data.status||'updated'}.`]
 } as const;
 const [title,body]=m[key]; return {title,body};
}
