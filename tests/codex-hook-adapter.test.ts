import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  analyzeCodexHookAdapter,
  CODEX_DEFERRED_SURFACE,
  CODEX_NOT_APPLICABLE,
  CODEX_REQUIRED,
  codexHookAdapterMessages,
  loadCodexHookAdapterInput,
} from "../src/lint/codex-hook-adapter.ts";
import {
  CODEX_DEFERRED_SURFACE as CODEX_DEFERRED_SURFACE_POLICY,
  CODEX_NOT_APPLICABLE as CODEX_NOT_APPLICABLE_POLICY,
  CODEX_REQUIRED as CODEX_REQUIRED_POLICY,
} from "../src/lint/codex-hook-adapter-policy.ts";
import {
  CODEX_GIT_ROOT_PREFIX,
  codexCommandString,
  parseCodexCommandString,
  parseHookInvocation,
} from "../src/lint/hook-invocation.ts";
import { REQUIRED as CLAUDE_REQUIRED, wrapperHookArgs } from "../src/lint/project-hook.ts";
import { analyzeReadability } from "../src/lint/readability.ts";
import { evaluateAgentGuard } from "../src/runtime/agent-guard.ts";
import { evaluateWorkGuard } from "../src/runtime/work-guard.ts";
import { BUILTIN_GITHUB_TEMPLATES } from "../src/setup/templates.ts";
import {
  createCleanPack,
  createConsumerProject,
  fixtureRoots,
  removeFixtureTree,
  setupConsumerFromPack,
  writeConsumerRuntimeInput,
} from "./support/pack-consumer-runtime.ts";

/**
 * .codex/hooks.json と同型の有効な Codex adapter fixture (mutate して fail-close を検証)。
 * PLAN-L7-668 §3: command は `node "$(git rev-parse --show-toplevel)/<script>" [固定引数...]`
 * の 1 文字列であり、`args` / `blockOnFailure` は持たない。
 */
function validCodexHooks(): Record<string, unknown> {
  const cmd = (id: Parameters<typeof wrapperHookArgs>[0]) =>
    codexCommandString(wrapperHookArgs(id));
  return {
    hooks: {
      PreToolUse: [
        {
          matcher: "apply_patch|write_file",
          hooks: [{ type: "command", command: cmd("work-guard") }],
        },
        {
          matcher: "spawn_agent|spawn_agents_on_csv",
          hooks: [{ type: "command", command: cmd("agent-guard") }],
        },
      ],
      SessionStart: [{ hooks: [{ type: "command", command: cmd("session-start") }] }],
      PostToolUse: [
        {
          matcher: "apply_patch|write_file|exec_command|local_shell|Bash",
          hooks: [{ type: "command", command: cmd("post-tool-use") }],
        },
      ],
      Stop: [{ hooks: [{ type: "command", command: cmd("session-summary") }] }],
    },
  };
}

const json = (o: unknown): string => JSON.stringify(o);

const assertExternalizedCodexRequiredPolicy = (): void => {
  expect(CODEX_REQUIRED_POLICY.map((hook) => hook.id)).toContain("work-guard");
  expect(CODEX_REQUIRED_POLICY).toEqual(CODEX_REQUIRED);
};

/**
 * Codex がそのまま hooks.json の `command` 文字列を渡す shell 起動形 (PLAN-L7-668 §1.1 実測):
 * Windows は `pwsh -NoProfile -Command <command>`、それ以外は POSIX `sh -c <command>`。
 * `spawn(..., { shell: true })` は使わない (Windows で cmd を使ってしまうため)。
 */
function spawnCodexHookCommand(
  command: string,
  options: { cwd: string; input: string; env?: NodeJS.ProcessEnv },
) {
  const env = { ...process.env, ...options.env };
  if (process.platform === "win32") {
    // PowerShell 7.3+ の $PSNativeCommandUseErrorActionPreference (既定 $true) は、非 0 exit +
    // stderr 出力を持つ native command を pwsh 自身の terminating error として扱い、pwsh の
    // プロセス exit code を (元の値ではなく) 1 に丸めてしまう。Codex が hook の exit code を
    // そのまま受け取る契約 (PLAN-L7-668 §3.3) を検証するため、ここでは無効化して
    // 元の $LASTEXITCODE をそのまま pwsh 自身の exit code にする。
    return spawnSync(
      "pwsh",
      [
        "-NoProfile",
        "-Command",
        `$global:PSNativeCommandUseErrorActionPreference = $false; ${command}; exit $LASTEXITCODE`,
      ],
      {
        cwd: options.cwd,
        input: options.input,
        encoding: "utf8",
        env,
        windowsHide: true,
      },
    );
  }
  return spawnSync("sh", ["-c", command], {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf8",
    env,
  });
}

