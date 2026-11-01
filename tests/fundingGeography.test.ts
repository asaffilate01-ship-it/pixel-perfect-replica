import { describe, expect, test } from "bun:test";
import {
  evaluateSchemeGeography,
  normalisePostcode,
  type PostcodeContext,
} from "../src/lib/domureva/funding/geography";
import { hasRecentSourceCheck } from "../src/lib/domureva/funding/source-freshness";
import { parsePostcodeLookup } from "../src/lib/domureva/funding/postcode.server";

const luton: PostcodeContext = {
  postcode: "LU1 2AA",
  outcode: "LU1",
  nation: "england",
  localAuthorityCode: "E06000032",
  authorityName: "Luton",
};

describe("UK postcode and scheme geography screening", () => {
  test("normalises a full UK postcode", () => {
    expect(normalisePostcode("lu1 2aa")).toBe("LU1 2AA");
    expect(normalisePostcode("SW1A1AA")).toBe("SW1A 1AA");
    expect(() => normalisePostcode("LU1")).toThrow("INVALID_UK_POSTCODE");
  });

  test("requires explicit scheme coverage, never accepts missing or unknown conditions", () => {
    expect(evaluateSchemeGeography({}, luton).status).toBe("review_required");
    expect(evaluateSchemeGeography({ postcodes: ["LU1 2AA"], unreviewed_boundary: "abc" }, luton).status)
      .toBe("review_required");
    expect(evaluateSchemeGeography({ scope: "national" }, luton).status).toBe("review_required");
    expect(evaluateSchemeGeography({ scope: "uk" }, null).status).toBe("review_required");
  });

  test("can match explicit country, authority and district combinations", () => {
    expect(evaluateSchemeGeography({
      nations: ["england"],
      local_authority_codes: ["E06000032"],
      outcodes: ["LU1"],
    }, luton).status).toBe("matched");
    expect(evaluateSchemeGeography({ scope: "uk" }, luton).status).toBe("matched");
    expect(evaluateSchemeGeography({ postcodes: ["lu1 2aa"] }, luton).status).toBe("matched");
  });

  test("excludes out-of-scope properties, even when other conditions match", () => {
    expect(evaluateSchemeGeography({ nations: ["wales"] }, luton).status).toBe("excluded");
    expect(evaluateSchemeGeography({ local_authority_codes: ["E09000033"] }, luton).status)
      .toBe("excluded");
    expect(evaluateSchemeGeography({ outcodes: ["AL10"] }, luton).status).toBe("excluded");
    expect(evaluateSchemeGeography({ postcodes: ["LU4 1AB"] }, luton).status).toBe("excluded");
  });

  test("invalid and unavailable authority codes never produce a positive match", () => {
    expect(evaluateSchemeGeography({ local_authority_codes: ["invalid"] }, luton).status)
      .toBe("review_required");
    expect(evaluateSchemeGeography({ local_authority_codes: ["E06000032"] }, {
      ...luton, localAuthorityCode: null,
    }).status).toBe("review_required");
  });

  test("parses and validates third-party postcode context without leaking case details", () => {
    const payload = {
      status: 200,
      result: {
        postcode: "LU1 2AA",
        outcode: "LU1",
        country: "England",
        admin_district: "Luton",
        codes: { admin_district: "E06000032" },
      },
    };
    expect(parsePostcodeLookup("lu12aa", payload)).toEqual(luton);
    expect(parsePostcodeLookup("lu12aa", { ...payload, result: {
      ...payload.result, postcode: "SW1A 1AA",
    } })).toBeNull();
    expect(parsePostcodeLookup("lu12aa", { status: 404, result: null })).toBeNull();
  });

  test("requires a recent source inspection rather than assuming an old link remains valid", () => {
    const now = new Date("2026-11-01T12:00:00Z");
    expect(hasRecentSourceCheck("2026-10-28T09:00:00Z", now)).toBe(true);
    expect(hasRecentSourceCheck("2025-10-28T09:00:00Z", now)).toBe(false);
    expect(hasRecentSourceCheck(null, now)).toBe(false);
    expect(hasRecentSourceCheck("bad timestamp", now)).toBe(false);
    expect(hasRecentSourceCheck("2026-11-03T09:00:00Z", now)).toBe(false);
  });
});
