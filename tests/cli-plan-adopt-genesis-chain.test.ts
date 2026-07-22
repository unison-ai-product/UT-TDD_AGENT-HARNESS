import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseGenesisAdoptionManifestText,
  registerPlanAdoptGenesisChainCommand,
} from "../src/cli/plan-adopt-genesis-chain.js";

const originalExitCode = process.exitCode;

afterEach(() => {
  process.exitCode = originalExitCode;
});

describe("plan adopt-genesis-chain CLI registrar", () => {
  it("U-GEN-015: strict manifestをrunnerへ渡しreceiptをJSON exit 0で返す", async () => {
    const result = await run(manifest());

    expect(process.exitCode).toBe(0);
    expect(result.execute).toHaveBeenCalledWith(expect.objectContaining({ plan_id: "PLAN-L4-31" }));
    expect(JSON.parse(result.output.join(""))).toEqual({
      ok: true,
      result: {
        ok: true,
        replayed: false,
        assetId: "plan:legacy:test",
        revision: 1,
        issueNumber: 129,
        projection: "projected",
      },
    });
  });

  it("U-GEN-016: unknown keyとabsolute source pathをrunner前に同じruleで拒否する", async () => {
    for (const input of [
      manifest({ unknown_claim: true }),
      manifest({ source: { ...sourceBinding(), path: "C:/Users/test/legacy.md" } }),
    ]) {
      const result = await run(input);
      expect(process.exitCode).toBe(1);
      expect(result.execute).not.toHaveBeenCalled();
      expect(JSON.parse(result.output.join(""))).toEqual({
        ok: false,
        rule_id: "genesis-adoption-manifest-invalid",
      });
    }
  });

  it("U-GEN-017: wrong branchをstable rule IDとJSON exit 1で返す", async () => {
    const result = await run(manifest(), () => {
      throw new Error("genesis-adoption-branch-mismatch");
    });

    expect(process.exitCode).toBe(1);
    expect(JSON.parse(result.output.join(""))).toEqual({
      ok: false,
      rule_id: "genesis-adoption-branch-mismatch",
    });
  });

  it("U-GEN-018: domain rejectionもrule IDを失わずJSON exit 1にする", async () => {
    const result = await run(manifest(), () => ({
      ok: false as const,
      ruleId: "genesis-adoption-command-conflict",
    }));

    expect(process.exitCode).toBe(1);
    expect(JSON.parse(result.output.join(""))).toEqual({
      ok: false,
      rule_id: "genesis-adoption-command-conflict",
    });
  });

  it("U-GEN-019: malformed JSONをmanifest ruleへ正規化する", () => {
    expect(() => parseGenesisAdoptionManifestText("{")).toThrow(
      "genesis-adoption-manifest-invalid",
    );
  });
});

async function run(
  input: string,
  execute: () =>
    | {
        readonly ok: true;
        readonly replayed: false;
        readonly assetId: string;
        readonly revision: 1;
        readonly issueNumber: number;
        readonly projection: "projected";
      }
    | { readonly ok: false; readonly ruleId: string } = () => ({
    ok: true,
    replayed: false,
    assetId: "plan:legacy:test",
    revision: 1,
    issueNumber: 129,
    projection: "projected",
  }),
) {
  const output: string[] = [];
  const runner = { run: vi.fn(execute) };
  const program = new Command().exitOverride();
  const plan = program.command("plan");
  registerPlanAdoptGenesisChainCommand(plan, {
    readText: () => input,
    writeOutput: (text) => output.push(text),
    runner,
  });
  await program.parseAsync([
    "node",
    "ut-tdd",
    "plan",
    "adopt-genesis-chain",
    "--manifest",
    "genesis.json",
  ]);
  return { output, execute: runner.run };
}

function manifest(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 1,
    command_id: "genesis:issue-129:l4-31",
    repository_identity: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    plan_id: "PLAN-L4-31",
    actor: "genesis:test",
    reason: "trusted HEAD genesis adoption",
    route_tuple_digest: "a".repeat(64),
    origin: { plan_id: "PLAN-L4-31", revision: 1, digest: `sha256:${"f".repeat(64)}` },
    reentry: { target_plan_id: "PLAN-L4-31", target_revision: 2, phase: "forward_merge" },
    recorded_at: "2026-07-22T00:00:00.000Z",
    source: sourceBinding(),
    issue: {
      number: 129,
      episode_id: "E4-129",
      drive_model: "redesign",
      branch: "work/redesign-planasset-genesis-adoption",
      preimage_digest: "d".repeat(64),
    },
    ...overrides,
  });
}

function sourceBinding() {
  return {
    path: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
    commit: "b".repeat(40),
    blob_oid: "c".repeat(40),
    content_digest: "e".repeat(64),
  };
}
