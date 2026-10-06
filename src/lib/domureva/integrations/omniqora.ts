import { AdapterResult } from "./base";

export type OmniqoraRun = { runId:string; jobId?:string; status:string };
type StartInput={
  tenantId:string;
  caseRef:string;
  goal:string;
  context:Record<string,unknown>;
  sourceRefs?:string[];
  serviceKey?:"domureva.funding-intelligence"|"omniqora.vacancy-scout"|"omniqora.property-intelligence";
};

function config(){
 const endpoint=process.env["OMNIQORA_INTELLIGENCE_URL"]?.trim();
 const token=process.env["OMNIQORA_SERVICE_TOKEN"]?.trim();
 if(!endpoint||!token||token.length<32)return null;
 try{
  const url=new URL(endpoint);
  if(url.protocol!=="https:"||url.username||url.password)return null;
  return {endpoint:url.toString(),token};
 }catch{return null;}
}

async function post(body:Record<string,unknown>){
 const c=config();if(!c)throw new Error("Omniqora intelligence is not configured");
 const response=await fetch(c.endpoint,{method:"POST",headers:{authorization:`Bearer ${c.token}`,"content-type":"application/json"},
  body:JSON.stringify(body),signal:AbortSignal.timeout(30_000)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error((data as any)?.error||`Omniqora request refused (${response.status})`);
 return data;
}

export class OmniqoraPropertyAdapter{
 name="Omniqora Property Intelligence";

 async health():Promise<AdapterResult<{status:string}>>{
  return config()?{ok:true,data:{status:"configured"}}:{ok:false,error:"OMNIQORA_INTELLIGENCE_URL/OMNIQORA_SERVICE_TOKEN not configured"};
 }

 async start(input:StartInput):Promise<AdapterResult<OmniqoraRun>>{
  try{
   const serviceKey=input.serviceKey??"domureva.funding-intelligence";
   const data=await post({
    operation:"run.start",tenantId:input.tenantId,productKey:"domureva",serviceKey,
    profile:serviceKey==="domureva.funding-intelligence"?"finance":"discovery",
    goal:input.goal,maxSteps:8,inputVersion:"domureva.property-network.v1",
    context:{caseRef:input.caseRef,...input.context},
    sourceRefs:input.sourceRefs??[],
   });
   if(typeof (data as any)?.runId!=="string")throw new Error("Invalid Omniqora run response");
   return {ok:true,data:data as OmniqoraRun};
  }catch(error){return {ok:false,error:error instanceof Error?error.message:"Omniqora intelligence failed"};}
 }

 async get(tenantId:string,runId:string):Promise<AdapterResult<Record<string,unknown>>>{
  try{
   const data=await post({operation:"run.get",tenantId,productKey:"domureva",runId});
   return {ok:true,data:data as Record<string,unknown>};
  }catch(error){return {ok:false,error:error instanceof Error?error.message:"Omniqora run unavailable"};}
 }
}
