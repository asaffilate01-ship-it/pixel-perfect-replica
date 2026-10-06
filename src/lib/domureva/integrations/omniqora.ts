import { AdapterResult } from "./base";

export type OmniqoraRun = {
  runId: string;
  jobId?: string;
  status: string;
};

type StartInput = {
  tenantId: string;
  caseRef: string;
  goal: string;
  context: Record<string, unknown>;
  sourceRefs?: string[];
  serviceKey?:
    | "domureva.funding-intelligence"
    | "omniqora.vacancy-scout"
    | "omniqora.property-intelligence";
};

function config() {
  const endpoint = process.env["OMNIQORA_INTELLIGENCE_URL"]?.trim();
  const token = process.env["OMNIQORA_SERVICE_TOKEN"]?.trim();
  if (!endpoint || !token || token.length < 32) return null;

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return { endpoint: url.toString(), token };
  } catch {
    return null;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function post(body: Record<string, unknown>): Promise<unknown> {
  const configured = config();
  if (!configured) throw new Error("Omniqora intelligence is not configured");

  const response = await fetch(configured.endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${configured.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      record(data) && typeof data.error === "string"
        ? data.error
        : `Omniqora request refused (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export class OmniqoraPropertyAdapter {
  name = "Omniqora Property Intelligence";

  async health(): Promise<AdapterResult<{ status: string }>> {
    return config()
      ? { ok: true, data: { status: "configured" } }
      : {
          ok: false,
          error: "OMNIQORA_INTELLIGENCE_URL/OMNIQORA_SERVICE_TOKEN not configured",
        };
  }

  async start(input: StartInput): Promise<AdapterResult<OmniqoraRun>> {
    try {
      const serviceKey = input.serviceKey ?? "domureva.funding-intelligence";
      const data = await post({
        operation: "run.start",
        tenantId: input.tenantId,
        productKey: "domureva",
        serviceKey,
        profile: serviceKey === "domureva.funding-intelligence" ? "finance" : "discovery",
        goal: input.goal,
        maxSteps: 8,
        inputVersion: "domureva.property-network.v1",
        context: { caseRef: input.caseRef, ...input.context },
        sourceRefs: input.sourceRefs ?? [],
      });

      if (!record(data) || typeof data.runId !== "string" || typeof data.status !== "string") {
        throw new Error("Invalid Omniqora run response");
      }
      return {
        ok: true,
        data: {
          runId: data.runId,
          status: data.status,
          ...(typeof data.jobId === "string" ? { jobId: data.jobId } : {}),
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Omniqora intelligence failed",
      };
    }
  }

  async get(
    tenantId: string,
    runId: string,
  ): Promise<AdapterResult<Record<string, unknown>>> {
    try {
      const data = await post({
        operation: "run.get",
        tenantId,
        productKey: "domureva",
        runId,
      });
      if (!record(data)) throw new Error("Invalid Omniqora run response");
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Omniqora run unavailable",
      };
    }
  }
}
