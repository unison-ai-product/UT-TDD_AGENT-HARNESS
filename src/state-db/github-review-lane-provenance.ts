import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { parse as parseYaml, stringify } from "yaml";
import { parseTrackedReceiptProjection } from "../kernel/github-closure-receipt.ts";

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

/** PLANのrevision identityを一意に解決する。 */
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
  if (embeddedAdmission !== undefined) return undefined;

  const canonicalFrontmatter = { ...document.frontmatter };
  delete canonicalFrontmatter.review_evidence;
  delete canonicalFrontmatter.admission_receipt;
  const digest = createHash("sha256")
    .update(canonicalJson({ frontmatter: canonicalFrontmatter, body: document.body }))
    .digest("hex");
  return { kind: "legacy-content", token: `legacy:sha256:${digest}` };
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function canonicalPlanPath(repoRoot: string, source: string): string | undefined {
  if (!/^docs\/plans\/[^/]+\.md$/.test(source)) return undefined;
  const root = resolve(repoRoot);
  const path = resolve(root, ...source.split("/"));
  const rel = relative(root, path);
  return rel && !rel.startsWith(`..${sep}`) && rel !== ".." ? path : undefined;
}

function sourceFrontmatter(
  repoRoot: string,
  source: string,
  expectedPlanId: string,
): Record<string, unknown> | undefined {
  const path = canonicalPlanPath(repoRoot, source);
  if (!path) return undefined;
  try {
    const physicalRoot = realpathSync(resolve(repoRoot));
    const physicalPath = realpathSync(path);
    const physicalRelative = relative(physicalRoot, physicalPath);
    if (!physicalRelative || physicalRelative === ".." || physicalRelative.startsWith(`..${sep}`))
      return undefined;
    const content = readFileSync(physicalPath, "utf8");
    const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!block) return undefined;
    const frontmatter = parseYaml(block[1] ?? "") as Record<string, unknown>;
    return text(frontmatter.plan_id) === expectedPlanId ? frontmatter : undefined;
  } catch {
    return undefined;
  }
}

function sourceContent(repoRoot: string, source: string): string | undefined {
  const path = canonicalPlanPath(repoRoot, source);
  if (!path) return undefined;
  try {
    const physicalRoot = realpathSync(resolve(repoRoot));
    const physicalPath = realpathSync(path);
    const physicalRelative = relative(physicalRoot, physicalPath);
    if (!physicalRelative || physicalRelative === ".." || physicalRelative.startsWith(`..${sep}`))
      return undefined;
    return readFileSync(physicalPath, "utf8");
  } catch {
    return undefined;
  }
}

function canonicalPlanContentDigest(content: string): string | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(content);
  if (!match) return undefined;
  try {
    const parsed = parseYaml(match[1] ?? "");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const frontmatter = { ...(parsed as Record<string, unknown>) };
    if (typeof frontmatter.plan_id !== "string" || !frontmatter.plan_id.trim()) return undefined;
    delete frontmatter.admission_receipt;
    return `sha256:${createHash("sha256")
      .update(`${stringify(frontmatter)}---\n${match[2] ?? ""}`)
      .digest("hex")}`;
  } catch {
    return undefined;
  }
}

function trackedReceiptProjectionContent(repoRoot: string): string | undefined {
  const root = resolve(repoRoot);
  const path = resolve(root, "docs", "governance", "plan-admission-receipts.json");
  try {
    const physicalRoot = realpathSync(root);
    const physicalPath = realpathSync(path);
    const rel = relative(physicalRoot, physicalPath);
    if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) return undefined;
    return readFileSync(physicalPath, "utf8");
  } catch {
    return undefined;
  }
}

export function canonicalPlanRevision(repoRoot: string, planId: string): string | undefined {
  if (!/^PLAN-[A-Za-z0-9-]+$/.test(planId)) return undefined;
  const source = `docs/plans/${planId}.md`;
  const content = sourceContent(repoRoot, source);
  if (!content) return undefined;
  const identity = resolvePlanRevisionIdentity(content, planId);
  if (!identity || identity.kind === "legacy-content") return identity?.token;
  const frontmatter = sourceFrontmatter(repoRoot, source, planId);
  const receipt = frontmatter?.admission_receipt;
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return undefined;
  const embedded = receipt as Record<string, unknown>;
  const binding = embedded.binding as Record<string, unknown> | undefined;
  const projectionContent = trackedReceiptProjectionContent(repoRoot);
  if (!binding || !projectionContent) return undefined;
  const projection = parseTrackedReceiptProjection(projectionContent);
  if (!projection.ok) return undefined;
  const projected = projection.value.lookup(text(embedded.command_id));
  const contentDigest = canonicalPlanContentDigest(content);
  if (
    !projected ||
    projected.receiptId !== text(embedded.receipt_id) ||
    projected.receiptDigest !== text(embedded.receipt_digest) ||
    projected.decisionDigest !== text(embedded.decision_digest) ||
    projected.binding.path !== binding.path ||
    projected.binding.planId !== binding.plan_id ||
    projected.binding.assetId !== binding.asset_id ||
    projected.binding.revision !== Number(binding.revision) ||
    projected.binding.contentDigest !== binding.content_digest ||
    contentDigest !== binding.content_digest
  )
    return undefined;
  return identity.token;
}
