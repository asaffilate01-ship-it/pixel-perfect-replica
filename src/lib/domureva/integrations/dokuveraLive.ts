import { signedPost } from './http';
export const dokuveraLive={createCase:(payload:unknown)=>signedPost(process.env.DOKUVERA_BASE_URL,'/api/v1/cases',process.env.DOKUVERA_API_KEY,payload)};
