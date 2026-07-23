import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import {
  createProductionGenesisRebaseMigrationRunner,
  registerGenesisRebaseMigrationProductionCommand,
} from "../src/cli/genesis-rebase-migration-production.js";
import { trackedReceiptRecordDigest } from "../src/plan-admission/tracked-receipt-projection.js";
import { parseLegacyPlanSource } from "../src/plan-asset/adapters/legacy-plan-inventory.js";
import { createGenesisRebaseCommentGroup } from "../src/plan-asset/application/genesis-rebase-comment-projection.js";
import {
  GENESIS_REBASE_CUSTODY_BODY_DIGEST,
  GENESIS_REBASE_CUSTODY_NODE_ID,
  GENESIS_REBASE_CUSTODY_UPDATED_AT,
  GENESIS_REBASE_MIGRATION_MARKER,
  GENESIS_REBASE_MIGRATION_OPERATION,
  GENESIS_REBASE_PLAN_ID,
  GENESIS_REBASE_REPOSITORY,
  GENESIS_REBASE_SOURCE_COMMIT,
  type GenesisRebaseMigrationCommand,
  GenesisRebaseMigrationRunner,
} from "../src/plan-asset/application/genesis-rebase-migration-runner.js";
import {
  deriveMigrationCertificate,
  deriveRebaseAssetId,
  type PlanAssetMigrationCertificateInput,
} from "../src/plan-asset/domain/plan-asset-migration-certificate.js";

