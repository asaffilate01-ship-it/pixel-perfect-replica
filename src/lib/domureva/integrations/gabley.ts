import { AdapterResult, IntegrationAdapter } from "./base";
import { signedPost } from "./http";

export type GableyFundingAssessment = {
  operation: "funding.assessment";
  agencyId: string;
  opportunityId: string;
  domurevaCaseRef: string;
  checkedAt: string;
  reviewStatus: "approved";
  assessment: {
    eligibility: "eligible" | "potentially_eligible" | "ineligible" | "unknown";
    schemes: Array<{
      schemeRef: string;
      name: string;
      fundingType: "grant" | "loan" | "guarantee" | "energy_support" | "other";
      maximumAmount: number | null;
      conditions: string[];
      sourceUrl: string;
      sourceCheckedAt: string;
    }>;
    fundingSummary?: {
      totalWorks: number;
      funded: number;
      ownerContribution: number;
    };
    warnings: string[];
  };
};

type GableyPushResponse = {
  ok: boolean;
  opportunityId: string;
  domurevaCaseRef: string;
};

function configuredBase() {
  const raw = process.env["GABLEY_API_URL"]?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export class GableyAdapter extends IntegrationAdapter {
  name = "Gabley";

  async health(): Promise<AdapterResult<{ status: string }>> {
    const base = configuredBase();
    const token = process.env["GABLEY_SYNC_SECRET"]?.trim();
    return base && token && token.length >= 32
      ? { ok: true, data: { status: "configured" } }
      : { ok: false, error: "GABLEY_API_URL/GABLEY_SYNC_SECRET not configured" };
  }

  async pushFundingAssessment(
    payload: GableyFundingAssessment,
  ): Promise<AdapterResult<GableyPushResponse>> {
    if (payload.reviewStatus !== "approved") {
      return {
        ok: false,
        error: "Only approved funding assessments may be sent to Gabley",
      };
    }

    const base = configuredBase();
    const token = process.env["GABLEY_SYNC_SECRET"]?.trim();
    if (!base || !token || token.length < 32) {
      return { ok: false, error: "Gabley integration is not configured" };
    }

    try {
      const data = await signedPost(base, "/api/integrations/domureva", token, payload);
      return { ok: true, data: data as GableyPushResponse };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Gabley integration failed",
      };
    }
  }
}
