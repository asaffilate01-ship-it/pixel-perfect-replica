import { describe, expect, test } from "bun:test";
import { cleanEvidenceFilename, matchesFileSignature } from "../src/lib/domureva/documents/validation";

describe("Evidence validation", () => {
  test("rejects mismatched type and signature", () => {
    expect(matchesFileSignature("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(matchesFileSignature("application/pdf", new TextEncoder().encode("<script>"))).toBe(false);
    expect(matchesFileSignature("image/jpeg", Uint8Array.from([255, 216, 255, 1]))).toBe(true);
    expect(matchesFileSignature("image/png", Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    expect(matchesFileSignature("image/webp", new TextEncoder().encode("RIFF1234WEBP"))).toBe(true);
  });

  test("removes path injection and unsafe filename characters", () => {
    expect(cleanEvidenceFilename("../../Private\\evidence<>.pdf")).toBe("evidence__.pdf");
    expect(cleanEvidenceFilename("")).toBe("evidence");
  });
});
