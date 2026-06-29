import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type L14CloseAuditStatus =
  | "closed"
  | "partial"
  | "human_required"
  | "external_required"
  | "parked_future";

export interface L14CloseAuditDoc {
  file: string;
  content: string;
}

export interface L14CloseAuditRow {
  file: string;
  item: string;
  question: string;
  evidence: string;
  gap: string;
  nextAction: string;
  status: L14CloseAuditStatus;
  evidencePaths: string[];
}

export interface L14CloseAuditViolation {
  file: string;
  item?: string;
  reason:
    | "missing_section"
    | "missing_table"
    | "malformed_row"
    | "missing_expected_item"
    | "unknown_status"
    | "missing_evidence_path"
    | "partial_without_gap"
    | "open_without_next_action";
}

export interface L14CloseAuditResult {
  checked: number;
  rows: L14CloseAuditRow[];
  violations: L14CloseAuditViolation[];
  ok: boolean;
}

const SECTION_RE = /^##\s+L14 Close System Foundation Audit Matrix\s*$/m;
const NEXT_SECTION_RE = /^##\s+/m;
const EVIDENCE_PATH_RE = /`([^`]+)`/g;
const VALID_STATUSES = new Set<L14CloseAuditStatus>([
  "closed",
  "partial",
  "human_required",
  "external_required",
  "parked_future",
]);

const EXPECTED_ITEMS = [
  "workflow-definition",
  "system-foundation",
  "claude-codex-parity",
  "clean-distribution-package",
  "version-up-nonbreaking",
  "brownfield-onboarding",
  "cross-project-test-workflow",
  "l1-l2-mock-roundtrip",
  "drive-model-bookbinding",
  "l8-l14-right-arm",
  "release-publication-boundary",
  "green-evidence-integrity",
] as const;

function section(content: string): string {
  const match = content.match(SECTION_RE);
  if (!match || match.index === undefined) return "";
  const rest = content.slice(match.index + match[0].length);
  const end = rest.search(NEXT_SECTION_RE);
  return end < 0 ? rest : rest.slice(0, end);
}

function tableRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

function normalizeStatus(raw: string): L14CloseAuditStatus | null {
  const cleaned = raw.replaceAll("`", "").trim();
  return VALID_STATUSES.has(cleaned as L14CloseAuditStatus)
    ? (cleaned as L14CloseAuditStatus)
    : null;
}

function evidencePaths(text: string): string[] {
  const paths: string[] = [];
  for (const match of text.matchAll(EVIDENCE_PATH_RE)) {
    const value = match[1]?.trim();
    if (!value) continue;
    if (
      value.startsWith(".ut-tdd/") ||
      value.startsWith("docs/") ||
      value.startsWith("src/") ||
      value.startsWith("tests/") ||
      value.startsWith(".github/") ||
      value === "package.json" ||
      value === "README.md" ||
      value === "AGENTS.md" ||
      value === "CLAUDE.md"
    ) {
      paths.push(value);
    }
  }
  return paths;
}

function pathExists(repoRoot: string, path: string): boolean {
  return existsSync(join(repoRoot, path));
}

export function analyzeL14CloseAudit(
  docs: L14CloseAuditDoc[],
  repoRoot: string = process.cwd(),
): L14CloseAuditResult {
  const rows: L14CloseAuditRow[] = [];
  const violations: L14CloseAuditViolation[] = [];

  for (const doc of docs) {
    const body = section(doc.content);
    if (!body) {
      violations.push({ file: doc.file, reason: "missing_section" });
      continue;
    }
    const parsed = tableRows(body);
    if (parsed.length < 2) {
      violations.push({ file: doc.file, reason: "missing_table" });
      continue;
    }
    const header = parsed[0].map((cell) => cell.toLowerCase());
    const indexes = {
      item: header.indexOf("item"),
      question: header.indexOf("audit question"),
      evidence: header.indexOf("current evidence"),
      gap: header.indexOf("gap / boundary"),
      next: header.indexOf("next action"),
      status: header.indexOf("status"),
    };
    if (Object.values(indexes).some((index) => index < 0)) {
      violations.push({ file: doc.file, reason: "malformed_row" });
      continue;
    }

    for (const cells of parsed.slice(1)) {
      const item = cells[indexes.item] ?? "";
      const question = cells[indexes.question] ?? "";
      const evidence = cells[indexes.evidence] ?? "";
      const gap = cells[indexes.gap] ?? "";
      const nextAction = cells[indexes.next] ?? "";
      const status = normalizeStatus(cells[indexes.status] ?? "");
      if (!item || !question || !evidence || !gap || !nextAction) {
        violations.push({ file: doc.file, item: item || undefined, reason: "malformed_row" });
        continue;
      }
      if (!status) {
        violations.push({ file: doc.file, item, reason: "unknown_status" });
        continue;
      }
      const paths = evidencePaths(evidence);
      if (paths.length === 0 || paths.some((path) => !pathExists(repoRoot, path))) {
        violations.push({ file: doc.file, item, reason: "missing_evidence_path" });
      }
      if (status === "partial" && /^(none|n\/a|なし)$/i.test(gap.trim())) {
        violations.push({ file: doc.file, item, reason: "partial_without_gap" });
      }
      if (
        (status === "partial" ||
          status === "human_required" ||
          status === "external_required" ||
          status === "parked_future") &&
        /^(none|n\/a|なし)$/i.test(nextAction.trim())
      ) {
        violations.push({ file: doc.file, item, reason: "open_without_next_action" });
      }
      rows.push({
        file: doc.file,
        item,
        question,
        evidence,
        gap,
        nextAction,
        status,
        evidencePaths: paths,
      });
    }

    const seen = new Set(rows.filter((row) => row.file === doc.file).map((row) => row.item));
    for (const item of EXPECTED_ITEMS) {
      if (!seen.has(item))
        violations.push({ file: doc.file, item, reason: "missing_expected_item" });
    }
  }

  return { checked: docs.length, rows, violations, ok: docs.length > 0 && violations.length === 0 };
}

export function loadL14CloseAuditDocs(repoRoot: string = process.cwd()): L14CloseAuditDoc[] {
  const target = join(repoRoot, ".ut-tdd", "audit", "A-143-l14-close-system-foundation-audit.md");
  if (!existsSync(target)) return [];
  return [
    {
      file: join(".ut-tdd", "audit", "A-143-l14-close-system-foundation-audit.md"),
      content: readFileSync(target, "utf8"),
    },
  ];
}

export function l14CloseAuditMessages(result: L14CloseAuditResult): string[] {
  if (result.checked === 0) return ["l14-close-audit - violation: A-143 audit not found"];
  if (result.violations.length > 0) {
    const sample = result.violations
      .slice(0, 8)
      .map((v) => `${v.file}${v.item ? `:${v.item}` : ""}:${v.reason}`)
      .join(", ");
    return [
      `l14-close-audit - violation ${result.violations.length} (${sample}); L14 close audit rows need real evidence, explicit gaps, and next actions`,
    ];
  }
  const byStatus = result.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(byStatus)
    .map(([status, count]) => `${status}=${count}`)
    .join(", ");
  return [
    `l14-close-audit - OK (checked=${result.checked}, rows=${result.rows.length}, ${summary})`,
  ];
}
