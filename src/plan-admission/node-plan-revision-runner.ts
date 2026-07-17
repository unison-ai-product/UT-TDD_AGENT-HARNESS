import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { PlanRevisionManifest } from "../cli/plan-revise.js";
import { loadProjectIdentityFromHead } from "../plan-asset/adapters/project-identity-loader.js";
import { LegacyPlanRevisionBootstrapTransaction } from "../plan-asset/ledger/plan-revision-bootstrap.js";
import { PlanRevisionLedgerTransaction } from "../plan-asset/ledger/plan-revision-ledger.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import { NodeAtomicDraftPublisher } from "./node-atomic-draft-publisher.js";
import {
  type DraftArtifact,
  type DraftPublisherPort,
  PlanDraftService,
} from "./plan-draft-service.js";
import {
  assemblePlanRevisionCommand,
  type PlanRevisionExecutionPayload,
  sha,
} from "./plan-revision-command-assembler.js";
import {
  PlanRevisionLedgerAdapter,
  type PlanRevisionReceipt,
} from "./plan-revision-ledger-adapter.js";
import type { AdmissionDecision, PlanAdmissionRequest } from "./policy.js";
import { SqliteDraftJournal } from "./sqlite-draft-journal.js";
import { TrackedReceiptRenderer } from "./tracked-receipt-renderer.js";

export interface NodePlanRevisionRunnerDeps {
  repoRoot: string;
  sourceCommit: () => string;
  sourceBlobOid: (path?: string) => string;
  actor: () => string;
  readText: (path: string) => string;
  headText?: (path: string) => string;
  repositoryIdentity?: () => string;
  openDb?: () => HarnessDb;
  publisher?: () => DraftPublisherPort;
}

/** HEAD preimage、working tree CAS、ledgerを一つのrevision Sagaへ閉じるNode adapter。 */
export class NodePlanRevisionRunner {
  constructor(private readonly deps: NodePlanRevisionRunnerDeps) {}

  run(input: {
    manifest: PlanRevisionManifest;
    admission: PlanAdmissionRequest;
    decision: Extract<AdmissionDecision, { ok: true }>;
  }) {
    const db = this.deps.openDb?.() ?? openPlanLedger({ repoRoot: this.deps.repoRoot });
    try {
      const snapshot = this.preflight(input.manifest);
      const adopted = Boolean(
        db
          .prepare("SELECT 1 FROM plan_assets WHERE asset_id = ?")
          .get(input.manifest.base.asset_id),
      );
      const command = assemblePlanRevisionCommand({
        manifest: input.manifest,
        admission: input.admission,
        environment: {
          repositoryIdentity: snapshot.repositoryIdentity,
          sourceCommit: snapshot.sourceCommit,
          sourceBlobOid: snapshot.sourceBlobOid,
          headSource: snapshot.headSource,
          actor: this.deps.actor(),
        },
        legacy: !adopted,
      });
      const publisher =
        this.deps.publisher?.() ?? new NodeAtomicDraftPublisher({ rootDir: this.deps.repoRoot });
      const renderer = new RevisionRenderer(
        new TrackedReceiptRenderer({ read: () => snapshot.projectionText }),
        snapshot.sourceByteDigest,
        snapshot.projectionByteDigest,
      );
      const service = new PlanDraftService<PlanRevisionExecutionPayload, PlanRevisionReceipt>({
        validator: { validate: () => undefined },
        journal: new SqliteDraftJournal(db),
        publisher,
        renderer,
        ledger: new PlanRevisionLedgerAdapter(
          new PlanRevisionLedgerTransaction(db),
          new LegacyPlanRevisionBootstrapTransaction(db),
        ),
      });
      return service.execute(command);
    } finally {
      db.close();
    }
  }