describe("genesis rebase migration production composition", () => {
  it("U-PA-REBASE-020: exact Issue #143 preimageだけをtransactionへ渡す", () => {
    const migrate = vi.fn((_input: GenesisRebaseMigrationCommand["input"]) => ({
      ok: true as const,
      replayed: false,
      certificateId: "genesis-rebase:test",
      certificateDigest: "a".repeat(64),
    }));
    const runner = new GenesisRebaseMigrationRunner({
      ...authorityDeps(command()),
      observeCustodyIssue: observedIssue,
      transaction: { migrate },
    });
    const candidate = command();
    candidate.input.commentGroup.groupId = "caller-forged";
    expect(runner.run(candidate)).toMatchObject({ ok: true, replayed: false });
    expect(migrate).toHaveBeenCalledOnce();
    expect(migrate.mock.calls[0]?.[0].commentGroup).toMatchObject({
      groupId: `comments:${candidate.proposal.commandId}`,
      commandId: candidate.proposal.commandId,
      members: [
        { kind: "issue102_seal", issueNodeId: "I-102" },
        { kind: "issue143_metadata", issueNodeId: GENESIS_REBASE_CUSTODY_NODE_ID },
      ],
    });
  });

  it("U-PA-REBASE-021: source HEADまたはcustody body driftはlocal write前にfail-closeする", () => {
    const migrate = vi.fn();
    const changed = command();
    changed.input.sourceCommit = "f".repeat(40);
    const runner = new GenesisRebaseMigrationRunner({
      ...authorityDeps(command()),
      observeCustodyIssue: observedIssue,
      transaction: { migrate },
    });
    expect(() => runner.run(changed)).toThrow("genesis-rebase-migration-preimage-mismatch");
    expect(migrate).not.toHaveBeenCalled();

    const exact = command();
    const custodyDrift = new GenesisRebaseMigrationRunner({
      ...authorityDeps(exact),
      observeCustodyIssue: () => ({ ...observedIssue(), bodyDigest: "0".repeat(64) }),
      transaction: { migrate },
    });
    expect(() => custodyDrift.run(exact)).toThrow("genesis-rebase-custody-preimage-mismatch");
    expect(migrate).not.toHaveBeenCalled();
  });

  it.each([
    ["review", (value: ReturnType<typeof command>) => (value.proposal.confirmationReview = null)],
    [
      "certificate",
      (value: ReturnType<typeof command>) =>
        (value.proposal.certificate = {
          ...value.proposal.certificate,
          certificateDigest: `sha256:${"0".repeat(64)}`,
        }),
    ],
    [
      "projection",
      (value: ReturnType<typeof command>) =>
        (value.proposal.projection.currentTailDigest = digest("drift")),
    ],
    [
      "Issue #102 seal",
      (value: ReturnType<typeof command>) => (value.proposal.issue102.mutationForbidden = false),
    ],
  ])("U-PA-REBASE-024: %s bypassはtransaction前にfail-closeする", (_name, mutate) => {
    const migrate = vi.fn();
    const candidate = command();
    mutate(candidate);
    const runner = new GenesisRebaseMigrationRunner({
      ...authorityDeps(candidate),
      observeCustodyIssue: observedIssue,
      transaction: { migrate },
    });

    expect(() => runner.run(candidate)).toThrow("genesis-rebase-domain-validation-failed");
    expect(migrate).not.toHaveBeenCalled();
  });

  it("U-PA-REBASE-025: validation済proposalとtransaction inputのidentity/digest driftを拒否する", () => {
    const migrate = vi.fn();
    const candidate = command();
    candidate.input.canonicalPayloadDigest = "0".repeat(64);
    const runner = new GenesisRebaseMigrationRunner({
      ...authorityDeps(candidate),
      observeCustodyIssue: observedIssue,
      transaction: { migrate },
    });

    expect(() => runner.run(candidate)).toThrow("genesis-rebase-trusted-source-mismatch");
    expect(migrate).not.toHaveBeenCalled();
  });

  it.each([
    "source",
    "projection",
  ] as const)("U-PA-REBASE-027: trusted %s authority driftをtransaction前に拒否する", (kind) => {
    const candidate = command();
    const migrate = vi.fn();
    const authority = authorityDeps(candidate);
    const runner = new GenesisRebaseMigrationRunner({
      ...authority,
      ...(kind === "source"
        ? {
            resolveBlob: () => ({
              ...authority.resolveBlob(),
              bytes: Buffer.from(`${sourceText()}tampered`, "utf8"),
            }),
          }
        : {
            resolveHistoricalProjection: () => ({
              ...authority.resolveHistoricalProjection(),
              tailDigest: "0".repeat(64),
            }),
          }),
      observeCustodyIssue: observedIssue,
      transaction: { migrate },
    });

    expect(() => runner.run(candidate)).toThrow(
      kind === "source"
        ? "genesis-rebase-trusted-source-mismatch"
        : "genesis-rebase-tracked-projection-mismatch",
    );
    expect(migrate).not.toHaveBeenCalled();
  });

  it("U-PA-REBASE-022: production factoryはfake portでGitHub/DB実writeなしに実行できる", () => {
    const runner = createProductionGenesisRebaseMigrationRunner("C:/unused", {
      ...authorityDeps(command()),
      observeCustodyIssue: observedIssue,
      transaction: {
        migrate: () => ({
          ok: false as const,
          ruleId: "genesis-rebase-historical-preimage-mismatch",
        }),
      },
    });
    expect(runner.run(command())).toEqual({
      ok: false,
      ruleId: "genesis-rebase-historical-preimage-mismatch",
    });
  });

  it("U-PA-REBASE-028: production default authority resolverをtrusted Git portへ配線する", () => {
    const candidate = command();
    const migrate = vi.fn(() => ({
      ok: true as const,
      replayed: false,
      certificateId: candidate.proposal.certificate.certificateId,
      certificateDigest: candidate.proposal.certificate.certificateDigest,
    }));
    const runner = createProductionGenesisRebaseMigrationRunner("C:/unused", {
      gitCommand: fakeGit(candidate),
      observeIssue102: authorityDeps(candidate).observeIssue102,
      observeCustodyIssue: observedIssue,
      transaction: { migrate },
    });

    expect(runner.run(candidate)).toMatchObject({ ok: true });
    expect(migrate).toHaveBeenCalledOnce();
  });

  it("U-PA-REBASE-023: plan CLI surfaceは機械可読なreceiptを返す", async () => {
    const output: string[] = [];
    const plan = new Command("plan").exitOverride();
    registerGenesisRebaseMigrationProductionCommand(plan, "C:/unused", {
      ...authorityDeps(command()),
      readText: () => JSON.stringify(command()),
      writeOutput: (text) => output.push(text),
      observeCustodyIssue: observedIssue,
      transaction: {
        migrate: () => ({
          ok: true,
          replayed: true,
          certificateId: "genesis-rebase:test",
          certificateDigest: "a".repeat(64),
        }),
      },
    });
    await plan.parseAsync(["node", "plan", "genesis-rebase-migrate", "--manifest", "fixture.json"]);
    expect(JSON.parse(output.join(""))).toMatchObject({
      ok: true,
      result: { replayed: true, certificateId: "genesis-rebase:test" },
    });
  });

  it("U-PA-REBASE-026: CLIはdomain拒否のstable child ruleを機械可読に返す", async () => {
    const output: string[] = [];
    const candidate = command();
    candidate.proposal.confirmationReview = null;
    const plan = new Command("plan").exitOverride();
    registerGenesisRebaseMigrationProductionCommand(plan, "C:/unused", {
      ...authorityDeps(candidate),
      readText: () => JSON.stringify(candidate),
      writeOutput: (text) => output.push(text),
      observeCustodyIssue: observedIssue,
      transaction: { migrate: vi.fn() },
    });

    await plan.parseAsync(["node", "plan", "genesis-rebase-migrate", "--manifest", "fixture.json"]);

    expect(JSON.parse(output.join(""))).toEqual({
      ok: false,
      rule_id: "confirmation-review-missing",
    });
  });
});

