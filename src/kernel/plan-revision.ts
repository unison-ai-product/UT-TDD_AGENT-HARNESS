import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";

export type PlanRevisionIdentity =
  | { kind: "admission"; token: string }
  | { kind: "legacy-content"; token: string };

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sha256(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/i.test(value);
}

function admittedRevision(admission: unknown, planId: string): { token: string } | undefined {
  if (!admission || typeof admission !== "object" || Array.isArray(admission)) return undefined;
  const receipt = admission as Record<string, unknown>;
  const binding = receipt.binding;
  const route = receipt.route;
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) return undefined;
  if (!route || typeof route !== "object" || Array.isArray(route)) return undefined;
  const bound = binding as Record<string, unknown>;
  const routed = route as Record<string, unknown>;
  const revision = Number(bound.revision);
  if (
    receipt.schema_version !== "v2" ||
    !nonEmpty(receipt.receipt_id) ||
    !nonEmpty(receipt.command_id) ||
    !nonEmpty(receipt.admitted_at) ||
    !sha256(receipt.source_digest) ||
    !sha256(receipt.decision_digest) ||
    !sha256(receipt.receipt_digest) ||
    bound.path !== `docs/plans/${planId}.md` ||
    bound.plan_id !== planId ||
    !nonEmpty(bound.asset_id) ||
    !Number.isSafeInteger(revision) ||
    revision <= 0 ||
    !sha256(bound.content_digest) ||
    !nonEmpty(routed.signal) ||
    !nonEmpty(routed.mode)
  )
    return undefined;
  return { token: String(revision) };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function frontmatterDocument(
  source: string,
): { frontmatter: Record<string, unknown>; body: string } | undefined {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return undefined;
  try {
    const parsed = parseYaml(match[1] ?? "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    return {
      frontmatter: parsed as Record<string, unknown>,
      body: (match[2] ?? "").replace(/\r\n/g, "\n"),
    };
  } catch {
    return undefined;
  }
}

/**
 * PLANのrevision identityを一意に解決する。
 * admission済みPLANは台帳revision、legacy PLANは自己参照するreview/admission証跡を
 * 除いたcanonical content digestを使う。完全なsource hashとは意図的に別物である。
 */
export function resolvePlanRevisionIdentity(
  source: string,
  expectedPlanId?: string,
): PlanRevisionIdentity | undefined {
  const document = frontmatterDocument(source);
  if (!document) return undefined;
  const planId = String(document.frontmatter.plan_id ?? "").trim();
  if (!planId || (expectedPlanId && planId !== expectedPlanId)) return undefined;

  const embeddedAdmission = document.frontmatter.admission_receipt;
  const admission = admittedRevision(embeddedAdmission, planId);
  if (admission) return { kind: "admission", token: admission.token };
  // receiptを名乗る壊れた/部分的な形をlegacyへ降格するとcustodyを迂回できる。
  if (embeddedAdmission !== undefined) return undefined;

  const canonicalFrontmatter = { ...document.frontmatter };
  delete canonicalFrontmatter.review_evidence;
  delete canonicalFrontmatter.admission_receipt;
  const digest = createHash("sha256")
    .update(canonicalJson({ frontmatter: canonicalFrontmatter, body: document.body }))
    .digest("hex");
  return { kind: "legacy-content", token: `legacy:sha256:${digest}` };
}
