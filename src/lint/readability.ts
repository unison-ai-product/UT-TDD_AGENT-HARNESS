import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ReadabilityDoc {
  path: string;
  text: string;
}

export interface ReadabilityViolation {
  path: string;
  marker: string;
  line: number;
}

export interface ReadabilityResult {
  checked: number;
  violations: ReadabilityViolation[];
  ok: boolean;
}

const MOJIBAKE_MARKERS: { marker: string; pattern: RegExp }[] = [
  { marker: "replacement-character", pattern: /\uFFFD/ },
  { marker: "em-space-before-ascii", pattern: /\u2001(?=[A-Za-z])/ },
  // Curated high-signal UTF-8/CP932 mojibake tokens observed in A-106/A-110/A-111.
  // This is intentionally heuristic; confirmed docs must be restored, not guessed.
  {
    marker: "cp932-mojibake",
    pattern: /窶|繝|縺|荳|螳|譁|竊|笞|莉|蜀|邨|逅|逕|隱|髢|雋|譛|蠑|蟄|莠|蛹|螟|蜿|谿|豁|竍/,
  },
];

const PM_REVIEW_PLAN_PATHS = [
  join("docs", "plans", "PLAN-L5-03-internal-processing.md"),
  join("docs", "plans", "PLAN-L5-05-roster.md"),
  join("docs", "plans", "PLAN-L5-06-skill.md"),
  join("docs", "plans", "PLAN-L5-07-drift.md"),
];

function firstLineOf(text: string, pattern: RegExp): number {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return 1;
}

export function analyzeReadability(docs: ReadabilityDoc[]): ReadabilityResult {
  const violations: ReadabilityViolation[] = [];
  for (const doc of docs) {
    for (const { marker, pattern } of MOJIBAKE_MARKERS) {
      const re = new RegExp(pattern.source, pattern.flags);
      if (!re.test(doc.text)) continue;
      violations.push({ path: doc.path, marker, line: firstLineOf(doc.text, re) });
    }
  }
  return { checked: docs.length, violations, ok: violations.length === 0 };
}

export function loadL6ReadabilityDocs(repoRoot: string = process.cwd()): ReadabilityDoc[] {
  const dir = join(repoRoot, "docs", "design", "harness", "L6-function-design");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const path = join("docs", "design", "harness", "L6-function-design", name);
      return { path, text: readFileSync(join(repoRoot, path), "utf8") };
    });
}

export function loadFreezeReadabilityDocs(repoRoot: string = process.cwd()): ReadabilityDoc[] {
  const l6Docs = loadL6ReadabilityDocs(repoRoot);
  const pmReviewPlans = PM_REVIEW_PLAN_PATHS.filter((path) => existsSync(join(repoRoot, path))).map(
    (path) => ({ path, text: readFileSync(join(repoRoot, path), "utf8") }),
  );
  return [...l6Docs, ...pmReviewPlans];
}

export function readabilityMessages(result: ReadabilityResult): string[] {
  if (result.ok) {
    return [`readability — OK (freeze review docs ${result.checked}件 mojibake marker 0)`];
  }
  const sample = result.violations
    .slice(0, 8)
    .map((v) => `${v.path}:${v.line}:${v.marker}`)
    .join(", ");
  return [
    `readability — ⚠ mojibake markers ${result.violations.length}件 (${sample})。confirmed doc は復元してから freeze する (IMP-089/091)`,
  ];
}
