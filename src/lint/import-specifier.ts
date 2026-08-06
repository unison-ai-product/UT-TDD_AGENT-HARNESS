/**
 * import-specifier lint — 相対 import 指定子の拡張子必須 gate (PLAN-L7-462 PR-A、AC-5)。
 *
 * 契約 (PLAN-L7-462 設計判断節): 対象 4 ディレクトリ (src/ tests/ scripts/ .claude/hooks/) の
 * `.ts` ファイルにおいて、相対 import 指定子は**実在する `.ts` ファイルを指す拡張子付き**で
 * あること。拡張子なし (Node ESM で ERR_MODULE_NOT_FOUND) だけでなく `.js` 指定子
 * (bun は解決するが node は fail する不可視 blocker) も fail-close する。
 *
 * 検出は正規表現の行 match でなく mini-scanner で行う: 文字列リテラル・template literal・
 * コメントの中身を code として読まない (tests/ の fixture 文字列に埋まった import 記述を
 * 誤検出しないため — 実測で 24 行の埋め込み fixture が存在する)。
 *
 * 純関数 (analyzeImportSpecifiers) + I/O loader (loadImportSpecifierInput) を分離 (lint 共通様式)。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, sep } from "node:path";

export const IMPORT_SPECIFIER_SCOPES = ["src", "tests", "scripts", ".claude/hooks"] as const;

export interface ImportSpecifierDoc {
  /** repo-relative posix path。 */
  path: string;
  text: string;
}

export interface ImportSpecifierViolation {
  path: string;
  line: number;
  specifier: string;
  rule: "missing-extension" | "js-specifier" | "unresolved-ts-target";
  message: string;
}

export interface ImportSpecifierResult {
  checked: number;
  specifiers: number;
  violations: ImportSpecifierViolation[];
  ok: boolean;
}

interface FoundSpecifier {
  specifier: string;
  line: number;
}

/**
 * code 状態で現れる import 系キーワード直後の文字列リテラルだけを抽出する mini-scanner。
 * 対象: `import ... from "x"` / `export ... from "x"` / `import "x"` / `import("x")` /
 * `require("x")` / `vi.mock("x")`。文字列・template・コメント内は code として読まない。
 */
export function extractImportSpecifiers(text: string): FoundSpecifier[] {
  const found: FoundSpecifier[] = [];
  const n = text.length;
  let i = 0;
  let line = 1;
  const keyword = /(?:from|import|require|vi\.mock)$/;
  // 直近の code トークン列 (キーワード判定用の小さな窓)。
  let tail = "";
  while (i < n) {
    const c = text[i];
    if (c === "\n") {
      line += 1;
      tail = "";
      i += 1;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < n && text[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] === "\n") line += 1;
        i += 1;
      }
      i += 2;
      continue;
    }
    if (c === "`") {
      i += 1;
      while (i < n && text[i] !== "`") {
        if (text[i] === "\\") i += 1;
        if (text[i] === "\n") line += 1;
        i += 1;
      }
      i += 1;
      tail = "";
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      const startLine = line;
      let value = "";
      i += 1;
      while (i < n && text[i] !== quote) {
        if (text[i] === "\\") {
          value += text[i];
          i += 1;
        }
        if (text[i] === "\n") line += 1;
        value += text[i];
        i += 1;
      }
      i += 1;
      // キーワード直後 (from "x" / import "x" / import("x" / require("x" / vi.mock("x") のみ採用。
      const t = tail.replace(/[\s(]+$/, "");
      if (keyword.test(t)) found.push({ specifier: value, line: startLine });
      tail = "";
      continue;
    }
    tail = (tail + c).slice(-16);
    i += 1;
  }
  return found;
}

export interface ImportSpecifierInput {
  docs: ImportSpecifierDoc[];
  /** repo-relative posix path の実在ファイル集合 (解決検証用)。 */
  files: Set<string>;
}

function resolveRelative(fromPath: string, specifier: string): string {
  return posix.normalize(posix.join(posix.dirname(fromPath), specifier));
}

