export type ManifestItem={id:string;kind:'document'|'funding_source'|'assessment'|'quote'|'certificate';sha256?:string;sourceUrl?:string;verifiedAt?:string};
export type ApplicationPackManifest={caseId:string;generatedAt:string;items:ManifestItem[];manifestHash:string};

export async function makeManifest(caseId:string, items:ManifestItem[]):Promise<ApplicationPackManifest>{
 const stable=JSON.stringify({caseId,items:[...items].sort((a,b)=>a.id.localeCompare(b.id))});
 const bytes=new TextEncoder().encode(stable);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const manifestHash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
 return {caseId,generatedAt:new Date().toISOString(),items,manifestHash};
}
