import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildAdapterPlan,
  buildProviderInvocation,
  isProviderCommandSpawnable,
  providerAvailable,
  resolveClaudeNativeCommand,
  resolveCodexNativeCommand,
} from "../src/runtime/adapter";
import {
  ADAPTER_CONTEXT_HEADER,
  CLAUDE_EFFORT_ENV,
  CLAUDE_STDIN_ARGS,
  CODEX_MODEL_FLAG,
  CODEX_STDIN_ARGS,
  REQUIRED_SKILL_LABEL,
} from "../src/runtime/adapter-policy";

/** 指定パスの親ディレクトリまで作成し、空の実行ファイルを置く。 */
function touchBinary(path: string): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, "");
}

describe("runtime adapter plan", () => {
  it("checks provider availability by execution mode", () => {
    expect(providerAvailable("codex", "codex-only")).toBe(true);
    expect(providerAvailable("codex", "claude-only")).toBe(false);
    expect(providerAvailable("claude", "hybrid")).toBe(true);
  });

  it("builds dry-run codex command plan", () => {
    const plan = buildAdapterPlan(
      {
        provider: "codex",
        role: "se",
        task: "implement",
        planId: "PLAN-L4-99-x",
        model: "gpt-5.3-codex",
        effort: "medium",
      },
      "hybrid",
    );
    expect(plan.available).toBe(true);
    expect(plan.dry_run).toBe(true);
    expect(plan.command).toBe("codex");
    expect(plan.args).toContain(CODEX_STDIN_ARGS[0]);
    expect(plan.args).toContain(CODEX_MODEL_FLAG);
    expect(plan.args).toContain("gpt-5.3-codex");
    expect(plan.args).not.toContain("--plan-id");
    expect(plan.model).toBe("gpt-5.3-codex");
    expect(plan.effort).toBe("medium");
    expect(plan.plan_id).toBe("PLAN-L4-99-x");
  });

  it("marks unavailable provider as not available", () => {
    const plan = buildAdapterPlan({ provider: "claude", role: "tl", task: "review" }, "codex-only");
    expect(plan.available).toBe(false);
    expect(plan.messages[0]).toContain("not available");
  });

  it("injects scoped skill paths into provider stdin without moving task text to argv", () => {
    const plan = buildAdapterPlan(
      {
        provider: "codex",
        role: "se",
        task: "implement",
        contextInjection: {
          required_paths: ["docs/skills/refactoring.md"],
          optional_paths: ["docs/skills/review-checklist.yaml"],
        },
      },
      "hybrid",
    );

    expect(plan.stdin).toContain("implement");
    expect(plan.stdin).toContain(ADAPTER_CONTEXT_HEADER);
    expect(plan.stdin).toContain(`- ${REQUIRED_SKILL_LABEL}: docs/skills/refactoring.md`);
    expect(plan.stdin).toContain("- optional skill: docs/skills/review-checklist.yaml");
    expect(plan.context_injection).toEqual({
      required_paths: ["docs/skills/refactoring.md"],
      optional_paths: ["docs/skills/review-checklist.yaml"],
    });
    expect(plan.args).not.toContain("docs/skills/refactoring.md");
  });

  it("builds claude command plan with Claude Code print-mode stdin", () => {
    const plan = buildAdapterPlan(
      {
        provider: "claude",
        role: "pmo-sonnet",
        task: "review",
        planId: "PLAN-L4-99-x",
        model: "claude-sonnet-4-6",
        effort: "medium",
      },
      "hybrid",
    );
    expect(plan.available).toBe(true);
    expect(plan.command).toBe("claude");
    expect(plan.args).toEqual([
      ...CLAUDE_STDIN_ARGS,
      "--model",
      "claude-sonnet-4-6",
      "--effort",
      "medium",
    ]);
    expect(plan.stdin).toBe("review");
    expect(plan.model).toBe("claude-sonnet-4-6");
    expect(plan.effort).toBe("medium");
    expect(plan.env).toEqual({ [CLAUDE_EFFORT_ENV]: "medium" });
    expect(plan.args).not.toContain("--role");
    expect(plan.args).not.toContain("--task");
    expect(plan.args).not.toContain("PLAN-L4-99-x");
    expect(plan.plan_id).toBe("PLAN-L4-99-x");
  });

  it("U-ADAPTER-002: honors UT_TDD_CODEX_BIN before PATH lookup", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-adapter-codex-bin-"));
    try {
      const explicit = join(root, process.platform === "win32" ? "codex.cmd" : "codex");
      writeFileSync(explicit, "");

      expect(resolveCodexNativeCommand({ env: { UT_TDD_CODEX_BIN: explicit } })).toBe(explicit);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-ADAPTER-003: wraps Windows command scripts through canonical cmd.exe", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-adapter-cmd-"));
    try {
      const explicit = join(root, "codex.cmd");
      writeFileSync(explicit, "");
      const invocation = buildProviderInvocation({
        provider: "codex",
        command: "codex",
        args: ["exec", "hello world"],
        opts: {
          platform: "win32",
          env: {
            SystemRoot: "C:\\Windows",
            UT_TDD_CODEX_BIN: explicit,
          },
        },
      });

      expect(invocation.args).toEqual([]);
      expect(invocation.shell).toBe(true);
      expect(invocation.command).toContain(`"${explicit}"`);
      expect(invocation.command).toContain('"hello world"');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-ADAPTER-005: picks the semver-newest native Claude, not the lexicographic-largest (A-137 #6)", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-adapter-claude-ver-"));
    try {
      const codeRoot = join(root, "Claude", "claude-code");
      // 字句順では "1.9.0" > "1.10.0" だが、実際の最新は 1.10.0。
      touchBinary(join(codeRoot, "1.9.0", "claude.exe"));
      touchBinary(join(codeRoot, "1.10.0", "claude.exe"));
      touchBinary(join(codeRoot, "1.2.3", "claude.exe"));

      const resolved = resolveClaudeNativeCommand({
        platform: "win32",
        env: { APPDATA: root, USERPROFILE: root },
      });

      expect(resolved).toBe(join(codeRoot, "1.10.0", "claude.exe"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-ADAPTER-006: compares semver across mixed sources, ignoring path-prefix and platform suffix (A-137 #6)", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-adapter-claude-mixed-"));
    try {
      const codeRoot = join(root, "Claude", "claude-code");
      touchBinary(join(codeRoot, "1.0.0", "claude.exe"));
      const vscodeExt = join(
        root,
        ".vscode",
        "extensions",
        "anthropic.claude-code-1.2.0-win32-x64",
      );
      const vscodeBinary = join(vscodeExt, "resources", "native-binary", "claude.exe");
      touchBinary(vscodeBinary);

      const resolved = resolveClaudeNativeCommand({
        platform: "win32",
        env: { APPDATA: root, USERPROFILE: root },
      });

      // appData 1.0.0 < vscode 1.2.0 → mixed-source でも semver 最新 (vscode) を選ぶ。
      expect(resolved).toBe(vscodeBinary);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-ADAPTER-004: treats provider availability as a successful capability probe", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-adapter-probe-"));
    try {
      const explicit = join(root, process.platform === "win32" ? "codex.cmd" : "codex");
      writeFileSync(explicit, "");
      const seen: string[] = [];
      const ok = isProviderCommandSpawnable("codex", {
        env: { UT_TDD_CODEX_BIN: explicit },
        platform: process.platform,
        runProbe: (command, args) => {
          seen.push(`${command} ${args.join(" ")}`);
          return { status: 0 };
        },
      });

      expect(ok).toBe(true);
      expect(seen[0]).toContain("--version");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-ADAPTER-007: delivers the codex prompt via stdin so Windows .cmd shell-wrapping cannot truncate it", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-adapter-codex-stdin-"));
    try {
      const explicit = join(root, "codex.cmd");
      writeFileSync(explicit, "");
      // 改行 + cmd.exe メタ文字 (< > | ( )) を含む実プロンプトは、引数経由だと
      // shell:true の cmd.exe で 1 行目に切り詰められる。stdin 経由なら無傷。
      const multiline = "line one\nline two has <name> and | and (paren)";
      const plan = buildAdapterPlan(
        { provider: "codex", role: "qa", task: multiline, model: "gpt-5.5" },
        "hybrid",
      );

      // プロンプトは stdin で帯域外に運ぶ。positional 引数には載せない。
      expect(plan.stdin).toBe(multiline);
      expect(plan.args).not.toContain(multiline);
      expect(plan.args).toContain("exec");
      expect(plan.args).toContain("-"); // codex exec [PROMPT]: '-' = stdin から読む

      // .cmd shell ラップに乗らないプロンプトは cmd.exe が破壊しようがない。
      const invocation = buildProviderInvocation({
        provider: "codex",
        command: "codex",
        args: plan.args,
        opts: { platform: "win32", env: { SystemRoot: "C:\\Windows", UT_TDD_CODEX_BIN: explicit } },
      });
      expect(invocation.command).not.toContain("line two");
      expect(invocation.command).not.toContain("\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-ADAPTER-008: delivers the claude prompt via stdin so native tool markup cannot leak through argv", () => {
    const multiline =
      'review\n<invoke name="Bash"><parameter name="command">git status</parameter></invoke>';
    const plan = buildAdapterPlan(
      { provider: "claude", role: "tl", task: multiline, model: "claude-sonnet-4-6" },
      "hybrid",
    );
    expect(plan.stdin).toBe(multiline);
    expect(plan.args).toContain("--print");
    expect(plan.args).toContain("--input-format");
    expect(plan.args).toContain("text");
    expect(plan.args).not.toContain("-p");
    expect(plan.args).not.toContain(multiline);

    const invocation = buildProviderInvocation({
      provider: "claude",
      command: "claude",
      args: plan.args,
      opts: { platform: "win32", env: { SystemRoot: "C:\\Windows" } },
    });
    expect(invocation.command).not.toContain("<invoke");
    expect(invocation.command).not.toContain("\n");
  });
});
