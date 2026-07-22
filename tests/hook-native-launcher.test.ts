import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_GITHUB_TEMPLATES } from "../src/setup/templates";

const repoRoot = process.cwd();
const launcher = join(repoRoot, ".claude", "hooks", "run-bun.mjs");
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
  it("forwards stdin and every argv token unchanged to a native Bun executable", () => {
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

  it("fails closed when no native Bun executable can be resolved", () => {
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

  it("uses direct executable spawning and never delegates to a shell host", () => {
    const source = readFileSync(launcher, "utf8");
    const consumerTemplate = BUILTIN_GITHUB_TEMPLATES["common/run-bun.mjs"];

    expect(source).toContain("spawn(findBun(), process.argv.slice(2)");
    expect(source).toContain("windowsHide: true");
    expect(source).toContain("process.stdin.pipe(child.stdin)");
    expect(source).toContain('for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"])');
    expect(source).toContain("child.kill(signal)");
    expect(source).not.toMatch(/\b(?:cmd(?:\.exe)?|powershell(?:\.exe)?|pwsh|sh(?:\.exe)?)\b/i);
    expect(source).not.toContain("shell: true");
    expect(consumerTemplate.replace(/\s+/g, "")).toBe(source.replace(/\s+/g, ""));
  });

  it("routes every tracked Claude hook through node plus the launcher as exact argv", () => {
    const settings = JSON.parse(
      readFileSync(join(repoRoot, ".claude", "settings.json"), "utf8"),
    ) as {
      hooks: Record<string, { hooks: { command: string; args?: string[] }[] }[]>;
    };
    const hooks = Object.values(settings.hooks).flatMap((entries) =>
      entries.flatMap((entry) => entry.hooks),
    );

    expect(hooks).toHaveLength(6);
    for (const hook of hooks) {
      expect(hook.command).toBe("node");
      expect(hook.args?.[0]).toBe("$" + "{CLAUDE_PROJECT_DIR}/.claude/hooks/run-bun.mjs");
      expect(hook.args?.slice(1).every((token) => token.length > 0)).toBe(true);
      expect(
        hook.args?.some((token) => /(?:cmd|powershell|pwsh|sh)(?:\.exe)?/i.test(basename(token))),
      ).toBe(false);
    }
  });

  it("generates exact node-launcher-native-Bun argv for every Pack hook", () => {
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
        ["node", ".ut-tdd/bin/run-bun.mjs", ".ut-tdd/bin/ut-tdd.mjs", "hook", "agent-guard"],
        ["node", ".ut-tdd/bin/run-bun.mjs", ".ut-tdd/bin/ut-tdd.mjs", "hook", "work-guard"],
      ],
      SessionStart: [
        ["node", ".ut-tdd/bin/run-bun.mjs", ".ut-tdd/bin/ut-tdd.mjs", "session", "start"],
      ],
      PostToolUse: [
        ["node", ".ut-tdd/bin/run-bun.mjs", ".ut-tdd/bin/ut-tdd.mjs", "hook", "post-tool-use"],
      ],
      Stop: [["node", ".ut-tdd/bin/run-bun.mjs", ".ut-tdd/bin/ut-tdd.mjs", "session", "summary"]],
      SubagentStop: [
        ["node", ".ut-tdd/bin/run-bun.mjs", ".ut-tdd/bin/ut-tdd.mjs", "hook", "subagent-stop"],
      ],
    });
  });
});
