import {IntegrationAdapter,AdapterResult} from './base';
export class DokuveraAdapter extends IntegrationAdapter{name='Dokuvera';async health():Promise<AdapterResult<{status:string}>>{return process.env.DOKUVERA_API_URL?{ok:true,data:{status:'configured'}}:{ok:false,error:'DOKUVERA_API_URL not configured'}}}