function observedIssue() {
  return {
    number: 143,
    nodeId: GENESIS_REBASE_CUSTODY_NODE_ID,
    bodyDigest: GENESIS_REBASE_CUSTODY_BODY_DIGEST,
    updatedAt: GENESIS_REBASE_CUSTODY_UPDATED_AT,
  };
}

function command(): Mutable<GenesisRebaseMigrationCommand> {
  const proposal = proposalFixture();
  const source = parseLegacyPlanSource(sourceText());
  if (!source) throw new Error("fixture source invalid");
  const revisions = proposal.historical.revisions.map((revision) => ({
    revision: revision.revision,
    canonicalPayloadDigest: revision.contentDigest.slice(7),
    bodyDigest: revision.bodyDigest.slice(7),
    sourcePath: revision.sourcePath,
    sourceCommit: revision.sourceCommit,
  }));
  return {
    marker: GENESIS_REBASE_MIGRATION_MARKER,
    operation: GENESIS_REBASE_MIGRATION_OPERATION,
    repository: GENESIS_REBASE_REPOSITORY,
    plan_id: GENESIS_REBASE_PLAN_ID,
    issue102_body_digest: proposal.issue102.bodyDigest.slice(7),
    inference_forbidden: true,
    drive: "recovery",
    proposal,
    input: {
      commandId: "genesis-rebase:recovery-16",
      historicalAssetId: "plan:historical-recovery-16",
      historicalRevisions: revisions,
      historicalProjectionPath: proposal.projection.sourcePath,
      historicalProjectionBlobOid: proposal.projection.blobOid,
      historicalProjectionContentDigest: proposal.projection.contentDigest.slice(7),
      historicalProjectionTailDigest: proposal.projection.expectedTailDigest.slice(7),
      newAssetId: proposal.successor.assetId,
      newPlanId: GENESIS_REBASE_PLAN_ID,
      canonicalPayloadJson: stable(source.frontmatter),
      canonicalPayloadDigest: proposal.successor.canonicalPayloadDigest.slice(7),
      bodyDigest: proposal.successor.bodyDigest.slice(7),
      sourcePath: "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md",
      sourceCommit: GENESIS_REBASE_SOURCE_COMMIT,
      actor: "recovery:issue-143",
      reason: "PO_A_seal_history_and_rebase",
      occurredAt: "2026-07-23T06:04:27.000Z",
      authoritativeCertificate: {
        certificateId: proposal.certificate.certificateId,
        certificateJson: stable(proposal.certificate),
        certificateDigest: proposal.certificate.certificateDigest,
      },
      commentGroup: commentGroupFixture(proposal),
      issue: {
        number: 143,
        nodeId: GENESIS_REBASE_CUSTODY_NODE_ID,
        bodyDigest: GENESIS_REBASE_CUSTODY_BODY_DIGEST,
        observedRevision: GENESIS_REBASE_CUSTODY_UPDATED_AT,
        episodeId: "E4-143",
        branch: "work/redesign-planasset-genesis-adoption",
      },
    },
  } as unknown as Mutable<GenesisRebaseMigrationCommand>;
}

function commentGroupFixture(proposal: ReturnType<typeof proposalFixture>) {
  const custody = proposal.custodyIssue;
  const terminal = proposal.historical.revisions.at(-1);
  if (!custody || !terminal) throw new Error("comment group fixture authority missing");
  return createGenesisRebaseCommentGroup({
    commandId: proposal.commandId,
    commandPayloadDigest: "pending-local-derivation",
    groupId: `comments:${proposal.commandId}`,
    issue102: {
      issueNodeId: "I-102",
      issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/102",
      issueBodyDigest: proposal.issue102.bodyDigest.slice(7),
      issueVersion: "issue-102-v1",
    },
    issue143: {
      issueNodeId: GENESIS_REBASE_CUSTODY_NODE_ID,
      issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/143",
      issueBodyDigest: custody.bodyDigest.slice(7),
      issueVersion: GENESIS_REBASE_CUSTODY_UPDATED_AT,
    },
    metadata: {
      repository: GENESIS_REBASE_REPOSITORY,
      source_commit: proposal.sourceCommit,
      predecessor_asset: proposal.historical.assetId,
      predecessor_revision_first: 1,
      predecessor_revision_last: 5,
      predecessor_terminal_record_digest: terminal.recordDigest,
      successor_asset: proposal.successor.assetId,
      successor_revision: 1,
      projection_preimage_digest: proposal.projection.expectedTailDigest,
      issue102_body_digest: proposal.issue102.bodyDigest,
      issue143_body_digest: custody.bodyDigest,
      migration_certificate_id: proposal.certificate.certificateId,
      migration_certificate_digest: proposal.certificate.certificateDigest,
      inference_forbidden: true,
      drive: "recovery",
    },
  });
}