export function analyzeImportSpecifiers(input: ImportSpecifierInput): ImportSpecifierResult {
  const violations: ImportSpecifierViolation[] = [];
  let specifiers = 0;
  for (const doc of input.docs) {
    for (const { specifier, line } of extractImportSpecifiers(doc.text)) {
      if (!specifier.startsWith("./") && !specifier.startsWith("../")) continue;
      specifiers += 1;
      if (specifier.endsWith(".js")) {
        violations.push({
          path: doc.path,
          line,
          specifier,
          rule: "js-specifier",
          message: `相対 .js 指定子は禁止 (node は解決できない): ${specifier} → .ts へ書き換える`,
        });
        continue;
      }
      if (specifier.endsWith(".json")) continue;
      if (!specifier.endsWith(".ts")) {
        violations.push({
          path: doc.path,
          line,
          specifier,
          rule: "missing-extension",
          message: `相対 import は実在 .ts を指す拡張子必須 (Node ESM): ${specifier} → ${specifier}.ts 等へ書き換える`,
        });
        continue;
      }
      const target = resolveRelative(doc.path, specifier);
      if (!input.files.has(target)) {
        violations.push({
          path: doc.path,
          line,
          specifier,
          rule: "unresolved-ts-target",
          message: `相対 .ts 指定子が実在ファイルを指していない: ${specifier} (解決先 ${target})`,
        });
      }
    }
  }
  return { checked: input.docs.length, specifiers, violations, ok: violations.length === 0 };
}

function walk(root: string, dir: string, out: string[]): void {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = `${dir}/${entry}`;
    const stat = statSync(join(root, rel));
    if (stat.isDirectory()) walk(root, rel, out);
    else out.push(rel);
  }
}

export function loadImportSpecifierInput(repoRoot: string): ImportSpecifierInput {
  const all: string[] = [];
  for (const scope of IMPORT_SPECIFIER_SCOPES) {
    try {
      walk(repoRoot, scope, all);
    } catch {
      // scope が無い checkout (Pack 等) は skip (fail-open ではなく対象不在)。
    }
  }
  const files = new Set(all);
  const docs = all
    .filter((p) => p.endsWith(".ts"))
    .map((p) => ({ path: p, text: readFileSync(join(repoRoot, p), "utf8") }));
  // scope 外 (repo root 等) の実在 target も解決対象に補完する (例: tests/ → ../vitest.config.ts)。
  for (const doc of docs) {
    for (const { specifier } of extractImportSpecifiers(doc.text)) {
      if (!specifier.startsWith("./") && !specifier.startsWith("../")) continue;
      if (!specifier.endsWith(".ts")) continue;
      const target = resolveRelative(doc.path, specifier);
      if (files.has(target)) continue;
      try {
        if (statSync(join(repoRoot, target)).isFile()) files.add(target);
      } catch {
        // 実在しない target は analyze 側で violation にする。
      }
    }
  }
  return { docs, files };
}

export function renderImportSpecifierMessages(r: ImportSpecifierResult): string[] {
  if (r.ok) {
    return [
      `import-specifier — OK (checked=${r.checked}, relative specifiers=${r.specifiers}, 拡張子違反 0)`,
    ];
  }
  const head = r.violations
    .slice(0, 10)
    .map((v) => `${v.path}:${v.line} ${v.rule} ${v.specifier}`);
  return [
    `import-specifier — violation ${r.violations.length} 件 (相対 import は実在 .ts 拡張子必須、PLAN-L7-462 PR-A): ${head.join("; ")}`,
  ];
}

/** doctor 配線用 (check-definition-groups から呼ぶ)。 */
export function checkImportSpecifiers(repoRoot: string): { messages: string[]; ok: boolean } {
  const result = analyzeImportSpecifiers(loadImportSpecifierInput(repoRoot));
  return { messages: renderImportSpecifierMessages(result), ok: result.ok };
}
