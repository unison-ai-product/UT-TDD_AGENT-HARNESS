import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
  // Halfwidth katakana / halfwidth punctuation (U+FF61–U+FF9F) is the CP932 single-byte
  // (0xA1–0xDF) artifact range. UT-TDD prose uses fullwidth Japanese only, so any halfwidth
  // form is a high-recall CP932-mojibake signal. This catches the 工程表→蟾･遞玖｡ｨ /
  // 直列→逶ｴ蛻余 class that the curated kanji list below missed (PLAN-M-00/01, 2026-06-17).
  { marker: "halfwidth-katakana", pattern: /[｡-ﾟ]/ },
  // Curated high-signal UTF-8/CP932 mojibake tokens observed in A-106/A-110/A-111 and the
  // PLAN-M cutover docs (蟾=工, 逶=直). This is intentionally heuristic; confirmed docs must be
  // restored from a clean source or reconstructed from context, not guessed.
  {
    marker: "cp932-mojibake",
    pattern: /窶|繝|縺|荳|螳|譁|竊|笞|莉|蜀|邨|逅|逕|隱|髢|雋|譛|蠑|蟄|莠|蛹|螟|蜿|谿|豁|竍|蟾|逶/,
  },
];

// G5 freeze 時に PM review 対象だった L5 PLAN (Codex 製で過去 mojibake が出た系)。
// A-120 m-3: 全 PLAN-L5-*.md の動的収集にしない理由 = freeze 品質で守る review band を
// 意図的に明示固定する (単一正本)。新規 freeze review 対象 PLAN を増やすときは本リストへ追記する。
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

function walkMarkdown(dir: string, repoRoot: string, acc: ReadabilityDoc[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkMarkdown(full, repoRoot, acc);
      continue;
    }
    if (!name.endsWith(".md")) continue;
    acc.push({ path: relative(repoRoot, full), text: readFileSync(full, "utf8") });
  }
}

// Canonical instruction prose outside docs/ that must also stay mojibake-free.
const ROOT_READABILITY_DOCS = ["README.md", "CLAUDE.md", "AGENTS.md", join(".claude", "CLAUDE.md")];

// System-wide readability band: every active UT-TDD prose surface (full docs/ tree + canonical
// root instruction docs). vendor source snapshot and legacy local state are intentionally
// excluded — they are read-only migration material that may legitimately quote source-era
// encodings, so scanning them would create false positives, not protect active prose.
export function loadSystemReadabilityDocs(repoRoot: string = process.cwd()): ReadabilityDoc[] {
  const acc: ReadabilityDoc[] = [];
  const docsDir = join(repoRoot, "docs");
  if (existsSync(docsDir)) walkMarkdown(docsDir, repoRoot, acc);
  for (const rel of ROOT_READABILITY_DOCS) {
    const full = join(repoRoot, rel);
    if (existsSync(full)) acc.push({ path: rel, text: readFileSync(full, "utf8") });
  }
  return acc.sort((a, b) => a.path.localeCompare(b.path));
}

export function readabilityMessages(result: ReadabilityResult): string[] {
  if (result.ok) {
    return [`readability — OK (prose docs ${result.checked}件 mojibake marker 0)`];
  }
  const sample = result.violations
    .slice(0, 8)
    .map((v) => `${v.path}:${v.line}:${v.marker}`)
    .join(", ");
  return [
    `readability — ⚠ mojibake markers ${result.violations.length}件 (${sample})。confirmed doc は復元してから freeze する (IMP-089/091)`,
  ];
}
