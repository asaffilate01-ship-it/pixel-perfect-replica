import { z } from "zod";

import { normalisePostcode, type Nation, type PostcodeContext } from "@/lib/domureva/funding/geography";

const resultSchema = z.object({
  status: z.literal(200),
  result: z.object({
    postcode: z.string(),
    outcode: z.string(),
    country: z.enum(["England", "Scotland", "Wales", "Northern Ireland"]),
    admin_district: z.string().nullable().optional(),
    codes: z.object({ admin_district: z.string().nullable().optional() }).optional(),
  }),
});

const nationMap: Record<string, Nation> = {
  England: "england",
  Scotland: "scotland",
  Wales: "wales",
  "Northern Ireland": "northern_ireland",
};

/** Validate provider records before using them for scheme jurisdiction screening. */
export function parsePostcodeLookup(rawPostcode: string, payload: unknown): PostcodeContext | null {
  let postcode: string;
  try { postcode = normalisePostcode(rawPostcode); }
  catch { return null; }

  const parsed = resultSchema.safeParse(payload);
  if (!parsed.success) return null;
  const data = parsed.data.result;
  let returned: string;
  try { returned = normalisePostcode(data.postcode); }
  catch { return null; }
  if (returned !== postcode) return null;

  const code = data.codes?.admin_district;
  const validCode = code && /^[EWSN]\d{8}$/i.test(code) && !code.endsWith("99999999")
    ? code.toUpperCase()
    : null;

  return {
    postcode,
    outcode: postcode.split(" ")[0]!,
    nation: nationMap[data.country]!,
    localAuthorityCode: validCode,
    authorityName: data.admin_district ?? null,
  };
}

/**
 * Fail closed when a postcode is unresolved. Postcodes.io supplies indicative
 * administrative boundaries, not official funding approval. Only the postcode
 * (not name, street or case ID) is sent to the provider.
 */
export async function resolvePostcodeContext(
  rawPostcode: string,
  fetcher: typeof fetch = fetch,
): Promise<PostcodeContext | null> {
  let postcode: string;
  try { postcode = normalisePostcode(rawPostcode); }
  catch { return null; }

  if (process.env["DOMUREVA_POSTCODE_LOOKUP_DISABLED"] === "true") return null;
  try {
    const response = await fetcher(
      "https://api.postcodes.io/postcodes/" + encodeURIComponent(postcode.replace(/\s/g, "")),
      { method: "GET", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) return null;
    const raw = await response.json() as unknown;
    return parsePostcodeLookup(postcode, raw);
  } catch {
    return null;
  }
}
