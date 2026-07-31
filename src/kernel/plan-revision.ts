import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";

export type PlanRevisionIdentity =
  | { kind: "admission"; token: string }
  | { kind: "legacy-content"; token: string };

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

  const admission = document.frontmatter.admission_receipt;
  if (admission && typeof admission === "object" && !Array.isArray(admission)) {
    const binding = (admission as Record<string, unknown>).binding;
    if (binding && typeof binding === "object" && !Array.isArray(binding)) {
      const revision = Number((binding as Record<string, unknown>).revision);
      if (Number.isSafeInteger(revision) && revision > 0)
        return { kind: "admission", token: String(revision) };
    }
  }

  const canonicalFrontmatter = { ...document.frontmatter };
  delete canonicalFrontmatter.review_evidence;
  delete canonicalFrontmatter.admission_receipt;
  const digest = createHash("sha256")
    .update(canonicalJson({ frontmatter: canonicalFrontmatter, body: document.body }))
    .digest("hex");
  return { kind: "legacy-content", token: `legacy:sha256:${digest}` };
}
