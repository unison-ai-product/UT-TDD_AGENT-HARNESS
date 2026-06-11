#!/usr/bin/env bun
/**
 * UT-TDD Agent Harness CLI (TypeScript core, ADR-001).
 * 薄い OS 別 entrypoint (scripts/ut-tdd, ut-tdd.ps1) が本 core を呼ぶ。
 * 現状は scaffold: status / doctor は最小実装、plan/vmodel lint は stub。
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { catalogAutomationAssets } from "./assets/catalog";
import { runDoctor } from "./doctor";
import { computeSkillMetrics, emitFeedbackEvents } from "./feedback/engine";
import { evaluateGateReview, loadReviewChecklistIfPresent } from "./gate/review-tier";
import {
  checkHandoverBypass,
  checkHandoverDiscipline,
  latestSessionId,
  nodeHandoverDeps,
  runHandover,
  setActivePlanCli,
} from "./handover/index";
import { loadChangedFiles } from "./lint/change-impact";
import {
  inspectMcpProfile,
  listVerificationProfiles,
  nodeVerificationProbeDeps,
  probeVerificationProfile,
  recommendVerificationProfiles,
  runVerificationProfile,
  saveVerificationEvidence,
  verificationRecommendationMermaid,
} from "./lint/verification-profile";
import { lintPlan } from "./plan/lint";
import { type AdapterProvider, buildAdapterPlan } from "./runtime/adapter";
import {
  nodeAgentSlotsDeps,
  releaseOldestGuardSlot,
  sweepStaleGuardSlots,
} from "./runtime/agent-slots";
import { detectMode } from "./runtime/detect";
import {
  type ClassifyResult,
  emitClassifyRequest,
  type FeedbackCtx,
  pendingRecoveryProposals,
  recordFeedback,
  scanDanglingStops,
} from "./runtime/forced-stop";
import {
  nodeProviderHandoverDeps,
  type ProviderRuntime,
  readProviderHandoverCurrent,
  runProviderHandover,
} from "./runtime/provider-handover";
import {
  dispatch,
  nodeDeps,
  resolveActivePlan,
  type SessionHookInput,
} from "./runtime/session-log";
import { findReference } from "./search/index";
import { nodeSetupDeps, runSetup, type SetupArgs } from "./setup/index";
import { defaultHarnessDbPath, openHarnessDb } from "./state-db/index";
import { harnessDbStatus } from "./state-db/maintenance";
import { rebuildHarnessDb } from "./state-db/projection-writer";
import { loadTeamDefinition, validateTeamRun } from "./team/run";
import { lintVmodel } from "./vmodel/lint";
import { evaluateAutomationReadiness } from "./workflow/readiness";

function gitBranch(): string | null {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function gitHead(): string | null {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function optionFromCommandChain<T>(cmd: Command, key: string): T | undefined {
  let current: Command | null = cmd;
  while (current) {
    const value = (current.opts() as Record<string, unknown>)[key];
    if (value !== undefined) return value as T;
    current = current.parent ?? null;
  }
  return undefined;
}

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function resolveTaskText(opts: { task?: string; taskFile?: string }): string | null {
  if (opts.task && opts.taskFile) return null;
  if (opts.taskFile) {
    try {
      return readFileSync(opts.taskFile, "utf8");
    } catch {
      return null;
    }
  }
  return opts.task ?? null;
}

function readHookInput(defaultEvent: string, sessionId?: string): SessionHookInput {
  const raw = process.stdin.isTTY ? "" : readStdin();
  const normalized = raw.replace(/^\uFEFF/, "").trim();
  let parsed: SessionHookInput = {};
  if (normalized) {
    try {
      parsed = JSON.parse(normalized) as SessionHookInput;
    } catch {
      parsed = {};
    }
  }
  return {
    ...parsed,
    hook_event_name: parsed.hook_event_name ?? defaultEvent,
    session_id: sessionId ?? parsed.session_id ?? "ut-tdd-cli",
  };
}

function writeHandoverWarnings(): void {
  const hdeps = nodeHandoverDeps(process.cwd());
  for (const w of [...checkHandoverDiscipline(hdeps), ...checkHandoverBypass(hdeps)]) {
    process.stderr.write(`[ut-tdd handover] ${w}\n`);
  }
}

function runSessionStartSideEffects(
  repoRoot: string,
  input: SessionHookInput,
  deps: ReturnType<typeof nodeDeps>,
): void {
  try {
    scanDanglingStops(deps, input.session_id);
    sweepStaleGuardSlots(nodeAgentSlotsDeps(repoRoot));
  } catch {
    // fail-open: lifecycle maintenance must not block the runtime.
  }
}

function adapterExecutionEnv(provider: AdapterProvider): NodeJS.ProcessEnv {
  if (provider === "claude") {
    return {
      ...process.env,
      HELIX_ALLOW_RAW_CLAUDE: "1",
      HELIX_RAW_CLAUDE_REASON: "ut-tdd-runtime-adapter-wrapper",
    };
  }
  if (provider !== "codex") return process.env;
  return {
    ...process.env,
    HELIX_ALLOW_RAW_CODEX: "1",
    HELIX_RAW_CODEX_REASON: "ut-tdd-runtime-adapter-wrapper",
  };
}

function newestExisting(paths: string[]): string | null {
  const existing = paths.filter((p) => existsSync(p));
  return existing.length > 0 ? (existing.sort().at(-1) ?? null) : null;
}

function resolveClaudeNativeCommand(): string | null {
  const explicit = process.env.HELIX_CLAUDE_BIN;
  if (explicit && existsSync(explicit)) return explicit;

  if (process.platform !== "win32") return null;

  const appData =
    process.env.APPDATA ??
    (process.env.USERPROFILE ? join(process.env.USERPROFILE, "AppData", "Roaming") : null);
  const appDataRoot = appData ? join(appData, "Claude", "claude-code") : null;
  const appDataCandidates =
    appDataRoot && existsSync(appDataRoot)
      ? readdirSync(appDataRoot).map((version) => join(appDataRoot, version, "claude.exe"))
      : [];

  const home = process.env.USERPROFILE ?? process.env.HOME;
  const vscodeRoot = home ? join(home, ".vscode", "extensions") : null;
  const vscodeCandidates =
    vscodeRoot && existsSync(vscodeRoot)
      ? readdirSync(vscodeRoot)
          .filter((name) => name.startsWith("anthropic.claude-code-"))
          .map((name) => join(vscodeRoot, name, "resources", "native-binary", "claude.exe"))
      : [];

  return newestExisting([...appDataCandidates, ...vscodeCandidates]);
}

function adapterCommand(provider: AdapterProvider, plannedCommand: string): string {
  if (provider !== "claude") return plannedCommand;
  return resolveClaudeNativeCommand() ?? plannedCommand;
}

const program = new Command();
program
  .name("ut-tdd")
  .description("UT-TDD Agent Harness (TypeScript core, ADR-001)")
  .version("0.1.0");

program
  .command("status")
  .description("実行モード検出 (standalone / claude-only / codex-only / hybrid)")
  .option("--json", "JSON で出力")
  .action((opts: { json?: boolean }) => {
    const d = detectMode();
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(d, null, 2)}\n`);
    } else {
      process.stdout.write(
        `mode: ${d.mode}  (claude=${d.claude}, codex=${d.codex}, current=${d.currentRuntime ?? "-"})\n`,
      );
    }
  });

program
  .command("doctor")
  .description("統合検証 (doctor / gate / trace / drift / roadmap)")
  .action(() => {
    const r = runDoctor();
    for (const m of r.messages) process.stdout.write(`${m}\n`);
    process.exitCode = r.ok ? 0 : 1;
  });

const mcp = program.command("mcp").description("MCP and external verification profile catalog");
const mcpProfile = mcp.command("profile").description("verification profile catalog");
mcpProfile
  .command("list")
  .description("list MCP / external verification profiles")
  .option("--all", "include builtin profiles")
  .option("--json", "JSON output")
  .option("--save-evidence", "persist normalized evidence for DB collector")
  .action((opts: { all?: boolean; json?: boolean; saveEvidence?: boolean }) => {
    const deps = nodeVerificationProbeDeps(process.cwd());
    const profiles = listVerificationProfiles().filter(
      (profile) => opts.all || profile.sourceType !== "builtin",
    );
    if (opts.saveEvidence) {
      saveVerificationEvidence({ kind: "profile-list", id: "catalog", payload: profiles }, deps);
    }
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(profiles, null, 2)}\n`);
      return;
    }
    for (const profile of profiles) {
      const state = profile.defaultEnabled ? "enabled" : "disabled";
      process.stdout.write(
        `${profile.id}: ${profile.sourceType} ${state} risk=${profile.riskTier} command="${profile.command}"\n`,
      );
    }
  });

mcpProfile
  .command("probe <name>")
  .description("probe whether a verification profile is configured and runnable")
  .option("--json", "JSON output")
  .option("--save-evidence", "persist normalized evidence for DB collector")
  .action((name: string, opts: { json?: boolean; saveEvidence?: boolean }) => {
    const deps = nodeVerificationProbeDeps(process.cwd());
    const result = probeVerificationProfile(name, deps);
    if (!result) {
      process.stderr.write(`unknown profile: ${name}\n`);
      process.exitCode = 1;
      return;
    }
    if (opts.saveEvidence) {
      saveVerificationEvidence({ kind: "profile-probe", id: name, payload: result }, deps);
    }
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }
    process.stdout.write(
      `profile ${result.profile.id}: ${result.ready ? "ready" : "not-ready"} (${result.profile.label})\n`,
    );
    for (const check of result.checks) {
      process.stdout.write(`  - ${check.ok ? "ok" : "missing"} ${check.name}: ${check.message}\n`);
    }
    process.exitCode = result.ready ? 0 : 1;
  });

mcp
  .command("inspect <name>")
  .description("inspect an MCP profile through the MCP Inspector readiness gate")
  .option("--method <method>", "MCP method to inspect", "tools/list")
  .option("--allow-external", "allow disabled external MCP inspection after review")
  .option("--json", "JSON output")
  .option("--save-evidence", "persist normalized evidence for DB collector")
  .action(
    (
      name: string,
      opts: { method?: string; allowExternal?: boolean; json?: boolean; saveEvidence?: boolean },
    ) => {
      const deps = nodeVerificationProbeDeps(process.cwd());
      const result = inspectMcpProfile(
        name,
        { method: opts.method, allowExternal: Boolean(opts.allowExternal) },
        deps,
      );
      if (!result) {
        process.stderr.write(`unknown MCP profile: ${name}\n`);
        process.exitCode = 1;
        return;
      }
      if (opts.saveEvidence) {
        saveVerificationEvidence({ kind: "mcp-inspect", id: name, payload: result }, deps);
      }
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        process.stdout.write(`mcp inspect ${name}: ${result.status} method=${result.method}\n`);
        for (const message of result.messages) process.stdout.write(`  - ${message}\n`);
      }
      process.exitCode = result.status === "ready" ? 0 : 1;
    },
  );

const verify = program.command("verify").description("verification profile recommendation");
verify
  .command("recommend")
  .description("recommend verification profiles from changed files and emit an impact graph")
  .option("--changed <path...>", "changed path(s); defaults to git status --porcelain")
  .option("--format <format>", "text / json / mermaid", "text")
  .option("--save-evidence", "persist normalized evidence for DB collector")
  .action(
    (opts: {
      changed?: string[];
      format?: "text" | "json" | "mermaid" | string;
      saveEvidence?: boolean;
    }) => {
      const deps = nodeVerificationProbeDeps(process.cwd());
      const changedFiles =
        opts.changed && opts.changed.length > 0 ? opts.changed : loadChangedFiles();
      const result = recommendVerificationProfiles(changedFiles);
      if (opts.saveEvidence) {
        saveVerificationEvidence(
          { kind: "verify-recommend", id: "changed-files", payload: result },
          deps,
        );
      }
      if (opts.format === "json") {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        return;
      }
      if (opts.format === "mermaid") {
        process.stdout.write(`${verificationRecommendationMermaid(result)}\n`);
        return;
      }
      process.stdout.write(
        `verify recommend: ${result.recommendations.length} profile(s), changed=${result.changedFiles.length}\n`,
      );
      for (const recommendation of result.recommendations) {
        const profile = recommendation.profile;
        const disabled = profile.defaultEnabled ? "" : " disabled-by-default";
        process.stdout.write(
          `  - ${profile.id}${disabled}: ${recommendation.signals.join(", ")} -> ${profile.command}\n`,
        );
      }
      if (result.missingProfiles.length > 0) {
        process.stdout.write(`missing/disabled profiles: ${result.missingProfiles.join(", ")}\n`);
      }
    },
  );

verify
  .command("run")
  .description("run an allow-listed verification profile")
  .requiredOption("--profile <id>", "profile id")
  .option("--dry-run", "print runnable command without executing")
  .option("--allow-external", "allow disabled-by-default external profile execution after review")
  .option("--json", "JSON output")
  .option("--save-evidence", "persist normalized evidence for DB collector")
  .action(
    (opts: {
      profile: string;
      dryRun?: boolean;
      allowExternal?: boolean;
      json?: boolean;
      saveEvidence?: boolean;
    }) => {
      const deps = nodeVerificationProbeDeps(process.cwd());
      const result = runVerificationProfile(
        opts.profile,
        { dryRun: Boolean(opts.dryRun), allowExternal: Boolean(opts.allowExternal) },
        deps,
      );
      if (!result) {
        process.stderr.write(`unknown profile: ${opts.profile}\n`);
        process.exitCode = 1;
        return;
      }
      if (opts.saveEvidence) {
        saveVerificationEvidence({ kind: "verify-run", id: opts.profile, payload: result }, deps);
      }
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        process.stdout.write(
          `verify run ${result.profile.id}: ${result.status} command="${result.command}"\n`,
        );
        for (const message of result.messages) process.stdout.write(`  - ${message}\n`);
      }
      process.exitCode = result.status === "passed" || result.status === "dry-run" ? 0 : 1;
    },
  );

const session = program.command("session").description("session-log runtime events");
session
  .command("start")
  .description("record SessionStart through the shared session-log core")
  .option("--session <id>", "session_id (defaults to stdin session_id or ut-tdd-cli)")
  .action((opts: { session?: string }) => {
    const input = readHookInput("SessionStart", opts.session);
    const repoRoot = process.cwd();
    const deps = nodeDeps(repoRoot, gitBranch, gitHead);
    runSessionStartSideEffects(repoRoot, input, deps);
    dispatch(input, deps, "SessionStart");
    process.stdout.write(`session-log: start ${input.session_id ?? "ut-tdd-cli"}\n`);
  });

session
  .command("summary")
  .description("compress session events into PLAN digest and surface handover discipline warnings")
  .option("--session <id>", "session_id (defaults to stdin session_id or ut-tdd-cli)")
  .action((opts: { session?: string }) => {
    const input = readHookInput("Stop", opts.session);
    dispatch(input, nodeDeps(process.cwd(), gitBranch, gitHead), "Stop");
    writeHandoverWarnings();
    process.stdout.write(`session-log: summary ${input.session_id ?? "ut-tdd-cli"}\n`);
  });

const hook = program.command("hook").description("package-local hook entrypoints");
hook
  .command("post-tool-use")
  .description("record PostToolUse through the shared session-log core")
  .option("--session <id>", "session_id (defaults to stdin session_id or ut-tdd-cli)")
  .option("--tool <name>", "tool_name override")
  .option("--path <path>", "file_path/path target hint")
  .option("--command <command>", "Bash command target hint")
  .option("--outcome <outcome>", "tool outcome: ok or error")
  .action(
    (opts: {
      session?: string;
      tool?: string;
      path?: string;
      command?: string;
      outcome?: "ok" | "error";
    }) => {
      const input = readHookInput("PostToolUse", opts.session);
      const toolInput: Record<string, unknown> = {
        ...(input.tool_input ?? {}),
        ...(opts.path ? { file_path: opts.path } : {}),
        ...(opts.command ? { command: opts.command } : {}),
      };
      dispatch(
        {
          ...input,
          hook_event_name: "PostToolUse",
          tool_name: opts.tool ?? input.tool_name ?? (opts.command ? "Bash" : "manual"),
          tool_input: toolInput,
          tool_response: opts.outcome
            ? {
                ...(typeof input.tool_response === "object" ? input.tool_response : {}),
                outcome: opts.outcome,
              }
            : input.tool_response,
        },
        nodeDeps(process.cwd(), gitBranch, gitHead),
        "PostToolUse",
      );
      process.stdout.write(`session-log: post-tool-use ${input.session_id ?? "ut-tdd-cli"}\n`);
    },
  );

hook
  .command("subagent-stop")
  .description(
    "SubagentStop: agent_guard slot を 1 件 (最古) release し active 数を実時間で正確化 (fail-open)",
  )
  .action(() => {
    // SubagentStop payload (session_id/transcript_path/stop_hook_active) は終了 subagent の
    // slot_id を含まず slot 個体相関に使えないため読まない (設計根拠 = agent-slots.md §2.4)。
    const released = releaseOldestGuardSlot(nodeAgentSlotsDeps(process.cwd()));
    process.stdout.write(
      released
        ? `agent-slots: released ${released.slot_id} (${released.agent_kind})\n`
        : "agent-slots: no running guard slot to release\n",
    );
  });

const plan = program.command("plan").description("PLAN 操作");
plan
  .command("lint [path]")
  .description("PLAN lint")
  .action((path?: string) => {
    const r = lintPlan(path);
    for (const m of r.messages) process.stdout.write(`${m}\n`);
    process.exitCode = r.ok ? 0 : 1;
  });

plan
  .command("use [id]")
  .description(
    "active PLAN を .ut-tdd/state/current-plan に記録 (session-log digest を活性化)。--clear で解除",
  )
  .option("--clear", "current-plan を clear")
  .action((id: string | undefined, opts: { clear?: boolean }) => {
    if (!opts.clear && !id) {
      process.stderr.write("plan use <id> または --clear を指定してください\n");
      process.exitCode = 1;
      return;
    }
    setActivePlanCli(process.cwd(), opts.clear ? null : (id as string), gitBranch);
    process.stdout.write(opts.clear ? "current-plan: cleared\n" : `current-plan: ${id}\n`);
  });

const handover = program
  .command("handover")
  .description(
    "session-log PLAN digest から handover を生成 (機械ポインタ CURRENT.json + 人間判断 markdown scaffold、要件 §6.8.5)",
  )
  .option("--dry-run", "書き込まず内容のみ表示")
  .option("--complete", "status=completed として記録 (PLAN 完了時)")
  .option("--plan <id>", "明示 active PLAN (省略時 current-plan/branch から解決)")
  .option("--scope-active", "§1-§2 を active plan family の digest のみへ絞る (IMP-048 ノイズ低減)")
  .option(
    "--scope-session",
    "§1-§2 を直近 session が触れた digest のみへ絞る (IMP-078 gap④ 前 session 混入排除)",
  )
  .option(
    "--session <id>",
    "session scope に使う session_id を明示 (省略時 --scope-session で直近を推定)",
  )
  .action(
    (opts: {
      dryRun?: boolean;
      complete?: boolean;
      plan?: string;
      scopeActive?: boolean;
      scopeSession?: boolean;
      session?: string;
    }) => {
      const date = new Date().toISOString().slice(0, 10);
      const deps = nodeHandoverDeps(process.cwd());
      // IMP-078 gap④: --session 明示 > --scope-session 推定 (latestSessionId) > なし。
      const sessionId =
        opts.session ?? (opts.scopeSession ? (latestSessionId(deps) ?? undefined) : undefined);
      const r = runHandover(
        {
          date,
          dryRun: Boolean(opts.dryRun),
          complete: Boolean(opts.complete),
          scopeToActive: Boolean(opts.scopeActive),
          ...(sessionId ? { sessionId } : {}),
          ...(opts.plan ? { planId: opts.plan } : {}),
        },
        deps,
      );
      process.stdout.write(
        `handover: active=${r.pointer.active_plan ?? "-"} status=${r.pointer.status}${opts.dryRun ? " (dry-run)" : ""}\n`,
      );
      for (const w of r.written) process.stdout.write(`  + ${w}\n`);
      if (opts.dryRun) process.stdout.write(`\n--- scaffold ---\n${r.content}\n`);
    },
  );

const providerHandover = handover.command("provider").description("Claude/Codex provider handover");
providerHandover
  .command("export")
  .description("write provider handover package under .ut-tdd/handover/provider")
  .requiredOption("--from <runtime>", "claude or codex")
  .requiredOption("--to <runtime>", "claude or codex")
  .requiredOption("--summary <text>", "handover context summary")
  .option("--plan <id>", "active PLAN (defaults to current-plan/branch resolution)")
  .option("--budget <text>", "budget or constraint summary")
  .option("--next-action <text...>", "next actions")
  .option("--file <path...>", "relevant files")
  .option("--dry-run", "do not write files")
  .action(
    (
      opts: {
        from: ProviderRuntime;
        to: ProviderRuntime;
        summary: string;
        plan?: string;
        budget?: string;
        nextAction?: string[];
        file?: string[];
        dryRun?: boolean;
      },
      cmd: Command,
    ) => {
      const localOpts = cmd.opts() as typeof opts;
      const chainPlan = optionFromCommandChain<string>(cmd, "plan");
      const chainBudget = optionFromCommandChain<string>(cmd, "budget");
      const chainNextAction = optionFromCommandChain<string[]>(cmd, "nextAction");
      const chainFile = optionFromCommandChain<string[]>(cmd, "file");
      const chainDryRun = optionFromCommandChain<boolean>(cmd, "dryRun");
      const planId =
        localOpts.plan ??
        opts.plan ??
        chainPlan ??
        resolveActivePlan(nodeDeps(process.cwd(), gitBranch));
      if (!planId) {
        process.stderr.write("provider handover requires --plan or active current-plan\n");
        process.exitCode = 1;
        return;
      }
      try {
        const result = runProviderHandover(
          {
            from: opts.from,
            to: opts.to,
            activePlan: planId,
            budget: localOpts.budget ?? opts.budget ?? chainBudget ?? null,
            summary: opts.summary,
            nextActions: localOpts.nextAction ?? opts.nextAction ?? chainNextAction ?? [],
            files: localOpts.file ?? opts.file ?? chainFile ?? [],
            dryRun: Boolean(localOpts.dryRun ?? opts.dryRun ?? chainDryRun),
          },
          nodeProviderHandoverDeps(process.cwd()),
        );
        process.stdout.write(`${JSON.stringify(result.package, null, 2)}\n`);
        for (const w of result.written) process.stdout.write(`  + ${w}\n`);
      } catch (e) {
        process.stderr.write(`${String(e)}\n`);
        process.exitCode = 1;
      }
    },
  );

providerHandover
  .command("status")
  .description("show latest provider handover package")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const current = readProviderHandoverCurrent(nodeProviderHandoverDeps(process.cwd()));
    if (!current) {
      process.stderr.write("provider handover: CURRENT.json not found\n");
      process.exitCode = 1;
      return;
    }
    if (opts.json) process.stdout.write(`${JSON.stringify(current, null, 2)}\n`);
    else {
      process.stdout.write(
        `provider handover: ${current.handover_id} ${current.from}->${current.to} plan=${current.active_plan}\n`,
      );
    }
  });

const db = program
  .command("db")
  .description("harness.db projection state (PLAN-L7-44 工程表、span ① foundation)");
db.command("status")
  .description(
    "harness.db の schema version / table / 行数 / orphan を報告 (read-only、新規作成しない)",
  )
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const s = harnessDbStatus(process.cwd());
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(s, null, 2)}\n`);
      return;
    }
    if (!s.initialized) {
      process.stdout.write(
        `db status: not initialized (${s.path})\n  → 'ut-tdd db rebuild' で schema を作成\n`,
      );
      return;
    }
    const stale = s.schemaVersion !== s.expectedVersion ? ` (expected ${s.expectedVersion})` : "";
    process.stdout.write(
      `db status: schema v${s.schemaVersion}${stale}, tables ${s.tableCount}, rows ${s.totalRows}, orphan trace_edges ${s.orphanTraceEdges}\n`,
    );
    if (s.missingTables.length > 0) {
      process.stdout.write(`  ⚠ missing tables: ${s.missingTables.join(", ")}\n`);
    }
  });
db.command("rebuild")
  .description("harness.db schema と deterministic projection を再構築")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const r = rebuildHarnessDb({ repoRoot: process.cwd() });
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
      return;
    }
    const totalRows = Object.values(r.rowCounts).reduce((sum, n) => sum + n, 0);
    process.stdout.write(
      `db rebuild: projection ${r.ok ? "ok" : "failed"}, rows ${totalRows} (${r.path})\n`,
    );
    process.stdout.write(
      "  note: plans / roadmap rollups / review evidence / optional Phase3 outputs を projection\n",
    );
  });

program
  .command("find <query>")
  .description("search harness.db reference index")
  .option("--json", "JSON output")
  .action((query: string, opts: { json?: boolean }) => {
    const dbPath = defaultHarnessDbPath(process.cwd());
    const db = openHarnessDb(dbPath, { repoRoot: process.cwd() });
    try {
      const rows = findReference(db, query);
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
        return;
      }
      for (const row of rows) {
        process.stdout.write(
          `${row.subject_type} ${row.subject_id} ${row.path} (${row.reason}, score=${row.score})\n`,
        );
      }
    } finally {
      db.close();
    }
  });

const metrics = program.command("metrics").description("harness.db quality metrics");
metrics
  .command("skill")
  .description("compute skill firing and acceptance metrics")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const rows = computeSkillMetrics(db);
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.plan_id} ${row.skill_id}: firing=${row.firing_rate} acceptance=${row.acceptance_rate}\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  });

const automation = program.command("automation").description("workflow automation readiness");
automation
  .command("readiness")
  .description("evaluate automation readiness from harness.db projections")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const rows = evaluateAutomationReadiness(db);
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.plan_id} ${row.workflow}/${row.phase}: ${row.ready_status} ${row.blocked_reason}\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  });

const guardrail = program.command("guardrail").description("guardrail decision ledger");
guardrail
  .command("status")
  .description("list guardrail decisions from harness.db")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const rows = db.prepare("SELECT * FROM guardrail_decisions ORDER BY decided_at").all();
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.plan_id ?? ""} ${row.guardrail ?? ""}: ${row.decision ?? ""} evidence=${row.evidence_path ?? ""}\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  });

const asset = program.command("asset").description("automation asset catalog");
asset
  .command("catalog")
  .description("catalog skill/roster/command docs into harness.db")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const result = catalogAutomationAssets({ repoRoot: process.cwd(), db });
      if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        process.stdout.write(
          `asset catalog: ${result.assets.length} assets, findings=${result.findings.length}\n`,
        );
        for (const id of result.assets) process.stdout.write(`  - ${id}\n`);
      }
      process.exitCode = result.ok ? 0 : 1;
    } finally {
      db.close();
    }
  });

const vmodel = program.command("vmodel").description("V-model trace");
vmodel
  .command("lint [path]")
  .description("V-model 4 artifact trace lint")
  .action((path?: string) => {
    const r = lintVmodel(path);
    for (const m of r.messages) process.stdout.write(`${m}\n`);
    process.exitCode = r.ok ? 0 : 1;
  });

function runtimeCommand(provider: AdapterProvider): Command {
  return program
    .command(provider)
    .description(`${provider} runtime adapter command`)
    .requiredOption("--role <role>", "delegation role")
    .option("--task <text>", "task text")
    .option("--task-file <path>", "read task text from file")
    .option("--plan <id>", "PLAN id")
    .option("--execute", "execute provider CLI instead of dry-run")
    .option("--json", "JSON output")
    .action(
      (opts: {
        role: string;
        task?: string;
        taskFile?: string;
        plan?: string;
        execute?: boolean;
        json?: boolean;
      }) => {
        const task = resolveTaskText(opts);
        if (!task) {
          process.stderr.write("adapter requires exactly one of --task or --task-file\n");
          process.exitCode = 1;
          return;
        }
        const mode = detectMode().mode;
        const plan = buildAdapterPlan(
          {
            provider,
            role: opts.role,
            task,
            planId: opts.plan,
            execute: Boolean(opts.execute),
          },
          mode,
        );
        if (!plan.available) {
          process.stderr.write(`${plan.messages.join("\n")}\n`);
          process.exitCode = 1;
          return;
        }
        if (opts.json || !opts.execute) {
          process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
          return;
        }
        const sessionId = `${provider}-${Date.now()}`;
        const repoRoot = process.cwd();
        const deps = nodeDeps(repoRoot, gitBranch, gitHead);
        const startInput: SessionHookInput = {
          hook_event_name: "SessionStart",
          session_id: sessionId,
          ...(opts.plan ? { plan_id: opts.plan } : {}),
        };
        runSessionStartSideEffects(repoRoot, startInput, deps);
        dispatch(startInput, deps, "SessionStart");
        const child = spawnSync(adapterCommand(provider, plan.command), plan.args, {
          stdio: "inherit",
          env: adapterExecutionEnv(provider),
        });
        if (child.error) {
          // spawn 自体の失敗 (ENOENT 等) は status=null のまま沈黙するため理由を surface する (A-128 F-5 / IMP-130(d))。
          process.stderr.write(`${provider}: failed to launch (${String(child.error)})\n`);
        }
        dispatch(
          {
            hook_event_name: "PostToolUse",
            session_id: sessionId,
            ...(opts.plan ? { plan_id: opts.plan } : {}),
            tool_name: provider,
            tool_input: { command: `${plan.command} ${plan.args.join(" ")}` },
            tool_response: { outcome: child.status === 0 ? "ok" : "error" },
          },
          deps,
          "PostToolUse",
        );
        dispatch(
          {
            hook_event_name: "Stop",
            session_id: sessionId,
            ...(opts.plan ? { plan_id: opts.plan } : {}),
          },
          deps,
          "Stop",
        );
        writeHandoverWarnings();
        process.exitCode = child.status ?? 1;
      },
    );
}

runtimeCommand("codex");
runtimeCommand("claude");

program
  .command("gate <id>")
  .description("mode-aware gate review-tier check")
  .option("--mode <mode>", "override execution mode for tests")
  .option("--review-kind <kind>", "cross_agent / intra_runtime_subagent / human")
  .option("--worker-model <model>", "worker provider/model id")
  .option("--reviewer-model <model>", "reviewer provider/model id")
  .option("--checklist <path>", "YAML checklist evidence for single-runtime review")
  .option("--human-approved", "standalone human approval evidence")
  .option("--json", "JSON output")
  .action(
    (
      id: string,
      opts: {
        mode?: ReturnType<typeof detectMode>["mode"];
        reviewKind?: "cross_agent" | "intra_runtime_subagent" | "human";
        workerModel?: string;
        reviewerModel?: string;
        checklist?: string;
        humanApproved?: boolean;
        json?: boolean;
      },
    ) => {
      const mode = opts.mode ?? detectMode().mode;
      const result = evaluateGateReview({
        gate: id,
        mode,
        reviewKind: opts.reviewKind,
        workerModel: opts.workerModel,
        reviewerModel: opts.reviewerModel,
        checklist: loadReviewChecklistIfPresent(opts.checklist),
        humanApproved: Boolean(opts.humanApproved),
      });
      if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        process.stdout.write(
          `gate ${id}: ${result.passed ? "passed" : "failed"} mode=${result.mode} review=${result.review_kind ?? "-"} cross_agent_review=${result.cross_agent_review}\n`,
        );
        for (const m of result.messages) process.stdout.write(`  - ${m}\n`);
      }
      process.exitCode = result.passed ? 0 : 1;
    },
  );

const team = program.command("team").description("team orchestration");
team
  .command("run")
  .description("validate and plan a hybrid team run")
  .requiredOption("--definition <path>", "team definition YAML")
  .option("--mode <mode>", "override execution mode for tests")
  .option("--json", "JSON output")
  .action(
    (opts: {
      definition: string;
      mode?: ReturnType<typeof detectMode>["mode"];
      json?: boolean;
    }) => {
      try {
        const mode = opts.mode ?? detectMode().mode;
        const definition = loadTeamDefinition(opts.definition);
        const result = validateTeamRun(definition, mode);
        const output = { team: definition.name, strategy: definition.strategy, ...result };
        if (opts.json) process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
        else {
          process.stdout.write(
            `team ${definition.name}: ${result.ok ? "ok" : "failed"} mode=${mode}\n`,
          );
          for (const m of result.messages) process.stdout.write(`  - ${m}\n`);
        }
        process.exitCode = result.ok ? 0 : 1;
      } catch (e) {
        process.stderr.write(`${String(e)}\n`);
        process.exitCode = 1;
      }
    },
  );

const feedback = program
  .command("feedback")
  .description("強制停止フィードバック (forced-stop-feedback, PLAN-L7-02)");

feedback
  .command("list")
  .description("emit/list harness.db feedback events")
  .option("--json", "JSON output")
  .option(
    "--emit",
    "compute feedback events from current findings and quality signals before listing",
  )
  .action((opts: { json?: boolean; emit?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      if (opts.emit) emitFeedbackEvents(db);
      const rows = db.prepare("SELECT * FROM feedback_events ORDER BY created_at").all();
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.feedback_event_id ?? ""} ${row.signal_type ?? ""}: ${row.next_action ?? ""}\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  });

feedback
  .command("classify")
  .description(
    "停止後メッセージを分類。既定=managed pmo-haiku への分類リクエスト emit / --apply で結果記録",
  )
  .option("--text <text>", "対象テキスト (省略時 stdin)")
  .option("--session <id>", "session_id")
  .option("--plan <id>", "plan_id (省略時 branch/state から解決)")
  .option("--apply <json>", "ClassifyResult JSON を渡して recordFeedback (是正のみ記録)")
  .action((opts: { text?: string; session?: string; plan?: string; apply?: string }) => {
    const text = opts.text ?? readStdin();
    if (!opts.apply) {
      // 既定: 分類リクエストを emit (raw API なし、agent が pmo-haiku に渡す)
      process.stdout.write(`${emitClassifyRequest(text)}\n`);
      return;
    }
    let result: ClassifyResult;
    try {
      result = JSON.parse(opts.apply) as ClassifyResult;
    } catch {
      process.stderr.write("--apply は ClassifyResult JSON である必要があります\n");
      process.exitCode = 1;
      return;
    }
    const deps = nodeDeps(process.cwd(), gitBranch);
    const ctx: FeedbackCtx = {
      session_id: opts.session ?? "unknown",
      plan_id: opts.plan ?? resolveActivePlan(deps), // 省略時 state/branch から解決
      summary: text,
    };
    recordFeedback(result, ctx, deps);
    process.stdout.write(
      result.category === "feedback" && ctx.plan_id
        ? `recorded: feedback (attention=${result.attention})\n`
        : "skipped (mistake or plan_id 未解決)\n",
    );
  });

feedback
  .command("pending")
  .description("Recovery 起票候補 (recovery_proposed && 未対応) を出力。agent 起動時に参照")
  .option("--json", "JSON で出力")
  .action((opts: { json?: boolean }) => {
    const deps = nodeDeps(process.cwd(), gitBranch);
    const pending = pendingRecoveryProposals(deps);
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(pending, null, 2)}\n`);
      return;
    }
    if (pending.length === 0) {
      process.stdout.write("Recovery 起票候補なし\n");
      return;
    }
    for (const p of pending) {
      process.stdout.write(`[${p.attention}] ${p.plan_id} ${p.ts} — ${p.summary}\n`);
    }
  });

program
  .command("setup")
  .description(
    "solo/team を検出・提案・確認して GitHub 設定を出し分け生成 (Phase 0-A/0-B、要件 §6.5)",
  )
  .option("--solo", "Phase 0-A (solo) を強制 (自動提案の上書き)")
  .option("--team", "Phase 0-B (team) を強制 (自動提案の上書き)")
  .option("--dry-run", "生成物一覧のみ表示 (書き込まない)")
  .option("--apply-branch-protection", "branch protection を対話下で適用 (既定は emit-only)")
  .option("--tl-team <slug>", "CODEOWNERS の TL team slug")
  .option("--qa-team <slug>", "CODEOWNERS の QA team slug")
  .option("--po-team <slug>", "CODEOWNERS の PO team slug")
  .action(
    (opts: {
      solo?: boolean;
      team?: boolean;
      dryRun?: boolean;
      applyBranchProtection?: boolean;
      tlTeam?: string;
      qaTeam?: string;
      poTeam?: string;
    }) => {
      if (opts.solo && opts.team) {
        process.stderr.write("--solo と --team は同時指定できません (どちらか一方)\n");
        process.exitCode = 1;
        return;
      }
      const teamCount = [opts.tlTeam, opts.qaTeam, opts.poTeam].filter(Boolean).length;
      if (teamCount > 0 && teamCount < 3) {
        process.stderr.write(
          "--tl-team / --qa-team / --po-team は 3 つとも指定してください (CODEOWNERS の @TODO 混入防止)\n",
        );
        process.exitCode = 1;
        return;
      }
      const deps = nodeSetupDeps(process.cwd());
      const phase = opts.solo ? "0-A" : opts.team ? "0-B" : undefined;
      const teams =
        teamCount === 3
          ? { tl: opts.tlTeam as string, qa: opts.qaTeam as string, po: opts.poTeam as string }
          : undefined;
      const args: SetupArgs = {
        ...(phase ? { phase } : {}),
        dryRun: Boolean(opts.dryRun),
        applyBranchProtection: Boolean(opts.applyBranchProtection),
        ...(teams ? { teams } : {}),
      };
      const r = runSetup(args, deps);
      process.stdout.write(`phase: ${r.phase}${args.dryRun ? " (dry-run)" : ""}\n`);
      for (const w of r.written) process.stdout.write(`  ${args.dryRun ? "·" : "+"} ${w}\n`);
      process.stdout.write(
        `branch-protection: ${
          r.branchProtection.applied ? "applied" : `skipped (${r.branchProtection.reason})`
        }\n`,
      );
      if (r.phase === "0-B" && r.branchProtection.reason === "emit-only") {
        process.stdout.write(
          "  → scripts/setup-branch-protection.sh を生成。admin 権限の人間が実行してください (本番 merge ゲート変更)\n",
        );
      }
    },
  );

program.parseAsync(process.argv).catch((e: unknown) => {
  process.stderr.write(`${String(e)}\n`);
  process.exitCode = 1;
});
