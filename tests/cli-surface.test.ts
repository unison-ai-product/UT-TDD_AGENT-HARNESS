import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const cliPath = join(repoRoot, "src", "cli.ts");
const legacyEnvPrefix = ["HE", "LIX"].join("");

function runCli(args: string[]) {
  return runCliIn(repoRoot, args);
}

function runCliIn(cwd: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  if (process.platform === "win32") {
    const cmdExe = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe");
    return spawnSync(cmdExe, ["/d", "/c", "bun", cliPath, ...args], {
      cwd,
      encoding: "utf8",
      env,
    });
  }
  return spawnSync("bun", [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env,
  });
}

function writeFakeProvider(binDir: string, name: "codex" | "claude"): string {
  const rawEnv = [legacyEnvPrefix, "ALLOW", "RAW", name.toUpperCase()].join("_");
  const reasonEnv = [legacyEnvPrefix, "RAW", name.toUpperCase(), "REASON"].join("_");
  if (process.platform === "win32") {
    const path = join(binDir, `${name}.cmd`);
    writeFileSync(
      path,
      [
        "@echo off",
        `echo noisy-${name}`,
        `echo raw=%${rawEnv}% > ${name}-env.txt`,
        `echo reason=%${reasonEnv}% >> ${name}-env.txt`,
        `echo effort=%CLAUDE_CODE_EFFORT_LEVEL% >> ${name}-env.txt`,
        `echo args=%* >> ${name}-env.txt`,
        "exit /b 0",
        "",
      ].join("\r\n"),
    );
    return path;
  }
  const path = join(binDir, name);
  writeFileSync(
    path,
    [
      "#!/bin/sh",
      `echo noisy-${name}`,
      `printf "raw=%s\\nreason=%s\\neffort=%s\\nargs=%s\\n" "$${rawEnv}" "$${reasonEnv}" "$CLAUDE_CODE_EFFORT_LEVEL" "$*" > ${name}-env.txt`,
      "exit 0",
      "",
    ].join("\n"),
  );
  chmodSync(path, 0o755);
  return path;
}

