#!/usr/bin/env bun
/**
 * UT-TDD Agent Harness CLI (TypeScript core, ADR-001).
 * 薄い OS 別 entrypoint (scripts/ut-tdd, ut-tdd.ps1) が本 core を呼ぶ。
 * status / doctor / plan lint / vmodel lint / gate / runtime adapter を集約する。
 */
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { catalogAutomationAssets } from "./assets/catalog";
import { runDoctor } from "./doctor";
import { computeSkillMetrics, emitFeedbackEvents } from "./feedback/engine";
import { renderTakeoverFeedback, selectTakeoverFeedback } from "./feedback/surface";
import { evaluateGateReview, loadReviewChecklistIfPresent } from "./gate/review-tier";
import { evaluateStaticGate } from "./gate/static";
import { loadRelationGraphSourceSet } from "./graph/loader";
import {
  checkHandoverBypass,
  checkHandoverDiscipline,
  latestSessionId,
  nodeHandoverDeps,
  runHandover,
  setActivePlanCli,
} from "./handover/index";
import { loadChangedFiles, loadStagedFiles } from "./lint/change-impact";
import { computeOutstandingWork, outstandingSummaryLine } from "./lint/outstanding";
import {
  analyzeRelationImpact,
  collectRelationGraphProjection,
  exportRelationDiagram,
  type RelationDiagramAdapter,
} from "./lint/relation-graph";
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
import { lintPlanWithGate } from "./plan/lint";
import { type AdapterProvider, buildAdapterPlan, buildProviderInvocation } from "./runtime/adapter";
import {
  nodeAgentSlotsDeps,
  releaseOldestGuardSlot,
  sweepStaleGuardSlots,
} from "./runtime/agent-slots";
import { detectMode, nextActionForMode, type RuntimeDetection } from "./runtime/detect";
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
  assessReviewSession,
  isReadOnlyDelegationRole,
  reviewGuardMessages,
  summarizeStagedReview,
} from "./runtime/review-guard";
import {
  dispatch,
  nodeDeps,
  resolveActivePlan,
  type SessionHookInput,
} from "./runtime/session-log";
import { findReference } from "./search/index";
import { nodeSetupDeps, runSetup, type SetupArgs } from "./setup/index";
import {
  bucketRecommendations,
  recommendSkillsForPlan,
  recommendSkillsForText,
  recordSkillRecommendations,
} from "./skills/recommend";
import { defaultHarnessDbPath, openHarnessDb } from "./state-db/index";
import { harnessDbStatus } from "./state-db/maintenance";
import { migrate } from "./state-db/migration";
import {
  projectModelEvaluations,
  projectTokenUsage,
  rebuildHarnessDb,
} from "./state-db/projection-writer";
import { loadRuntimeSessionUsage, summarizeRunUsage } from "./state-db/token-tracker";
import { classifyTask } from "./task/classify";
import {
  type Provider,
  type RouterRole,
  roster,
  route,
  routeTeamMembers,
  routeToAdapterPlan,
} from "./task/tier-router";
import { recommendTeamLaunch } from "./team/launch-policy";
import {
  buildTeamRunPlan,
  executeTeamRunPlan,
  loadTeamDefinition,
  type MemberPlacement,
} from "./team/run";
import { lintVmodel } from "./vmodel/lint";
import { startWebServer } from "./web/server";
import { buildCommandCatalog } from "./workflow/contracts";
import { evaluateAutomationReadiness } from "./workflow/readiness";

