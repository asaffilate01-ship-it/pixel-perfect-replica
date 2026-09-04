import { signedPost } from './http';
export const leadLensLive={discover:(payload:unknown)=>signedPost(process.env.LEADLENS_BASE_URL,'/api/v1/domureva/discover',process.env.LEADLENS_API_KEY,payload)};
