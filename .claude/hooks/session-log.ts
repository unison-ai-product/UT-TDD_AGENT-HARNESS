#!/usr/bin/env node
/**
 * Backward-compatible Claude Code session-log shim.
 *
 * The canonical implementation is the package-local UT-TDD CLI:
 *   - SessionStart -> dist/ut-tdd.mjs session start
 *   - PostToolUse  -> dist/ut-tdd.mjs hook post-tool-use
 *   - Stop         -> dist/ut-tdd.mjs session summary
 *
 * This file remains only for older settings or manual invocations.
 * It is fail-open: hook failures must not block Claude Code work.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadNodeBootstrapReceipt } from "../../src/runtime/node-bootstrap";
import type { SessionHookInput } from "../../src/runtime/session-log";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.env.CLAUDE_PROJECT_DIR ?? join(here, "..", "..");

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function commandFor(raw: string): string[] {
  let eventName = process.argv[2] ?? "";
  try {
    const input = JSON.parse(raw.replace(/^\uFEFF/, "") || "{}") as SessionHookInput;
    eventName = input.hook_event_name ?? eventName;
  } catch {
    // Keep argv fallback.
  }
  if (eventName === "SessionStart" || eventName === "start") return ["session", "start"];
  if (eventName === "Stop" || eventName === "stop") return ["session", "summary"];
  return ["hook", "post-tool-use"];
}

try {
  const raw = await readStdin();
  const bootstrap = loadNodeBootstrapReceipt(repoRoot);
  const child = spawnSync(bootstrap.nodePath, [bootstrap.compiledCliPath, ...commandFor(raw)], {
    cwd: repoRoot,
    encoding: "utf8",
    input: raw,
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
} catch {
  // fail-open
}

process.exit(0);
