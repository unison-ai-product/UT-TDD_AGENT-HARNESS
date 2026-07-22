import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createProductionGenesisAdoptionCommandRunner } from "../../src/cli/genesis-adoption-production.js";
import {
  type ForwardEscapeIssueAdoptionPort,
  type RequestForwardEscape,
  renderForwardEscapeIssueBody,
} from "../../src/execution/forward-escape.js";
import { deriveLegacyAssetId } from "../../src/plan-asset/adapters/legacy-plan-adapter.js";
import { openNodeGenesisProjectionDispatcher } from "../../src/plan-asset/application/genesis-projection-dispatcher.js";
import type { GenesisAdoptionManifest } from "../../src/plan-asset/application/node-genesis-adoption-runner.js";
import { deriveGenesisRouteTupleDigest } from "../../src/plan-asset/ledger/genesis-route-binding.js";
import { openPlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { defaultHarnessDbPath, openHarnessDb } from "../../src/state-db/index.js";
import { removeTestTree } from "../support/temp-tree.js";

const repository = "unison-ai-product/UT-TDD_AGENT-HARNESS";
const branch = "work/redesign-planasset-genesis-adoption";
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) removeTestTree(root);
});

describe("Issue #129 production genesis chain", () => {
  it("U-GEN-024: L6-83をtrusted HEADから採用しL7-452 reentryとremote projectionを2DBへ収束する", () => {
    const root = repositoryFixture();
    const manifest = l683Manifest(root);
    const issueBody = renderForwardEscapeIssueBody(manifest.issue.contract);
    const createComment = vi.fn((request: { body_digest: string }) => ({
      ok: true as const,
      comment: {
        node_id: "IC_GENESIS_129",
        url: `https://github.com/${repository}/issues/129#issuecomment-genesis`,
        body_digest: request.body_digest,
        observed_revision: "comment-etag-1",
      },
    }));
    const port: ForwardEscapeIssueAdoptionPort = {
      observeIssue: () => ({
        repository,
        issue_number: 129,
        node_id: "I_GENESIS_129",
        url: `https://github.com/${repository}/issues/129`,
        body: issueBody,
        body_digest: sha(issueBody),
        observed_revision: "issue-etag-1",
      }),
      createOrGetMetadataComment: createComment,
    };
    const runner = createProductionGenesisAdoptionCommandRunner(root, {
      openDispatcher: (repoRoot, identity) =>
        openNodeGenesisProjectionDispatcher(repoRoot, identity, port),
    });
    expect(runner.run(manifest)).toMatchObject({
      ok: true,
      replayed: false,
      assetId: deriveLegacyAssetId(repository, manifest.plan_id),
      revision: 1,
      issueNumber: 129,
      projection: "projected",
    });
    expect(runner.run(manifest)).toMatchObject({
      ok: true,
      replayed: true,
      projection: "projected",
    });
    expect(createComment).toHaveBeenCalledOnce();

    const planDb = openPlanLedger({ repoRoot: root });
    try {
      expect(planDb.prepare("SELECT COUNT(*) AS n FROM plan_assets").get()?.n).toBe(1);
      expect(
        planDb
          .prepare(
            "SELECT route_tuple_digest, plan_id FROM plan_admission_receipts WHERE command_id = ?",
          )
          .get(manifest.command_id),
      ).toEqual({
        route_tuple_digest: manifest.route_tuple_digest,
        plan_id: manifest.plan_id,
      });
      expect(
        planDb
          .prepare("SELECT status FROM genesis_projection_outbox WHERE command_id = ?")
          .get(manifest.command_id)?.status,
      ).toBe("projected");
    } finally {
      planDb.close();
    }
    const harnessDb = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
    try {
      expect(
        harnessDb
          .prepare(
            "SELECT COUNT(*) AS n FROM forward_escape_projection_events WHERE command_id = ?",
          )
          .get(manifest.command_id)?.n,
      ).toBe(2);
    } finally {
      harnessDb.close();
    }
  });
});

function repositoryFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-genesis-production-chain-"));
  roots.push(root);
  const paths = [
    "ut-tdd.project.json",
    "docs/plans/PLAN-L6-83-forward-escape-issue-contract.md",
    "docs/plans/PLAN-L7-452-forward-escape-contract-red.md",
  ];
  for (const path of paths) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, gitBytes(process.cwd(), "show", `HEAD:${path}`));
  }
  git(root, "init", "-b", branch);
  git(root, "config", "user.email", "genesis-test@example.invalid");
  git(root, "config", "user.name", "Genesis Test");
  git(root, "add", ...paths);
  git(root, "commit", "-m", "test: freeze trusted genesis chain");
  return root;
}

function l683Manifest(root: string): GenesisAdoptionManifest {
  const sourcePath = "docs/plans/PLAN-L6-83-forward-escape-issue-contract.md";
  const source = gitBytes(root, "show", `HEAD:${sourcePath}`);
  const origin = {
    planId: "PLAN-L6-83-forward-escape-issue-contract",
    revision: 1,
    digest: `sha256:${sha(source)}`,
  };
  const reentry = {
    targetPlanId: "PLAN-L7-452-forward-escape-contract-red",
    targetRevision: 1,
    phase: "forward_merge" as const,
  };
  const contract: RequestForwardEscape = {
    command_id: "genesis:issue-129:l6-83-production-chain",
    origin_asset_id: origin.planId,
    origin_revision_id: String(origin.revision),
    origin_layer: "L6",
    origin_state: "legacy_unadopted",
    escape_reason: "Issue #129 genesis adoption",
    drive_model: "redesign",
    reentry_target_asset_id: reentry.targetPlanId,
    reentry_target_revision_id: String(reentry.targetRevision),
    reentry_target_layer: "L7",
    reentry_target_state: reentry.phase,
    issue_projection: {
      owner: "unison-ai-product",
      repository: "UT-TDD_AGENT-HARNESS",
      title: "Genesis adoption: L6-83 to L7-452",
      labels: ["redesign", "genesis-adoption"],
    },
    plan_id: reentry.targetPlanId,
  };
  return {
    version: 1,
    command_id: "genesis:issue-129:l6-83-production-chain",
    repository_identity: repository,
    plan_id: origin.planId,
    actor: "genesis-production-chain:test",
    reason: "Issue #129 production chain oracle",
    route_tuple_digest: deriveGenesisRouteTupleDigest({ origin, reentry }),
    origin: {
      plan_id: origin.planId,
      revision: origin.revision,
      digest: origin.digest,
    },
    reentry: {
      target_plan_id: reentry.targetPlanId,
      target_revision: reentry.targetRevision,
      phase: reentry.phase,
    },
    recorded_at: "2026-07-22T08:00:00.000Z",
    source: {
      path: sourcePath,
      commit: git(root, "rev-parse", "HEAD"),
      blob_oid: git(root, "rev-parse", `HEAD:${sourcePath}`),
      content_digest: sha(source),
    },
    issue: {
      number: 129,
      episode_id: "E4-129",
      drive_model: "redesign",
      branch,
      preimage_digest: sha(renderForwardEscapeIssueBody(contract)),
      contract,
    },
  };
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim();
}

function gitBytes(root: string, ...args: string[]): Buffer {
  return execFileSync("git", args, { cwd: root, windowsHide: true });
}

function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
