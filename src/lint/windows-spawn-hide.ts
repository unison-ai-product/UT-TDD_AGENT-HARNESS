/**
 * windows-spawn-hide — 子プロセス起動が Windows でコンソールウィンドウを開かないことの機械強制。
 *
 * 背景 (PO 報告 2026-07-28): 作業中にコンソールウィンドウが繰り返し前面に出て**操作を妨害する**。
 * Windows では、コンソールを持たない親 (GUI プロセス = IDE 拡張ホスト等) から console 系の子
 * (git / gh / bun / node / pwsh) を起動すると、OS が子のためにコンソールを新規割り当てするため、
 * `windowsHide: true` を渡していない spawn が毎回ウィンドウを点滅させる。
 *
 * issue #123 / PR #125 は **hook 経路**を shell-free 化して popup を消したが、CLI / lint 内部の
 * spawn は対象外だった。特に PostToolUse hook 経路は `gitBranch` / `gitHead` / `loadChangedFiles`
 * を通り、**ツール呼び出し 1 回ごとに git を複数回起動する**ため、体感の妨害はここが支配的になる。
 *
 * 本 lint は「spawn 系 API の呼び出しに `windowsHide` が付いていること」を fail-close で要求する。
 * prose の注意書きではなく検査で固定するのは、面が 50 箇所超あり人手の徹底が続かないため。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** 検査対象の子プロセス起動 API。 */
const SPAWN_APIS = ["spawnSync", "spawn", "execFileSync", "execFile", "execSync", "exec"] as const;

/** 走査するルート (runtime が実行するコードのみ。tests は対象外)。 */
const SCAN_ROOTS = ["src", "scripts", join(".claude", "hooks")] as const;

const SCAN_EXTENSIONS = [".ts", ".mjs", ".js"] as const;

export interface WindowsSpawnHideViolation {
  path: string;
  line: number;
  api: string;
}

export interface WindowsSpawnHideDoc {
  path: string;
  content: string;
}

export interface WindowsSpawnHideResult {
  ok: boolean;
  violations: WindowsSpawnHideViolation[];
  checked: number;
}

function isScannable(name: string): boolean {
  return SCAN_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export function loadWindowsSpawnHideDocs(repoRoot: string): WindowsSpawnHideDoc[] {
  const docs: WindowsSpawnHideDoc[] = [];
  const walk = (relative: string): void => {
    const absolute = join(repoRoot, relative);
    let entries: string[];
    try {
      if (!statSync(absolute).isDirectory()) return;
      entries = readdirSync(absolute);
    } catch {
      return;
    }
    for (const entry of entries) {
      const nextRelative = join(relative, entry);
      const nextAbsolute = join(absolute, entry);
      let directory = false;
      try {
        directory = statSync(nextAbsolute).isDirectory();
      } catch {
        continue;
      }
      if (directory) {
        walk(nextRelative);
        continue;
      }
      if (!isScannable(entry)) continue;
      docs.push({
        path: nextRelative.replaceAll("\\", "/"),
        content: readFileSync(nextAbsolute, "utf8"),
      });
    }
  };
  for (const root of SCAN_ROOTS) walk(root);
  return docs;
}

/**
 * 呼び出しの引数リスト全体を括弧の対応で切り出す。
 *
 * 行単位の正規表現では複数行の option object を取り逃がすため、開き括弧から対応する閉じ括弧までを
 * 数えて判定する (文字列リテラル内の括弧は数えない)。
 */
function callArguments(content: string, openParenIndex: number): string | null {
  let depth = 0;
  let quote: string | null = null;
  for (let index = openParenIndex; index < content.length; index += 1) {
    const char = content[index];
    const previous = index > 0 ? content[index - 1] : "";
    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return content.slice(openParenIndex + 1, index);
    }
  }
  return null;
}

function lineOf(content: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content[cursor] === "\n") line += 1;
  }
  return line;
}

export function analyzeWindowsSpawnHide(docs: WindowsSpawnHideDoc[]): WindowsSpawnHideResult {
  const violations: WindowsSpawnHideViolation[] = [];
  for (const doc of docs) {
    // 本 lint 自身は API 名を文字列として持つだけなので対象外にする。
    if (doc.path.endsWith("src/lint/windows-spawn-hide.ts")) continue;
    // node:child_process を import していないファイルに子プロセス起動は無い。
    if (!doc.content.includes("node:child_process")) continue;
    for (const api of SPAWN_APIS) {
      const pattern = new RegExp(`\\b${api}\\s*\\(`, "g");
      for (const match of doc.content.matchAll(pattern)) {
        const openParenIndex = (match.index ?? 0) + match[0].length - 1;
        // 定義側 (`function spawnSync(` / import 節) と member 呼び出し (`db.exec(` /
        // `pattern.exec(`) は対象外。後者を除かないと SQLite / 正規表現の exec を誤検出する
        // (実測: 除外前 151 件のうち大半が db.exec / regex.exec だった)。
        const before = doc.content.slice(Math.max(0, (match.index ?? 0) - 12), match.index ?? 0);
        if (/\b(function|import|from)\s*$/.test(before)) continue;
        if (/[.?]\s*$/.test(before)) continue;
        const args = callArguments(doc.content, openParenIndex);
        if (args === null) continue;
        if (args.includes("windowsHide")) continue;
        violations.push({
          path: doc.path,
          line: lineOf(doc.content, match.index ?? 0),
          api,
        });
      }
    }
  }
  violations.sort((a, b) => (a.path === b.path ? a.line - b.line : a.path < b.path ? -1 : 1));
  return { ok: violations.length === 0, violations, checked: docs.length };
}

export function windowsSpawnHideMessages(result: WindowsSpawnHideResult): string[] {
  if (result.ok) {
    return [
      `windows-spawn-hide — OK (${result.checked} files: 子プロセス起動はすべて windowsHide 指定)`,
    ];
  }
  const sample = result.violations
    .slice(0, 5)
    .map((violation) => `${violation.path}:${violation.line}:${violation.api}`)
    .join(", ");
  const more = result.violations.length > 5 ? ` (+${result.violations.length - 5}件)` : "";
  return [
    `windows-spawn-hide - violation: windowsHide なしの子プロセス起動 ${result.violations.length}件 — ` +
      `${sample}${more}。Windows でコンソールウィンドウが前面に出て操作を妨害する ` +
      `(issue #123 の hook 経路以外の残件)。option object に windowsHide: true を渡すこと`,
  ];
}
