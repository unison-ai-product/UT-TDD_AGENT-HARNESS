#!/usr/bin/env bun
/**
 * Claude Code session-log hook entry — SessionStart / PostToolUse / Stop。
 *
 * 環境非依存 (bun 実行、bash/python3 不要)。判定/圧縮本体は src/runtime/session-log.ts。
 * settings.json: 3 event に同一 command を登録し、stdin の `hook_event_name` で handler 分岐。
 *
 * **fail-OPEN**: stdin/JSON/I-O 失敗を含め **常に exit 0** (ログがワークフローを止めない。
 * agent-guard の fail-close と逆。settings.json に blockOnFailure を付けないこと)。
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanDanglingStops } from "../../src/runtime/forced-stop";
import { dispatch, nodeDeps, type SessionHookInput } from "../../src/runtime/session-log";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.env.CLAUDE_PROJECT_DIR ?? join(here, "..", "..");

function gitBranch(): string | null {
  try {
    const out = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

try {
  const raw = await readStdin();
  const input = JSON.parse(raw || "{}") as SessionHookInput;
  const deps = nodeDeps(repoRoot, gitBranch);
  const evName = input.hook_event_name ?? process.argv[2];
  // SessionStart: 直前までの dangling session (強制停止推定) を後追い記録 (fail-open)
  if (evName === "SessionStart" || evName === "start") {
    scanDanglingStops(deps, input.session_id);
  }
  dispatch(input, deps, process.argv[2]);
} catch {
  // fail-OPEN: ログの失敗で作業を止めない
}
process.exit(0);
