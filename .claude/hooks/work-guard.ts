#!/usr/bin/env bun
/**
 * Claude Code PreToolUse(Edit|Write|MultiEdit) hook entry — UT-TDD 作業衝突ガードレール (PLAN-L7-114)。
 *
 * hybrid 多ランタイムで、このセッションが触っていない uncommitted ファイル (= 他ランタイムの
 * in-flight 成果と推定) への盲目的 Edit/Write を block し、相手の未コミット成果のクロバーを防ぐ。
 * 判定本体は src/runtime/work-guard.ts (純関数)。
 *
 * settings.json:
 *   "matcher": "Edit|Write|MultiEdit",
 *   "command": "bun \"$CLAUDE_PROJECT_DIR/.claude/hooks/work-guard.ts\""
 *
 * stdin: { tool_name, tool_input: { file_path }, session_id }。
 * exit:  0 = pass / 2 = block。
 * override: UT_TDD_ALLOW_FOREIGN_EDIT=1 (意図的に相手ファイルへ積む時のみ、理由を記録)。
 * 内部エラー (git 失敗 / parse 失敗 / state 不明) は **fail-open** (exit 0): ガードの不調で
 * 全 Edit を止めない。block は「衝突を確実に検知できた時」のみ。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateWorkGuard, normalizeRepoRelative } from "../../src/runtime/work-guard";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.env.CLAUDE_PROJECT_DIR ?? join(here, "..", "..");

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function gitUncommittedFiles(): string[] {
  // porcelain v1: "XY <path>" / rename "R  old -> new"。path 部のみを repo-relative で取る。
  const out = execFileSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const files: string[] = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const rest = line.slice(3).trim();
    const path = rest.includes(" -> ") ? rest.split(" -> ")[1] : rest;
    files.push(normalizeRepoRelative(path.replace(/^"|"$/g, ""), repoRoot));
  }
  return files;
}

function sessionTouchedFiles(sessionId: string): string[] {
  const safe = sessionId.replace(/[\\/]+/g, "_");
  const file = join(repoRoot, ".ut-tdd", "logs", "session", `${safe}.jsonl`);
  if (!existsSync(file)) return [];
  const touched: string[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const ev = JSON.parse(line) as { target?: string };
      if (ev.target) touched.push(normalizeRepoRelative(ev.target, repoRoot));
    } catch {
      // 壊れ行は skip (fail-open)。
    }
  }
  return touched;
}

// fail-open: 検証不能 (stdin/JSON/git/state) は exit 0。block は衝突を確証できた時のみ。
let input: { tool_input?: { file_path?: string; path?: string }; session_id?: string };
try {
  const raw = await readStdin();
  input = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

try {
  const targetRaw = input.tool_input?.file_path ?? input.tool_input?.path ?? "";
  const target = targetRaw ? normalizeRepoRelative(targetRaw, repoRoot) : "";
  const result = evaluateWorkGuard({
    targetPath: target,
    uncommittedFiles: gitUncommittedFiles(),
    sessionTouchedFiles: sessionTouchedFiles(input.session_id ?? "unknown"),
    bypass: process.env.UT_TDD_ALLOW_FOREIGN_EDIT === "1",
  });
  if (result.decision === "block") {
    process.stderr.write(`${result.message}\n`);
    process.exit(2);
  }
  process.exit(0);
} catch {
  // git 不在 / 権限 / その他 I/O 失敗 → ガードを諦めて通す (作業を止めない)。
  process.exit(0);
}
