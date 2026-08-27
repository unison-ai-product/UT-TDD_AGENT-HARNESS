import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;
const GENESIS = "genesis";

export type ConsumerRuntimeDenyReason =
  | "consumer_runtime_absent"
  | "consumer_runtime_identity_mismatch"
  | "consumer_runtime_digest_mismatch"
  | "consumer_runtime_external_path"
  | "consumer_runtime_resolution_denied"
  | "consumer_runtime_permission"
  | "consumer_runtime_indeterminate";

/** The complete identity tuple is deliberately data-only: no source checkout is a valid input. */
export interface ConsumerNodeRuntimeIdentity {
  readonly product_id: string;
  readonly consumer_root: string;
  readonly runtime_root: string;
  readonly operation_id: string;
  readonly attempt: number;
  readonly generation_id: string;
  readonly subject_revision: string;
  readonly artifact_digest: string;
  readonly node_executable_identity: string;
  readonly package_lock_digest: string;
  readonly source_graph_digest: string;
  readonly compiled_esm_digest: string;
  readonly release_id: string;
  readonly materializer_version: string;
  readonly artifact_set_digest: string;
  readonly control_manifest_digest: string;
  readonly sealed_policy: "compiled-esm-only";
}

export interface ConsumerNodeRuntimeBundle {
  readonly identity: ConsumerNodeRuntimeIdentity;
  readonly bundle_digest: string;
  readonly bundle_path: string;
  readonly files: Readonly<Record<string, string>>;
  readonly history_sequence: number;
  readonly prior_bundle_digest: string;
  readonly prior_history_tip_digest: string;
}

export interface ConsumerNodeRuntimeBundleInput {
  readonly identity: ConsumerNodeRuntimeIdentity;
  readonly compiled_esm: Uint8Array;
  readonly node_bootstrap_receipt: Uint8Array;
  readonly marker: Uint8Array;
  readonly consumer_receipt: Uint8Array;
  readonly history: Uint8Array;
  readonly operation_state: Uint8Array;
  readonly prior_bundle_digest?: string;
  readonly prior_history_tip_digest?: string;
  readonly history_sequence?: number;
}

export interface ConsumerNodeRuntimeReadinessInput {
  readonly status: "ready" | "blocked";
  readonly reason?: ConsumerRuntimeDenyReason;
  readonly identity?: ConsumerNodeRuntimeIdentity;
  readonly bundle?: ConsumerNodeRuntimeBundle;
}

export interface ConsumerNodeRuntimePorts {
  readConsumerIdentity: () => void | Promise<void>;
  verifySealedAggregate: () => void | Promise<void>;
  verifyNodeGeneration: () => void | Promise<void>;
  acquireConsumerLock: () => void | Promise<void>;
  snapshotPriorActivePointer: () => void | Promise<void>;
  createPrivateStaging: (path: string) => void | Promise<void>;
  writeGenerationAndReceipt: (
    path: string,
    bundle: ConsumerNodeRuntimeBundle,
  ) => void | Promise<void>;
  fsyncStaging: (path: string) => void | Promise<void>;
  sealActivationBundle: (path: string, bundle: ConsumerNodeRuntimeBundle) => void | Promise<void>;
  atomicRenameActivePointerCAS: (
    bundle: ConsumerNodeRuntimeBundle,
  ) => void | Promise<void>;
  verifyActiveBundle: (bundle: ConsumerNodeRuntimeBundle) => void | Promise<void>;
  reconcileDurableOperation: () =>
    | "committed"
    | "uncommitted"
    | "unknown"
    | "partial"
    | Promise<"committed" | "uncommitted" | "unknown" | "partial">;
  releaseConsumerLock: () => void | Promise<void>;
  destroyPrivateStaging?: (path: string) => void | Promise<void>;
  quarantinePrivateStaging?: (path: string) => void | Promise<void>;
}

