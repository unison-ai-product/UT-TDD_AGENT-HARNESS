import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { parseNodeBootstrapReceiptBytes } from "../runtime/node-bootstrap.ts";
import {
  admitConsumerLocalRuntime,
  type ConsumerLocalRuntimeAdmission,
} from "./consumer-local-runtime-admission.ts";
import {
  type ConsumerNodeRuntimeBundle,
  type ConsumerNodeRuntimeIdentity,
  type ConsumerNodeRuntimePriorPointer,
  digestConsumerRuntimeBytes,
  digestConsumerRuntimeValue,
  contained as isStrictlyContainedPath,
  validateConsumerNodeRuntimeBundle,
} from "./consumer-node-runtime.ts";
import type {
  ConsumerRuntimeReleaseInstallResult,
  SetupConsumerRuntimeInput,
  SetupResult,
} from "./consumer-runtime-contracts.ts";
import type { verifyConsumerRuntimeReleaseAssets } from "./consumer-runtime-release.ts";
import type { ConsumerRuntimePin } from "./consumer-worktree-runtime.ts";
import { cacheConsumerRuntimeRelease, mainWorktreeCommonDir } from "./consumer-worktree-runtime.ts";
import type { ReleaseChannelAttestation } from "./release-channel-adapter.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function consumerReleaseAttestation(
  document: ReturnType<typeof verifyConsumerRuntimeReleaseAssets>["document"],
): Extract<ReleaseChannelAttestation, { status: "attested" }> {
  const raw = document.admission_input.aggregate_input.attestation;
  return {
    status: "attested",
    releaseId: raw.releaseId,
    artifactSourceCommit: raw.artifactSourceCommit,
    expectedDigest: raw.expectedDigest,
    actualDigest: raw.actualDigest,
    entries: raw.entries.map((entry) => ({
      path: entry.path,
      mode: entry.mode,
      content: Buffer.from(entry.content_base64, "base64"),
    })),
  };
}

export function cacheAlreadyInstalledRuntime(input: {
  readonly consumerRoot: string;
  readonly releaseDirectory: string;
  readonly releaseId: string;
  readonly tag: string;
  readonly expectedConsumerDigest: string;
  readonly executingModulePath: string;
  readonly expectedPin: ConsumerRuntimePin;
}): ConsumerRuntimeReleaseInstallResult {
  const commonDir = mainWorktreeCommonDir(input.consumerRoot);
  if (!commonDir) return { status: "already-installed" };
  return { status: "already-installed", ...cacheConsumerRuntimeRelease({ ...input, commonDir }) };
}

export function sameCanonicalSetupPath(left: string, right: string): boolean {
  try {
    return canonicalSetupPath(left) === canonicalSetupPath(right);
  } catch {
    return false;
  }
}

function canonicalSetupPath(path: string): string {
  let current = resolve(path);
  const suffix: string[] = [];
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) throw new Error("consumer_runtime_external_path");
    suffix.unshift(basename(current));
    current = parent;
  }
  return resolve(realpathSync.native(current), ...suffix);
}

export function createSetupConsumerRuntimeInput(input: {
  readonly identity: ConsumerNodeRuntimeIdentity;
  readonly admission: ConsumerLocalRuntimeAdmission;
  readonly compiledEsm: Uint8Array;
  readonly nodeBootstrapReceipt: Uint8Array;
  readonly prior?: CommittedConsumerRuntimePrior;
}): SetupConsumerRuntimeInput {
  return {
    identity: input.identity,
    admission: input.admission,
    compiled_esm: input.compiledEsm,
    node_bootstrap_receipt: input.nodeBootstrapReceipt,
    ...(input.prior
      ? {
          prior_bundle: input.prior.bundle,
          prior_bundle_digest: input.prior.bundle.bundle_digest,
          prior_history_tip_digest: input.prior.historyTipDigest,
          history_sequence: input.prior.historySequence + 1,
          prior_history: input.prior.historyBytes,
          prior_identity: input.prior.bundle.identity,
          prior_pointer: input.prior.priorPointer,
          operation_kind: "update" as const,
        }
      : {}),
  };
}

