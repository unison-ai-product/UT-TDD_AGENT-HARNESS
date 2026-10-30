/**
 * baseline を持つ gate の並行 PR 競合を merge 前に止める (Issue #1423)。
 * 契約: docs/design/harness/L6-function-design/merge-gate-check-run-selection.md §6。
 * 純粋関数 `evaluateBaselineConflict` と、git を読む adapter `checkBaselineConflict` に分ける。
 */
import { execFileSync } from "node:child_process";
import { CODE_SIZE_BASELINE_PATH, classifyCodeFile } from "../lint/code-size.ts";
import { classifyDoc } from "../lint/doc-split.ts";
import { DOC_SPLIT_BASELINE_PATH } from "../lint/doc-split-inputs.ts";

export interface BaselineGate {
  name: string;
  inScope: (path: string) => boolean;
  baselinePath: string;
}

export const BASELINE_GATES: readonly BaselineGate[] = [
  {
    name: "doc-split",
    inScope: (path) => classifyDoc(path) !== null,
    baselinePath: DOC_SPLIT_BASELINE_PATH,
  },
  {
    name: "code-size",
    inScope: (path) => classifyCodeFile(path) !== null,
    baselinePath: CODE_SIZE_BASELINE_PATH,
  },
];

export interface BaselineConflict {
  gate: string;
  paths: string[];
}

/** §6.2: 共通 path、または baseline の変更と相手側の対象変更の組を競合とする。 */
export function evaluateBaselineConflict(
  prChanged: readonly string[],
  mainChanged: readonly string[],
  gates: readonly BaselineGate[] = BASELINE_GATES,
): { conflicts: BaselineConflict[] } {
  const conflicts: BaselineConflict[] = [];
  for (const gate of gates) {
    const inGate = (path: string): boolean => path === gate.baselinePath || gate.inScope(path);
    const p = prChanged.filter(inGate);
    const m = mainChanged.filter(inGate);
    const paths = new Set(p.filter((path) => m.includes(path)));
    if (p.includes(gate.baselinePath) && m.length > 0) for (const path of m) paths.add(path);
    if (m.includes(gate.baselinePath) && p.length > 0) for (const path of p) paths.add(path);
    if (paths.size > 0) conflicts.push({ gate: gate.name, paths: [...paths].sort() });
  }
  return { conflicts };
}

function git(repoRoot: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** `git diff -M --name-status -z` の出力から、rename の旧 path と新 path を含む path 一覧を得る。 */
function changedPaths(repoRoot: string, from: string, to: string): string[] {
  const tokens = execFileSync(
    "git",
    ["-C", repoRoot, "diff", "-M", "--name-status", "-z", from, to],
    {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  )
    .split("\0")
    .filter((token) => token !== "");
  const paths: string[] = [];
  for (let i = 0; i < tokens.length; ) {
    const count = /^[RC]/.test(tokens[i]) ? 2 : 1;
    paths.push(...tokens.slice(i + 1, i + 1 + count));
    i += 1 + count;
  }
  return paths;
}

/**
 * deny の reason を返す。競合なしは null。
 * git の起動・fetch・merge-base・diff の失敗はすべて `baseline_conflict_unknown` で返す (L6 §6.2。競合なしにしない)。
 */
export function checkBaselineConflict(repoRoot: string, headSha: string): string | null {
  try {
    git(repoRoot, ["fetch", "-q", "origin", "+refs/heads/main:refs/remotes/origin/main"]);
    const mergeBase = git(repoRoot, ["merge-base", headSha, "origin/main"]);
    const { conflicts } = evaluateBaselineConflict(
      changedPaths(repoRoot, mergeBase, headSha),
      changedPaths(repoRoot, mergeBase, "origin/main"),
    );
    if (conflicts.length === 0) return null;
    return `baseline_conflict:${conflicts.map((c) => `${c.gate}=${c.paths.join("|")}`).join(";")}`;
  } catch (error) {
    const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
    return `baseline_conflict_unknown:${message}`;
  }
}
