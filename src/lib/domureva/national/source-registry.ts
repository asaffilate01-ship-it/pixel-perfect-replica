export type Nation='england'|'wales'|'scotland'|'northern_ireland';
export type FundingSource={key:string;nation:Nation;kind:'national'|'local_authority'|'housing_provider'|'procurement';enabled:boolean};
export const FUNDING_SOURCE_REGISTRY:FundingSource[]=[
 {key:'govuk-housing',nation:'england',kind:'national',enabled:true},
 {key:'homes-england',nation:'england',kind:'national',enabled:true},
 {key:'english-local-authorities',nation:'england',kind:'local_authority',enabled:true},
 {key:'welsh-government-housing',nation:'wales',kind:'national',enabled:true},
 {key:'welsh-local-authorities',nation:'wales',kind:'local_authority',enabled:true},
 {key:'scottish-government-housing',nation:'scotland',kind:'national',enabled:true},
 {key:'scottish-local-authorities',nation:'scotland',kind:'local_authority',enabled:true},
 {key:'ni-housing',nation:'northern_ireland',kind:'national',enabled:true},
 {key:'ni-councils',nation:'northern_ireland',kind:'local_authority',enabled:true},
];