export interface CommittedConsumerRuntimePrior {
  readonly bundle: ConsumerNodeRuntimeBundle;
  readonly historyBytes: Uint8Array;
  readonly historySequence: number;
  readonly historyTipDigest: string;
  readonly priorPointer: ConsumerNodeRuntimePriorPointer;
}

interface CommittedRuntimePointerValue {
  readonly bundle_digest: string;
  readonly bundle_path: string;
  readonly entry_path: string;
}

function readCommittedRuntimePointer(runtimeRoot: string): {
  readonly path: string;
  readonly bytes: Buffer;
  readonly value: CommittedRuntimePointerValue;
} {
  const path = resolve(runtimeRoot, "activation", "active.json");
  const bytes = readFileSync(path);
  const value: unknown = JSON.parse(bytes.toString("utf8"));
  if (
    !isRecord(value) ||
    Object.keys(value).sort().join("\0") !== "bundle_digest\0bundle_path\0entry_path" ||
    typeof value.bundle_digest !== "string" ||
    typeof value.bundle_path !== "string" ||
    typeof value.entry_path !== "string" ||
    value.bundle_path !== resolve(value.bundle_path) ||
    value.entry_path !== resolve(value.entry_path)
  )
    throw new Error("consumer_runtime_identity_mismatch");
  return {
    path,
    bytes,
    value: {
      bundle_digest: value.bundle_digest,
      bundle_path: value.bundle_path,
      entry_path: value.entry_path,
    },
  };
}

function readCommittedRuntimeBundle(
  runtimeRoot: string,
  pointer: CommittedRuntimePointerValue,
): ConsumerNodeRuntimeBundle {
  const runtimeRealPath = realpathSync.native(runtimeRoot);
  const bundleRealPath = realpathSync.native(pointer.bundle_path);
  if (!isStrictlyContainedPath(runtimeRealPath, bundleRealPath))
    throw new Error("consumer_runtime_identity_mismatch");
  const bundle = JSON.parse(
    readFileSync(resolve(pointer.bundle_path, "bundle-manifest.json"), "utf8"),
  ) as ConsumerNodeRuntimeBundle;
  if (
    validateConsumerNodeRuntimeBundle(bundle) ||
    pointer.bundle_digest !== bundle.bundle_digest ||
    pointer.bundle_path !== bundle.bundle_path ||
    !sameCanonicalSetupPath(pointer.entry_path, resolve(bundle.bundle_path, "ut-tdd.mjs"))
  )
    throw new Error("consumer_runtime_identity_mismatch");
  return bundle;
}

function assertCommittedRuntimeReceipt(
  bundle: ConsumerNodeRuntimeBundle,
  consumerRoot: string,
  runtimeRoot: string,
): void {
  const receipt = JSON.parse(
    readFileSync(resolve(bundle.bundle_path, "consumer-receipt.json"), "utf8"),
  ) as Record<string, unknown>;
  const consumer = isRecord(receipt.consumer) ? receipt.consumer : undefined;
  const identity = bundle.identity;
  if (
    !consumer ||
    !sameCanonicalSetupPath(String(consumer.consumerRoot ?? ""), consumerRoot) ||
    !sameCanonicalSetupPath(String(consumer.runtimeRoot ?? ""), runtimeRoot) ||
    receipt.identity_digest !== digestConsumerRuntimeValue(identity) ||
    receipt.operation_id !== identity.operation_id ||
    !sameCanonicalSetupPath(identity.consumer_root, consumerRoot) ||
    !sameCanonicalSetupPath(identity.runtime_root, runtimeRoot) ||
    consumer.productId !== identity.product_id ||
    consumer.materializerVersion !== identity.materializer_version ||
    consumer.releaseId !== identity.release_id ||
    consumer.sourceRevision !== identity.subject_revision ||
    consumer.artifactSetDigest !== identity.artifact_set_digest
  )
    throw new Error("consumer_runtime_receipt_mismatch");
}