export type ConsumerNodeRuntimeInstallResult =
  | { readonly ok: true; readonly status: "committed"; readonly bundle: ConsumerNodeRuntimeBundle }
  | {
      readonly ok: false;
      readonly status: "denied" | "failed" | "indeterminate";
      readonly reason: ConsumerRuntimeDenyReason;
      readonly phase: "admission" | "staging" | "activation" | "reconcile" | "release";
      readonly error?: unknown;
    };

type ConsumerNodeRuntimeInstallPhase = "admission" | "staging" | "activation" | "reconcile" | "release";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

export function digestConsumerRuntimeBytes(bytes: Uint8Array): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function digestConsumerRuntimeValue(value: unknown): string {
  return digestConsumerRuntimeBytes(Buffer.from(canonical(value), "utf8"));
}

function validIdentity(identity: ConsumerNodeRuntimeIdentity): boolean {
  return (
    isRecord(identity) &&
    typeof identity.product_id === "string" &&
    identity.product_id.length > 0 &&
    isAbsolute(identity.consumer_root) &&
    isAbsolute(identity.runtime_root) &&
    within(identity.consumer_root, identity.runtime_root) &&
    typeof identity.operation_id === "string" &&
    /^[A-Za-z0-9._-]+$/.test(identity.operation_id) &&
    Number.isSafeInteger(identity.attempt) &&
    identity.attempt >= 0 &&
    typeof identity.generation_id === "string" &&
    identity.generation_id.length > 0 &&
    REVISION.test(identity.subject_revision) &&
    DIGEST.test(identity.artifact_digest) &&
    typeof identity.node_executable_identity === "string" &&
    identity.node_executable_identity.length > 0 &&
    DIGEST.test(identity.package_lock_digest) &&
    DIGEST.test(identity.source_graph_digest) &&
    DIGEST.test(identity.compiled_esm_digest) &&
    identity.release_id.length > 0 &&
    identity.materializer_version.length > 0 &&
    DIGEST.test(identity.artifact_set_digest) &&
    DIGEST.test(identity.control_manifest_digest) &&
    identity.sealed_policy === "compiled-esm-only"
  );
}

function within(parent: string, child: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(rel);
}

function fileDigestMap(input: ConsumerNodeRuntimeBundleInput): Record<string, string> {
  return {
    "ut-tdd.mjs": digestConsumerRuntimeBytes(input.compiled_esm),
    "node-bootstrap-receipt.json": digestConsumerRuntimeBytes(input.node_bootstrap_receipt),
    "marker.json": digestConsumerRuntimeBytes(input.marker),
    "consumer-receipt.json": digestConsumerRuntimeBytes(input.consumer_receipt),
    "history.jsonl": digestConsumerRuntimeBytes(input.history),
    "operation-state.json": digestConsumerRuntimeBytes(input.operation_state),
  };
}

export function bundlePathFor(identity: ConsumerNodeRuntimeIdentity, bundleDigest: string): string {
  if (!validIdentity(identity) || !DIGEST.test(bundleDigest)) throw new Error("invalid consumer runtime identity");
  return resolve(
    identity.runtime_root,
    "bundles",
    identity.operation_id,
    `attempt-${identity.attempt}-${bundleDigest.slice("sha256:".length)}`,
  );
}

export function stagingPathFor(identity: ConsumerNodeRuntimeIdentity): string {
  if (!validIdentity(identity)) throw new Error("invalid consumer runtime identity");
  return resolve(identity.runtime_root, "staging", identity.operation_id, `attempt-${identity.attempt}`);
}

