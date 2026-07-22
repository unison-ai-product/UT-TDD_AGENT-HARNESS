import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import {
  deriveRedesignPublication,
  PlanRedesignBundleCoordinator,
  type RedesignBundleInput,
  redesignBundlePayloadDigest,
} from "../plan-asset/ledger/plan-redesign-bundle.js";
import {
  type BootstrapLegacyPlanRevisionInput,
  deriveLegacyPlanRevisionBootstrap,
} from "../plan-asset/ledger/plan-revision-bootstrap.js";
import {
  type AppendPlanRevisionInput,
  derivePlanRevisionDigests,
} from "../plan-asset/ledger/plan-revision-ledger.js";
import { committedRevisionPredicate } from "../plan-asset/ledger/revision-visibility.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import type { IssueProjectionEvidenceClaim } from "./issue-projection-evidence-resolver.js";
import { NodeAuthoringArtifactPublisher } from "./node-authoring-artifact-publisher.js";
import { NodeIssueProjectionEvidenceResolver } from "./node-issue-projection-evidence-resolver.js";
import type { PlanRedesignBundleManifest } from "./plan-authoring-command-port.js";
import { validatePlanRedesignBundleManifest } from "./plan-redesign-command-assembler.js";
import { TRACKED_RECEIPT_SCHEMA } from "./tracked-receipt-projection.js";
import { TrackedReceiptRenderer } from "./tracked-receipt-renderer.js";
import {
  NodeGitCommandPort,
  type TrustedGitBlob,
  TrustedGitBlobResolver,
} from "./trusted-git-blob-resolver.js";
import {
  assertTrustedRepositoryIdentity,
  NodeRepositoryIdentityGitPort,
  TrustedRepositoryIdentityResolver,
} from "./trusted-repository-identity-resolver.js";

export interface NodePlanRedesignRunnerDeps {
  readonly repoRoot: string;
  readonly openDb?: () => HarnessDb;
  readonly gitResolver?: Pick<TrustedGitBlobResolver, "resolve">;
  readonly readText?: (path: string) => string;
  readonly issueProjectionResolver?: {
    readonly resolve: (claim: IssueProjectionEvidenceClaim) => unknown;
  };
  readonly repositoryIdentityResolver?: Pick<TrustedRepositoryIdentityResolver, "assertClaim">;
}

/** v2 manifestをexact publication factoryへ通し、bundle coordinatorへ到達させる兄弟runner。 */
export class NodePlanRedesignRunner {
  constructor(private readonly deps: NodePlanRedesignRunnerDeps) {}