function proposalFixture() {
  const source = parseLegacyPlanSource(sourceText());
  if (!source) throw new Error("fixture source invalid");
  const revisions: ReturnType<typeof revisionFixture>[] = [];
  for (let index = 0; index < 5; index++)
    revisions.push(revisionFixture(index, revisions.at(-1)?.recordDigest ?? null));
  const identity = {
    algorithm: "ut-tdd-plan-rebase-v1" as const,
    repositoryIdentity: GENESIS_REBASE_REPOSITORY,
    planId: GENESIS_REBASE_PLAN_ID,
    historicalAssetId: "plan:historical-recovery-16",
    historicalTerminalRevision: 5,
    historicalTerminalRecordDigest: requireLastRevision(revisions).recordDigest,
    sourceCommit: GENESIS_REBASE_SOURCE_COMMIT,
    sourceBlobOid: "b".repeat(40),
  };
  const projectionText = projectionTextFor(revisions);
  const proposal = {
    commandId: "genesis-rebase:recovery-16",
    repositoryIdentity: GENESIS_REBASE_REPOSITORY,
    sourceCommit: GENESIS_REBASE_SOURCE_COMMIT,
    issue102: {
      number: 102 as const,
      state: "OPEN" as const,
      bodyDigest: digest("c"),
      mutationForbidden: true,
    },
    custodyIssue: {
      number: 143,
      state: "OPEN" as const,
      bodyDigest: `sha256:${GENESIS_REBASE_CUSTODY_BODY_DIGEST}` as const,
      projectionDigest: digest("custody-projection"),
      terminal: true,
      driveModel: "recovery" as const,
      nodeId: GENESIS_REBASE_CUSTODY_NODE_ID,
      updatedAt: GENESIS_REBASE_CUSTODY_UPDATED_AT,
    },
    historical: {
      assetId: identity.historicalAssetId,
      disposition: "historical_sealed_unrehydratable" as const,
      appendForbidden: true,
      inferredRowsForbidden: true,
      revisions,
    },
    successor: {
      assetId: deriveRebaseAssetId(identity),
      revision: 1 as const,
      planId: GENESIS_REBASE_PLAN_ID,
      sourceBlobOid: identity.sourceBlobOid,
      status: "confirmed" as const,
      canonicalPayloadDigest: digest(stable(source.frontmatter)),
      bodyDigest: digest(source.body),
      sourcePath: "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md",
      contentDigest: digest(sourceText()),
    },
    projection: {
      sourcePath: "docs/governance/plan-admission-receipts.json",
      blobOid: "c".repeat(40),
      contentDigest: digest(projectionText),
      expectedTailDigest: requireLastRevision(revisions).recordDigest,
      currentTailDigest: requireLastRevision(revisions).recordDigest,
      preserveThroughSequence: 5,
      appendOnly: true,
    },
    confirmationReview: {
      reviewKind: "cross_agent" as const,
      verdict: "pass" as const,
      exactHead: GENESIS_REBASE_SOURCE_COMMIT,
      workerModel: "gpt-worker",
      reviewerModel: "claude-reviewer",
      reviewedAt: "2026-07-23T07:00:00.000Z",
      testsGreenAt: "2026-07-23T06:59:00.000Z",
      greenCommandCount: 2,
    },
    certificate: undefined as unknown as ReturnType<typeof deriveMigrationCertificate>,
  };
  const certificateInput: PlanAssetMigrationCertificateInput = {
    commandId: proposal.commandId,
    identity,
    predecessorRevisionRange: [1, 5],
    successorAssetId: proposal.successor.assetId,
    successorRevision: 1,
    issue102BodyDigest: proposal.issue102.bodyDigest,
    custodyIssueNumber: 143,
    custodyIssueBodyDigest: proposal.custodyIssue.bodyDigest,
    custodyProjectionDigest: proposal.custodyIssue.projectionDigest,
    projectionPreimageDigest: proposal.projection.expectedTailDigest,
    decision: "PO_A_seal_history_and_rebase",
  };
  proposal.certificate = deriveMigrationCertificate(certificateInput);
  return proposal;
}

