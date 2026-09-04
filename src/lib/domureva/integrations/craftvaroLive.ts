import { signedPost } from './http';
export const craftvaroLive={publishOpportunity:(payload:unknown)=>signedPost(process.env["CRAFTVARO_BASE_URL"],'/api/v1/opportunities',process.env["CRAFTVARO_API_KEY"],payload)};