  run(input: { manifest: PlanRedesignBundleManifest }) {
    const manifest = validatePlanRedesignBundleManifest(input.manifest);
    if (
      manifest.replacement.command_id !== `${manifest.command_id}:replacement` ||
      manifest.origin.command_id !== `${manifest.command_id}:origin`
    ) {
      throw new Error("plan-redesign-command-binding-invalid");
    }
    const resolver =
      this.deps.gitResolver ??
      new TrustedGitBlobResolver(new NodeGitCommandPort(this.deps.repoRoot));
    verifyRevisionGitBinding(manifest, resolver);
    const trustedRepositoryIdentity = (
      this.deps.repositoryIdentityResolver ??
      new TrustedRepositoryIdentityResolver(new NodeRepositoryIdentityGitPort(this.deps.repoRoot))
    ).assertClaim(manifest.repository_identity);
    const issue = manifest.replacement.admission.issue;
    if (!issue) throw new Error("plan-redesign-issue-projection-evidence-missing");
    const issueEvidence = (
      this.deps.issueProjectionResolver ??
      new NodeIssueProjectionEvidenceResolver(this.deps.repoRoot)
    ).resolve({
      issueId: issue.issueId,
      episodeId: issue.episodeId,
      projectionDigest: issue.projectionDigest,
    });
    assertTrustedRepositoryIdentity(
      issueEvidenceRepository(issueEvidence),
      trustedRepositoryIdentity,
    );
    const revisions = {
      origin: revision(manifest.origin),
      replacement: revision(manifest.replacement),
    };
    const artifacts = new RedesignReceiptArtifactAssembler({
      projectionText: () =>
        manifest.projection.expected_preimage.kind === "absent"
          ? `${JSON.stringify({ schema_version: TRACKED_RECEIPT_SCHEMA, records: [] }, null, 2)}\n`
          : (this.deps.readText ?? ((path) => readFileSync(path, "utf8")))(
              resolveTrackedPath(this.deps.repoRoot, manifest.projection.path),
            ),
    }).assemble({ manifest, revisions });
    const publishedRevisions = {
      origin: { ...revisions.origin, sourceContent: artifacts.origin.content },
      replacement: { ...revisions.replacement, sourceContent: artifacts.replacement.content },
    };
    const otherArtifacts = {
      pairs: manifest.pairs.map((item) =>
        artifact({
          memberId: `pair:${sha(item.path)}` as const,
          path: item.path,
          content: item.content,
          expectedPreimage: preimage(item.expected_preimage),
        }),
      ),
      upstream: manifest.upstream.map((item) =>
        artifact({
          memberId: `upstream:${sha(item.path)}` as const,
          path: item.path,
          content: item.content,
          expectedPreimage: preimage(item.expected_preimage),
        }),
      ),
    };
    const publication = deriveRedesignPublication({
      origin: withoutMemberId(artifacts.origin),
      replacement: withoutMemberId(artifacts.replacement),
      projection: withoutMemberId(artifacts.projection),
      pairs: otherArtifacts.pairs,
      upstream: otherArtifacts.upstream,
    });
    const partial = {
      commandId: manifest.command_id,
      repositoryIdentity: manifest.repository_identity,
      replacement: publishedRevisions.replacement,
      origin: publishedRevisions.origin,
      reentry: {
        targetPlanId: manifest.reentry.target_plan_id,
        targetRevision: manifest.reentry.target_revision,
        phase: manifest.reentry.phase,
      },
      projection: bindRenderedProjection(artifacts.projection),
      publication,
    };
    const bundle: RedesignBundleInput = {
      ...partial,
      commandPayloadDigest: redesignBundlePayloadDigest(partial),
    };
    const db = this.deps.openDb?.() ?? openPlanLedger({ repoRoot: this.deps.repoRoot });
    try {
      verifyAppendLedgerBases(db, manifest);
      const coordinator = new PlanRedesignBundleCoordinator(db);
      const publisher = new NodeAuthoringArtifactPublisher({
        rootDir: this.deps.repoRoot,
        artifacts: [
          artifacts.origin,
          artifacts.replacement,
          artifacts.projection,
          ...otherArtifacts.pairs,
          ...otherArtifacts.upstream,
        ].map(({ path, ...value }) => ({ ...value, path })),
      });
      return coordinator.publishDurable(bundle, publisher);
    } finally {
      db.close();
    }
  }
}

/** bundle/DB bindingはcaller manifestでなくrendererが確定したtracked projectionを正本にする。 */
export function bindRenderedProjection(input: { readonly path: string; readonly content: string }) {
  return { path: input.path, contentDigest: sha(input.content) };
}

type RedesignRevision = ReturnType<typeof revision>;

/** ledgerと同じpure導出receiptから、2 PLANと単一projectionをorigin→replacement順に生成する。 */
export class RedesignReceiptArtifactAssembler {
  constructor(private readonly deps: { readonly projectionText: () => string }) {}

  assemble(input: {
    readonly manifest: PlanRedesignBundleManifest;
    readonly revisions: {
      readonly origin: RedesignRevision;
      readonly replacement: RedesignRevision;
    };
  }) {
    let projection = this.deps.projectionText();
    const render = (role: "origin" | "replacement", revisionInput: RedesignRevision) => {
      const manifestRevision = input.manifest[role];
      const receipt = derivedReceipt(revisionInput);
      const renderer = new TrackedReceiptRenderer({ read: () => projection });
      const [source, nextProjection] = renderer.render(
        {
          commandId: manifestRevision.command_id,
          commandPayloadDigest: `sha256:${receipt.commandPayloadDigest}`,
          planId: manifestRevision.plan_id,
          recordedAt: manifestRevision.occurred_at,
          payload: { admission: manifestRevision.admission },
          source: { path: manifestRevision.source_path, content: manifestRevision.source_content },
          projectionPath: input.manifest.projection.path,
        },
        receipt,
      );
      projection = nextProjection.content;
      return artifact({
        memberId: role,
        path: source.path,
        content: source.content,
        expectedPreimage: preimage(manifestRevision.expected_preimage),
      });
    };
    const origin = render("origin", input.revisions.origin);
    const replacement = render("replacement", input.revisions.replacement);
    return {
      origin,
      replacement,
      projection: artifact({
        memberId: "projection",
        path: input.manifest.projection.path,
        content: projection,
        expectedPreimage: preimage(input.manifest.projection.expected_preimage),
      }),
    };
  }
}

