import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_GITHUB_TEMPLATES } from "../src/setup/templates";

const repoRoot = process.cwd();
const launcher = join(repoRoot, ".claude", "hooks", "run-bun.ts");
const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "ut-tdd-hook-launcher-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("Claude native Bun hook launcher (issue #123)", () => {
  it("U-HOOKEXEC-001: forwards stdin and every argv token unchanged to a native Bun executable", () => {
    const directory = temporaryDirectory();
    const nativeBun = join(directory, process.platform === "win32" ? "bun.exe" : "bun");
    copyFileSync(process.execPath, nativeBun);

    const recorder = join(directory, "record.mjs");
    const output = join(directory, "result.json");
    writeFileSync(
      recorder,
      [
        'import { readFileSync, writeFileSync } from "node:fs";',
        "const [output, ...forwarded] = process.argv.slice(2);",
        'writeFileSync(output, JSON.stringify({ forwarded, stdin: readFileSync(0, "utf8") }));',
      ].join("\n"),
    );
    const forwarded = ["plain", "contains spaces", 'quote"inside', "a&b", "日本語"];
    const stdin = '{"hook_event_name":"SessionStart","value":"a & b"}';

    const result = spawnSync(process.execPath, [launcher, recorder, output, ...forwarded], {
      cwd: repoRoot,
      env: { ...process.env, PATH: directory, APPDATA: "" },
      input: stdin,
      encoding: "utf8",
      windowsHide: true,
    });

    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(output, "utf8"))).toEqual({ forwarded, stdin });
  });

  it("U-HOOKEXEC-008: fails closed when no native Bun executable can be resolved", () => {
    const directory = temporaryDirectory();
    const result = spawnSync(process.execPath, [launcher, "should-not-run.ts"], {
      cwd: repoRoot,
      env: { ...process.env, PATH: directory, APPDATA: "" },
      encoding: "utf8",
      windowsHide: true,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("native Bun executable not found");
  });

  it("U-HOOKEXEC-008: uses direct executable spawning and never delegates to a shell host", () => {
    const source = readFileSync(launcher, "utf8");
    const consumerTemplate = BUILTIN_GITHUB_TEMPLATES["common/run-bun.ts"];

    expect(source).toContain("spawn(findBun(), process.argv.slice(2)");
    expect(source).toContain("windowsHide: true");
    expect(source).toContain("process.stdin.pipe(child.stdin)");
    expect(source).toMatch(
      /for \(const signal of \["SIGINT", "SIGTERM", "SIGHUP"\](?: as const)?\)/,
    );
    expect(source).toContain("child.kill(signal)");
    expect(source).not.toMatch(/\b(?:cmd(?:\.exe)?|powershell(?:\.exe)?|pwsh|sh(?:\.exe)?)\b/i);
    expect(source).not.toContain("shell: true");
    expect(consumerTemplate.replace(/\s+/g, "")).toBe(source.replace(/\s+/g, ""));
  });

  it("U-HOOKEXEC-009: requires the first Node release line with unflagged TypeScript execution", () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      engines?: { node?: string };
    };
    expect(manifest.engines?.node).toBe(">=22.18");
  });

  it("U-HOOKEXEC-010: keeps Windows process-tree custody open until the Rust kernel owns it", () => {
    const plan = readFileSync(
      join(repoRoot, "docs", "plans", "PLAN-L7-139-codex-hook-adapter.md"),
      "utf8",
    );
    expect(plan).toContain("Issue #134");
    expect(plan).toContain("Windows Job Object");
    expect(plan).toContain("未解消");
  });

  it("U-HOOKEXEC-002/U-HOOKEXEC-003/U-HOOKEXEC-004/U-HOOKEXEC-007: routes all Claude hooks as exact argv and preserves policy", () => {
    const settings = JSON.parse(
      readFileSync(join(repoRoot, ".claude", "settings.json"), "utf8"),
    ) as {
      hooks: Record<
        string,
        { hooks: { command: string; args?: string[]; blockOnFailure?: boolean }[] }[]
      >;
    };
    const hooks = Object.values(settings.hooks).flatMap((entries) =>
      entries.flatMap((entry) => entry.hooks),
    );

    expect(hooks).toHaveLength(6);
    for (const hook of hooks) {
      expect(hook.command).toBe("node");
      expect(hook.args?.[0]).toBe("$" + "{CLAUDE_PROJECT_DIR}/.claude/hooks/run-bun.ts");
      expect(hook.args?.slice(1).every((token) => token.length > 0)).toBe(true);
      expect(
        hook.args?.some((token) => /(?:cmd|powershell|pwsh|sh)(?:\.exe)?/i.test(basename(token))),
      ).toBe(false);
    }
    const preToolHooks = (
      settings.hooks.PreToolUse as {
        hooks: { command: string; args?: string[]; blockOnFailure?: boolean }[];
      }[]
    ).flatMap((entry) => entry.hooks);
    expect(preToolHooks.every((hook) => hook.blockOnFailure === true)).toBe(true);
    for (const event of ["SessionStart", "PostToolUse", "Stop", "SubagentStop"]) {
      expect(
        settings.hooks[event]
          .flatMap((entry) => entry.hooks)
          .every((hook) => hook.blockOnFailure !== true),
      ).toBe(true);
    }
  });

  it("U-HOOKEXEC-005/U-HOOKEXEC-006: keeps Codex separation and exact Pack launcher argv", () => {
    const settings = JSON.parse(BUILTIN_GITHUB_TEMPLATES["adapter/.claude/settings.json"]) as {
      hooks: Record<string, { hooks: { command: string; args?: string[] }[] }[]>;
    };
    const actual = Object.fromEntries(
      Object.entries(settings.hooks).map(([event, entries]) => [
        event,
        entries.flatMap((entry) => entry.hooks.map((hook) => [hook.command, ...(hook.args ?? [])])),
      ]),
    );

    expect(actual).toEqual({
      PreToolUse: [
        ["node", ".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "hook", "agent-guard"],
        ["node", ".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "hook", "work-guard"],
      ],
      SessionStart: [
        ["node", ".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "session", "start"],
      ],
      PostToolUse: [
        ["node", ".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "hook", "post-tool-use"],
      ],
      Stop: [["node", ".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "session", "summary"]],
      SubagentStop: [
        ["node", ".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "hook", "subagent-stop"],
      ],
    });
    const wrapper = BUILTIN_GITHUB_TEMPLATES["common/ut-tdd.mjs"];
    const codexHooks = JSON.parse(BUILTIN_GITHUB_TEMPLATES["adapter/.codex/hooks.json"]) as {
      hooks: Record<string, { hooks: { command: string; args?: string[] }[] }[]>;
    };
    const codexCommands = Object.values(codexHooks.hooks).flatMap((entries) =>
      entries.flatMap((entry) => entry.hooks),
    );
    expect(
      codexCommands.every(
        (hook) =>
          hook.command === "node" &&
          hook.args?.[0] === ".ut-tdd/bin/run-bun.ts" &&
          hook.args?.[1] === ".ut-tdd/bin/ut-tdd.mjs",
      ),
    ).toBe(true);
    expect(wrapper).toContain("spawnSync(process.execPath");
    expect(wrapper).toContain("windowsHide: true");
    expect(wrapper).not.toContain("shell:");
    expect(wrapper).not.toContain("ut-tdd.cmd");
  });
});
