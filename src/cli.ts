#!/usr/bin/env bun
/**
 * UT-TDD Agent Harness CLI (TypeScript core, ADR-001).
 * 薄い OS 別 entrypoint (scripts/ut-tdd, ut-tdd.ps1) が本 core を呼ぶ。
 * 現状は scaffold: status / doctor は最小実装、plan/vmodel lint は stub。
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { runDoctor } from "./doctor";
import { lintPlan } from "./plan/lint";
import { detectMode } from "./runtime/detect";
import {
  type ClassifyResult,
  type FeedbackCtx,
  emitClassifyRequest,
  pendingRecoveryProposals,
  recordFeedback,
} from "./runtime/forced-stop";
import { nodeDeps, resolveActivePlan } from "./runtime/session-log";
import { lintVmodel } from "./vmodel/lint";

function gitBranch(): string | null {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
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
      process.stdout.write(JSON.stringify(d, null, 2) + "\n");
    } else {
      process.stdout.write(
        `mode: ${d.mode}  (claude=${d.claude}, codex=${d.codex}, current=${d.currentRuntime ?? "-"})\n`,
      );
    }
  });

program
  .command("doctor")
  .description("統合検証 (scaffold stub)")
  .action(() => {
    const r = runDoctor();
    for (const m of r.messages) process.stdout.write(m + "\n");
    process.exitCode = r.ok ? 0 : 1;
  });

const plan = program.command("plan").description("PLAN 操作");
plan
  .command("lint [path]")
  .description("PLAN lint (scaffold stub)")
  .action((path?: string) => {
    const r = lintPlan(path);
    for (const m of r.messages) process.stdout.write(m + "\n");
    process.exitCode = r.ok ? 0 : 1;
  });

const vmodel = program.command("vmodel").description("V-model trace");
vmodel
  .command("lint [path]")
  .description("V-model 4 artifact trace lint (scaffold stub)")
  .action((path?: string) => {
    const r = lintVmodel(path);
    for (const m of r.messages) process.stdout.write(m + "\n");
    process.exitCode = r.ok ? 0 : 1;
  });

const feedback = program
  .command("feedback")
  .description("強制停止フィードバック (forced-stop-feedback, PLAN-L7-02)");

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

program.parseAsync(process.argv).catch((e: unknown) => {
  process.stderr.write(String(e) + "\n");
  process.exitCode = 1;
});