function derivedReceipt(input: RedesignRevision) {
  const derived =
    "identityAlgorithm" in input
      ? deriveLegacyPlanRevisionBootstrap(input)
      : { ok: true as const, assetId: input.assetId, ...derivePlanRevisionDigests(input) };
  if (!derived.ok) throw new Error(derived.ruleId);
  return {
    assetId: derived.assetId,
    revision: input.baseRevision + 1,
    certificateId: input.certificateId,
    certificateDigest: derived.certificateDigest,
    commandPayloadDigest: derived.commandPayloadDigest,
  };
}

function resolveTrackedPath(repoRoot: string, path: string): string {
  const root = resolve(repoRoot);
  const target = resolve(root, path);
  const rel = relative(root, target);
  if (!rel || rel.startsWith("..") || isAbsolute(rel))
    throw new Error("plan-redesign-projection-path-invalid");
  return target;
}

function verifyRevisionGitBinding(
  manifest: PlanRedesignBundleManifest,
  resolver: Pick<TrustedGitBlobResolver, "resolve">,
): void {
  for (const revision of [manifest.origin, manifest.replacement]) {
    if (revision.revision_mode === "legacy_bootstrap") {
      if (!revision.bootstrap) throw new Error("plan-redesign-bootstrap-fields-missing");
      const base = revision.bootstrap;
      assertBootstrapBinding(
        base,
        resolver.resolve(base.base_source_commit, base.base_source_path),
      );
      continue;
    }
    assertAppendHeadBinding(revision, resolver.resolve("HEAD", revision.source_path));
  }
}

function assertAppendHeadBinding(
  revision: PlanRedesignBundleManifest["origin"],
  actual: TrustedGitBlob,
): void {
  if (actual.commitOid !== revision.source_commit)
    throw new Error("plan-redesign-append-source-commit-drift");
  if (actual.sourcePath !== revision.source_path)
    throw new Error("plan-redesign-append-source-path-mismatch");
  if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(actual.blobOid))
    throw new Error("plan-redesign-append-source-blob-invalid");
  if (
    revision.expected_preimage.kind !== "sha256" ||
    sha(actual.bytes) !== unprefix(revision.expected_preimage.digest)
  )
    throw new Error("plan-redesign-append-source-content-drift");
}

export function verifyAppendLedgerBases(db: HarnessDb, manifest: PlanRedesignBundleManifest): void {
  for (const revision of [manifest.origin, manifest.replacement]) {
    if (revision.revision_mode !== "append") continue;
    const aliases = db
      .prepare("SELECT asset_id FROM plan_aliases WHERE alias = ? AND valid_to_revision IS NULL")
      .all(revision.plan_id) as Array<{ asset_id: string }>;
    if (aliases.length !== 1 || aliases[0]?.asset_id !== revision.asset_id)
      throw new Error("plan-redesign-append-alias-binding-invalid");
    const latest = db
      .prepare(
        `SELECT revision, canonical_payload_digest, source_path FROM plan_revisions revision
         WHERE asset_id = ? AND ${committedRevisionPredicate("revision")}
         ORDER BY revision DESC LIMIT 1`,
      )
      .get(revision.asset_id) as
      | { revision: number; canonical_payload_digest: string; source_path: string }
      | undefined;
    if (
      !latest ||
      Number(latest.revision) !== revision.base_revision ||
      unprefix(String(latest.canonical_payload_digest)) !==
        unprefix(revision.base_payload_digest) ||
      latest.source_path !== revision.source_path
    )
      throw new Error("plan-redesign-append-ledger-base-drift");
  }
}

