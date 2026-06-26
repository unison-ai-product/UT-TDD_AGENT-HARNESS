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
 * override: UT_TDD_ALLOW_FOREIGN_EDIT=1 (env、人間が out-of-band で設定) か、`.ut-tdd/state/
 *   foreign-edit-override` に非空の理由を書く marker。marker は **one-shot**: foreign 編集を伴う
 *   1 tool-call で消費 (削除) する。古い marker が残って「今回だけの例外」が「以後ずっと例外」に
 *   ならないようにする (env override は人間管理ゆえ消費しない)。
 * 内部エラー (git 失敗 / parse 失敗 / state 不明) は **fail-open** (exit 0): ガードの不調で
 * 全 Edit を止めない。block は「衝突を確実に検知できた時」のみ。
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateWorkGuard,
  extractEditTargets,
  normalizeRepoRelative,
  resolveForeignEditOverride,
  type WorkGuardResult,
} from "../../src/runtime/work-guard";

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

const OVERRIDE_MARKER = join(repoRoot, ".ut-tdd", "state", "foreign-edit-override");
const OVERRIDE_AUDIT = join(repoRoot, ".ut-tdd", "logs", "foreign-edit-overrides.jsonl");

/** agent-accessible override marker (`.ut-tdd/state/foreign-edit-override`) の本文 (=理由) を読む。 */
function readOverrideMarker(): string | null {
  try {
    return existsSync(OVERRIDE_MARKER) ? readFileSync(OVERRIDE_MARKER, "utf8") : null;
  } catch {
    return null;
  }
}

/** marker 経由 override を durable log へ追記 (silent bypass を許さない = 証跡を残す)。 */
function auditOverride(entry: { target: string; reason: string; sessionId: string }): void {
  try {
    mkdirSync(dirname(OVERRIDE_AUDIT), { recursive: true });
    appendFileSync(OVERRIDE_AUDIT, `${JSON.stringify({ ts: new Date().toISOString(), ...entry })}\n`);
  } catch {
    // audit 失敗は override 自体を妨げない (fail-open)。
  }
}

/**
 * marker を one-shot 消費する (使用後に削除)。これで stale marker が以後の foreign edit を
 * 恒久バイパスし続けるのを防ぐ。次の foreign 編集には新しい理由 marker が要る。
 */
function consumeOverrideMarker(): void {
  try {
    rmSync(OVERRIDE_MARKER, { force: true });
  } catch {
    // 削除失敗は block 判断に影響させない (fail-open)。次回 marker が残っても audit は残る。
  }
}

// fail-open: 検証不能 (stdin/JSON/git/state) は exit 0。block は衝突を確証できた時のみ。
// tool_input は Claude (file_path) と Codex apply_patch (freeform patch 本文) で形が違うため unknown で受け、
// extractEditTargets で両形を吸収する (PLAN-L7-139)。
let input: { tool_input?: unknown; session_id?: string };
try {
  const raw = await readStdin();
  input = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

try {
  // apply_patch は複数ファイルを 1 patch で編集しうる。全対象を評価し、1 つでも foreign なら block。
  const targets = extractEditTargets(input.tool_input)
    .map((t) => normalizeRepoRelative(t, repoRoot))
    .filter((t) => t.length > 0);
  const override = resolveForeignEditOverride({
    env: process.env.UT_TDD_ALLOW_FOREIGN_EDIT,
    markerReason: readOverrideMarker(),
  });
  const uncommitted = gitUncommittedFiles();
  const touched = sessionTouchedFiles(input.session_id ?? "unknown");
  let blocked: WorkGuardResult | null = null;
  for (const target of targets) {
    const result = evaluateWorkGuard({
      targetPath: target,
      uncommittedFiles: uncommitted,
      sessionTouchedFiles: touched,
      bypass: override.bypass,
    });
    if (result.decision === "block") {
      blocked = result;
      break;
    }
  }
  if (override.source === "marker" && targets.length > 0) {
    // agent-accessible override は silent にせず durable に audit する (証跡を残す)。
    auditOverride({
      target: targets.join(", "),
      reason: override.reason,
      sessionId: input.session_id ?? "unknown",
    });
    // 使用したら marker を消費 (one-shot)。残置による恒久バイパスを防ぐ。
    consumeOverrideMarker();
  }
  if (blocked) {
    process.stderr.write(`${blocked.message}\n`);
    process.exit(2);
  }
  process.exit(0);
} catch {
  // git 不在 / 権限 / その他 I/O 失敗 → ガードを諦めて通す (作業を止めない)。
  process.exit(0);
}
