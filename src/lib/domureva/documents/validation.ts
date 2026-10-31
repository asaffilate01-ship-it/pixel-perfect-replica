export const MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;

export const EVIDENCE_MIME_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type EvidenceMime = keyof typeof EVIDENCE_MIME_TYPES;

export function isEvidenceMime(value: string): value is EvidenceMime {
  return Object.prototype.hasOwnProperty.call(EVIDENCE_MIME_TYPES, value);
}

/** Reject obviously spoofed MIME types. This is NOT a malware scan. */
export function matchesFileSignature(mime: EvidenceMime, content: Uint8Array): boolean {
  if (mime === "application/pdf") {
    return content.length >= 5 && String.fromCharCode(...content.slice(0, 5)) === "%PDF-";
  }
  if (mime === "image/jpeg") {
    return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  }
  if (mime === "image/png") {
    return content.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => content[i] === b);
  }
  return (
    content.length >= 12 &&
    String.fromCharCode(...content.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...content.slice(8, 12)) === "WEBP"
  );
}

export function cleanEvidenceFilename(name: string): string {
  const lastPart = name.split(/[\\/]/).pop() ?? "evidence";
  return lastPart.replace(/[^a-zA-Z0-9.() _-]/g, "_").slice(0, 160) || "evidence";
}
