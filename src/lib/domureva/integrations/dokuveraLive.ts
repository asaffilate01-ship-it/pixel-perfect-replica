import { signedPost } from "./http";

export const dokuveraLive = {
  createCase: (payload: unknown) =>
    signedPost(
      process.env["DOKUVERA_BASE_URL"],
      "/api/v1/cases",
      process.env["DOKUVERA_API_KEY"],
      payload,
      process.env["DOKUVERA_SIGNING_SECRET"],
    ),
  requestEvidence: (caseId: string, payload: unknown) =>
    signedPost(
      process.env["DOKUVERA_BASE_URL"],
      `/api/v1/cases/${caseId}/evidence-requests`,
      process.env["DOKUVERA_API_KEY"],
      payload,
      process.env["DOKUVERA_SIGNING_SECRET"],
    ),
};
