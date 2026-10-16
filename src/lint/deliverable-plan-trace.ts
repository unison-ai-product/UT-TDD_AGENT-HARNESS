import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  analyzeArtifactOwnership,
  type DuplicateArtifactOwnershipFinding,
} from "./artifact-ownership.ts";
import {
  collectCandidateOracleCitationSites,
  collectOracleCitationSites,
} from "./oracle-test-citation.ts";
import { collectOracleDeclarationSites } from "./oracle-test-trace.ts";
import { normalizePath } from "./shared.ts";

const CANDIDATE_ID = /(?<![A-Z0-9-])CANDIDATE-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{3}(?![A-Z0-9-])/g;

export interface DeliverablePlanTraceFinding {
  kind: "orphan-deliverable" | "stale-deliverable-trace-debt";
  artifactPath: string;
}

export type DeliverableTraceFinding =
  | DeliverablePlanTraceFinding
  | DuplicateArtifactOwnershipFinding;

export interface DeliverablePlanTraceResult {
  findings: DeliverableTraceFinding[];
  ok: boolean;
}

export interface TestDesignOwnershipSite {
  id: string;
  declarationPath: string;
  declarationLine: number;
  testPath: string;
  citationLine: number;
  kind: "formal" | "candidate";
}

export function analyzeDeliverablePlanTrace(input: {
  artifactFiles: readonly string[];
  tracedPaths: ReadonlySet<string>;
  baseline: ReadonlyMap<string, string>;
}): DeliverablePlanTraceResult {
  const untraced = input.artifactFiles.filter((path) => !input.tracedPaths.has(path)).sort();
  const findings: DeliverablePlanTraceFinding[] = [
    ...untraced
      .filter((path) => !input.baseline.has(path))
      .map((artifactPath) => ({ kind: "orphan-deliverable" as const, artifactPath })),
    ...[...input.baseline.keys()]
      .filter((path) => !untraced.includes(path))
      .sort()
      .map((artifactPath) => ({ kind: "stale-deliverable-trace-debt" as const, artifactPath })),
  ];
  return { findings, ok: findings.length === 0 };
}

export interface DeliverablePlanTraceInput {
  artifactFiles: string[];
  tracedPaths: Set<string>;
  ownersByPath: Map<string, string[]>;
  baseline: Map<string, string>;
  ownershipBaseline: Set<string>;
  testDesignOwnershipSites?: TestDesignOwnershipSite[];
}

/**
 * Runtime-local Claude state is intentionally gitignored and cannot be a PLAN
 * deliverable. Keep it outside this repository-deliverable gate so a clean CI
 * snapshot and a developer worktree observe the same artifact set.
 */
export function isDeliverableArtifactPath(path: string): boolean {
  if (
    path === ".claude/settings.local.json" ||
    path === ".claude/scheduled_tasks.lock" ||
    path.startsWith(".claude/agent-memory/")
  ) {
    return false;
  }
  return (
    path.startsWith("scripts/") ||
    path.startsWith(".claude/") ||
    /\/tests\/.*\.test\.ts$/.test(`/${path}`)
  );
}

function listFiles(dir: string, repoRoot: string, output: string[]): void {
  if (!statSync(dir).isDirectory()) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) listFiles(path, repoRoot, output);
    else output.push(normalizePath(path.slice(repoRoot.length + 1)));
  }
}