  private preflight(manifest: PlanRevisionManifest) {
    const sourceCommit = this.deps.sourceCommit();
    if (sourceCommit !== manifest.base.source_commit)
      throw new Error("plan-revision-source-commit-drift");
    const sourceBlobOid = this.deps.sourceBlobOid(manifest.source.path);
    if (sourceBlobOid !== manifest.base.source_blob_oid)
      throw new Error("plan-revision-source-blob-drift");
    const sourcePath = resolveRepoPath(this.deps.repoRoot, manifest.source.path);
    const projectionPath = resolveRepoPath(this.deps.repoRoot, manifest.projection.path);
    const sourceText = this.deps.readText(sourcePath);
    const projectionText = this.deps.readText(projectionPath);
    const sourceByteDigest = prefixedSha(sourceText);
    const projectionByteDigest = prefixedSha(projectionText);
    if (!digestEqual(sourceByteDigest, manifest.base.source_content_digest))
      throw new Error("plan-revision-source-content-drift");
    if (!digestEqual(projectionTailDigest(projectionText), manifest.base.projection_tail_digest))
      throw new Error("plan-revision-projection-tail-drift");
    return {
      sourceCommit,
      sourceBlobOid,
      sourceByteDigest,
      projectionByteDigest,
      projectionText,
      headSource: this.deps.headText?.(manifest.source.path) ?? sourceText,
      repositoryIdentity: this.deps.repositoryIdentity?.() ?? `repo:${sha(this.deps.repoRoot)}`,
    };
  }
}

class RevisionRenderer {
  constructor(
    private readonly delegate: TrackedReceiptRenderer,
    private readonly sourceDigest: `sha256:${string}`,
    private readonly projectionDigest: `sha256:${string}`,
  ) {}

  render(
    command: import("./plan-draft-service.js").PlanDraftCommand<PlanRevisionExecutionPayload>,
    receipt: PlanRevisionReceipt,
  ): readonly [DraftArtifact, DraftArtifact] {
    if (!receipt.certificateDigest) throw new Error("plan-revision-receipt-incomplete");
    const compatible = {
      ...command,
      payload: { canonical: {} as never, admission: command.payload.admission },
    };
    const [source, projection] = this.delegate.render(
      compatible,
      receipt as PlanRevisionReceipt & { certificateDigest: string },
    );
    return [
      { ...source, expectedPreimage: { kind: "sha256", digest: this.sourceDigest } },
      { ...projection, expectedPreimage: { kind: "sha256", digest: this.projectionDigest } },
    ];
  }
}

export function createNodePlanRevisionRunner(repoRoot: string): NodePlanRevisionRunner {
  return new NodePlanRevisionRunner({
    repoRoot,
    sourceCommit: () => git(repoRoot, ["rev-parse", "HEAD"]),
    sourceBlobOid: (path) => git(repoRoot, ["rev-parse", `HEAD:${path}`]),
    headText: (path) =>
      execFileSync("git", ["-C", repoRoot, "show", `HEAD:${path}`], { encoding: "utf8" }),
    repositoryIdentity: () => {
      const identity = loadProjectIdentityFromHead({ repoRoot });
      if (!identity.ok) throw new Error(identity.error.ruleId);
      return identity.value.repositoryIdentity;
    },
    actor: () => {
      try {
        return git(repoRoot, ["config", "user.name"]) || "ut-tdd";
      } catch {
        return "ut-tdd";
      }
    },
    readText: (path) => readFileSync(path, "utf8"),
  });
}

function projectionTailDigest(text: string): `sha256:${string}` {
  try {
    const value = JSON.parse(text) as { records?: unknown[] };
    const tail = value.records?.at(-1);
    if (
      tail &&
      typeof tail === "object" &&
      "record_digest" in tail &&
      typeof (tail as { record_digest?: unknown }).record_digest === "string"
    )
      return normalizeDigest((tail as { record_digest: string }).record_digest);
  } catch {
    /* invalid projection is rejected by renderer after the drift fence */
  }
  return prefixedSha(text);
}

function normalizeDigest(value: string): `sha256:${string}` {
  return (value.startsWith("sha256:") ? value : `sha256:${value}`) as `sha256:${string}`;
}
function prefixedSha(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
function digestEqual(left: string, right: string): boolean {
  return normalizeDigest(left) === normalizeDigest(right);
}
function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}
function resolveRepoPath(root: string, path: string): string {
  const normalized = path.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.split("/").includes(".."))
    throw new Error("plan-revision-path-invalid");
  return `${root.replaceAll("\\", "/").replace(/\/$/, "")}/${normalized}`;
}
