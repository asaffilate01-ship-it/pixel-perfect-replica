export type AdapterResult<T>={ok:boolean;data?:T;error?:string;externalId?:string};
export abstract class IntegrationAdapter {abstract name:string; abstract health():Promise<AdapterResult<{status:string}>>;}
