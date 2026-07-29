import { readFileSync, realpathSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { parse as parseYaml } from "yaml";
import type { HarnessDb } from "../state-db/index";
import {
  type ReviewReceiptSource,
  reviewReceiptDigest,
  validCrossReviewSource,
} from "./closure-receipt";

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

function sourceEntries(
  repoRoot: string,
  source: string,
  expectedPlanId: string,
): Record<string, unknown>[] {
  const path = canonicalPlanPath(repoRoot, source);
  if (!path) return [];
  try {
    const physicalRoot = realpathSync(resolve(repoRoot));
    const physicalPath = realpathSync(path);
    const physicalRelative = relative(physicalRoot, physicalPath);
    if (!physicalRelative || physicalRelative === ".." || physicalRelative.startsWith(`..${sep}`))
      return [];
    const content = readFileSync(physicalPath, "utf8");
    const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!block) return [];
    const frontmatter = parseYaml(block[1] ?? "") as Record<string, unknown>;
    if (text(frontmatter.plan_id) !== expectedPlanId) return [];
    return Array.isArray(frontmatter.review_evidence)
      ? frontmatter.review_evidence.filter(
          (entry): entry is Record<string, unknown> =>
            Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
        )
      : [];
  } catch {
    return [];
  }
}

function validCitations(repoRoot: string, citations: readonly string[]): boolean {
  try {
    const physicalRoot = realpathSync(resolve(repoRoot));
    return citations.every((citation) => {
      const match = citation.match(/^(.+):([1-9][0-9]*)$/);
      if (!match || /^[A-Za-z]:|^[/\\]/.test(match[1] ?? "")) return false;
      const path = realpathSync(resolve(physicalRoot, ...(match[1] ?? "").split("/")));
      const rel = relative(physicalRoot, path);
      if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) return false;
      const line = Number(match[2]);
      return line <= readFileSync(path, "utf8").split(/\r?\n/).length;
    });
  } catch {
    return false;
  }
}

function matchesSourceEntry(entry: Record<string, unknown>, source: ReviewReceiptSource): boolean {
  const citations = Array.isArray(entry.citations) ? entry.citations.map(text).filter(Boolean) : [];
  return (
    text(entry.review_kind) === source.reviewKind &&
    text(entry.verdict) === source.verdict &&
    text(entry.reviewed_at) === source.reviewedAt &&
    text(entry.tests_green_at) === source.testsGreenAt &&
    text(entry.worker_model) === source.workerModel &&
    text(entry.reviewer_model) === source.reviewerModel &&
    text(entry.lane) === source.lane &&
    text(entry.plan_revision) === source.planRevision &&
    text(entry.subject_head) === source.headSha &&
    Number(entry.attack_trials ?? 0) === source.attackTrials &&
    JSON.stringify(citations) === JSON.stringify(source.citations)
  );
}

export function verifiedReviewLaneDigests(
  db: HarnessDb,
  input: {
    repoRoot: string;
    planId: string;
    planRevision: string;
    headSha: string;
  },
): { claimBlind: string; specBlind: string } | undefined {
  const rows = db
    .prepare(
      `SELECT lane, verdict, reviewed_at, tests_green_at, worker_model,
              reviewer_model, attack_trials, citations_json, source
         FROM github_review_lane_receipts
        WHERE plan_id = ? AND plan_revision = ? AND subject_head = ?
        ORDER BY lane, reviewed_at DESC, rowid DESC`,
    )
    .all(input.planId, input.planRevision, input.headSha);
  const digests = new Map<string, string>();
  for (const row of rows) {
    const lane = text(row.lane);
    if (digests.has(lane) || !["claim-blind", "spec-blind"].includes(lane)) continue;
    let citations: string[] = [];
    try {
      const parsed = JSON.parse(text(row.citations_json));
      if (Array.isArray(parsed)) citations = parsed.map(text).filter(Boolean);
    } catch {
      continue;
    }
    const source: ReviewReceiptSource = {
      planId: input.planId,
      planRevision: input.planRevision,
      headSha: input.headSha,
      reviewKind: "cross_agent",
      verdict: text(row.verdict),
      reviewedAt: text(row.reviewed_at),
      testsGreenAt: text(row.tests_green_at),
      workerModel: text(row.worker_model),
      reviewerModel: text(row.reviewer_model),
      source: text(row.source),
      lane: lane as ReviewReceiptSource["lane"],
      attackTrials: Number(row.attack_trials ?? 0),
      citations,
    };
    const matchingEntries = sourceEntries(input.repoRoot, source.source, input.planId).filter(
      (entry) => matchesSourceEntry(entry, source),
    );
    if (
      validCrossReviewSource(source) &&
      validCitations(input.repoRoot, source.citations) &&
      matchingEntries.length === 1
    )
      digests.set(lane, reviewReceiptDigest(source));
  }
  const claimBlind = digests.get("claim-blind");
  const specBlind = digests.get("spec-blind");
  return claimBlind && specBlind ? { claimBlind, specBlind } : undefined;
}
