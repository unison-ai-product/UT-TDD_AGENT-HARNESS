import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createProductionGenesisAdoptionCommandRunner } from "../src/cli/genesis-adoption-production.js";
import { renderForwardEscapeIssueBody } from "../src/execution/forward-escape.js";
import type {
  GenesisAdoptionManifest,
  GenesisAdoptionProjectionOutboxPort,
} from "../src/plan-asset/application/node-genesis-adoption-runner.js";

describe("genesis adoption production composition", () => {
  it("U-GEN-023: src/cli.tsのplan production surfaceへ登録される", () => {
    const run = spawnSync(
      process.env.UT_TDD_BUN_BINARY ??
        (process.platform === "win32"
          ? join(process.env.APPDATA ?? "", "npm", "node_modules", "bun", "bin", "bun.exe")
          : "bun"),
      ["src/cli.ts", "plan", "adopt-genesis-chain", "--help"],
      { cwd: process.cwd(), encoding: "utf8", windowsHide: true },
    );

    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toContain("--manifest <path>");
  });

  it("U-GEN-020: repository identityをdispatcherへ渡し当該commandのprojection状態を返してcloseする", () => {
    const close = vi.fn();
    const dispatchCommand = vi.fn(() => ({ scanned: 1, projected: 1, recoveryRequired: 0 }));
    const openDispatcher = vi.fn(() => ({ dispatcher: { dispatchCommand }, close }));
    const runner = createProductionGenesisAdoptionCommandRunner("C:/repo", {
      observeIssue,
      openDispatcher,
      createRunner: (_root, projection) => successfulRunner(projection),
    });

    expect(runner.run(manifest())).toEqual({ ...receipt(), projection: "projected" });
    expect(openDispatcher).toHaveBeenCalledWith(
      "C:/repo",
      "unison-ai-product/UT-TDD_AGENT-HARNESS",
    );
    expect(dispatchCommand).toHaveBeenCalledWith("genesis:issue-129:l4-31");
    expect(close).toHaveBeenCalledOnce();
  });

  it("U-GEN-021: trusted binding mismatch時はremote/DB dispatcherを起動しない", () => {
    const openDispatcher = vi.fn();
    const runner = createProductionGenesisAdoptionCommandRunner("C:/repo", {
      observeIssue,
      openDispatcher,
      createRunner: () => ({
        run: () => {
          throw new Error("genesis-adoption-repository-mismatch");
        },
      }),
    });

    expect(() => runner.run(manifest())).toThrow("genesis-adoption-repository-mismatch");
    expect(openDispatcher).not.toHaveBeenCalled();
  });

  it("U-GEN-022: command-specific dispatch失敗時も全resourceをcloseする", () => {
    const close = vi.fn();
    const runner = createProductionGenesisAdoptionCommandRunner("C:/repo", {
      observeIssue,
      openDispatcher: () => ({
        dispatcher: {
          dispatchCommand: () => {
            throw new Error("remote-down");
          },
        },
        close,
      }),
      createRunner: (_root, projection) => successfulRunner(projection),
    });

    expect(() => runner.run(manifest())).toThrow("remote-down");
    expect(close).toHaveBeenCalledOnce();
  });

  it("U-GEN-027: actual GitHub Issue偽装をlocal runner/Plan DB open前に拒否する", () => {
    const createRunner = vi.fn(() =>
      successfulRunner({
        dispatch: () => ({ durable: true, state: "projected" }),
      }),
    );
    const openDispatcher = vi.fn();
    const runner = createProductionGenesisAdoptionCommandRunner("C:/repo", {
      createRunner,
      openDispatcher,
      observeIssue: (input) => ({ ...observeIssue(input), body: "forged issue body" }),
    });

    expect(() => runner.run(manifest())).toThrow("genesis-adoption-actual-issue-mismatch");
    expect(createRunner).not.toHaveBeenCalled();
    expect(openDispatcher).not.toHaveBeenCalled();
  });
});

function successfulRunner(projection: GenesisAdoptionProjectionOutboxPort) {
  return {
    run: () => {
      const local = receipt();
      const projected = projection.dispatch({
        commandId: "genesis:issue-129:l4-31",
        issueNumber: 129,
        issuePreimageDigest: "d".repeat(64),
        localReceipt: local,
      });
      return { ...local, projection: projected.state };
    },
  };
}

function receipt() {
  return {
    ok: true as const,
    replayed: false as const,
    assetId: "plan:legacy:test",
    revision: 1 as const,
    issueNumber: 129,
  };
}

function manifest(): GenesisAdoptionManifest {
  return {
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
    source: {
      path: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
      commit: "b".repeat(40),
      blob_oid: "c".repeat(40),
      content_digest: "e".repeat(64),
    },
    reentry_target: {
      kind: "existing",
      path: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
      blob_oid: "c".repeat(40),
      content_digest: sha("trusted target"),
    },
    issue: {
      number: 129,
      episode_id: "E4-129",
      drive_model: "redesign",
      branch: "work/redesign-planasset-genesis-adoption",
      preimage_digest: sha(renderForwardEscapeIssueBody(issueContract())),
      contract: issueContract(),
    },
  };
}

function observeIssue(input: { repository: string; issue_number: number }) {
  const body = renderForwardEscapeIssueBody(issueContract());
  return {
    ...input,
    node_id: "I_GENESIS_129",
    url: `https://github.com/${input.repository}/issues/${input.issue_number}`,
    body,
    body_digest: sha(body),
    observed_revision: "issue-etag-1",
  };
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function issueContract() {
  return {
    command_id: "redesign:issue-129:l4-31",
    origin_asset_id: "PLAN-L4-31",
    origin_revision_id: "1",
    origin_layer: "L4",
    origin_state: "confirmed",
    escape_reason: "legacy PlanAsset genesis adoption",
    drive_model: "redesign",
    reentry_target_asset_id: "PLAN-L4-31",
    reentry_target_revision_id: "2",
    reentry_target_layer: "L4",
    reentry_target_state: "forward_merge",
    issue_projection: {
      owner: "unison-ai-product",
      repository: "UT-TDD_AGENT-HARNESS",
      title: "Redesign: genesis adoption",
      labels: ["redesign"],
    },
    plan_id: "PLAN-L4-31",
  };
}
