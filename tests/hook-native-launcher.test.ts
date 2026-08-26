import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_GITHUB_TEMPLATES } from "../src/setup/templates.ts";

const repoRoot = process.cwd();
// PLAN-L7-462 PR-C: repo 自身の hooks は node 直起動になり shim は撤去済み。
// launcher の挙動検証は consumer 向け template (setup が生成する wrapper) を実体化して行う。
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

// module 寿命の実体化 (afterEach の cleanup 対象に載せない)。
// PLAN-L7-509: run-bun 間接層は削除済み。生成 wrapper (ut-tdd.mjs) を実体化し、
// Bun が PATH に存在しない環境で node 直起動が成立することを oracle にする (AC-6)。
const wrapperDirectory = mkdtempSync(join(tmpdir(), "ut-tdd-hook-wrapper-src-"));
const wrapper = join(wrapperDirectory, "ut-tdd.mjs");
writeFileSync(wrapper, BUILTIN_GITHUB_TEMPLATES["common/ut-tdd.mjs"]);

describe("Claude hook wrapper launch (issue #123 / PLAN-L7-509)", () => {
  it("U-HOOKEXEC-001: forwards stdin and every argv token unchanged without Bun on PATH", () => {
    const directory = temporaryDirectory();
    const localCli = join(directory, "src", "cli.ts");
    const output = join(directory, "result.json");
    mkdirSync(join(directory, "src", "setup"), { recursive: true });
    writeFileSync(join(directory, "src", "setup", "index.ts"), "export {};");
    writeFileSync(
      localCli,
      [
        'import { readFileSync, writeFileSync } from "node:fs";',
        "const [output, ...forwarded] = process.argv.slice(2);",
        'writeFileSync(output, JSON.stringify({ forwarded, stdin: readFileSync(0, "utf8") }));',
      ].join("\n"),
    );
    const forwarded = ["plain", "contains spaces", 'quote"inside', "a&b", "日本語"];
    const stdin = '{"hook_event_name":"SessionStart","value":"a & b"}';

    // PATH を空にして Bun (および他のあらゆる外部コマンド) を解決不能にする。
    const result = spawnSync(process.execPath, [wrapper, output, ...forwarded], {
      cwd: directory,
      env: { ...process.env, PATH: "", APPDATA: "" },
      input: stdin,
      encoding: "utf8",
      windowsHide: true,
    });

    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(output, "utf8"))).toEqual({ forwarded, stdin });
  });

  it("U-HOOKEXEC-008: fails closed with the wrapper message when no CLI entrypoint resolves", () => {
    const directory = temporaryDirectory();
    const result = spawnSync(process.execPath, [wrapper, "status"], {
      cwd: directory,
      env: { ...process.env, PATH: "", APPDATA: "" },
      encoding: "utf8",
      windowsHide: true,
    });

    expect(result.status).toBe(127);
    expect(result.stderr).toContain("consumer_runtime_absent");
  });

  it("U-HOOKEXEC-011: never falls back to the setup machine's Pack checkout (PLAN-L6-101 §1.1)", () => {
    // CANDIDATE-PACKISO-001 系の oracle: setup 元 (development repo / worktree / Pack
    // checkout) が consumer から到達可能であっても、wrapper はそれを解決先にしない。
    // ここでは「setup 元に相当する実在の harness source」を用意した上で、consumer 側に
    // harness が無ければ typed fail-close することを検査する。
    const setupOrigin = temporaryDirectory();
    mkdirSync(join(setupOrigin, "src", "setup"), { recursive: true });
    writeFileSync(join(setupOrigin, "src", "setup", "index.ts"), "export {};");
    writeFileSync(
      join(setupOrigin, "src", "cli.ts"),
      'console.log("setup-origin cli must not run");\n',
    );

    const consumer = temporaryDirectory();
    const result = spawnSync(process.execPath, [wrapper, "status"], {
      cwd: consumer,
      env: { ...process.env, PATH: "", APPDATA: "" },
      encoding: "utf8",
      windowsHide: true,
    });

    expect(result.status).toBe(127);
    expect(result.stderr).toContain("consumer_runtime_absent");
    expect(result.stdout).not.toContain("setup-origin cli must not run");
    // 生成物に setup 元の絶対パスが焼き込まれていないこと (静的側の fail-close)。
    expect(readFileSync(wrapper, "utf8")).not.toContain(setupOrigin);
  });

  it("U-HOOKEXEC-008: uses direct executable spawning and never delegates to a shell host or Bun", () => {
    const source = readFileSync(wrapper, "utf8");

    expect(source).toContain("spawnSync(process.execPath, [resolvedCli, ...process.argv.slice(2)]");
    expect(source).toContain("windowsHide: true");
    expect(source).not.toMatch(/\bbun\b/i);
    expect(source).not.toMatch(/\b(?:cmd(?:\.exe)?|powershell(?:\.exe)?|pwsh|sh(?:\.exe)?)\b/i);
    expect(source).not.toContain("shell: true");
  });

  it("U-HOOKEXEC-009: requires the first Node release line with unflagged TypeScript execution", () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
      engines?: { node?: string };
    };
    // F0a pins engines.node to an exact version (toolchain-pin lint); the
    // unflagged-TS floor stays 22.18, so ranges and pins below it must fail.
    const pinned = manifest.engines?.node ?? "";
    const exact = /^(\d+)\.(\d+)\.\d+$/.exec(pinned);
    expect(exact).not.toBeNull();
    const major = Number(exact?.[1]);
    const minor = Number(exact?.[2]);
    expect(major > 22 || (major === 22 && minor >= 18)).toBe(true);
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

    expect(hooks).toHaveLength(7);
    for (const hook of hooks) {
      expect(hook.command).toBe("node");
      // PR-C: launcher shim を廃し node 直起動 (第一引数は実 hook script / cli)。
      expect(hook.args?.[0]).toMatch(
        /^\$\{CLAUDE_PROJECT_DIR\}\/(?:\.claude\/hooks\/[a-z-]+\.ts|src\/cli\.ts)$/,
      );
      expect(hook.args?.some((token) => token.includes("run-bun"))).toBe(false);
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
        ["node", ".ut-tdd/bin/ut-tdd.mjs", "hook", "agent-guard"],
        ["node", ".ut-tdd/bin/ut-tdd.mjs", "hook", "work-guard"],
      ],
      SessionStart: [["node", ".ut-tdd/bin/ut-tdd.mjs", "session", "start"]],
      PostToolUse: [["node", ".ut-tdd/bin/ut-tdd.mjs", "hook", "post-tool-use"]],
      Stop: [
        ["node", ".ut-tdd/bin/ut-tdd.mjs", "session", "summary"],
        ["node", ".ut-tdd/bin/ut-tdd.mjs", "hook", "claude-memory-wake"],
      ],
      SubagentStop: [["node", ".ut-tdd/bin/ut-tdd.mjs", "hook", "subagent-stop"]],
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
        (hook) => hook.command === "node" && hook.args?.[0] === ".ut-tdd/bin/ut-tdd.mjs",
      ),
    ).toBe(true);
    expect(wrapper).toContain("spawnSync(process.execPath");
    expect(wrapper).toContain("windowsHide: true");
    expect(wrapper).not.toContain("shell:");
    expect(wrapper).not.toContain("ut-tdd.cmd");
  });
});