function revisionFixture(index: number, previousRecordDigest: `sha256:${string}` | null) {
  const base = {
    sequence: index + 1,
    previousRecordDigest,
    commandId: `old:${index + 1}`,
    receiptId: `receipt:${index + 1}`,
    receiptDigest: digest(`receipt-${index + 1}`),
    decisionDigest: digest(`decision-${index + 1}`),
    binding: {
      path: `docs/plans/PLAN-RECOVERY-16-R${index + 1}.md`,
      planId: GENESIS_REBASE_PLAN_ID,
      assetId: "plan:historical-recovery-16",
      revision: index + 1,
      contentDigest: digest("a"),
    },
  };
  return {
    revision: index + 1,
    commandId: base.commandId,
    receiptId: base.receiptId,
    receiptDigest: base.receiptDigest,
    contentDigest: base.binding.contentDigest,
    recordDigest: trackedReceiptRecordDigest(base) as `sha256:${string}`,
    previousRecordDigest,
    bodyDigest: digest("b"),
    sourcePath: base.binding.path,
    sourceCommit: GENESIS_REBASE_SOURCE_COMMIT,
  };
}

function projectionTextFor(revisions: readonly ReturnType<typeof revisionFixture>[]): string {
  return JSON.stringify({
    schema_version: "ut-tdd.plan-admission-receipts/v1",
    records: revisions.map((revision, index) => ({
      sequence: revision.revision,
      previous_record_digest: revision.previousRecordDigest,
      record_digest: revision.recordDigest,
      command_id: revision.commandId,
      receipt_id: revision.receiptId,
      receipt_digest: revision.receiptDigest,
      decision_digest: digest(`decision-${index + 1}`),
      binding: {
        path: revision.sourcePath,
        plan_id: GENESIS_REBASE_PLAN_ID,
        asset_id: "plan:historical-recovery-16",
        revision: revision.revision,
        content_digest: revision.contentDigest,
      },
    })),
  });
}

function requireLastRevision<T>(revisions: readonly T[]): T {
  const revision = revisions.at(-1);
  if (!revision) throw new Error("test fixture historical revision missing");
  return revision;
}

function digest(value: string): `sha256:${string}` {
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sourceText(): string {
  return `---\nplan_id: ${GENESIS_REBASE_PLAN_ID}\n---\n\nsuccessor body\n`;
}

function authorityDeps(candidate: Mutable<GenesisRebaseMigrationCommand>) {
  return {
    observeIssue102: () => ({
      number: 102,
      nodeId: "I-102",
      bodyDigest: candidate.proposal.issue102.bodyDigest.slice(7),
      updatedAt: "2026-07-23T05:00:00Z",
    }),
    resolveBlob: () => ({
      commitOid: candidate.proposal.sourceCommit,
      sourcePath: candidate.proposal.successor.sourcePath,
      blobOid: candidate.proposal.successor.sourceBlobOid,
      bytes: Buffer.from(sourceText(), "utf8"),
    }),
    resolveHistoricalProjection: () => ({
      blobOid: candidate.proposal.projection.blobOid,
      contentDigest: candidate.proposal.projection.contentDigest.slice(7),
      tailDigest: candidate.proposal.projection.expectedTailDigest.slice(7),
      revisions: candidate.proposal.historical.revisions.map((revision) => ({
        revision: revision.revision,
        commandId: revision.commandId,
        receiptId: revision.receiptId,
        receiptDigest: revision.receiptDigest,
        contentDigest: revision.contentDigest,
        recordDigest: revision.recordDigest,
        previousRecordDigest: revision.previousRecordDigest,
        sourcePath: revision.sourcePath,
      })),
    }),
  };
}

function fakeGit(candidate: Mutable<GenesisRebaseMigrationCommand>) {
  return {
    run(args: readonly string[]): Buffer {
      if (args[0] === "rev-parse") return Buffer.from(`${candidate.proposal.sourceCommit}\n`);
      if (args[0] === "ls-tree") {
        const path = args.at(-1);
        const oid =
          path === candidate.proposal.successor.sourcePath
            ? candidate.proposal.successor.sourceBlobOid
            : candidate.proposal.projection.blobOid;
        return Buffer.from(`100644 blob ${oid}\t${path}\0`);
      }
      if (args[0] === "cat-file") {
        const oid = args[2];
        return Buffer.from(
          oid === candidate.proposal.successor.sourceBlobOid
            ? sourceText()
            : projectionTextFor(candidate.proposal.historical.revisions),
          "utf8",
        );
      }
      throw new Error(`unexpected git argv: ${args.join(" ")}`);
    },
  };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K];
};