function frontmatter(content: string): Record<string, unknown> {
  const end = content.indexOf("\n---", 3);
  if (!content.startsWith("---") || end < 0) return {};
  const parsed = parseYaml(content.slice(3, end));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function loadLedger(content: string): {
  baseline: Map<string, string>;
  ownershipBaseline: Set<string>;
} {
  const rows = content.split(/\r?\n/).filter((line) => line.startsWith("| `"));
  const baseline = new Map<string, string>();
  const ownershipBaseline = new Set<string>();
  for (const row of rows) {
    const columns = row.split("|").map((column) => column.trim());
    const artifactPath = columns[1]?.replaceAll("`", "");
    const legacyRow = columns.length === 6;
    const debtKind = legacyRow ? "orphan-deliverable" : columns[2];
    const ownerPlan = (legacyRow ? columns[2] : columns[3])?.replaceAll("`", "");
    const justification = legacyRow ? columns[3] : columns[4];
    const promoteBy = legacyRow ? columns[4] : columns[5];
    if (!artifactPath || !ownerPlan || !justification || !promoteBy) {
      throw new Error("invalid deliverable trace debt ledger row");
    }
    const normalized = normalizePath(artifactPath);
    if (debtKind === "orphan-deliverable") baseline.set(normalized, ownerPlan);
    else if (debtKind === "duplicate-artifact-ownership") ownershipBaseline.add(normalized);
    else throw new Error("invalid deliverable trace debt ledger kind");
  }
  return { baseline, ownershipBaseline };
}

function markdownCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed
    .slice(1, -1)
    .replaceAll("\\|", "\u0000")
    .split("|")
    .map((cell) => cell.replaceAll("\u0000", "|").trim());
}

