import { buildPackSpec, type PackSection } from "@/lib/domureva/applications/pdf-spec";
import { makeManifest, type ManifestItem } from "@/lib/domureva/application-pack/manifest";

type SupabaseAdmin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

function assertSuccess(error: { message: string } | null) {
  if (error) throw new Error("PACK_DATA_UNAVAILABLE");
}

export async function buildCasePackPreview(
  supabaseAdmin: SupabaseAdmin,
  caseId: string,
  property: { postcode: string; address_line: string | null },
) {
  const [matched, documents, evidence, works, applications] = await Promise.all([
    supabaseAdmin.from("funding_matches").select("scheme_id,eligible,confidence").eq("case_id", caseId).eq("eligible", true).limit(50),
    supabaseAdmin.from("case_documents").select("id,filename,sha256,verified_at").eq("case_id", caseId).limit(100),
    supabaseAdmin.from("evidence_items").select("id,kind,sha256,verified").eq("case_id", caseId).limit(100),
    supabaseAdmin.from("funding_work_items").select("id,description,estimated_cost").eq("case_id", caseId).limit(100),
    supabaseAdmin.from("funding_applications").select("id,scheme_id,status").eq("case_id", caseId).limit(50),
  ]);
  for (const result of [matched, documents, evidence, works, applications]) {
    assertSuccess(result.error);
  }

  const ids = [...new Set((matched.data ?? []).map((row) => row.scheme_id))];
  const schemeQuery = ids.length
    ? await supabaseAdmin.from("funding_schemes")
      .select("id,name,authority,source_id,status,valid_from,valid_to")
      .eq("status", "reviewed")
      .in("id", ids)
    : { data: [], error: null };
  assertSuccess(schemeQuery.error);

  const schemes = schemeQuery.data ?? [];
  const sourceIds = [...new Set(schemes.map((scheme) => scheme.source_id))];
  const sourceQuery = sourceIds.length
    ? await supabaseAdmin.from("source_records")
      .select("id,source_url,last_checked_at")
      .in("id", sourceIds)
    : { data: [], error: null };
  assertSuccess(sourceQuery.error);
  const sourceById = new Map((sourceQuery.data ?? []).map((source) => [source.id, source]));

  const evidenceItems: PackSection["items"] = [
    ...(documents.data ?? []).map((doc) => ({
      label: doc.filename,
      status: doc.verified_at && doc.sha256 ? "ready" as const : "review" as const,
      documentId: doc.id,
    })),
    ...(evidence.data ?? []).map((item) => ({
      label: item.kind,
      status: item.verified && item.sha256 ? "ready" as const : "review" as const,
      documentId: item.id,
    })),
  ];
  if (evidenceItems.length === 0) evidenceItems.push({ label: "Property evidence not yet supplied", status: "missing" });

  // A preliminary match is deliberately never treated as a funding award.
  const fundingItems: PackSection["items"] = schemes.length
    ? schemes.map((scheme) => ({
      label: `${scheme.name} (${scheme.authority}) — preliminary match; confirm rules with authority`,
      status: "review" as const,
      ...(sourceById.get(scheme.source_id)?.source_url
        ? { sourceUrl: sourceById.get(scheme.source_id)!.source_url }
        : {}),
    }))
    : [{ label: "No eligible human-reviewed scheme match confirmed", status: "missing" }];

  const worksItems: PackSection["items"] = (works.data ?? []).length
    ? (works.data ?? []).map((work) => ({
      label: `${work.description} — £${Number(work.estimated_cost).toFixed(2)} estimated`,
      status: "review" as const,
    }))
    : [{ label: "Costed schedule of works not yet recorded", status: "missing" }];

  const sections: PackSection[] = [
    { title: "Preliminary funding and authority review", required: true, items: fundingItems },
    { title: "Evidence and provenance", required: true, items: evidenceItems },
    { title: "Costed works and funding compatibility", required: true, items: worksItems },
  ];

  const items: ManifestItem[] = [
    ...(documents.data ?? []).map((doc) => ({
      id: doc.id,
      kind: "document" as const,
      ...(doc.sha256 ? { sha256: doc.sha256 } : {}),
      ...(doc.verified_at ? { verifiedAt: doc.verified_at } : {}),
    })),
    ...(evidence.data ?? []).map((item) => ({
      id: item.id,
      kind: "document" as const,
      ...(item.sha256 ? { sha256: item.sha256 } : {}),
    })),
    ...schemes.map((scheme) => ({
      id: scheme.source_id,
      kind: "funding_source" as const,
      ...(sourceById.get(scheme.source_id)?.source_url
        ? { sourceUrl: sourceById.get(scheme.source_id)!.source_url }
        : {}),
    })),
  ];
  const manifest = await makeManifest(caseId, items);
  const spec = buildPackSpec({
    caseId,
    propertyAddress: [property.address_line, property.postcode].filter(Boolean).join(", "),
    schemeTitle: schemes.length ? schemes.map((scheme) => scheme.name).join(", ") : "No reviewed scheme confirmed",
    eligibilitySummary: "Preliminary funding matching only. Geographic eligibility, terms, compatibility and award must be verified with the administering authority.",
    sections,
  });

  return {
    status: "preview" as const,
    spec,
    manifest,
    counts: {
      preliminaryMatches: schemes.length,
      recordedApplications: (applications.data ?? []).length,
      documentCount: (documents.data ?? []).length,
      verifiedDocuments: (documents.data ?? []).filter((doc) => Boolean(doc.verified_at)).length,
      evidenceItems: (evidence.data ?? []).length,
      costedWorkItems: (works.data ?? []).length,
    },
    requiresHumanReview: true as const,
    readyForSubmission: false as const,
    exportFormat: "json-audit-manifest" as const,
    note: "This is a working case audit preview, not a PDF, funding approval or submitted application.",
  };
}