function assertCommittedRuntimeFiles(bundle: ConsumerNodeRuntimeBundle): void {
  const bundleRealPath = realpathSync.native(bundle.bundle_path);
  for (const [name, expectedDigest] of Object.entries(bundle.files)) {
    const path = resolve(bundle.bundle_path, name);
    if (!isStrictlyContainedPath(bundleRealPath, realpathSync.native(path)))
      throw new Error("consumer_runtime_identity_mismatch");
    if (digestConsumerRuntimeBytes(readFileSync(path)) !== expectedDigest)
      throw new Error("consumer_runtime_identity_mismatch");
  }
}

function readCommittedRuntimeHistory(bundle: ConsumerNodeRuntimeBundle): {
  readonly bytes: Buffer;
  readonly tipDigest: string;
} {
  const bytes = readFileSync(resolve(bundle.bundle_path, "history.jsonl"));
  const lines = bytes.toString("utf8").split("\n");
  if (lines.at(-1) !== "" || lines.length !== bundle.history_sequence + 2)
    throw new Error("consumer_runtime_identity_mismatch");
  const tip: unknown = JSON.parse(lines.at(-2) ?? "null");
  if (
    !isRecord(tip) ||
    tip.history_sequence !== bundle.history_sequence ||
    typeof tip.record_digest !== "string" ||
    !/^sha256:[a-f0-9]{64}$/.test(tip.record_digest)
  )
    throw new Error("consumer_runtime_identity_mismatch");
  const unsignedTip = { ...tip };
  delete unsignedTip.record_digest;
  if (digestConsumerRuntimeValue(unsignedTip) !== tip.record_digest)
    throw new Error("consumer_runtime_identity_mismatch");
  return { bytes, tipDigest: tip.record_digest };
}

export function readCommittedConsumerRuntimePrior(input: {
  readonly consumerRoot: string;
  readonly runtimeRoot: string;
}): CommittedConsumerRuntimePrior {
  try {
    const pointer = readCommittedRuntimePointer(input.runtimeRoot);
    const bundle = readCommittedRuntimeBundle(input.runtimeRoot, pointer.value);
    assertCommittedRuntimeReceipt(bundle, input.consumerRoot, input.runtimeRoot);
    assertCommittedRuntimeFiles(bundle);
    const history = readCommittedRuntimeHistory(bundle);
    return {
      bundle,
      historyBytes: history.bytes,
      historySequence: bundle.history_sequence,
      historyTipDigest: history.tipDigest,
      priorPointer: {
        bytes: pointer.bytes,
        mode: statSync(pointer.path).mode & 0o777,
        digest: digestConsumerRuntimeBytes(pointer.bytes),
      },
    };
  } catch (error) {
    if (
      error instanceof Error &&
      ["consumer_runtime_receipt_mismatch", "consumer_runtime_identity_mismatch"].some((reason) =>
        error.message.includes(reason),
      )
    )
      throw error;
    throw new Error("consumer_runtime_identity_mismatch");
  }
}

import type { SealedReleaseAggregatePlan } from "./release-aggregate-admission.ts";

export function parseConsumerRuntimeReceipt(input: {
  readonly receiptBytes: Uint8Array;
  readonly tag: string;
  readonly generationId: string;
}): {
  readonly receipt: ReturnType<typeof parseNodeBootstrapReceiptBytes>;
  readonly operationId: string;
} {
  let receipt: ReturnType<typeof parseNodeBootstrapReceiptBytes>;
  try {
    receipt = parseNodeBootstrapReceiptBytes(input.receiptBytes);
  } catch {
    throw new Error("consumer_runtime_node_receipt_invalid");
  }
  const operationId = `packrt-${digestConsumerRuntimeBytes(
    Buffer.from(`${input.tag}\0${input.generationId}`, "utf8"),
  ).slice(7, 31)}`;
  return { receipt, operationId };
}

