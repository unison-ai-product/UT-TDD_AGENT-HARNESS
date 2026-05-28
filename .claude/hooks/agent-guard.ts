#!/usr/bin/env bun
/**
 * Claude Code PreToolUse(Agent) hook entry — UT-TDD subagent guard。
 *
 * 環境非依存 (bun 実行、bash / python3 不要)。判定本体は src/runtime/agent-guard.ts。
 * settings.json:
 *   "command": "bun \"$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts\""
 *
 * stdin: Claude Code が渡す tool 呼び出し JSON ({ tool_name, tool_input: { subagent_type, model } })。
 * exit:  0 = pass / 2 = block (Claude Code が Agent 呼び出しを抑止)。
 * bypass: 環境変数 UT_TDD_ALLOW_RAW_AGENT=1。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AgentGuardInput,
  evaluateAgentGuard,
  normalizeModelFamily,
  type ResolvedFamily,
} from "../../src/runtime/agent-guard";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

function resolveAgentFamily(subagentType: string): ResolvedFamily {
  const md = join(repoRoot, ".claude", "agents", `${subagentType}.md`);
  if (!existsSync(md)) return "missing";
  const content = readFileSync(md, "utf8");
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return "unknown";
  const modelLine = fm[1].match(/^model:[ \t]*(\S+)/m);
  // trim: CRLF チェックアウトされた agent .md で末尾 CR が残るのを防ぐ (NFR-01 cross-platform)
  return normalizeModelFamily(modelLine?.[1]?.trim()) ?? "unknown";
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

// matcher="Agent" でのみ発火する hook のため、stdin 読取・JSON 解析の失敗は
// 「Agent 呼び出しの安全性を検証できない」状態 = fail-close で block する (exit 2)。
let raw: string;
try {
  raw = await readStdin();
} catch {
  process.stderr.write("[ut-tdd-guard] BLOCK: hook stdin の読み取りに失敗しました (fail-close)。\n");
  process.exit(2);
}
let input: AgentGuardInput;
try {
  input = JSON.parse(raw || "{}") as AgentGuardInput;
} catch {
  process.stderr.write("[ut-tdd-guard] BLOCK: hook stdin の JSON 解析に失敗しました (fail-close)。\n");
  process.exit(2);
}

const decision = evaluateAgentGuard(input, {
  resolveAgentFamily,
  allowRaw: process.env.UT_TDD_ALLOW_RAW_AGENT === "1",
});

if (decision.message) process.stderr.write(`${decision.message}\n`);
process.exit(decision.code);
