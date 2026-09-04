import { signedPost } from './http';
export const gableyRetrofitLive={requestAssessment:(payload:unknown)=>signedPost(process.env["GABLEY_RETROFIT_BASE_URL"],'/api/v1/assessments',process.env["GABLEY_RETROFIT_API_KEY"],payload)};
