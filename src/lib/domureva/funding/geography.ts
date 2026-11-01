/** Narrow, auditable geography rules; unknown restrictions must never be counted as eligible. */
export type Nation = "england" | "scotland" | "wales" | "northern_ireland";
export type PostcodeContext = {
  postcode: string;
  outcode: string;
  nation: Nation;
  localAuthorityCode: string | null;
  authorityName: string | null;
};
export type GeographyDecision = {
  status: "matched" | "excluded" | "review_required";
  reason: string;
};

export function normalisePostcode(value: string): string {
  const clean = value.toUpperCase().replace(/\s+/g, "");
  if (!/^(GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(clean)) {
    throw new Error("INVALID_UK_POSTCODE");
  }
  return clean.slice(0, -3) + " " + clean.slice(-3);
}

const recognisedKeys = new Set([
  "scope", "nations", "nation", "postcodes", "outcodes", "local_authority_codes",
]);

function normaliseNation(value: string): Nation | null {
  const name = value.toLowerCase().trim().replace(/[- ]+/g, "_");
  if (name === "england" || name === "scotland" || name === "wales" || name === "northern_ireland") {
    return name;
  }
  return null;
}
function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || !item.trim())) {
    return null;
  }
  return value as string[];
}

/** Evaluate only explicitly modelled conditions. The evaluation is fail-closed for missing data. */
export function evaluateSchemeGeography(geography: unknown, location: PostcodeContext | null): GeographyDecision {
  if (!location) return { status: "review_required", reason: "Postcode authority could not be verified" };
  if (!geography || typeof geography !== "object" || Array.isArray(geography)) {
    return { status: "review_required", reason: "Scheme geography is not structured" };
  }
  const rules = geography as Record<string, unknown>;
  const keys = Object.keys(rules);
  if (!keys.length || keys.some((key) => !recognisedKeys.has(key))) {
    return { status: "review_required", reason: "Scheme geography is missing or contains unsupported restrictions" };
  }

  let hasConstraint = false;
  if ("scope" in rules) {
    if (rules["scope"] !== "uk") {
      return { status: "review_required", reason: "Scheme jurisdiction is not explicitly supported" };
    }
    hasConstraint = true;
  }

  const country = "nation" in rules ? [rules["nation"]] : ("nations" in rules ? rules["nations"] : undefined);
  if (country !== undefined) {
    const names = stringList(country);
    const nations = names?.map(normaliseNation);
    if (!nations || nations.some((name) => !name)) {
      return { status: "review_required", reason: "Invalid or unrecognised country restriction" };
    }
    hasConstraint = true;
    if (!nations.includes(location.nation)) {
      return { status: "excluded", reason: "Property is outside the scheme country" };
    }
  }

  if ("postcodes" in rules) {
    const provided = stringList(rules["postcodes"]);
    if (!provided) return { status: "review_required", reason: "Invalid postcode restriction" };
    const allowed: string[] = [];
    for (const code of provided) {
      try { allowed.push(normalisePostcode(code)); }
      catch { return { status: "review_required", reason: "Invalid scheme postcode list" }; }
    }
    hasConstraint = true;
    if (!allowed.includes(location.postcode)) {
      return { status: "excluded", reason: "Property postcode is outside scheme coverage" };
    }
  }

  if ("outcodes" in rules) {
    const allowed = stringList(rules["outcodes"]);
    if (!allowed || allowed.some((code) => !/^[A-Z]{1,2}\d[A-Z\d]?$/i.test(code))) {
      return { status: "review_required", reason: "Invalid postcode district list" };
    }
    hasConstraint = true;
    if (!allowed.map((code) => code.toUpperCase()).includes(location.outcode)) {
      return { status: "excluded", reason: "Property postcode district is outside scheme coverage" };
    }
  }

  if ("local_authority_codes" in rules) {
    const allowed = stringList(rules["local_authority_codes"]);
    if (!allowed || allowed.some((code) => !/^[EWSN]\d{8}$/i.test(code))) {
      return { status: "review_required", reason: "Invalid authority code restriction" };
    }
    if (!location.localAuthorityCode) {
      return { status: "review_required", reason: "Local authority code is not available" };
    }
    hasConstraint = true;
    if (!allowed.map((code) => code.toUpperCase()).includes(location.localAuthorityCode.toUpperCase())) {
      return { status: "excluded", reason: "Property is outside the scheme local authority" };
    }
  }

  return hasConstraint
    ? { status: "matched", reason: "Published geographical restrictions match the resolved postcode" }
    : { status: "review_required", reason: "Scheme geography contains no valid coverage rule" };
}