describe("L7 CLI surface closure", () => {
  it("exposes plan complete as the completed handover lifecycle entrypoint", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-cli-plan-complete-"));
    try {
      const use = runCliIn(root, ["plan", "use", "PLAN-L7-04-handover-mechanism"]);
      expect(use.status).toBe(0);

      const complete = runCliIn(root, ["plan", "complete", "--dry-run"]);
      expect(complete.status).toBe(0);
      expect(complete.stdout).toContain("plan complete:");
      expect(complete.stdout).toContain("status=completed");
      expect(complete.stdout).toContain("(dry-run)");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 15_000);

  it("exposes skill suggest as a JSON command surface", () => {
    const run = runCli(["skill", "suggest", "--plan", "PLAN-NO-SUCH", "--json"]);

    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual([]);
  }, 15_000);

  it("exposes builder catalog as a JSON command surface", () => {
    const run = runCli(["builder", "catalog", "--json"]);
    const payload = JSON.parse(run.stdout);

    expect(run.status).toBe(0);
    expect(payload.ok).toBe(true);
    expect(payload.commands.map((row: { command: string }) => row.command)).toContain(
      "ut-tdd builder catalog",
    );
  });

  it("fails review command closed unless the current uncommitted scope is explicit", () => {
    const run = runCli(["review", "--json"]);

    expect(run.status).toBe(1);
    expect(run.stderr).toContain("review requires --uncommitted");
  });

  it("emits a non-destructive cutover dry-run plan", () => {
    const run = runCli(["cutover", "--to", "staging", "--dry-run", "--json"]);
    const payload = JSON.parse(run.stdout);

    expect(run.status).toBe(0);
    expect(payload).toMatchObject({
      ok: true,
      mode: "dry-run",
      to: "staging",
      humanApprovalRequired: true,
    });
    expect(payload.checks).toContain("bun run src\\cli.ts doctor");
  });

  it("refuses cutover apply without a human-approved runbook", () => {
    const run = runCli(["cutover", "--to", "staging", "--json"]);
    const payload = JSON.parse(run.stdout);

    expect(run.status).toBe(1);
    expect(payload).toMatchObject({
      ok: false,
      mode: "requires-human-approval",
      humanApprovalRequired: true,
    });
    expect(run.stderr).toContain("explicit human-approved runbook");
  });

  it("exposes telemetry scan as a JSON command surface without provider CLI execution", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-cli-telemetry-"));
    try {
      const run = runCliIn(root, [
        "telemetry",
        "scan",
        "--claude-dir",
        join(root, "missing-claude"),
        "--codex-dir",
        join(root, "missing-codex"),
        "--json",
      ]);
      const payload = JSON.parse(run.stdout);

      expect(run.status).toBe(0);
      expect(payload).toMatchObject({
        totalRuns: 0,
        claudeRuns: 0,
        codexRuns: 0,
        inputTokens: 0,
        outputTokens: 0,
      });
      expect(payload.claudeDir).toBe(join(root, "missing-claude"));
      expect(payload.codexDir).toBe(join(root, "missing-codex"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("exposes team run as a shared Claude/Codex dry-run launch plan", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-cli-team-"));
    try {
      const teamPath = join(root, "team.yaml");
      writeFileSync(
        teamPath,
        [
          "name: speed-team",
          "strategy: parallel",
          "max_parallel: 2",
          "members:",
          "  - role: se",
          "    engine: codex-se",
          "    task: implement slice A",
          "  - role: tl",
          "    engine: pmo-sonnet",
          "    task: review slice A",
          "",
        ].join("\n"),
      );

      const run = runCli(["team", "run", "--definition", teamPath, "--mode", "hybrid", "--json"]);
      const payload = JSON.parse(run.stdout);

      expect(run.status).toBe(0);
      expect(payload).toMatchObject({
        ok: true,
        team: "speed-team",
        strategy: "parallel",
        dry_run: true,
      });
      expect(payload.members.map((member: { provider: string }) => member.provider)).toEqual([
        "codex",
        "claude",
      ]);
      expect(
        payload.members.map((member: { adapter: { command: string } }) => member.adapter.command),
      ).toEqual(["codex", "claude"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("exposes team suggest as a deterministic launch policy surface", () => {
    const run = runCli([
      "team",
      "suggest",
      "--task",
      "production security schema migration",
      "--mode",
      "hybrid",
      "--json",
    ]);
    const payload = JSON.parse(run.stdout);

    expect(run.status).toBe(0);
    expect(payload).toMatchObject({
      should_launch: true,
      mode: "hybrid",
      difficulty: "critical",
      trigger: "risk",
    });
    expect(
      payload.definition.members.map((member: { provider?: string; role: string }) => member.role),
    ).toEqual(["se", "tl", "qa"]);
  });

  it("executes team run through fake Claude/Codex adapters while keeping JSON machine-readable", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-cli-team-exec-"));
    try {
      const binDir = join(root, "bin");
      mkdirSync(binDir);
      const fakeCodex = writeFakeProvider(binDir, "codex");
      const fakeClaude = writeFakeProvider(binDir, "claude");
      const teamPath = join(root, "team.yaml");
      writeFileSync(
        teamPath,
        [
          "name: speed-team",
          "strategy: parallel",
          "max_parallel: 2",
          "members:",
          "  - role: se",
          "    engine: codex-se",
          "    task: implement slice A",
          "  - role: tl",
          "    engine: pmo-sonnet",
          "    task: review slice A",
          "",
        ].join("\n"),
      );

      const currentPath = process.env.PATH ?? process.env.Path ?? "";
      const testPath = `${binDir}${process.platform === "win32" ? ";" : ":"}${currentPath}`;
      const env = {
        ...process.env,
        PATH: testPath,
        Path: testPath,
        UT_TDD_CODEX_BIN: fakeCodex,
        UT_TDD_CLAUDE_BIN: fakeClaude,
      };
      const run = runCliIn(
        root,
        ["team", "run", "--definition", teamPath, "--mode", "hybrid", "--execute", "--json"],
        env,
      );
      const payload = JSON.parse(run.stdout);

      expect(run.status).toBe(0);
      expect(run.stdout).not.toContain("noisy-codex");
      expect(run.stdout).not.toContain("noisy-claude");
      expect(payload).toMatchObject({
        ok: true,
        team: "speed-team",
        strategy: "parallel",
        dry_run: false,
      });
      expect(payload.executions.map((row: { status: string }) => row.status)).toEqual([
        "completed",
        "completed",
      ]);
      const slots = JSON.parse(
        readFileSync(join(root, ".ut-tdd", "state", "agent-slots.json"), "utf8"),
      );
      expect(slots).toHaveLength(2);
      expect(
        slots.every((slot: { slot_source: string }) => slot.slot_source === "team_runner"),
      ).toBe(true);
      expect(slots.every((slot: { released_at: string | null }) => slot.released_at !== null)).toBe(
        true,
      );
      expect(readFileSync(join(root, "codex-env.txt"), "utf8")).not.toContain("raw=1");
      expect(readFileSync(join(root, "codex-env.txt"), "utf8")).not.toContain(
        "reason=ut-tdd-runtime-adapter-wrapper",
      );
      expect(readFileSync(join(root, "claude-env.txt"), "utf8")).not.toContain("raw=1");
      expect(readFileSync(join(root, "claude-env.txt"), "utf8")).toContain("effort=medium");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
