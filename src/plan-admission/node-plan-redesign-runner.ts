import { createHash } from "node:crypto";
import {
  deriveRedesignPublication,
  PlanRedesignBundleCoordinator,
  type RedesignBundleInput,
  redesignBundlePayloadDigest,
} from "../plan-asset/ledger/plan-redesign-bundle.js";
import type { BootstrapLegacyPlanRevisionInput } from "../plan-asset/ledger/plan-revision-bootstrap.js";
import type { AppendPlanRevisionInput } from "../plan-asset/ledger/plan-revision-ledger.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import { NodeAuthoringArtifactPublisher } from "./node-authoring-artifact-publisher.js";
import type { PlanRedesignBundleManifest } from "./plan-authoring-command-port.js";
import { validatePlanRedesignBundleManifest } from "./plan-redesign-command-assembler.js";
import {
  NodeGitCommandPort,
  type TrustedGitBlob,
  TrustedGitBlobResolver,
} from "./trusted-git-blob-resolver.js";

export interface NodePlanRedesignRunnerDeps {
  readonly repoRoot: string;
  readonly openDb?: () => HarnessDb;
  readonly gitResolver?: Pick<TrustedGitBlobResolver, "resolve">;
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
    verifyLegacyBootstrapGitBinding(
      manifest,
      this.deps.gitResolver ??
        new TrustedGitBlobResolver(new NodeGitCommandPort(this.deps.repoRoot)),
    );
    const artifacts = {
      origin: artifact({
        memberId: "origin",
        path: manifest.origin.source_path,
        content: manifest.origin.source_content,
        expectedPreimage: preimage(manifest.origin.expected_preimage),
      }),
      replacement: artifact({
        memberId: "replacement",
        path: manifest.replacement.source_path,
        content: manifest.replacement.source_content,
        expectedPreimage: preimage(manifest.replacement.expected_preimage),
      }),
      projection: artifact({
        memberId: "projection",
        path: manifest.projection.path,
        content: manifest.projection.content,
        expectedPreimage: preimage(manifest.projection.expected_preimage),
      }),
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
      pairs: artifacts.pairs,
      upstream: artifacts.upstream,
    });
    const partial = {
      commandId: manifest.command_id,
      repositoryIdentity: manifest.repository_identity,
      replacement: revision(manifest.replacement),
      origin: revision(manifest.origin),
      reentry: {
        targetPlanId: manifest.reentry.target_plan_id,
        targetRevision: manifest.reentry.target_revision,
        phase: manifest.reentry.phase,
      },
      projection: {
        path: manifest.projection.path,
        contentDigest: sha(manifest.projection.content),
      },
      publication,
    };
    const bundle: RedesignBundleInput = {
      ...partial,
      commandPayloadDigest: redesignBundlePayloadDigest(partial),
    };
    const db = this.deps.openDb?.() ?? openPlanLedger({ repoRoot: this.deps.repoRoot });
    try {
      const coordinator = new PlanRedesignBundleCoordinator(db);
      const publisher = new NodeAuthoringArtifactPublisher({
        rootDir: this.deps.repoRoot,
        artifacts: [
          artifacts.origin,
          artifacts.replacement,
          artifacts.projection,
          ...artifacts.pairs,
          ...artifacts.upstream,
        ].map(({ path, ...value }) => ({ ...value, path })),
      });
      return coordinator.publishDurable(bundle, publisher);
    } finally {
      db.close();
    }
  }
}

function verifyLegacyBootstrapGitBinding(
  manifest: PlanRedesignBundleManifest,
  resolver: Pick<TrustedGitBlobResolver, "resolve">,
): void {
  for (const revision of [manifest.origin, manifest.replacement]) {
    if (revision.revision_mode !== "legacy_bootstrap") continue;
    if (!revision.bootstrap) throw new Error("plan-redesign-bootstrap-fields-missing");
    const base = revision.bootstrap;
    const actual = resolver.resolve(base.base_source_commit, base.base_source_path);
    assertBootstrapBinding(base, actual);
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
