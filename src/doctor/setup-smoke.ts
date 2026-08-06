import { join } from "node:path";
import {
  type HookInvocation,
  invocationEquals,
  parseHookInvocation,
} from "../lint/hook-invocation.ts";

export interface SetupSmokeDeps {
  repoRoot: string;
  readText: (path: string) => string | null;
}

interface SetupSmokeCheck {
  name: string;
  ok: boolean;
  message: string;
}

const SETUP_SMOKE_REQUIRED_FILES = [
  ".ut-tdd/bin/run-bun.ts",
  ".ut-tdd/bin/ut-tdd.mjs",
  "AGENTS.md",
  "CLAUDE.md",
  ".claude/CLAUDE.md",
  ".claude/settings.json",
  ".codex/config.toml",
  ".codex/hooks.json",
] as const;

const nativeInvocation = (...suffix: string[]) => ({
  executable: "node",
  args: [".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", ...suffix],
});
const SETUP_SMOKE_SHARED_INVOCATIONS = [
  nativeInvocation("hook", "agent-guard"),
  nativeInvocation("hook", "work-guard"),
  nativeInvocation("session", "start"),
  nativeInvocation("hook", "post-tool-use"),
  nativeInvocation("session", "summary"),
] as const;
const SETUP_SMOKE_CLAUDE_INVOCATIONS = [
  ...SETUP_SMOKE_SHARED_INVOCATIONS,
  nativeInvocation("hook", "subagent-stop"),
] as const;

function collectHookInvocations(raw: string | null): HookInvocation[] | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as {
      hooks?: Record<string, { hooks?: { command?: unknown; args?: unknown }[] }[]>;
    };
    return Object.values(parsed.hooks ?? {}).flatMap((entries) =>
      (entries ?? []).flatMap((entry) =>
        (entry.hooks ?? [])
          .map(parseHookInvocation)
          .filter((hook): hook is HookInvocation => !!hook),
      ),
    );
  } catch {
    return null;
  }
}

export function collectHookCommands(raw: string | null): string[] | null {
  return collectHookInvocations(raw)?.map((invocation) => invocation.display) ?? null;
}

export function checkSetupSmoke(deps: SetupSmokeDeps): { ok: boolean; messages: string[] } {
  const checks: SetupSmokeCheck[] = [];
  for (const file of SETUP_SMOKE_REQUIRED_FILES) {
    checks.push({
      name: file,
      ok: deps.readText(join(deps.repoRoot, file)) !== null,
      message: file,
    });
  }

  const wrapper = deps.readText(join(deps.repoRoot, ".ut-tdd/bin/ut-tdd.mjs"));
  const launcher = deps.readText(join(deps.repoRoot, ".ut-tdd/bin/run-bun.ts"));
  checks.push({
    name: "wrapper-placeholder-free",
    ok: wrapper !== null && !/UT_TDD_SOURCE_CLI_JSON|__UT_TDD|placeholder/i.test(wrapper),
    message: "project-local wrapper has no template placeholder residue",
  });
  checks.push({
    name: "native-bun-launcher-contract",
    ok:
      launcher !== null &&
      launcher.includes("windowsHide: true") &&
      launcher.includes("realpathSync") &&
      !launcher.includes("shell: true") &&
      !launcher.includes("spawnSync"),
    message: "native Bun launcher is shell-free, canonical-path checked, and signal-aware",
  });

  const claudeInvocations = collectHookInvocations(
    deps.readText(join(deps.repoRoot, ".claude/settings.json")),
  );
  const codexInvocations = collectHookInvocations(
    deps.readText(join(deps.repoRoot, ".codex/hooks.json")),
  );
  checks.push({
    name: "claude-hooks-json",
    ok: claudeInvocations !== null,
    message: "Claude adapter hook JSON parses",
  });
  checks.push({
    name: "codex-hooks-json",
    ok: codexInvocations !== null,
    message: "Codex adapter hook JSON parses",
  });

  for (const expected of SETUP_SMOKE_CLAUDE_INVOCATIONS) {
    const display = [expected.executable, ...expected.args].join(" ");
    checks.push({
      name: `claude-hook:${display}`,
      ok: (claudeInvocations ?? []).some(
        (actual) => actual.serialization === "exec_args" && invocationEquals(actual, expected),
      ),
      message: display,
    });
  }
  for (const expected of SETUP_SMOKE_SHARED_INVOCATIONS) {
    const display = [expected.executable, ...expected.args].join(" ");
    checks.push({
      name: `codex-hook:${display}`,
      ok: (codexInvocations ?? []).some(
        (actual) => actual.serialization === "exec_args" && invocationEquals(actual, expected),
      ),
      message: display,
    });
  }
  // CodexにはSubagentStop surfaceがないため、このcommandはClaude側のnative launcher契約にのみ存在する。
  const combinedCommands = [...(claudeInvocations ?? []), ...(codexInvocations ?? [])].map(
    (invocation) => invocation.display,
  );
  checks.push({
    name: "portable-hook-paths",
    ok:
      combinedCommands.length > 0 &&
      combinedCommands.every(
        (command) =>
          command.includes(".ut-tdd/bin/ut-tdd.mjs") &&
          !command.includes("$CLAUDE_PROJECT_DIR") &&
          !/[\\/]\\.codex[\\/]/i.test(command),
      ),
    message: "hooks use project-local wrapper and avoid runtime/global paths",
  });

  const failed = checks.filter((check) => !check.ok);
  return {
    ok: failed.length === 0,
    messages: [
      `doctor: setup-smoke - ${failed.length === 0 ? "OK" : "violation"} (checked=${checks.length}, failed=${failed.length})`,
      ...failed
        .slice(0, 12)
        .map((check) => `doctor: setup-smoke - missing ${check.name}: ${check.message}`),
    ],
  };
}