function assertBootstrapBinding(
  base: NonNullable<PlanRedesignBundleManifest["origin"]["bootstrap"]>,
  actual: TrustedGitBlob,
): void {
  if (actual.commitOid !== base.base_source_commit)
    throw new Error("plan-redesign-bootstrap-source-commit-mismatch");
  if (actual.sourcePath !== base.base_source_path)
    throw new Error("plan-redesign-bootstrap-source-path-mismatch");
  if (actual.blobOid !== base.base_source_blob_oid)
    throw new Error("plan-redesign-bootstrap-blob-oid-mismatch");
  const declaredBytes = Buffer.from(base.base_source_content, "utf8");
  if (!actual.bytes.equals(declaredBytes))
    throw new Error("plan-redesign-bootstrap-source-content-mismatch");
  if (sha(actual.bytes) !== unprefix(base.base_source_content_digest))
    throw new Error("plan-redesign-bootstrap-source-content-digest-mismatch");
}

export function createNodePlanRedesignRunner(repoRoot: string): NodePlanRedesignRunner {
  return new NodePlanRedesignRunner({ repoRoot });
}

function revision(
  value: PlanRedesignBundleManifest["origin"],
):
  | (AppendPlanRevisionInput & { readonly sourceContent: string })
  | (BootstrapLegacyPlanRevisionInput & { readonly sourceContent: string }) {
  const common = {
    commandId: value.command_id,
    assetId: value.asset_id,
    planId: value.plan_id,
    baseRevision: value.base_revision,
    basePayloadDigest: unprefix(value.base_payload_digest),
    canonicalPayloadJson: value.canonical_payload_json,
    contentDigest: unprefix(value.content_digest),
    bodyDigest: unprefix(value.body_digest),
    sourcePath: value.source_path,
    sourceCommit: value.source_commit,
    actor: value.actor,
    reason: value.reason,
    routeTupleDigest: unprefix(value.route_tuple_digest),
    certificateId: value.certificate_id,
    occurredAt: value.occurred_at,
    sourceContent: value.source_content,
  };
  if (value.revision_mode === "append") return common;
  if (!value.bootstrap) throw new Error("plan-redesign-bootstrap-fields-missing");
  const { assetId: _assetId, basePayloadDigest: _basePayloadDigest, ...bootstrapCommon } = common;
  return {
    ...bootstrapCommon,
    repositoryIdentity: value.bootstrap.repository_identity,
    identityAlgorithm: value.bootstrap.identity_algorithm,
    identityInputJson: value.bootstrap.identity_input_json,
    identityDigest: unprefix(value.bootstrap.identity_digest),
    baseCanonicalPayloadJson: value.bootstrap.base_canonical_payload_json,
    baseCanonicalPayloadDigest: unprefix(value.bootstrap.base_canonical_payload_digest),
    baseBodyDigest: unprefix(value.bootstrap.base_body_digest),
    baseSourcePath: value.bootstrap.base_source_path,
    baseSourceCommit: value.bootstrap.base_source_commit,
    baseSourceBlobOid: value.bootstrap.base_source_blob_oid,
    baseSourceContent: value.bootstrap.base_source_content,
    baseSourceContentDigest: unprefix(value.bootstrap.base_source_content_digest),
  };
}

function artifact<T extends string>(input: {
  memberId: T;
  path: string;
  content: string;
  expectedPreimage: { kind: "absent" } | { kind: "sha256"; digest: `sha256:${string}` };
}) {
  return input;
}

function preimage(value: { kind: "absent" } | { kind: "sha256"; digest: string }) {
  return value.kind === "absent"
    ? ({ kind: "absent" } as const)
    : ({ kind: "sha256", digest: `sha256:${unprefix(value.digest)}` as const } as const);
}

function withoutMemberId<T extends { readonly memberId: string }>(value: T): Omit<T, "memberId"> {
  const { memberId: _memberId, ...artifact } = value;
  return artifact;
}

function sha(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
function unprefix(value: string): string {
  return value.startsWith("sha256:") ? value.slice(7) : value;
}

function issueEvidenceRepository(evidence: unknown): string {
  if (
    !evidence ||
    typeof evidence !== "object" ||
    typeof Reflect.get(evidence, "repository") !== "string"
  )
    throw new Error("trusted-repository-identity-invalid");
  return Reflect.get(evidence, "repository") as string;
}