export function buildConsumerNodeRuntimeBundle(input: ConsumerNodeRuntimeBundleInput): ConsumerNodeRuntimeBundle {
  if (!validIdentity(input.identity)) throw new Error("invalid consumer runtime identity");
  if (digestConsumerRuntimeBytes(input.compiled_esm) !== input.identity.compiled_esm_digest)
    throw new Error("compiled ESM digest mismatch");
  const historySequence = input.history_sequence ?? 0;
  if (!Number.isSafeInteger(historySequence) || historySequence < 0) throw new Error("invalid history sequence");
  const priorBundleDigest = input.prior_bundle_digest ?? GENESIS;
  const priorHistoryTipDigest = input.prior_history_tip_digest ?? GENESIS;
  if (historySequence === 0 && (priorBundleDigest !== GENESIS || priorHistoryTipDigest !== GENESIS))
    throw new Error("invalid genesis history");
  if (historySequence > 0 && (!DIGEST.test(priorBundleDigest) || !DIGEST.test(priorHistoryTipDigest)))
    throw new Error("invalid prior history identity");
  const files = fileDigestMap(input);
  const bundleDigest = digestConsumerRuntimeValue({
    identity: input.identity,
    files,
    history_sequence: historySequence,
    prior_bundle_digest: priorBundleDigest,
    prior_history_tip_digest: priorHistoryTipDigest,
  });
  return Object.freeze({
    identity: Object.freeze({ ...input.identity }),
    bundle_digest: bundleDigest,
    bundle_path: bundlePathFor(input.identity, bundleDigest),
    files: Object.freeze(files),
    history_sequence: historySequence,
    prior_bundle_digest: priorBundleDigest,
    prior_history_tip_digest: priorHistoryTipDigest,
  });
}

export function validateConsumerNodeRuntimeBundle(bundle: ConsumerNodeRuntimeBundle): ConsumerRuntimeDenyReason | null {
  if (!isRecord(bundle) || !validIdentity(bundle.identity)) return "consumer_runtime_identity_mismatch";
  if (!DIGEST.test(bundle.bundle_digest)) return "consumer_runtime_digest_mismatch";
  if (!within(bundle.identity.runtime_root, bundle.bundle_path)) return "consumer_runtime_external_path";
  if (bundle.history_sequence === 0 && (bundle.prior_bundle_digest !== GENESIS || bundle.prior_history_tip_digest !== GENESIS))
    return "consumer_runtime_identity_mismatch";
  if (bundle.history_sequence > 0 && (!DIGEST.test(bundle.prior_bundle_digest) || !DIGEST.test(bundle.prior_history_tip_digest)))
    return "consumer_runtime_identity_mismatch";
  return null;
}

export function renderConsumerNodeWrapper(): string {
  return `import { readFileSync } from "node:fs";\nimport { spawnSync } from "node:child_process";\nimport { dirname, resolve } from "node:path";\nimport { fileURLToPath } from "node:url";\nconst consumerRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");\nconst pointerPath = resolve(consumerRoot, ".ut-tdd", "runtime", "activation", "active.json");\nlet pointer;\ntry { pointer = JSON.parse(readFileSync(pointerPath, "utf8")); } catch { console.error("consumer_runtime_absent"); process.exit(78); }\nif (!pointer || typeof pointer.bundle_path !== "string" || typeof pointer.entry_path !== "string" || pointer.bundle_path !== resolve(pointer.bundle_path) || !pointer.entry_path.startsWith(pointer.bundle_path)) { console.error("consumer_runtime_resolution_denied"); process.exit(78); }\nconst result = spawnSync(process.execPath, [pointer.entry_path, ...process.argv.slice(2)], { cwd: consumerRoot, stdio: "inherit", windowsHide: true });\nif (result.error) { console.error("consumer_runtime_resolution_denied"); process.exit(78); }\nprocess.exit(result.status ?? 1);\n`;
}

export function validateConsumerReadiness(input: ConsumerNodeRuntimeReadinessInput | undefined): { ok: boolean; reason?: ConsumerRuntimeDenyReason } {
  if (!input || input.status !== "ready" || !input.identity || !input.bundle) return { ok: false, reason: input?.reason ?? "consumer_runtime_absent" };
  const bundleReason = validateConsumerNodeRuntimeBundle(input.bundle);
  if (bundleReason) return { ok: false, reason: bundleReason };
  if (digestConsumerRuntimeValue(input.identity) !== digestConsumerRuntimeValue(input.bundle.identity))
    return { ok: false, reason: "consumer_runtime_identity_mismatch" };
  return { ok: true };
}

