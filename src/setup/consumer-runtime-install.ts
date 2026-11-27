import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
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
}): SetupConsumerRuntimeInput {
  return {
    identity: input.identity,
    admission: input.admission,
    compiled_esm: input.compiledEsm,
    node_bootstrap_receipt: input.nodeBootstrapReceipt,
  };
}

export interface CommittedConsumerRuntimePrior {
  readonly bundle: ConsumerNodeRuntimeBundle;
  readonly historyBytes: Uint8Array;
  readonly historySequence: number;
  readonly historyTipDigest: string;
  readonly priorPointer: ConsumerNodeRuntimePriorPointer;
}

export function readCommittedConsumerRuntimePrior(input: {
  readonly consumerRoot: string;
  readonly runtimeRoot: string;
}): CommittedConsumerRuntimePrior {
  try {
    const pointerPath = resolve(input.runtimeRoot, "activation", "active.json");
    const pointerBytes = readFileSync(pointerPath);
    const pointer: unknown = JSON.parse(pointerBytes.toString("utf8"));
    if (
      !isRecord(pointer) ||
      Object.keys(pointer).sort().join("\0") !== "bundle_digest\0bundle_path\0entry_path" ||
      typeof pointer.bundle_digest !== "string" ||
      typeof pointer.bundle_path !== "string" ||
      typeof pointer.entry_path !== "string" ||
      pointer.bundle_path !== resolve(pointer.bundle_path) ||
      pointer.entry_path !== resolve(pointer.entry_path)
    )
      throw new Error("consumer_runtime_identity_mismatch");

    const bundlePath = pointer.bundle_path;
    const runtimeRealPath = realpathSync.native(input.runtimeRoot);
    const bundleRealPath = realpathSync.native(bundlePath);
    const bundleRelativePath = relative(runtimeRealPath, bundleRealPath);
    if (
      bundleRelativePath === "" ||
      bundleRelativePath === ".." ||
      isAbsolute(bundleRelativePath) ||
      bundleRelativePath.startsWith(`..${sep}`)
    )
      throw new Error("consumer_runtime_identity_mismatch");

    const bundle = JSON.parse(
      readFileSync(resolve(bundlePath, "bundle-manifest.json"), "utf8"),
    ) as ConsumerNodeRuntimeBundle;
    if (validateConsumerNodeRuntimeBundle(bundle))
      throw new Error("consumer_runtime_identity_mismatch");
    if (
      pointer.bundle_digest !== bundle.bundle_digest ||
      pointer.bundle_path !== bundle.bundle_path ||
      !sameCanonicalSetupPath(pointer.entry_path, resolve(bundle.bundle_path, "ut-tdd.mjs"))
    )
      throw new Error("consumer_runtime_identity_mismatch");

    const storedReceipt = JSON.parse(
      readFileSync(resolve(bundlePath, "consumer-receipt.json"), "utf8"),
    ) as Record<string, unknown>;
    const rawConsumer = storedReceipt.consumer;
    const storedConsumer =
      rawConsumer && typeof rawConsumer === "object" && !Array.isArray(rawConsumer)
        ? (rawConsumer as Record<string, unknown>)
        : undefined;
    const identity = bundle.identity;
    if (
      !storedConsumer ||
      !sameCanonicalSetupPath(String(storedConsumer.consumerRoot ?? ""), input.consumerRoot) ||
      !sameCanonicalSetupPath(String(storedConsumer.runtimeRoot ?? ""), input.runtimeRoot)
    )
      throw new Error("consumer_runtime_receipt_mismatch");
    if (
      storedReceipt.identity_digest !== digestConsumerRuntimeValue(identity) ||
      storedReceipt.operation_id !== identity.operation_id ||
      !sameCanonicalSetupPath(identity.consumer_root, input.consumerRoot) ||
      !sameCanonicalSetupPath(identity.runtime_root, input.runtimeRoot) ||
      storedConsumer.productId !== identity.product_id ||
      storedConsumer.materializerVersion !== identity.materializer_version ||
      storedConsumer.releaseId !== identity.release_id ||
      storedConsumer.sourceRevision !== identity.subject_revision ||
      storedConsumer.artifactSetDigest !== identity.artifact_set_digest
    )
      throw new Error("consumer_runtime_receipt_mismatch");

    for (const [name, expectedDigest] of Object.entries(bundle.files)) {
      const path = resolve(bundlePath, name);
      const fileRealPath = realpathSync.native(path);
      const relativeFilePath = relative(bundleRealPath, fileRealPath);
      if (
        relativeFilePath === "" ||
        relativeFilePath === ".." ||
        isAbsolute(relativeFilePath) ||
        relativeFilePath.startsWith(`..${sep}`) ||
        digestConsumerRuntimeBytes(readFileSync(path)) !== expectedDigest
      )
        throw new Error("consumer_runtime_identity_mismatch");
    }

    const historyBytes = readFileSync(resolve(bundlePath, "history.jsonl"));
    const historyLines = historyBytes.toString("utf8").split("\n");
    if (historyLines.at(-1) !== "" || historyLines.length !== bundle.history_sequence + 2)
      throw new Error("consumer_runtime_identity_mismatch");
    const historyTip = JSON.parse(historyLines.at(-2) ?? "null") as unknown;
    if (
      !isRecord(historyTip) ||
      historyTip.history_sequence !== bundle.history_sequence ||
      typeof historyTip.record_digest !== "string" ||
      !/^sha256:[a-f0-9]{64}$/.test(historyTip.record_digest)
    )
      throw new Error("consumer_runtime_identity_mismatch");
    const unsignedHistoryTip = { ...historyTip };
    delete unsignedHistoryTip.record_digest;
    if (digestConsumerRuntimeValue(unsignedHistoryTip) !== historyTip.record_digest)
      throw new Error("consumer_runtime_identity_mismatch");

    const priorPointer = {
      bytes: pointerBytes,
      mode: statSync(pointerPath).mode & 0o777,
      digest: digestConsumerRuntimeBytes(pointerBytes),
    };
    return {
      bundle,
      historyBytes,
      historySequence: bundle.history_sequence,
      historyTipDigest: historyTip.record_digest,
      priorPointer,
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
