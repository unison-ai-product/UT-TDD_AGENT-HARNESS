#!/usr/bin/env bun
/**
 * UT-TDD Agent Harness CLI (TypeScript core, ADR-001).
 * 薄い OS 別 entrypoint (scripts/ut-tdd, ut-tdd.ps1) が本 core を呼ぶ。
 * 現状は scaffold: status / doctor は最小実装、plan/vmodel lint は stub。
 */
import { Command } from "commander";
import { detectMode } from "./runtime/detect";
import { lintPlan } from "./plan/lint";
import { lintVmodel } from "./vmodel/lint";
import { runDoctor } from "./doctor";

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

program.parseAsync(process.argv).catch((e: unknown) => {
  process.stderr.write(String(e) + "\n");
  process.exitCode = 1;
});