function isMarkdownSeparatorRow(line: string): boolean {
  const cells = markdownCells(line);
  return cells !== null && cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

interface CandidateDeclarationSite {
  id: string;
  path: string;
  line: number;
}

function candidateDeclarationSitesFromFile(
  markdown: string,
  path: string,
): CandidateDeclarationSite[] {
  const lines = markdown.split(/\r?\n/u);
  const sites: CandidateDeclarationSite[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (/^#{1,6}\s/u.test(line)) continue;
    const cells = markdownCells(line);
    if (!cells || isMarkdownSeparatorRow(line) || isMarkdownSeparatorRow(lines[index + 1] ?? ""))
      continue;
    const ids = cells.flatMap((cell) => {
      CANDIDATE_ID.lastIndex = 0;
      const matches = [...cell.matchAll(CANDIDATE_ID)];
      const normalized = cell.replace(/`/gu, "").trim();
      return matches.length === 1 && normalized === matches[0]?.[0] ? [matches[0][0]] : [];
    });
    for (const id of ids) sites.push({ id, path, line: index + 1 });
  }
  return sites;
}

function collectCandidateDeclarationSites(repoRoot: string): CandidateDeclarationSite[] {
  const paths: string[] = [];
  try {
    listFiles(join(repoRoot, "docs", "test-design"), repoRoot, paths);
  } catch {
    return [];
  }
  const sites: CandidateDeclarationSite[] = [];
  for (const path of paths) {
    if (!path.endsWith(".md")) continue;
    const content = readFileSync(join(repoRoot, path), "utf8");
    sites.push(...candidateDeclarationSitesFromFile(content, path));
  }
  return sites;
}

function isTestArtifactPath(path: string): boolean {
  return /^tests\/.*\.test\.ts$/.test(path);
}

export function loadDeliverablePlanTraceInput(repoRoot: string): DeliverablePlanTraceInput {
  const artifactFiles: string[] = [];
  for (const root of ["scripts", ".claude", "tests"]) {
    const path = join(repoRoot, root);
    try {
      if (statSync(path).isDirectory()) listFiles(path, repoRoot, artifactFiles);
    } catch {
      // Optional roots are an empty set in consumer repositories.
    }
  }
  const scopedArtifacts = artifactFiles.filter(isDeliverableArtifactPath);
  const tracedPaths = new Set<string>();
  const ownersByPath = new Map<string, string[]>();
  for (const file of readdirSync(join(repoRoot, "docs", "plans")).filter((name) =>
    name.endsWith(".md"),
  )) {
    const meta = frontmatter(readFileSync(join(repoRoot, "docs", "plans", file), "utf8"));
    const planId = typeof meta.plan_id === "string" ? meta.plan_id : "";
    const generates = Array.isArray(meta.generates) ? meta.generates : [];
    for (const item of generates) {
      if (!item || typeof item !== "object") continue;
      const artifactPath = (item as Record<string, unknown>).artifact_path;
      if (typeof artifactPath !== "string" || !artifactPath) continue;
      const normalized = normalizePath(artifactPath);
      tracedPaths.add(normalized);
      if (planId) ownersByPath.set(normalized, [...(ownersByPath.get(normalized) ?? []), planId]);
    }
  }
  const declarations = collectOracleDeclarationSites(repoRoot);
  const declarationsById = new Map<string, typeof declarations>();
  for (const declaration of declarations) {
    const sites = declarationsById.get(declaration.id) ?? [];
    sites.push(declaration);
    declarationsById.set(declaration.id, sites);
  }
  const testDesignOwnershipSites: TestDesignOwnershipSite[] = [];
  for (const citation of collectOracleCitationSites(repoRoot)) {
    const matchingDeclarations = declarationsById.get(citation.id) ?? [];
    if (matchingDeclarations.length > 0 && isTestArtifactPath(citation.path)) {
      tracedPaths.add(citation.path);
      for (const declaration of matchingDeclarations) {
        testDesignOwnershipSites.push({
          id: citation.id,
          declarationPath: declaration.path,
          declarationLine: declaration.line,
          testPath: citation.path,
          citationLine: citation.line,
          kind: "formal",
        });
      }
    }
  }
  const candidateDeclarations = collectCandidateDeclarationSites(repoRoot);
  const declarationsByCandidateId = new Map<string, CandidateDeclarationSite[]>();
  for (const declaration of candidateDeclarations) {
    const sites = declarationsByCandidateId.get(declaration.id) ?? [];
    sites.push(declaration);
    declarationsByCandidateId.set(declaration.id, sites);
  }
  for (const citation of collectCandidateOracleCitationSites(repoRoot)) {
    const matchingDeclarations = declarationsByCandidateId.get(citation.id) ?? [];
    if (matchingDeclarations.length === 0 || !isTestArtifactPath(citation.path)) continue;
    tracedPaths.add(citation.path);
    for (const declaration of matchingDeclarations) {
      testDesignOwnershipSites.push({
        id: citation.id,
        declarationPath: declaration.path,
        declarationLine: declaration.line,
        testPath: citation.path,
        citationLine: citation.line,
        kind: "candidate",
      });
    }
  }
  const ledger = loadLedger(
    readFileSync(join(repoRoot, "docs", "governance", "deliverable-trace-debt-audit.md"), "utf8"),
  );
  return {
    artifactFiles: scopedArtifacts.sort(),
    tracedPaths,
    ownersByPath,
    baseline: new Map([...ledger.baseline].filter(([path]) => isDeliverableArtifactPath(path))),
    ownershipBaseline: ledger.ownershipBaseline,
    testDesignOwnershipSites,
  };
}

export function analyzeDeliverableTraceGate(
  input: DeliverablePlanTraceInput,
): DeliverablePlanTraceResult {
  const trace = analyzeDeliverablePlanTrace(input);
  const ownership = analyzeArtifactOwnership({
    ownersByPath: input.ownersByPath,
    baseline: input.ownershipBaseline,
  });
  const duplicatePaths = new Set(
    [...input.ownersByPath]
      .filter(([, planIds]) => planIds.length > 1)
      .map(([artifactPath]) => artifactPath),
  );
  const staleOwnership = [...input.ownershipBaseline]
    .filter((artifactPath) => !duplicatePaths.has(artifactPath))
    .map((artifactPath) => ({ kind: "stale-deliverable-trace-debt" as const, artifactPath }));
  const findings = [...ownership.findings, ...trace.findings, ...staleOwnership].sort((a, b) =>
    a.artifactPath.localeCompare(b.artifactPath),
  );
  return { findings, ok: findings.length === 0 };
}

export function deliverablePlanTraceMessages(result: DeliverablePlanTraceResult): string[] {
  if (result.ok) return ["deliverable-plan-trace — OK (W2/W3/W4 finding 0; ledger 双方向一致)"];
  return result.findings.map(
    (finding) => `deliverable-plan-trace - violation: ${finding.kind} ${finding.artifactPath}`,
  );
}
