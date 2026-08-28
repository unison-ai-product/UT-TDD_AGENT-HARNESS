import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve, sep } from "node:path";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const REVISION = /^[a-f0-9]{40}$/;
const RELEASE_ID = /^rel-sha256:[a-f0-9]{64}$/;
const OPERATION_ID = /^[A-Za-z0-9._-]+$/;
const GENESIS = "genesis";

export type ConsumerRuntimeDenyReason =
  | "consumer_runtime_absent"
  | "consumer_runtime_identity_mismatch"
  | "consumer_runtime_digest_mismatch"
  | "consumer_runtime_external_path"
  | "consumer_runtime_resolution_denied"
  | "consumer_runtime_permission"
  | "consumer_runtime_indeterminate";

/** The runtime identity is data-only; no source checkout is a valid input. */
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
  atomicRenameActivePointerCAS: (bundle: ConsumerNodeRuntimeBundle) => void | Promise<void>;
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

type Phase = "admission" | "staging" | "activation" | "reconcile" | "release";
type OperationState = "committed" | "uncommitted" | "unknown" | "partial";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Stable JSON bytes are the only bytes used for identity digests. */
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

function contained(parent: string, child: string): boolean {
  const rel = relative(resolve(parent), resolve(child));
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function validIdentity(value: unknown): value is ConsumerNodeRuntimeIdentity {
  if (!isRecord(value)) return false;
  const id = value as Partial<ConsumerNodeRuntimeIdentity>;
  return (
    typeof id.product_id === "string" &&
    id.product_id.length > 0 &&
    typeof id.consumer_root === "string" &&
    isAbsolute(id.consumer_root) &&
    typeof id.runtime_root === "string" &&
    isAbsolute(id.runtime_root) &&
    contained(id.consumer_root, id.runtime_root) &&
    typeof id.operation_id === "string" &&
    OPERATION_ID.test(id.operation_id) &&
    Number.isSafeInteger(id.attempt) &&
    (id.attempt as number) >= 0 &&
    typeof id.generation_id === "string" &&
    id.generation_id.length > 0 &&
    typeof id.subject_revision === "string" &&
    REVISION.test(id.subject_revision) &&
    typeof id.artifact_digest === "string" &&
    DIGEST.test(id.artifact_digest) &&
    typeof id.node_executable_identity === "string" &&
    /^node-[^|]+\|sha256:[a-f0-9]{64}$/.test(id.node_executable_identity) &&
    typeof id.package_lock_digest === "string" &&
    DIGEST.test(id.package_lock_digest) &&
    typeof id.source_graph_digest === "string" &&
    DIGEST.test(id.source_graph_digest) &&
    typeof id.compiled_esm_digest === "string" &&
    DIGEST.test(id.compiled_esm_digest) &&
    typeof id.release_id === "string" &&
    RELEASE_ID.test(id.release_id) &&
    typeof id.materializer_version === "string" &&
    id.materializer_version.length > 0 &&
    typeof id.artifact_set_digest === "string" &&
    DIGEST.test(id.artifact_set_digest) &&
    typeof id.control_manifest_digest === "string" &&
    DIGEST.test(id.control_manifest_digest) &&
    id.sealed_policy === "compiled-esm-only"
  );
}

function fileDigests(input: ConsumerNodeRuntimeBundleInput): Record<string, string> {
  return {
    "ut-tdd.mjs": digestConsumerRuntimeBytes(input.compiled_esm),
    "node-bootstrap-receipt.json": digestConsumerRuntimeBytes(input.node_bootstrap_receipt),
    "marker.json": digestConsumerRuntimeBytes(input.marker),
    "consumer-receipt.json": digestConsumerRuntimeBytes(input.consumer_receipt),
    "history.jsonl": digestConsumerRuntimeBytes(input.history),
    "operation-state.json": digestConsumerRuntimeBytes(input.operation_state),
  };
}

function assertHistory(sequence: number, priorBundle: string, priorTip: string): void {
  if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error("invalid history sequence");
  if (sequence === 0 && (priorBundle !== GENESIS || priorTip !== GENESIS))
    throw new Error("invalid genesis history");
  if (sequence > 0 && (!DIGEST.test(priorBundle) || !DIGEST.test(priorTip)))
    throw new Error("invalid prior history identity");
}

export function bundlePathFor(identity: ConsumerNodeRuntimeIdentity, bundleDigest: string): string {
  if (!validIdentity(identity) || !DIGEST.test(bundleDigest))
    throw new Error("invalid consumer runtime identity");
  return resolve(
    identity.runtime_root,
    "bundles",
    identity.operation_id,
    `attempt-${identity.attempt}-${bundleDigest.slice(7)}`,
  );
}

export function stagingPathFor(identity: ConsumerNodeRuntimeIdentity): string {
  if (!validIdentity(identity)) throw new Error("invalid consumer runtime identity");
  return resolve(
    identity.runtime_root,
    "staging",
    identity.operation_id,
    `attempt-${identity.attempt}`,
  );
}

export function quarantinePathFor(
  identity: ConsumerNodeRuntimeIdentity,
  bundleDigest: string,
): string {
  if (!validIdentity(identity) || !DIGEST.test(bundleDigest))
    throw new Error("invalid consumer runtime identity");
  return resolve(
    identity.runtime_root,
    "quarantine",
    identity.operation_id,
    `attempt-${identity.attempt}-${bundleDigest.slice(7)}`,
  );
}

export function buildConsumerNodeRuntimeBundle(
  input: ConsumerNodeRuntimeBundleInput,
): ConsumerNodeRuntimeBundle {
  if (!validIdentity(input.identity)) throw new Error("invalid consumer runtime identity");
  if (digestConsumerRuntimeBytes(input.compiled_esm) !== input.identity.compiled_esm_digest)
    throw new Error("compiled ESM digest mismatch");
  const sequence = input.history_sequence ?? 0;
  const priorBundle = input.prior_bundle_digest ?? GENESIS;
  const priorTip = input.prior_history_tip_digest ?? GENESIS;
  assertHistory(sequence, priorBundle, priorTip);
  const files = fileDigests(input);
  const digest = digestConsumerRuntimeValue({
    identity: input.identity,
    files,
    history_sequence: sequence,
    prior_bundle_digest: priorBundle,
    prior_history_tip_digest: priorTip,
  });
  return Object.freeze({
    identity: Object.freeze({ ...input.identity }),
    bundle_digest: digest,
    bundle_path: bundlePathFor(input.identity, digest),
    files: Object.freeze(files),
    history_sequence: sequence,
    prior_bundle_digest: priorBundle,
    prior_history_tip_digest: priorTip,
  });
}

export function validateConsumerNodeRuntimeBundle(
  bundle: unknown,
): ConsumerRuntimeDenyReason | null {
  if (!isRecord(bundle) || !validIdentity(bundle.identity))
    return "consumer_runtime_identity_mismatch";
  if (typeof bundle.bundle_digest !== "string" || !DIGEST.test(bundle.bundle_digest))
    return "consumer_runtime_digest_mismatch";
  if (
    typeof bundle.bundle_path !== "string" ||
    !contained(bundle.identity.runtime_root, bundle.bundle_path)
  )
    return "consumer_runtime_external_path";
  if (
    !isRecord(bundle.files) ||
    Object.keys(bundle.files).sort().join("\0") !==
      [
        "consumer-receipt.json",
        "history.jsonl",
        "marker.json",
        "node-bootstrap-receipt.json",
        "operation-state.json",
        "ut-tdd.mjs",
      ]
        .sort()
        .join("\0") ||
    Object.values(bundle.files).some((value) => typeof value !== "string" || !DIGEST.test(value))
  )
    return "consumer_runtime_digest_mismatch";
  if (bundle.files["ut-tdd.mjs"] !== bundle.identity.compiled_esm_digest)
    return "consumer_runtime_digest_mismatch";
  try {
    assertHistory(
      bundle.history_sequence as number,
      bundle.prior_bundle_digest as string,
      bundle.prior_history_tip_digest as string,
    );
  } catch {
    return "consumer_runtime_identity_mismatch";
  }
  if (bundle.bundle_path !== bundlePathFor(bundle.identity, bundle.bundle_digest as string))
    return "consumer_runtime_external_path";
  const expectedDigest = digestConsumerRuntimeValue({
    identity: bundle.identity,
    files: bundle.files,
    history_sequence: bundle.history_sequence,
    prior_bundle_digest: bundle.prior_bundle_digest,
    prior_history_tip_digest: bundle.prior_history_tip_digest,
  });
  if (bundle.bundle_digest !== expectedDigest) return "consumer_runtime_digest_mismatch";
  return null;
}

export function validateConsumerReadiness(input: ConsumerNodeRuntimeReadinessInput | undefined): {
  ok: boolean;
  reason?: ConsumerRuntimeDenyReason;
} {
  if (!input || input.status !== "ready" || !input.identity || !input.bundle)
    return { ok: false, reason: input?.reason ?? "consumer_runtime_absent" };
  const reason = validateConsumerNodeRuntimeBundle(input.bundle);
  if (reason) return { ok: false, reason };
  if (
    digestConsumerRuntimeValue(input.identity) !== digestConsumerRuntimeValue(input.bundle.identity)
  )
    return { ok: false, reason: "consumer_runtime_identity_mismatch" };
  return { ok: true };
}

/** A generated wrapper has one resolution source: the consumer-local active pointer. */
export function renderConsumerNodeWrapper(): string {
  return `import { readFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const consumerRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pointerPath = resolve(consumerRoot, ".ut-tdd", "runtime", "activation", "active.json");
const deny = (reason) => { console.error(reason); process.exit(78); };
let pointer;
try { pointer = JSON.parse(readFileSync(pointerPath, "utf8")); } catch { deny("consumer_runtime_absent"); }
if (!pointer || typeof pointer.bundle_path !== "string" || typeof pointer.entry_path !== "string" || typeof pointer.bundle_digest !== "string") deny("consumer_runtime_resolution_denied");
if (Object.keys(pointer).sort().join("\\0") !== "bundle_digest\\0bundle_path\\0entry_path") deny("consumer_runtime_resolution_denied");
if (pointer.bundle_path !== resolve(pointer.bundle_path) || pointer.entry_path !== resolve(pointer.entry_path)) deny("consumer_runtime_resolution_denied");
const bundle = resolve(pointer.bundle_path), entry = resolve(pointer.entry_path);
const runtimeRoot = resolve(consumerRoot, ".ut-tdd", "runtime");
const runtimeRel = relative(runtimeRoot, bundle);
const rel = relative(bundle, entry);
if (runtimeRel === "" || runtimeRel === ".." || runtimeRel.startsWith("..") || rel === "" || rel === ".." || rel.startsWith("..")) deny("consumer_runtime_external_path");
let runtimeReal, bundleReal, entryReal;
try { runtimeReal = realpathSync.native(runtimeRoot); bundleReal = realpathSync.native(bundle); entryReal = realpathSync.native(entry); } catch { deny("consumer_runtime_absent"); }
const runtimePhysicalRel = relative(runtimeReal, bundleReal);
if (runtimePhysicalRel === "" || runtimePhysicalRel === ".." || runtimePhysicalRel.startsWith("..")) deny("consumer_runtime_external_path");
const physicalRel = relative(bundleReal, entryReal);
if (physicalRel === "" || physicalRel === ".." || physicalRel.startsWith("..")) deny("consumer_runtime_external_path");
const sha256 = (bytes) => "sha256:" + createHash("sha256").update(bytes).digest("hex");
const canonical = (value) => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? "[" + value.map(canonical).join(",") + "]" : "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
let manifest;
try { manifest = JSON.parse(readFileSync(resolve(bundle, "bundle-manifest.json"), "utf8")); } catch { deny("consumer_runtime_absent"); }
const required = ["consumer-receipt.json", "history.jsonl", "marker.json", "node-bootstrap-receipt.json", "operation-state.json", "ut-tdd.mjs"];
if (!manifest || typeof manifest.bundle_digest !== "string" || manifest.bundle_digest !== pointer.bundle_digest || manifest.bundle_path !== bundle || !manifest.identity || manifest.identity.consumer_root !== consumerRoot || manifest.identity.runtime_root !== runtimeRoot || manifest.identity.sealed_policy !== "compiled-esm-only" || typeof manifest.identity.node_executable_identity !== "string" || !/^node-[^|]+\\|sha256:[a-f0-9]{64}$/.test(manifest.identity.node_executable_identity) || !manifest.files || Object.keys(manifest.files).sort().join("\\0") !== required.slice().sort().join("\\0")) deny("consumer_runtime_identity_mismatch");
if (!Number.isSafeInteger(manifest.history_sequence) || manifest.history_sequence < 0 || (manifest.history_sequence === 0 && (manifest.prior_bundle_digest !== "genesis" || manifest.prior_history_tip_digest !== "genesis")) || (manifest.history_sequence > 0 && (typeof manifest.prior_bundle_digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(manifest.prior_bundle_digest) || typeof manifest.prior_history_tip_digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(manifest.prior_history_tip_digest)))) deny("consumer_runtime_identity_mismatch");
if (sha256(Buffer.from(canonical({ identity: manifest.identity, files: manifest.files, history_sequence: manifest.history_sequence, prior_bundle_digest: manifest.prior_bundle_digest, prior_history_tip_digest: manifest.prior_history_tip_digest }), "utf8")) !== manifest.bundle_digest) deny("consumer_runtime_digest_mismatch");
for (const name of required) { let bytes; try { bytes = readFileSync(resolve(bundle, name)); } catch { deny("consumer_runtime_absent"); } if (sha256(bytes) !== manifest.files[name]) deny("consumer_runtime_digest_mismatch"); }
if (manifest.files["ut-tdd.mjs"] !== manifest.identity.compiled_esm_digest) deny("consumer_runtime_digest_mismatch");
const result = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], { cwd: consumerRoot, stdio: "inherit", windowsHide: true });
if (result.error) deny("consumer_runtime_resolution_denied");
process.exit(result.status ?? 1);
`;
}

function failure(input: {
  status: "denied" | "failed" | "indeterminate";
  reason: ConsumerRuntimeDenyReason;
  phase: Phase;
  error?: unknown;
}): ConsumerNodeRuntimeInstallResult {
  return {
    ok: false,
    status: input.status,
    reason: input.reason,
    phase: input.phase,
    ...(input.error === undefined ? {} : { error: input.error }),
  };
}

function reasonFromError(error: unknown): ConsumerRuntimeDenyReason | undefined {
  const message = error instanceof Error ? error.message : String(error);
  const reasons: ConsumerRuntimeDenyReason[] = [
    "consumer_runtime_absent",
    "consumer_runtime_identity_mismatch",
    "consumer_runtime_digest_mismatch",
    "consumer_runtime_external_path",
    "consumer_runtime_resolution_denied",
    "consumer_runtime_permission",
    "consumer_runtime_indeterminate",
  ];
  return reasons.find((reason) => message.includes(reason));
}

export async function installConsumerNodeRuntime(input: {
  readonly identity: ConsumerNodeRuntimeIdentity;
  readonly bundle: ConsumerNodeRuntimeBundle;
  readonly ports: ConsumerNodeRuntimePorts;
}): Promise<ConsumerNodeRuntimeInstallResult> {
  const { identity, bundle, ports } = input;
  if (!validIdentity(identity))
    return failure({
      status: "denied",
      reason: "consumer_runtime_identity_mismatch",
      phase: "admission",
    });
  const bundleReason = validateConsumerNodeRuntimeBundle(bundle);
  if (
    bundleReason ||
    digestConsumerRuntimeValue(identity) !== digestConsumerRuntimeValue(bundle.identity)
  )
    return failure({
      status: "denied",
      reason: bundleReason ?? "consumer_runtime_identity_mismatch",
      phase: "admission",
    });
  const stage = stagingPathFor(identity);
  let locked = false,
    staged = false,
    committed = false,
    renameStarted = false,
    phase: Phase = "admission";
  let primaryError: unknown;
  let result: ConsumerNodeRuntimeInstallResult | undefined;
  let reconciled = false;
  const reconcileOnce = async (): Promise<OperationState> => {
    if (reconciled) return "unknown";
    reconciled = true;
    return await ports.reconcileDurableOperation();
  };
  try {
    await ports.readConsumerIdentity();
    await ports.verifySealedAggregate();
    await ports.verifyNodeGeneration();
    await ports.acquireConsumerLock();
    locked = true;
    phase = "staging";
    await ports.snapshotPriorActivePointer();
    await ports.createPrivateStaging(stage);
    staged = true;
    await ports.writeGenerationAndReceipt(stage, bundle);
    await ports.fsyncStaging(stage);
    await ports.sealActivationBundle(stage, bundle);
    renameStarted = true;
    await ports.atomicRenameActivePointerCAS(bundle);
    committed = true;
    phase = "activation";
    await ports.verifyActiveBundle(bundle);
    const state = await reconcileOnce();
    if (state !== "committed") {
      result = failure({
        status: "indeterminate",
        reason: "consumer_runtime_indeterminate",
        phase: "reconcile",
      });
    } else {
      result = { ok: true, status: "committed", bundle };
    }
  } catch (error) {
    primaryError = error;
    if (committed || renameStarted) {
      phase = "reconcile";
      try {
        await reconcileOnce();
      } catch (reconcileError) {
        primaryError = { primary: error, reconcile: reconcileError };
      }
      result = failure({
        status: "indeterminate",
        reason: "consumer_runtime_indeterminate",
        phase: "reconcile",
        error: primaryError,
      });
    } else {
      phase = phase === "admission" ? "admission" : "staging";
      if (staged) {
        try {
          if (ports.destroyPrivateStaging) await ports.destroyPrivateStaging(stage);
          else if (ports.quarantinePrivateStaging) await ports.quarantinePrivateStaging(stage);
        } catch (cleanupError) {
          result = failure({
            status: "indeterminate",
            reason: "consumer_runtime_indeterminate",
            phase: "staging",
            error: { primary: error, cleanup: cleanupError },
          });
        }
      }
      result ??= failure({
        status: phase === "admission" ? "denied" : "failed",
        reason:
          phase === "admission"
            ? (reasonFromError(error) ?? "consumer_runtime_identity_mismatch")
            : (reasonFromError(error) ?? "consumer_runtime_permission"),
        phase,
        error: primaryError,
      });
    }
  } finally {
    if (locked) {
      try {
        await ports.releaseConsumerLock();
      } catch (releaseError) {
        result = failure({
          status: "indeterminate",
          reason: "consumer_runtime_indeterminate",
          phase: "release",
          error: primaryError ? { primary: primaryError, release: releaseError } : releaseError,
        });
      }
    }
  }
  return (
    result ??
    failure({
      status: "indeterminate",
      reason: "consumer_runtime_indeterminate",
      phase,
      error: primaryError,
    })
  );
}