function gitBranch(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function gitHead(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

/** review-guard 用: loadChangedFiles を fail-open でラップ (非 git / 一時失敗で委譲を壊さない、IMP-137)。 */
function safeLoadChangedFiles(repoRoot: string): string[] {
  try {
    return loadChangedFiles(repoRoot);
  } catch {
    // guard probe は best-effort。git が無い/失敗しても委譲本体は止めない (fail-open)。
    return [];
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
  surfaceTakeoverFeedbackToStdout(repoRoot);
}

/**
 * 引き継ぎ (SessionStart) 時に harness.db の open feedback をエージェントへ surface する
 * (PLAN-L7-110)。stale な prose handover や、共有 working tree の都度計測ではなく、DB を
 * 正本として feedback を「受け取る」経路。独立した fail-open: Codex の並行 db rebuild と競合して
 * ロックされても、引き継ぎ維持処理 (上) も runtime も阻害しない。
 */
function surfaceTakeoverFeedbackToStdout(repoRoot: string): void {
  try {
    const db = openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
    try {
      const block = renderTakeoverFeedback(selectTakeoverFeedback(db));
      if (block) process.stdout.write(block);
    } finally {
      db.close();
    }
  } catch {
    // fail-open: feedback surface は best-effort。DB 不在 / ロック / 破損で runtime を止めない。
  }
}

function adapterExecutionEnv(
  provider: AdapterProvider,
  extraEnv: Record<string, string> = {},
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const legacyPrefix = ["HE", "LIX"].join("");
  for (const key of [
    [legacyPrefix, "ALLOW", "RAW", "CLAUDE"].join("_"),
    [legacyPrefix, "RAW", "CLAUDE", "REASON"].join("_"),
    [legacyPrefix, "ALLOW", "RAW", "CODEX"].join("_"),
    [legacyPrefix, "RAW", "CODEX", "REASON"].join("_"),
    [legacyPrefix, "CLAUDE", "BIN"].join("_"),
    [legacyPrefix, "CODEX", "BIN"].join("_"),
  ]) {
    delete env[key];
  }
  if (provider !== "claude" && provider !== "codex") return env;
  return { ...env, ...extraEnv };
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
    const nextAction = nextActionForMode(d.mode);
    // IMP-139: 未了の正の集計 (非終端 PLAN 層別 + open defer) を additive に surface し
    // 「doctor green = 完了」誤読を機械照合可能にする (gate ではない informational surface)。
    const outstanding = computeOutstandingWork(process.cwd());
    if (opts.json) {
      // 既存 6 フィールド (camelCase 公開契約) に nextAction + outstanding を additive に付加する
      // (A-138 ITEM-1、PLAN-L7-84、IMP-139、taxonomy=current)。判断ゲートの進め方 + 未了量を提示。
      process.stdout.write(`${JSON.stringify({ ...d, nextAction, outstanding }, null, 2)}\n`);
    } else {
      process.stdout.write(
        `mode: ${d.mode}  (claude=${d.claude}, codex=${d.codex}, current=${d.currentRuntime ?? "-"})\n`,
      );
      process.stdout.write(`next: ${nextAction}\n`);
      process.stdout.write(`${outstandingSummaryLine(outstanding)}\n`);
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

program
  .command("web")
  .description("中央 UI (read-only ダッシュボード) を local 起動 (ADR-005 D2 Phase A、Bun 必須)")
  .option("--port <port>", "listen port", "4173")
  .action((opts: { port?: string }) => {
    const handle = startWebServer({ port: Number(opts.port ?? 4173), repoRoot: process.cwd() });
    process.stdout.write(`UT-TDD 中央 UI (read-only) → http://localhost:${handle.port}/projects\n`);
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

// PLAN-L7-32 §9 discharge: cross-artifact relation graph CLI (ADR-002 A-124 surface)。
// 純関数 (collect/analyze/export) は src/lint/relation-graph.ts、repo→source set loader は
// src/graph/loader.ts。doc/source graph に集中し db-table node は projection-writer 経由で別供給。
const graph = program
  .command("graph")
  .description("cross-artifact relation graph (impact analysis / diagram export)");
graph
  .command("impact")
  .description("compute impact of changed files across the cross-artifact relation graph")
  .option("--changed <path...>", "changed path(s); defaults to git status --porcelain")
  .action((opts: { changed?: string[] }) => {
    const repoRoot = process.cwd();
    const changedFiles =
      opts.changed && opts.changed.length > 0 ? opts.changed : loadChangedFiles();
    const projection = collectRelationGraphProjection(loadRelationGraphSourceSet(repoRoot));
    const result = analyzeRelationImpact({ changedPaths: changedFiles, projection });
    process.stdout.write(
      `graph impact: changed=${result.changedNodes.length}, impacted=${result.impacted.length}, actions=${result.actions.length}\n`,
    );
    for (const n of result.changedNodes) process.stdout.write(`  changed: ${n.id}\n`);
    for (const n of result.impacted) process.stdout.write(`  impacted: ${n.id}\n`);
    for (const a of result.actions) {
      process.stdout.write(`  action: ${a.kind} -> ${a.nodeId} (${a.reason})\n`);
    }
    for (const f of result.findings) {
      process.stdout.write(`  [${f.severity}] ${f.code}: ${f.message}\n`);
    }
    process.exitCode = result.ok ? 0 : 1;
  });
graph
  .command("export")
  .description("export the relation graph as a diagram (mermaid|dot)")
  .option("--format <format>", "mermaid | dot", "mermaid")
  .option("--scope <scope>", "scope label (full export; per-scope filtering is a follow-up)")
  .action((opts: { format?: string; scope?: string }) => {
    const repoRoot = process.cwd();
    const projection = collectRelationGraphProjection(loadRelationGraphSourceSet(repoRoot));
    const format = opts.format === "dot" ? "dot" : "mermaid";
    // dot は renderDot が純粋に DOT テキストを生成する (外部 graphviz は SVG 化の後段でのみ要る)
    // ため CLI からは常に emit 可能。adapter を available 宣言して text 出力を有効化する。
    const availableAdapters: RelationDiagramAdapter[] = format === "dot" ? ["dot"] : [];
    const artifact = exportRelationDiagram({ snapshot: projection, format, availableAdapters });
    if (opts.scope) {
      process.stdout.write(
        `# scope=${opts.scope} (full export; per-scope filtering is a follow-up)\n`,
      );
    }
    if (!artifact.ok) {
      for (const f of artifact.findings) {
        process.stderr.write(`[${f.severity}] ${f.code}: ${f.message}\n`);
      }
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${artifact.content}\n`);
  });

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
  .option(
    "--gate <id>",
    "run a named PLAN gate lint (schedule, governance/frontmatter, G1-trace, G3-trace)",
  )
  .action((path?: string, opts?: { gate?: string }) => {
    const r = lintPlanWithGate(path, process.cwd(), opts?.gate);
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

const progress = program.command("progress").description("artifact progress read model");
progress
  .command("artifacts")
  .description("list DB-backed artifact progress colors")
  .option("--json", "JSON output")
  .option("--color <color>", "filter by color: red, yellow, or green")
  .action((opts: { json?: boolean; color?: string }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      migrate(db);
      const color = opts.color?.trim().toLowerCase();
      const rows =
        color != null && color.length > 0
          ? db
              .prepare(
                "SELECT artifact_path, artifact_type, state, color, linked_test_count, dependency_checked, open_dependency_impacts, linked_test_paths, reason, indexed_at FROM artifact_progress WHERE color = ? ORDER BY artifact_path",
              )
              .all(color)
          : db
              .prepare(
                "SELECT artifact_path, artifact_type, state, color, linked_test_count, dependency_checked, open_dependency_impacts, linked_test_paths, reason, indexed_at FROM artifact_progress ORDER BY CASE color WHEN 'red' THEN 0 WHEN 'yellow' THEN 1 ELSE 2 END, artifact_path",
              )
              .all();
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
        return;
      }
      if (rows.length === 0) {
        process.stdout.write("artifact progress: no rows (run `ut-tdd db rebuild` first)\n");
        return;
      }
      for (const row of rows as Array<Record<string, unknown>>) {
        process.stdout.write(
          `${row.color} ${row.artifact_path} ${row.state} tests=${row.linked_test_count} deps=${row.dependency_checked} impacts=${row.open_dependency_impacts} - ${row.reason}\n`,
        );
      }
    } finally {
      db.close();
    }
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

const telemetry = program
  .command("telemetry")
  .description("cross-runtime token/cost telemetry (FR-L1-38、PLAN-L7-57/58)");
telemetry
  .command("scan")
  .description(
    "両 runtime の session JSONL を走査し token/cost を harness.db (model_runs) へ ingest (CLI 非起動)",
  )
  .option(
    "--claude-dir <dir>",
    "Claude transcript dir (default: $UT_TDD_CLAUDE_SESSIONS_DIR or ~/.claude/projects)",
  )
  .option(
    "--codex-dir <dir>",
    "Codex session dir (default: $UT_TDD_CODEX_SESSIONS_DIR or ~/.codex/sessions)",
  )
  .option("--json", "JSON output")
  .action((opts: { claudeDir?: string; codexDir?: string; json?: boolean }) => {
    const repoRoot = process.cwd();
    // env-specific session-dir 解決: 明示 option > 環境変数 > OS default。CLI は一切起動せず
    // 既存ログを読むだけ (8009001d 無関係、OS 非依存)。不在ディレクトリは cold-start 安全 (空)。
    const claudeDir =
      opts.claudeDir ??
      process.env.UT_TDD_CLAUDE_SESSIONS_DIR ??
      join(homedir(), ".claude", "projects");
    const codexDir =
      opts.codexDir ??
      process.env.UT_TDD_CODEX_SESSIONS_DIR ??
      join(homedir(), ".codex", "sessions");
    const usages = loadRuntimeSessionUsage({ claudeDirs: [claudeDir], codexDirs: [codexDir] });
    const summary = summarizeRunUsage(usages);
    const db = openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
    try {
      // 既存 on-disk db が古い schema (token 列なし) でも壊れないよう migrate (冪等 ADD COLUMN)。
      migrate(db);
      projectTokenUsage(db, usages);
      // model_evaluations を再集計 (opt-in gate 無効なら no-op、cold-start 安全)。
      projectModelEvaluations(db, repoRoot);
    } finally {
      db.close();
    }
    if (opts.json) {
      process.stdout.write(`${JSON.stringify({ claudeDir, codexDir, ...summary }, null, 2)}\n`);
      return;
    }
    process.stdout.write(
      `telemetry scan: ${summary.totalRuns} runs ingested (claude=${summary.claudeRuns}, codex=${summary.codexRuns})\n` +
        `  tokens: input ${summary.inputTokens}, output ${summary.outputTokens}\n` +
        `  cost: $${summary.knownCostUsd} known, ${summary.runsWithoutCost} runs without published pricing (cost=null)\n` +
        `  sources: claude=${claudeDir}, codex=${codexDir}\n`,
    );
  });

const skill = program.command("skill").description("skill recommendation and invocation telemetry");
skill
  .command("suggest")
  .description("suggest skills for a PLAN id or a free-text task from harness.db context")
  .option("--plan <id>", "PLAN id (harness.db plan/layer/drive context)")
  .option("--text <task>", "free-text task (classify → context; mutually exclusive with --plan)")
  .option("--record", "write recommendations to harness.db (--plan only)")
  .option("--buckets", "group ranked rows into required/recommended/optional (additive view)")
  .option("--json", "JSON output")
  .action(
    (opts: {
      plan?: string;
      text?: string;
      record?: boolean;
      buckets?: boolean;
      json?: boolean;
    }) => {
      // A-138 ITEM-2: --plan / --text のどちらか一方が必須 (相互排他、flat ranked list は不変)。
      if (Boolean(opts.plan) === Boolean(opts.text)) {
        process.stderr.write("skill suggest requires exactly one of --plan or --text\n");
        process.exitCode = 1;
        return;
      }
      // 自由文は登録 PLAN でないので DB record 不可 (--record は --plan 専用)。
      if (opts.text && opts.record) {
        process.stderr.write(
          "--record requires --plan (free-text task is not a registered PLAN)\n",
        );
        process.exitCode = 1;
        return;
      }
      const repoRoot = process.cwd();
      const db = openHarnessDb(opts.record ? defaultHarnessDbPath(repoRoot) : ":memory:", {
        repoRoot,
      });
      try {
        rebuildHarnessDb({ repoRoot, db });
        const rows = opts.plan
          ? recommendSkillsForPlan(db, opts.plan)
          : recommendSkillsForText(db, opts.text ?? "");
        if (opts.record) recordSkillRecommendations(db, rows);
        // A-138 ITEM-2 PO 残課題: --buckets で required/recommended/optional に再編成 (additive、flat は既定)。
        if (opts.buckets) {
          const buckets = bucketRecommendations(rows);
          if (opts.json) process.stdout.write(`${JSON.stringify(buckets, null, 2)}\n`);
          else {
            for (const tier of ["required", "recommended", "optional"] as const) {
              process.stdout.write(`# ${tier}\n`);
              for (const row of buckets[tier]) {
                process.stdout.write(
                  `  ${row.skill_id}: score=${row.score} reason=${row.reason}\n`,
                );
              }
            }
          }
        } else if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
        else {
          for (const row of rows) {
            process.stdout.write(
              `${row.plan_id} ${row.skill_id}: rank=${row.rank} score=${row.score} reason=${row.reason}\n`,
            );
          }
        }
      } finally {
        db.close();
      }
    },
  );

program
  .command("review")
  .description("prepare a deterministic review packet for the current worktree")
  .option("--uncommitted", "review uncommitted git changes")
  .option("--staged", "confirm the staged set before commit (IMP-137 staged-diff gate)")
  .option("--json", "JSON output")
  .action((opts: { uncommitted?: boolean; staged?: boolean; json?: boolean }) => {
    if (opts.staged) {
      // commit 前 staged-diff 確認の機械化 (IMP-137): staged 集合を surface し doctor を回す。
      // 意図しない混入を staged 段階で弾く (doctor 失敗 / suspect 検出で fail-close)。
      const staged = loadStagedFiles(process.cwd());
      const summary = summarizeStagedReview(staged);
      const doctor = runDoctor();
      const ok = doctor.ok && summary.ok;
      const stagedOutput = {
        scope: "staged",
        ok,
        staged: summary.staged,
        suspect: summary.suspect,
        doctorOk: doctor.ok,
        doctorMessages: doctor.messages,
      };
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(stagedOutput, null, 2)}\n`);
      } else {
        process.stdout.write(
          `review staged: ${ok ? "ok" : "failed"} staged=${summary.staged.length} doctor=${doctor.ok ? "ok" : "failed"}\n`,
        );
        for (const path of summary.staged) process.stdout.write(`  + ${path}\n`);
      }
      process.exitCode = ok ? 0 : 1;
      return;
    }
    if (!opts.uncommitted) {
      process.stderr.write(
        "review requires --uncommitted or --staged for the current implementation surface\n",
      );
      process.exitCode = 1;
      return;
    }
    const changedFiles = loadChangedFiles(process.cwd());
    const doctor = runDoctor();
    const verification = recommendVerificationProfiles(changedFiles);
    const output = {
      scope: "uncommitted",
      ok: doctor.ok,
      changedFiles,
      verificationRecommendations: verification.recommendations.map((r) => ({
        profile: r.profile.id,
        signals: r.signals,
        command: r.profile.command,
        defaultEnabled: r.profile.defaultEnabled,
      })),
      missingProfiles: verification.missingProfiles,
      doctorMessages: doctor.messages,
    };
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      process.stdout.write(
        `review uncommitted: ${doctor.ok ? "ok" : "failed"} changed=${changedFiles.length} recommendations=${output.verificationRecommendations.length}\n`,
      );
      for (const rec of output.verificationRecommendations) {
        process.stdout.write(`  - ${rec.profile}: ${rec.signals.join(", ")} -> ${rec.command}\n`);
      }
      if (verification.missingProfiles.length > 0) {
        process.stdout.write(
          `missing/disabled profiles: ${verification.missingProfiles.join(", ")}\n`,
        );
      }
    }
    process.exitCode = doctor.ok ? 0 : 1;
  });

program
  .command("cutover")
  .description("prepare a non-destructive cutover / rollback plan")
  .requiredOption("--to <target>", "target ref, environment, or release label")
  .option("--from <source>", "source ref; defaults to current git HEAD when available")
  .option("--dry-run", "emit plan only; required for current implementation surface")
  .option("--json", "JSON output")
  .action((opts: { to: string; from?: string; dryRun?: boolean; json?: boolean }) => {
    const from = opts.from ?? gitHead() ?? "unknown";
    const output = {
      ok: Boolean(opts.dryRun),
      mode: opts.dryRun ? "dry-run" : "requires-human-approval",
      from,
      to: opts.to,
      checks: ["bun run src\\cli.ts doctor", "bun run src\\cli.ts db status --json"],
      rollback:
        from === "unknown" ? "record source ref before applying cutover" : `git switch ${from}`,
      humanApprovalRequired: true,
    };
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      process.stdout.write(
        `cutover ${from} -> ${opts.to}: ${output.mode} approval=${output.humanApprovalRequired}\n`,
      );
      for (const check of output.checks) process.stdout.write(`  - check: ${check}\n`);
      process.stdout.write(`  - rollback: ${output.rollback}\n`);
    }
    if (!opts.dryRun) {
      process.stderr.write(
        "cutover apply is not implemented without explicit human-approved runbook\n",
      );
      process.exitCode = 1;
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

const issue = program.command("issue").description("external issue dry-run queue");
issue
  .command("queue")
  .description("list GitHub issue dry-run queue entries")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const rows = db
        .prepare("SELECT * FROM issue_queue ORDER BY created_at, issue_queue_id")
        .all();
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.issue_queue_id ?? ""} ${row.status ?? ""}: ${row.title ?? ""} approval=${row.human_approval_required ?? ""}\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  });

issue
  .command("mark-created")
  .description("record externally created GitHub issue back-reference for a queued dry-run item")
  .requiredOption("--queue-id <id>", "issue_queue_id")
  .requiredOption("--issue-url <url>", "created GitHub issue URL")
  .option("--issue-id <id>", "GitHub issue number or node id")
  .option("--approved-by <name>", "human approver")
  .action((opts: { queueId: string; issueUrl: string; issueId?: string; approvedBy?: string }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const existing = db
        .prepare("SELECT * FROM issue_queue WHERE issue_queue_id = ?")
        .get(opts.queueId);
      if (!existing) {
        process.stderr.write(`issue queue entry not found: ${opts.queueId}\n`);
        process.exitCode = 1;
        return;
      }
      db.prepare(
        `UPDATE issue_queue
           SET status = ?,
               human_approval_required = 0,
               approved_by = ?,
               approved_at = ?,
               external_issue_id = ?,
               external_issue_url = ?
           WHERE issue_queue_id = ?`,
      ).run(
        "created",
        opts.approvedBy ?? "",
        new Date().toISOString(),
        opts.issueId ?? "",
        opts.issueUrl,
        opts.queueId,
      );
      process.stdout.write(`issue queue updated: ${opts.queueId} -> ${opts.issueUrl}\n`);
    } finally {
      db.close();
    }
  });

const trouble = program.command("trouble").description("trouble taxonomy events");
trouble
  .command("list")
  .description("list projected trouble events")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const rows = db
        .prepare("SELECT * FROM trouble_events ORDER BY created_at, trouble_event_id")
        .all();
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.trouble_event_id ?? ""} ${row.category ?? ""}: ${row.summary ?? ""}\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  });

const improvement = program.command("improvement").description("self-improvement log");
improvement
  .command("log")
  .description("list projected self-improvement log entries")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const db = openHarnessDb(defaultHarnessDbPath(process.cwd()), { repoRoot: process.cwd() });
    try {
      const rows = db
        .prepare("SELECT * FROM improvement_log ORDER BY created_at, improvement_log_id")
        .all();
      if (opts.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      else {
        for (const row of rows) {
          process.stdout.write(
            `${row.improvement_log_id ?? ""} ${row.category ?? ""}: ${row.next_action ?? ""}\n`,
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

const builder = program.command("builder").description("command and workflow builder catalog");
builder
  .command("catalog")
  .description("emit the implemented command-builder surface without mutating state")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const commandDocs = [
      { path: "src/cli.ts", command: "ut-tdd skill suggest", description: "skill recommendation" },
      { path: "src/cli.ts", command: "ut-tdd review --uncommitted", description: "review packet" },
      { path: "src/cli.ts", command: "ut-tdd cutover --to", description: "cutover dry-run" },
      { path: "src/cli.ts", command: "ut-tdd asset catalog", description: "asset catalog" },
      { path: "src/cli.ts", command: "ut-tdd builder catalog", description: "builder catalog" },
    ];
    const surface = commandDocs.map((doc) => doc.command);
    const result = buildCommandCatalog({ command_docs: commandDocs, cli_surface: surface });
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else {
      process.stdout.write(`builder catalog: ${result.commands.length} commands\n`);
      for (const row of result.commands) process.stdout.write(`  - ${row.command}\n`);
    }
    process.exitCode = result.ok ? 0 : 1;
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
        // review-guard (IMP-137): read-only (相談/検証) ロールの委譲 session が working tree を
        // 変更したら検知するため、spawn 前の変更パスを snapshot する。
        const guardActive = isReadOnlyDelegationRole(opts.role);
        const treeBefore = guardActive ? safeLoadChangedFiles(repoRoot) : [];
        const invocation = buildProviderInvocation({
          provider,
          command: plan.command,
          args: plan.args,
        });
        const child = spawnSync(invocation.command, invocation.args, {
          // Provider prompts are passed through stdin; argv carries only fixed
          // command flags so shell metacharacters and tool markup stay inert.
          // codex はプロンプトを stdin で受ける (plan.stdin)。cmd.exe shell-wrap が
          // 引数の改行/メタ文字を切り詰めるのを回避する (PLAN-L7-77)。
          input: plan.stdin,
          stdio: plan.stdin === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
          env: adapterExecutionEnv(provider, plan.env),
          shell: invocation.shell ?? false,
        });
        if (child.error) {
          // spawn 自体の失敗 (ENOENT 等) は status=null のまま沈黙するため理由を surface する (A-128 F-5 / IMP-130(d))。
          process.stderr.write(`${provider}: failed to launch (${String(child.error)})\n`);
        }
        if (guardActive) {
          // read-only 委譲が tree を変更したら warning で surface する (検知/隔離、IMP-137)。
          // exit code は変えない (レビュー成果は有効でも、混入を staged 前に弾く規律へ繋ぐ)。
          const assessment = assessReviewSession({
            role: opts.role,
            before: treeBefore,
            after: safeLoadChangedFiles(repoRoot),
          });
          for (const m of reviewGuardMessages(assessment)) process.stderr.write(`${m}\n`);
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
  .description("mode-aware gate review-tier and deterministic static checks")
  .option("--mode <mode>", "override execution mode for tests")
  .option("--review-kind <kind>", "cross_agent / intra_runtime_subagent / human")
  .option("--worker-model <model>", "worker provider/model id")
  .option("--reviewer-model <model>", "reviewer provider/model id")
  .option("--checklist <path>", "YAML checklist evidence for single-runtime review")
  .option("--coverage-summary <path>", "coverage/coverage-summary.json evidence for G7")
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
        coverageSummary?: string;
        humanApproved?: boolean;
        json?: boolean;
      },
    ) => {
      const mode = opts.mode ?? detectMode().mode;
      let checklist = null;
      const checklistMessages: string[] = [];
      try {
        checklist = loadReviewChecklistIfPresent(opts.checklist);
      } catch (e) {
        checklistMessages.push(
          `review checklist - violation: could not load checklist (${String(e)})`,
        );
      }
      const review = evaluateGateReview({
        gate: id,
        mode,
        reviewKind: opts.reviewKind,
        workerModel: opts.workerModel,
        reviewerModel: opts.reviewerModel,
        checklist,
        humanApproved: Boolean(opts.humanApproved),
      });
      if (checklistMessages.length > 0) {
        review.passed = false;
        review.messages.push(...checklistMessages);
      }
      const staticGate = evaluateStaticGate({
        gate: id,
        repoRoot: process.cwd(),
        coverageSummaryPath: opts.coverageSummary,
      });
      const result = {
        ...review,
        passed: review.passed && staticGate.passed,
        review,
        static_gate: staticGate,
        messages: [...review.messages, ...staticGate.messages],
      };
      if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        process.stdout.write(
          `gate ${id}: ${result.passed ? "passed" : "failed"} mode=${result.mode} review=${result.review_kind ?? "-"} cross_agent_review=${result.cross_agent_review} static=${staticGate.applicable ? (staticGate.passed ? "passed" : "failed") : "n-a"}\n`,
        );
        for (const m of result.messages) process.stdout.write(`  - ${m}\n`);
      }
      process.exitCode = result.passed ? 0 : 1;
    },
  );

const task = program
  .command("task")
  .description("task classification (FR-L1-39: kind/drive/size/complexity/risk)");
task
  .command("classify")
  .description("classify a task into kind / drive / size / complexity / difficulty / risk")
  .option("--text <text>", "task text")
  .option("--text-file <path>", "read task text from file")
  .option("--plan <path>", "read task text from a PLAN file")
  .option("--files <list>", "comma-separated affected file paths")
  .option("--json", "JSON output")
  .action(
    (opts: { text?: string; textFile?: string; plan?: string; files?: string; json?: boolean }) => {
      const text = resolveTaskText({ task: opts.text, taskFile: opts.textFile ?? opts.plan });
      if (text === null || text.trim().length === 0) {
        process.stderr.write(
          "task classify requires exactly one of --text, --text-file, or --plan\n",
        );
        process.exitCode = 1;
        return;
      }
      const affected_files = opts.files
        ? opts.files
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        : undefined;
      const result = classifyTask({ text, affected_files });
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        return;
      }
      process.stdout.write(
        `task classify: kind=${result.kind} drive=${result.drive}(${result.drive_confidence}) size=${result.size} complexity=${result.complexity_score} difficulty=${result.difficulty} risk=[${result.risk_flags.join(",")}]\n`,
      );
      for (const f of result.findings) {
        process.stdout.write(`  - ${f.severity}: ${f.code} ${f.message}\n`);
      }
    },
  );

const ROUTER_ROLES: readonly RouterRole[] = ["tl", "qa", "uiux", "se", "docs"];

task
  .command("route")
  .description(
    "route a task to a role tier/provider (難易度ルーター: archetype × difficulty × 主 provider)",
  )
  .requiredOption("--role <role>", `router role: ${ROUTER_ROLES.join("|")}`)
  .option("--text <text>", "task text")
  .option("--text-file <path>", "read task text from file")
  .option("--plan <path>", "read task text from a PLAN file")
  .option("--files <list>", "comma-separated affected file paths")
  .option("--primary <provider>", "override primary provider (claude|codex)")
  .option("--allow-frontier", "explicitly authorize T0 (opus/gpt-5.5)")
  .option("--execute", "bridge the decision to the provider adapter plan (dry-run command)")
  .option("--mode <mode>", "override execution mode for tests")
  .option("--json", "JSON output")
  .action(
    (opts: {
      role: string;
      text?: string;
      textFile?: string;
      plan?: string;
      files?: string;
      primary?: string;
      allowFrontier?: boolean;
      execute?: boolean;
      mode?: ReturnType<typeof detectMode>["mode"];
      json?: boolean;
    }) => {
      if (!ROUTER_ROLES.includes(opts.role as RouterRole)) {
        process.stderr.write(`task route requires --role in ${ROUTER_ROLES.join("|")}\n`);
        process.exitCode = 1;
        return;
      }
      const text = resolveTaskText({ task: opts.text, taskFile: opts.textFile ?? opts.plan });
      if (text === null || text.trim().length === 0) {
        process.stderr.write("task route requires exactly one of --text, --text-file, or --plan\n");
        process.exitCode = 1;
        return;
      }
      if (opts.primary && opts.primary !== "claude" && opts.primary !== "codex") {
        process.stderr.write("task route --primary must be claude or codex\n");
        process.exitCode = 1;
        return;
      }
      const affected_files = opts.files
        ? opts.files
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        : undefined;
      const base = detectMode();
      const detection = opts.mode ? { ...base, mode: opts.mode } : base;
      const decision = route(
        { role: opts.role as RouterRole, task: { text, affected_files } },
        detection,
        {
          primary: opts.primary as Provider | undefined,
          auth: { explicit: Boolean(opts.allowFrontier) },
        },
      );
      const adapterPlan = opts.execute ? routeToAdapterPlan(decision, text, detection.mode) : null;
      if (opts.json) {
        process.stdout.write(`${JSON.stringify({ decision, adapterPlan }, null, 2)}\n`);
        return;
      }
      process.stdout.write(
        `task route: role=${decision.role} archetype=${decision.archetype} tier=${decision.tier} provider=${decision.provider} model=${decision.model ?? "(blocked)"} status=${decision.status} review=${decision.reviewEntry} gate=${decision.gate} crossReview=${decision.crossReview} switch=${decision.cross.execution}>${decision.cross.judgement}(${decision.cross.review_kind}) difficulty=${decision.difficulty} risk=[${decision.riskFlags.join(",")}]\n`,
      );
      if (decision.reason) process.stdout.write(`  - ${decision.reason}\n`);
      if (opts.execute) {
        if (adapterPlan) {
          process.stdout.write(
            `  dispatch: provider=${adapterPlan.provider} available=${adapterPlan.available} command=${adapterPlan.command} args=[${adapterPlan.args.join(" ")}]\n`,
          );
        } else {
          process.stdout.write("  dispatch: not executable (T0 explicit-permission gate)\n");
          process.exitCode = 1;
        }
      }
    },
  );

task
  .command("roster")
  .description("list the symmetric dual-provider role roster (10 bindings)")
  .option("--json", "JSON output")
  .action((opts: { json?: boolean }) => {
    const bindings = roster();
    if (opts.json) {
      process.stdout.write(`${JSON.stringify(bindings, null, 2)}\n`);
      return;
    }
    for (const b of bindings) {
      process.stdout.write(
        `roster: role=${b.role} archetype=${b.archetype} claude=${b.claude} codex=${b.codex}\n`,
      );
    }
  });

const team = program.command("team").description("team orchestration");
team
  .command("suggest")
  .description("recommend whether a task should launch a Claude/Codex team")
  .requiredOption("--task <text>", "task text to classify")
  .option("--mode <mode>", "override execution mode for tests")
  .option("--json", "JSON output")
  .action(
    (opts: { task: string; mode?: ReturnType<typeof detectMode>["mode"]; json?: boolean }) => {
      const mode = opts.mode ?? detectMode().mode;
      const result = recommendTeamLaunch({ task: opts.task, mode });
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        process.stdout.write(
          `team suggest: ${result.should_launch ? "launch" : "single-agent"} mode=${result.mode} difficulty=${result.difficulty} trigger=${result.trigger}\n`,
        );
        process.stdout.write(`  - ${result.reason}\n`);
        if (result.definition) {
          process.stdout.write(
            `  - definition=${result.definition.name} members=${result.definition.members.length}\n`,
          );
        }
      }
    },
  );
team
  .command("run")
  .description("validate, plan, and optionally execute a hybrid team run")
  .requiredOption("--definition <path>", "team definition YAML")
  .option("--mode <mode>", "override execution mode for tests")
  .option("--plan <id>", "PLAN id to attach to provider adapter metadata")
  .option("--execute", "execute provider adapters; default is dry-run planning only")
  .option(
    "--route",
    "tier-router でクロス配置 (ワーカー=主 / 相談・検証=相手) と原則安く tier モデルを導出",
  )
  .option("--primary <provider>", "クロス分岐の主 provider (claude/codex)。--route 時に使用")
  .option("--allow-frontier", "T0 (opus/gpt-5.5) の相談・検証 member を明示許可 (--route 時)")
  .option("--json", "JSON output")
  .action(
    async (opts: {
      definition: string;
      mode?: ReturnType<typeof detectMode>["mode"];
      plan?: string;
      execute?: boolean;
      route?: boolean;
      primary?: Provider;
      allowFrontier?: boolean;
      json?: boolean;
    }) => {
      try {
        const mode = opts.mode ?? detectMode().mode;
        const definition = loadTeamDefinition(opts.definition);
        let placements: (MemberPlacement | null)[] | undefined;
        if (opts.route) {
          const base = detectMode();
          const detection: RuntimeDetection = { ...base, mode };
          const primary = opts.primary ?? base.currentRuntime ?? "claude";
          const auth = opts.allowFrontier ? { explicit: true } : undefined;
          const routings = routeTeamMembers(
            definition.members.map((m) => ({ role: m.role, task: m.task })),
            detection,
            { primary, auth },
          );
          placements = routings.map((r): MemberPlacement | null => {
            if (!r.routed || !r.decision) return null;
            const d = r.decision;
            if (d.status !== "ready" || !d.model) {
              return { provider: d.provider, model: "", blockedReason: d.reason ?? "blocked" };
            }
            return { provider: d.provider, model: d.model };
          });
        }
        const result = buildTeamRunPlan(definition, mode, {
          execute: Boolean(opts.execute),
          planId: opts.plan,
          placements,
        });
        if (!opts.execute) {
          if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
          else {
            process.stdout.write(
              `team ${definition.name}: ${result.ok ? "ok" : "failed"} mode=${mode} strategy=${result.strategy}${opts.route ? " routed" : ""} dry-run\n`,
            );
            for (const member of result.members) {
              process.stdout.write(
                `  - ${member.role}:${member.engine} provider=${member.provider} model=${member.model_selection.model}${member.adapter ? ` command=${member.adapter.command}` : ""}\n`,
              );
            }
            for (const m of result.messages) process.stdout.write(`  - ${m}\n`);
          }
          process.exitCode = result.ok ? 0 : 1;
          return;
        }
        let teamSessionSeq = 0;
        const repoRoot = process.cwd();
        const sessionDeps = nodeDeps(repoRoot, gitBranch, gitHead);
        const execution = await executeTeamRunPlan(result, {
          slots: nodeAgentSlotsDeps(repoRoot),
          runCommand: ({ command, args, provider, env, stdin }) =>
            new Promise((resolve) => {
              const sessionId = `${provider}-team-${Date.now()}-${teamSessionSeq++}`;
              const startInput: SessionHookInput = {
                hook_event_name: "SessionStart",
                session_id: sessionId,
                ...(opts.plan ? { plan_id: opts.plan } : {}),
              };
              runSessionStartSideEffects(repoRoot, startInput, sessionDeps);
              dispatch(startInput, sessionDeps, "SessionStart");
              const invocation = buildProviderInvocation({ provider, command, args });
              const ioMode = opts.json ? "ignore" : "inherit";
              const child = spawn(invocation.command, invocation.args, {
                cwd: repoRoot,
                env: adapterExecutionEnv(provider, env),
                // Provider prompts are passed through stdin; argv carries only fixed
                // command flags so shell metacharacters and tool markup stay inert.
                // codex はプロンプトを stdin で受ける (cmd.exe shell-wrap 回避、PLAN-L7-77)。
                stdio: stdin === undefined ? ioMode : ["pipe", ioMode, ioMode],
                shell: invocation.shell ?? false,
              });
              if (stdin !== undefined) {
                child.stdin?.write(stdin);
                child.stdin?.end();
              }
              let finalized = false;
              const finish = (exitCode: number | null) => {
                if (finalized) return;
                finalized = true;
                dispatch(
                  {
                    hook_event_name: "PostToolUse",
                    session_id: sessionId,
                    ...(opts.plan ? { plan_id: opts.plan } : {}),
                    tool_name: provider,
                    tool_input: { command: `${command} ${args.join(" ")}` },
                    tool_response: { outcome: exitCode === 0 ? "ok" : "error" },
                  },
                  sessionDeps,
                  "PostToolUse",
                );
                dispatch(
                  {
                    hook_event_name: "Stop",
                    session_id: sessionId,
                    ...(opts.plan ? { plan_id: opts.plan } : {}),
                  },
                  sessionDeps,
                  "Stop",
                );
                resolve({ exitCode });
              };
              child.on("error", () => finish(null));
              child.on("close", (code) => finish(code));
            }),
        });
        writeHandoverWarnings();
        if (opts.json) process.stdout.write(`${JSON.stringify(execution, null, 2)}\n`);
        else {
          process.stdout.write(
            `team ${definition.name}: ${execution.ok ? "completed" : "failed"} strategy=${execution.strategy}\n`,
          );
          for (const member of execution.executions) {
            process.stdout.write(
              `  - ${member.role}:${member.engine} status=${member.status} exit=${member.exit_code ?? "null"} slot=${member.slot_id ?? "-"}\n`,
            );
          }
          for (const m of execution.messages) process.stdout.write(`  - ${m}\n`);
        }
        process.exitCode = execution.ok ? 0 : 1;
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