describe("codex-hook-adapter — Codex hooks.json parity (PLAN-L7-139, PLAN-L7-668)", () => {
  it("U-CXHOOKCMD-001: 実 repo の .codex/hooks.json と setup 生成 consumer hooks.json は現行 Codex command schema を満たす", () => {
    const r = analyzeCodexHookAdapter(loadCodexHookAdapterInput(process.cwd()));
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
    expect(r.apiToolPathEnforced).toBe(false);
    expect(codexHookAdapterMessages(r)[0]).toContain(".codex/hooks.json shares");
    expect(codexHookAdapterMessages(r).join("\n")).toContain(
      "hosted API/developer apply_patch tools do not execute through the Codex hook engine",
    );

    const raw = readFileSync(join(process.cwd(), ".codex", "hooks.json"), "utf8");
    const parsedRaw = JSON.parse(raw) as {
      hooks: Record<string, { matcher?: string; hooks: { command: string; args?: unknown }[] }[]>;
    };
    const allCommands = Object.values(parsedRaw.hooks).flatMap((entries) =>
      entries.flatMap((entry) => entry.hooks),
    );
    for (const hook of allCommands) {
      expect(hook.args).toBeUndefined();
      expect(hook.command.startsWith(`node "${CODEX_GIT_ROOT_PREFIX}`)).toBe(true);
    }
    expect(parsedRaw.hooks.PostToolUse.some((entry) => entry.matcher?.includes("Bash"))).toBe(true);

    const generated = BUILTIN_GITHUB_TEMPLATES["adapter/.codex/hooks.json"];
    const rGenerated = analyzeCodexHookAdapter({ codexHooksJson: generated });
    expect(rGenerated.ok).toBe(true);
    expect(rGenerated.violations).toEqual([]);
    const parsedGenerated = JSON.parse(generated) as {
      hooks: Record<string, { matcher?: string; hooks: { command: string } }[]>;
    };
    expect(
      Object.values(parsedGenerated.hooks)
        .flatMap((entries) => entries.flatMap((entry) => entry.hooks))
        .every((hook) => hook.command.startsWith(`node "${CODEX_GIT_ROOT_PREFIX}`)),
    ).toBe(true);
  });

  it("U-CXHOOK-002: 有効な adapter fixture は ok", () => {
    assertExternalizedCodexRequiredPolicy();
    expect(analyzeCodexHookAdapter({ codexHooksJson: json(validCodexHooks()) }).ok).toBe(true);
  });

  it("U-CXHOOK-002d: Claude/Codex の wrapper 配線は定義上同一 (entrypoint 分岐防止)", () => {
    const claudeWrapperById = new Map(CLAUDE_REQUIRED.map((hook) => [hook.id, hook.wrapperArgs]));
    for (const required of CODEX_REQUIRED) {
      expect(required.wrapperArgs).toBe(claudeWrapperById.get(required.id));
    }
  });

  it("U-CXHOOK-002f: Claude/Codex の invocation は git-root 前置を除けば同一 semantics を持つ", () => {
    const claude = JSON.parse(BUILTIN_GITHUB_TEMPLATES["adapter/.claude/settings.json"]) as {
      hooks: Record<string, { hooks: { command: string; args: string[] }[] }[]>;
    };
    const codex = JSON.parse(BUILTIN_GITHUB_TEMPLATES["adapter/.codex/hooks.json"]) as {
      hooks: Record<string, { hooks: { command: string }[] }[]>;
    };

    const claudeInvocations = Object.values(claude.hooks)
      .flatMap((entries) => entries.flatMap((entry) => entry.hooks))
      .map((hook) => parseHookInvocation(hook))
      .filter((invocation) => invocation !== null)
      .map((invocation) => [invocation.executable, ...invocation.args].join(" "))
      // CodexにはClaude宛てwakeとSubagentStopの対応surfaceがない。
      .filter(
        (command) =>
          !command.endsWith(" hook subagent-stop") && !command.endsWith(" hook claude-memory-wake"),
      )
      .sort();
    const codexInvocations = Object.values(codex.hooks)
      .flatMap((entries) => entries.flatMap((entry) => entry.hooks))
      .map((hook) => parseCodexCommandString(hook.command).invocation)
      .filter((invocation) => invocation !== null)
      .map((invocation) => [invocation.executable, ...invocation.args].join(" "))
      .sort();

    expect(claudeInvocations).toEqual(codexInvocations);
  });

  it("U-CXHOOK-002b: policy prose is mojibake-free", () => {
    const policyText = [
      ...CODEX_NOT_APPLICABLE_POLICY.map((item) => item.reason),
      ...CODEX_DEFERRED_SURFACE_POLICY.map((item) => item.reason),
    ].join("\n");
    expect(
      analyzeReadability([{ path: "src/lint/codex-hook-adapter-policy.ts", text: policyText }])
        .violations,
    ).toEqual([]);
  });

  it("U-CXHOOK-003: hooks.json 不在は fail-close (missing_hooks_json)", () => {
    const r = analyzeCodexHookAdapter({ codexHooksJson: null });
    expect(r.ok).toBe(false);
    expect(r.violations[0].reason).toBe("missing_hooks_json");
  });

  it("U-CXHOOK-004: 壊れた JSON は fail-close (malformed_json)", () => {
    const r = analyzeCodexHookAdapter({ codexHooksJson: "{ not json" });
    expect(r.ok).toBe(false);
    expect(r.violations[0].reason).toBe("malformed_json");
  });

  it("U-CXHOOK-005: work-guard ガードを欠くと fail-close (missing_hook)", () => {
    const broken = validCodexHooks() as { hooks: Record<string, unknown> };
    broken.hooks.PreToolUse = [];
    const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.hook === "work-guard" && v.reason === "missing_hook")).toBe(
      true,
    );
  });

  it("U-CXHOOK-006: Codex の編集 matcher が Claude 字面のままだと発火しない = fail-close", () => {
    const broken = validCodexHooks() as { hooks: { PreToolUse: { matcher: string }[] } };
    // 字面コピー (Edit|Write|MultiEdit) は Codex tool 名と一致せず発火しない偽パリティ。
    broken.hooks.PreToolUse[0].matcher = "Edit|Write|MultiEdit";
    const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.hook === "work-guard" && v.reason === "missing_hook")).toBe(
      true,
    );
  });

  it("U-CXHOOK-008: Codex command が $CLAUDE_PROJECT_DIR 依存だと fail-close (repo-relative 原則)", () => {
    const broken = validCodexHooks() as {
      hooks: { PreToolUse: { hooks: { command: string }[] }[] };
    };
    broken.hooks.PreToolUse[0].hooks[0].command =
      'bun "$CLAUDE_PROJECT_DIR/.claude/hooks/work-guard.ts"';
    const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.reason === "claude_project_dir_in_codex")).toBe(true);
  });

  it("U-CXHOOK-009: global ~/.codex/ 参照は fail-close (no global writes)", () => {
    const broken = validCodexHooks() as {
      hooks: { SessionStart: { hooks: { command: string }[] }[] };
    };
    broken.hooks.SessionStart[0].hooks[0].command = "bun ~/.codex/hooks/start.ts";
    const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.reason === "global_codex_path")).toBe(true);
  });

  it("U-CXHOOK-010: Codex の各 entrypoint は Claude REQUIRED にも存在する (双方向、no silent fork)", () => {
    const claudeEntrypoints = new Set(CLAUDE_REQUIRED.map((r) => r.commandParts.join(" ")));
    for (const guard of CODEX_REQUIRED) {
      expect(claudeEntrypoints.has(guard.commandParts.join(" "))).toBe(true);
    }
  });

  it("U-CXHOOK-011: subagent-stop stays N/A while Codex spawn_agent is guarded", () => {
    const naEntrypoints = CODEX_NOT_APPLICABLE.map((n) => n.entrypoint);
    expect(naEntrypoints).toContain("src/cli.ts hook subagent-stop");
    for (const n of CODEX_NOT_APPLICABLE) expect(n.reason.length).toBeGreaterThan(0);
    expect(CODEX_DEFERRED_SURFACE).toEqual([]);
    expect(CODEX_REQUIRED.find((hook) => hook.id === "agent-guard")).toMatchObject({
      event: "PreToolUse",
      matcher: "spawn_agent|spawn_agents_on_csv",
    });
    expect(analyzeCodexHookAdapter({ codexHooksJson: json(validCodexHooks()) }).ok).toBe(true);
  });

  it("U-CXHOOK-012: 共有 guard ロジックは runtime 非依存 — Codex 発火時も同じ判定になる", () => {
    // work-guard: foreign uncommitted file は block (Codex の apply_patch|write_file 経由でも同一純関数)。
    expect(
      evaluateWorkGuard({
        targetPath: "src/plan/lint.ts",
        uncommittedFiles: ["src/plan/lint.ts"],
        sessionTouchedFiles: [],
        bypass: false,
      }).decision,
    ).toBe("block");
    // agent-guard allowlist ロジックは共有。Codex は spawn_agent 面を実際に持つので、agent-guard 相当を
    // 配線すれば同 entrypoint・同判定になる (配線自体は deferred follow-up)。
    expect(
      evaluateAgentGuard(
        { tool_name: "Agent", tool_input: { subagent_type: "be-logic", model: "sonnet" } },
        { allowRaw: false, resolveAgentFamily: () => "missing" },
      ).code,
    ).toBe(2);
  });

  it("U-CXHOOK-013: 非 command type の hook では guard 充足とみなさない (type==='command' 必須)", () => {
    const broken = validCodexHooks() as {
      hooks: { PreToolUse: { hooks: { type: string }[] }[] };
    };
    broken.hooks.PreToolUse[0].hooks[0].type = "notification";
    const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.hook === "work-guard" && v.reason === "missing_hook")).toBe(
      true,
    );
  });

  it("U-CXHOOK-014: script path が別 token の部分文字列に紛れるだけでは guard 充足にしない (token 厳格化)", () => {
    const broken = validCodexHooks() as {
      hooks: { Stop: { hooks: { command: string }[] }[] };
    };
    // 'src/cli.tsx' は 'src/cli.ts' を部分文字列に含むが別ファイル。scriptPath 完全一致なら弾ける。
    broken.hooks.Stop[0].hooks[0].command = `node "${CODEX_GIT_ROOT_PREFIX}src/cli.tsx" session summary`;
    const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
    expect(r.ok).toBe(false);
    expect(
      r.violations.some((v) => v.hook === "session-summary" && v.reason === "missing_hook"),
    ).toBe(true);
  });

  describe("U-CXHOOKCMD-002: command 形式の変異は typed finding で fail-close", () => {
    it("(a) 旧形式 command+args (2026-09-18 以前の実 fixture 形) は fail-close", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: Record<string, unknown>[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0] = {
        type: "command",
        command: "node",
        args: [...wrapperHookArgs("work-guard")],
      };
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(
        r.violations.some((v) => v.reason === "unsupported_hook_field" && v.field === "args"),
      ).toBe(true);
    });

    it("(b) blockOnFailure の付加は fail-close (schema に存在しない field)", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: Record<string, unknown>[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0].blockOnFailure = true;
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(
        r.violations.some(
          (v) => v.reason === "unsupported_hook_field" && v.field === "blockOnFailure",
        ),
      ).toBe(true);
    });

    it("(c) schema 外の任意 field は fail-close", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: Record<string, unknown>[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0].foo = "bar";
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(
        r.violations.some((v) => v.reason === "unsupported_hook_field" && v.field === "foo"),
      ).toBe(true);
    });

    it("(d) command が interpreter 単体 (`node`) は fail-close", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: { command: string }[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0].command = "node";
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(r.violations.some((v) => v.reason === "bare_interpreter_command")).toBe(true);
    });

    it("(e) 固定前置部分の外の script path に空白を含めると fail-close", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: { command: string }[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0].command = `node "${CODEX_GIT_ROOT_PREFIX}.claude/hooks/work guard.ts"`;
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(r.violations.some((v) => v.reason === "unsafe_command_token")).toBe(true);
    });

    it("(f) git root 解決を外した repo 相対 command は fail-close", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: { command: string }[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0].command = 'node ".claude/hooks/work-guard.ts"';
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(r.violations.some((v) => v.reason === "unrooted_command_path")).toBe(true);
    });

    it("(g) commandWindows の付加は fail-close (Windows 専用の別経路を作らない)", () => {
      const broken = validCodexHooks() as {
        hooks: { PreToolUse: { hooks: Record<string, unknown>[] }[] };
      };
      broken.hooks.PreToolUse[0].hooks[0].commandWindows = "node.exe";
      const r = analyzeCodexHookAdapter({ codexHooksJson: json(broken) });
      expect(r.ok).toBe(false);
      expect(
        r.violations.some(
          (v) => v.reason === "unsupported_hook_field" && v.field === "commandWindows",
        ),
      ).toBe(true);
    });
  });

  describe("U-CXHOOKCMD-003/004/005: hooks.json の command 文字列を Codex と同じ shell 起動形で実行", () => {
    let consumer = "";

    beforeAll(async () => {
      const pack = createCleanPack();
      consumer = createConsumerProject("fixture/consumer-cxhookcmd");
      const input = await writeConsumerRuntimeInput(pack, consumer);
      setupConsumerFromPack(pack, consumer, input);
      removeFixtureTree(pack);
      mkdirSync(join(consumer, "subdir"), { recursive: true });
    }, 420_000);

    afterAll(() => {
      for (const root of fixtureRoots.splice(0, fixtureRoots.length)) {
        if (root === consumer) removeFixtureTree(root);
      }
    });

    function codexHooks(): {
      hooks: Record<string, { matcher?: string; hooks: { command: string }[] }[]>;
    } {
      return JSON.parse(readFileSync(join(consumer, ".codex", "hooks.json"), "utf8"));
    }

    function commandFor(event: string, matcher?: string): string {
      const hooks = codexHooks();
      const entries = hooks.hooks[event] ?? [];
      const entry = matcher ? entries.find((e) => e.matcher === matcher) : entries[0];
      const command = entry?.hooks[0]?.command;
      if (!command) throw new Error(`no command for ${event}/${matcher ?? ""}`);
      return command;
    }

    it("U-CXHOOKCMD-003: SessionStart/PostToolUse/Stop は repo root / subdirectory の両方の cwd で exit 0", () => {
      const subdirectory = join(consumer, "subdir");
      for (const cwd of [consumer, subdirectory]) {
        const sessionStart = spawnCodexHookCommand(commandFor("SessionStart"), {
          cwd,
          input: JSON.stringify({ session_id: "cxhookcmd-003", tool_name: "SessionStart" }),
          env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
        });
        expect(
          sessionStart.status,
          `cwd=${cwd}: ${sessionStart.stdout}\n${sessionStart.stderr}`,
        ).toBe(0);

        const stop = spawnCodexHookCommand(commandFor("Stop"), {
          cwd,
          input: JSON.stringify({ session_id: "cxhookcmd-003", tool_name: "Stop" }),
          env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
        });
        expect(stop.status, `cwd=${cwd}: ${stop.stdout}\n${stop.stderr}`).toBe(0);
      }

      // 変異: 旧形式 (node 単体) に戻すと exit 1 になる。
      const legacy = spawnCodexHookCommand("node", {
        cwd: consumer,
        input: JSON.stringify({ session_id: "cxhookcmd-003-legacy" }),
      });
      expect(legacy.status).not.toBe(0);

      // 変異: git root 解決を外した repo 相対 command は subdirectory cwd で解決できず fail する。
      const unrooted = spawnCodexHookCommand('node "src/cli.ts" session start', {
        cwd: subdirectory,
        input: JSON.stringify({ session_id: "cxhookcmd-003-unrooted" }),
        env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
      });
      expect(unrooted.status).not.toBe(0);
    }, 420_000);

    it("U-CXHOOKCMD-004: work-guard/agent-guard は foreign 編集を repo root / subdirectory の両方で block する", () => {
      const subdirectory = join(consumer, "subdir");
      const workGuardCommand = commandFor("PreToolUse", "apply_patch|write_file");
      const agentGuardCommand = commandFor("PreToolUse", "spawn_agent|spawn_agents_on_csv");

      // setup が生成した AGENTS.md は consumer repo でまだ commit されておらず
      // (setupConsumerFromPack が commit するのは ut-tdd.project.json だけ)、この hook
      // 呼び出しの session_id とは無関係の "foreign uncommitted file" として扱われる。
      // (`.claude/CLAUDE.md` のような「丸ごと新規の untracked ディレクトリ」配下のパスは
      // `git status --porcelain` が既定でディレクトリ 1 行に畳んでしまい、work-guard の
      // per-file 照合に乗らない。リポジトリ直下は project 作成時から tracked なので、
      // 直下の untracked ファイルは個別行になる。)
      for (const cwd of [consumer, subdirectory]) {
        const foreignEdit = spawnCodexHookCommand(workGuardCommand, {
          cwd,
          input: JSON.stringify({
            session_id: "cxhookcmd-004",
            tool_name: "apply_patch",
            tool_input: { file_path: "AGENTS.md" },
          }),
          env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
        });
        expect(foreignEdit.status, `cwd=${cwd}: ${foreignEdit.stdout}\n${foreignEdit.stderr}`).toBe(
          2,
        );
      }

      // README.md は project 作成時に commit 済みで未変更 (uncommitted files に含まれない) なので pass する。
      const ownSessionEdit = spawnCodexHookCommand(workGuardCommand, {
        cwd: consumer,
        input: JSON.stringify({
          session_id: "cxhookcmd-004-own",
          tool_name: "apply_patch",
          tool_input: { file_path: "README.md" },
        }),
        env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
      });
      expect(ownSessionEdit.status).toBe(0);

      const disallowedSpawn = spawnCodexHookCommand(agentGuardCommand, {
        cwd: consumer,
        input: JSON.stringify({
          session_id: "cxhookcmd-004-agent",
          tool_name: "spawn_agent",
          tool_input: { subagent_type: "not-allowlisted", model: "sonnet" },
        }),
        env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
      });
      expect(disallowedSpawn.status).toBe(2);
    }, 420_000);

    it("U-CXHOOKCMD-005: consumer launcher は active runtime 不在時 exit 78 (consumer_runtime_absent)", () => {
      const command = commandFor("SessionStart");
      expect(command).toContain(".ut-tdd/bin/ut-tdd.mjs");

      // 構成済み consumer (active runtime あり) では launcher が正常起動する。
      const configured = spawnCodexHookCommand(command, {
        cwd: consumer,
        input: JSON.stringify({ session_id: "cxhookcmd-005-configured" }),
        env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
      });
      expect(configured.status, `${configured.stdout}\n${configured.stderr}`).toBe(0);

      // active runtime pointer を取り除くと、同じ launcher command が
      // exit 78 / consumer_runtime_absent を返す (U-HOOKEXEC-001 と同じ契約)。
      // args が落ちて bare `node` の SyntaxError になる旧 args 形式の失敗経路とは区別する。
      const pointerPath = join(consumer, ".ut-tdd", "runtime", "activation", "active.json");
      const pointerBytes = readFileSync(pointerPath);
      rmSync(pointerPath, { force: true });
      try {
        const absent = spawnCodexHookCommand(command, {
          cwd: consumer,
          input: JSON.stringify({ session_id: "cxhookcmd-005-absent" }),
          env: { CLAUDE_PROJECT_DIR: consumer, UT_TDD_PROJECT_DIR: consumer },
        });
        expect(absent.status, `${absent.stdout}\n${absent.stderr}`).toBe(78);
        expect(absent.stderr).toContain("consumer_runtime_absent");
        expect(absent.stderr).not.toMatch(/SyntaxError/);
      } finally {
        writeFileSync(pointerPath, pointerBytes);
      }
    }, 420_000);
  });
});