export function admitConsumerRuntimeIdentity(input: {
  readonly productId: string;
  readonly consumerRoot: string;
  readonly runtimeRoot: string;
  readonly operationId: string;
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly materializerVersion: string;
  readonly generationId: string;
  readonly subjectRevision: string;
  readonly artifactSetDigest: string;
  readonly compiledEsmDigest: string;
  readonly compiledCliDigest: string;
  readonly nodeVersion: string;
  readonly nodeDigest: string;
  readonly packageLockDigest: string;
  readonly sourceGraphDigest: string;
  readonly controlManifestBytes: Uint8Array;
  readonly plan: SealedReleaseAggregatePlan;
}): {
  readonly admission: ConsumerLocalRuntimeAdmission;
  readonly identity: ConsumerNodeRuntimeIdentity;
} {
  const artifactIdentity = {
    materializerVersion: input.materializerVersion,
    releaseId: input.releaseId,
    sourceRevision: input.sourceRevision,
    artifactSetDigest: input.artifactSetDigest,
  };
  const admissionResult = admitConsumerLocalRuntime({
    productId: input.productId,
    consumerRoot: input.consumerRoot,
    runtimeRoot: input.runtimeRoot,
    plan: input.plan,
    manifest: artifactIdentity,
    receipt: {
      ...artifactIdentity,
      productId: input.productId,
      consumerRoot: input.consumerRoot,
      runtimeRoot: input.runtimeRoot,
    },
    controlManifestBytes: input.controlManifestBytes,
  });
  if (!admissionResult.ok)
    throw new Error(`consumer_runtime_release_admission_${admissionResult.error}`);
  return {
    admission: admissionResult.admission,
    identity: {
      product_id: input.productId,
      consumer_root: input.consumerRoot,
      runtime_root: input.runtimeRoot,
      operation_id: input.operationId,
      attempt: 1,
      generation_id: input.generationId,
      subject_revision: input.subjectRevision,
      artifact_digest: `sha256:${input.compiledCliDigest}`,
      node_executable_identity: `node-${input.nodeVersion}|sha256:${input.nodeDigest}`,
      package_lock_digest: `sha256:${input.packageLockDigest}`,
      source_graph_digest: `sha256:${input.sourceGraphDigest}`,
      compiled_esm_digest: input.compiledEsmDigest,
      release_id: input.releaseId,
      materializer_version: input.materializerVersion,
      artifact_set_digest: input.artifactSetDigest,
      control_manifest_digest: admissionResult.admission.controlManifestSnapshotDigest,
      sealed_policy: "compiled-esm-only",
    },
  };
}

export async function completeConsumerRuntimeInstallation(input: {
  readonly consumerRoot: string;
  readonly releaseDirectory: string;
  readonly releaseId: string;
  readonly tag: string;
  readonly expectedConsumerDigest: string;
  readonly executingModulePath: string;
  readonly setup: () => Promise<SetupResult>;
  readonly expectedPin: ConsumerRuntimePin;
}): Promise<ConsumerRuntimeReleaseInstallResult> {
  const setup = await input.setup();
  const runtimeInstall = setup.consumerRuntime?.result;
  if (!runtimeInstall?.ok)
    throw new Error(
      runtimeInstall && !runtimeInstall.ok
        ? runtimeInstall.reason
        : "consumer_runtime_install_failed",
    );
  const commonDir = mainWorktreeCommonDir(input.consumerRoot);
  if (!commonDir) return { status: "installed", setup };
  const cache = cacheConsumerRuntimeRelease({
    commonDir,
    releaseDirectory: input.releaseDirectory,
    releaseId: input.releaseId,
    tag: input.tag,
    expectedConsumerDigest: input.expectedConsumerDigest,
    executingModulePath: input.executingModulePath,
    expectedPin: input.expectedPin,
  });
  if (!cache.cacheWarning) return { status: "installed", setup };
  return {
    status: "installed",
    setup: {
      ...setup,
      notices: [...(setup.notices ?? []), cache.cacheWarning],
    },
  };
}