export async function installConsumerNodeRuntime(input: {
  readonly identity: ConsumerNodeRuntimeIdentity;
  readonly bundle: ConsumerNodeRuntimeBundle;
  readonly ports: ConsumerNodeRuntimePorts;
}): Promise<ConsumerNodeRuntimeInstallResult> {
  const { identity, bundle, ports } = input;
  if (!validIdentity(identity)) return { ok: false, status: "denied", reason: "consumer_runtime_identity_mismatch", phase: "admission" };
  const bundleReason = validateConsumerNodeRuntimeBundle(bundle);
  if (bundleReason || digestConsumerRuntimeValue(identity) !== digestConsumerRuntimeValue(bundle.identity))
    return { ok: false, status: "denied", reason: bundleReason ?? "consumer_runtime_identity_mismatch", phase: "admission" };
  const stage = stagingPathFor(identity);
  let locked = false;
  let committed = false;
  let primaryError: unknown;
  let phase: ConsumerNodeRuntimeInstallPhase = "admission";
  let result: ConsumerNodeRuntimeInstallResult | undefined;
  try {
    await ports.readConsumerIdentity();
    await ports.verifySealedAggregate();
    await ports.verifyNodeGeneration();
    await ports.acquireConsumerLock();
    locked = true;
    phase = "staging";
    await ports.snapshotPriorActivePointer();
    await ports.createPrivateStaging(stage);
    await ports.writeGenerationAndReceipt(stage, bundle);
    await ports.fsyncStaging(stage);
    await ports.sealActivationBundle(stage, bundle);
    await ports.atomicRenameActivePointerCAS(bundle);
    committed = true;
    phase = "activation";
    await ports.verifyActiveBundle(bundle);
    await ports.reconcileDurableOperation();
    result = { ok: true, status: "committed", bundle };
  } catch (error) {
    primaryError = error;
    if (committed) {
      try {
        const state = await ports.reconcileDurableOperation();
        if (state === "committed") result = { ok: false, status: "indeterminate", reason: "consumer_runtime_indeterminate", phase: "reconcile", error };
      } catch (reconcileError) {
        primaryError = { primary: error, reconcile: reconcileError };
      }
      result = { ok: false, status: "indeterminate", reason: "consumer_runtime_indeterminate", phase: "reconcile", error: primaryError };
      // final return is below the finally so a release failure can fail-close success too.
    }
    try {
      if (ports.destroyPrivateStaging) await ports.destroyPrivateStaging(stage);
      else if (ports.quarantinePrivateStaging) await ports.quarantinePrivateStaging(stage);
    } catch (cleanupError) {
      primaryError = { primary: error, cleanup: cleanupError };
      result = { ok: false, status: "indeterminate", reason: "consumer_runtime_indeterminate", phase: "staging", error: primaryError };
      // final return is below the finally so a release failure can fail-close the operation.
    }
    result = { ok: false, status: "failed", reason: "consumer_runtime_permission", phase, error: primaryError };
    // final return is below the finally so cleanup/release errors remain observable.
  } finally {
    if (locked) {
      try {
        await ports.releaseConsumerLock();
      } catch (releaseError) {
        // Never turn a release failure into success. Preserve the primary fault when present.
        result = {
          ok: false,
          status: "indeterminate",
          reason: "consumer_runtime_indeterminate",
          phase: "release",
          error: primaryError ? { primary: primaryError, release: releaseError } : releaseError,
        };
      }
    }
  }
  return result ?? { ok: false, status: "indeterminate", reason: "consumer_runtime_indeterminate", phase, error: primaryError };
}
