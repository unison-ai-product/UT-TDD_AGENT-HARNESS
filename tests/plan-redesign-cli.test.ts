import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerPlanRedesignCommand } from "../src/cli/plan-redesign.js";
import { registerPlanRevisionCommand } from "../src/cli/plan-revise.js";
import { NodePlanRedesignRunner } from "../src/plan-admission/node-plan-redesign-runner.js";
import { createNodePlanRevisionRunner } from "../src/plan-admission/node-plan-revision-runner.js";
import { PlanAuthoringCommandDispatcher } from "../src/plan-admission/plan-authoring-command-runner.js";
import { parseTrackedReceiptProjection } from "../src/plan-admission/tracked-receipt-projection.js";
import type { TrustedGitBlob } from "../src/plan-admission/trusted-git-blob-resolver.js";
import { openPlanLedger } from "../src/plan-asset/ledger/schema.js";

const roots: string[] = [];
const originalExitCode = process.exitCode;
afterEach(() => {
  process.exitCode = originalExitCode;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("plan redesign CLI", () => {
  it("assembly inputを公開CLIでv2化しreviseから実coordinator/DB/publisherへ通す", async () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-redesign-cli-"));
    roots.push(root);
    const originPath = "docs/plans/PLAN-L6-01-origin.md";
    const replacementPath = "docs/plans/PLAN-L6-02-replacement.md";
    const projectionPath = "docs/governance/plan-admission-receipts.json";
    const pairPath = "docs/test-design/pair.md";
    const originBase = source("PLAN-L6-01-origin", "origin base");
    const replacementBase = source("PLAN-L6-02-replacement", "replacement base");
    const initialProjection = `${JSON.stringify(
      { schema_version: "ut-tdd.plan-admission-receipts/v1", records: [] },
      null,
      2,
    )}\n`;
    const initialPair = "# old pair\n";
    for (const path of [originPath, replacementPath, projectionPath, pairPath])
      mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, originPath), originBase, "utf8");
    writeFileSync(join(root, replacementPath), replacementBase, "utf8");
    writeFileSync(join(root, projectionPath), initialProjection, "utf8");
    writeFileSync(join(root, pairPath), initialPair, "utf8");

    const assembly = JSON.stringify(
      assemblyInput({
        originPath,
        replacementPath,
        projectionPath,
        pairPath,
        originBase,
        replacementBase,
        initialProjection,
        initialPair,
      }),
    );
    const assembled: string[] = [];
    const producer = new Command().exitOverride();
    const producerPlan = producer.command("plan");
    registerPlanRedesignCommand(producerPlan, {
      readText: () => assembly,
      writeOutput: (text) => assembled.push(text),
    });
    await producer.parseAsync(["node", "ut-tdd", "plan", "redesign", "--input", "seed.json"]);
    const manifest = JSON.parse(assembled.join(""));
    expect(manifest).toMatchObject({ version: 2, operation: "redesign_bundle" });
    expect(manifest.origin.canonical_payload_json).toEqual(expect.any(String));

    const blobs = new Map([
      [originPath, trusted(originPath, originBase, "1".repeat(40))],
      [replacementPath, trusted(replacementPath, replacementBase, "2".repeat(40))],
    ]);
    const resolveIssueProjection = vi.fn((_claim: unknown) => ({}));
    const consumer = new Command().exitOverride();
    const consumerPlan = consumer.command("plan");
    registerPlanRevisionCommand(consumerPlan, {
      readText: () => assembled.join(""),
      writeOutput: () => undefined,
      runner: new PlanAuthoringCommandDispatcher(
        createNodePlanRevisionRunner(root),
        new NodePlanRedesignRunner({
          repoRoot: root,
          gitResolver: { resolve: (_commit, path) => blobs.get(path) as TrustedGitBlob },
          issueProjectionResolver: {
            resolve: (claim) => {
              resolveIssueProjection(claim);
              return { repository: "owner/repository" };
            },
          },
          repositoryIdentityResolver: { assertClaim: () => "owner/repository" },
        }),
      ),
    });
    await consumer.parseAsync(["node", "ut-tdd", "plan", "revise", "--manifest", "manifest.json"]);

    expect(process.exitCode).toBe(0);
    expect(resolveIssueProjection).toHaveBeenCalledWith({
      issueId: 102,
      episodeId: "E4-102",
      projectionDigest: `sha256:${hash("recomputed")}`,
    });
    const projection = parseTrackedReceiptProjection(
      readFileSync(join(root, projectionPath), "utf8"),
    );
    expect(projection.ok).toBe(true);
    if (!projection.ok) throw new Error("projection should parse");
    expect(projection.value.records.map((record) => record.commandId)).toEqual([
      "redesign:cli-e2e:origin",
      "redesign:cli-e2e:replacement",
    ]);
    expect(readFileSync(join(root, pairPath), "utf8")).toBe("# new pair\n");
    const db = openPlanLedger({ repoRoot: root });
    try {
      const rows = db
        .prepare("SELECT group_id, status FROM authoring_command_groups")
        .all() as Array<{ group_id: string; status: string }>;
      expect(rows).toContainEqual({ group_id: "redesign:cli-e2e", status: "committed" });
    } finally {
      db.close();
    }
  });
});

function assemblyInput(input: {
  originPath: string;
  replacementPath: string;
  projectionPath: string;
  pairPath: string;
  originBase: string;
  replacementBase: string;
  initialProjection: string;
  initialPair: string;
}) {
  const repository = "owner/repository";
  const commit = "a".repeat(40);
  return {
    command_id: "redesign:cli-e2e",
    repository_identity: repository,
    source_commit: commit,
    actor: "codex",
    occurred_at: "2026-07-21T00:00:00.000Z",
    origin: revisionSeed({
      repository,
      commit,
      planId: "PLAN-L6-01-origin",
      path: input.originPath,
      base: input.originBase,
      next: source("PLAN-L6-01-origin", "origin revision 2"),
      blobOid: "1".repeat(40),
      admission: originAdmission(),
    }),
    replacement: revisionSeed({
      repository,
      commit,
      planId: "PLAN-L6-02-replacement",
      path: input.replacementPath,
      base: input.replacementBase,
      next: source("PLAN-L6-02-replacement", "replacement revision 2"),
      blobOid: "2".repeat(40),
      admission: replacementAdmission(),
    }),
    reentry: {
      target_plan_id: "PLAN-L6-01-origin",
      target_revision: 2,
      phase: "forward_merge",
    },
    projection: artifact(input.projectionPath, '[{"redesign":true}]\n', input.initialProjection),
    pairs: [artifact(input.pairPath, "# new pair\n", input.initialPair)],
    upstream: [],
  };
}

function revisionSeed(input: {
  repository: string;
  commit: string;
  planId: string;
  path: string;
  base: string;
  next: string;
  blobOid: string;
  admission: Record<string, unknown>;
}) {
  const identityInput = JSON.stringify([input.repository, input.planId]);
  return {
    revision_mode: "legacy_bootstrap",
    asset_id: "ignored-for-bootstrap",
    plan_id: input.planId,
    base_revision: 1,
    base_payload_digest: hash("ignored-for-bootstrap"),
    source_path: input.path,
    source_content: input.next,
    admission: input.admission,
    expected_preimage: { kind: "sha256", digest: `sha256:${hash(input.base)}` },
    bootstrap: {
      repository_identity: input.repository,
      identity_algorithm: "ut-tdd-plan-legacy-v1",
      identity_digest: hash(identityInput),
      source_blob_oid: input.blobOid,
      source_content: input.base,
      source_content_digest: hash(input.base),
      source_commit: input.commit,
    },
  };
}

function originAdmission() {
  return {
    routeSignal: "forward",
    routeMode: "forward",
    kind: "design",
    layer: "L6",
    subDoc: "function-spec",
    drive: "agent",
    branch: "work/forward-origin",
  };
}

function replacementAdmission() {
  return {
    routeSignal: "redesign",
    routeMode: "redesign",
    kind: "design",
    layer: "L6",
    subDoc: "function-spec",
    drive: "agent",
    branch: "work/redesign-replacement",
    transitionDirection: "design_to_implementation",
    implementationDisposition: "discarded",
    implementationTarget: { targetPlanId: "PLAN-L7-02-target", targetRevision: 1 },
    supersedes: ["PLAN-L6-01-origin"],
    issue: {
      provider: "github",
      issueId: 102,
      episodeId: "E4-102",
      projectionDigest: hash("recomputed"),
    },
    origin: { planId: "PLAN-L6-01-origin", revision: 1, digest: hash("origin") },
    reentry: { targetPlanId: "PLAN-L6-01-origin", targetRevision: 2, phase: "forward_merge" },
    escapeReason: "redesign",
  };
}

function artifact(path: string, content: string, previous: string) {
  return {
    path,
    content,
    expected_preimage: { kind: "sha256", digest: `sha256:${hash(previous)}` },
  };
}

function trusted(path: string, content: string, blobOid: string): TrustedGitBlob {
  return { commitOid: "a".repeat(40), sourcePath: path, blobOid, bytes: Buffer.from(content) };
}

function source(planId: string, body: string): string {
  return `---\nplan_id: ${planId}\ntitle: ${planId}\nkind: design\nlayer: L6\nsub_doc: function-spec\ndrive: agent\nstatus: draft\nagent_slots:\n  - role: se\n    slot_label: primary\ngenerates: []\ndependencies:\n  parent: null\n  requires: []\n  blocks: []\n  references: []\nroute_signal: forward\nroute_mode: forward\n---\n${body}\n`;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
