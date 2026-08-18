import {
  parseReleaseManifest,
  type ReleaseIdentity,
  resolveReleaseChannel,
} from "../schema/release-manifest.ts";
import type {
  ReleaseChannelAdapterInput,
  ReleaseChannelAttestation,
} from "./release-channel-adapter.ts";
import type { MaterializedReleaseEntry } from "./release-materializer.ts";

const CONTROL_MANIFEST = "release/manifest.yaml";
const REVISION = /^[a-f0-9]{40}$/;

export interface ReleaseManifestTreeEntry {
  readonly path: string;
  readonly value: unknown;
}

export interface ReleaseChannelMapping {
  readonly channel: string;
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly sourcePath: string;
  readonly destinationPath: string;
}

export interface ReleaseAggregateFinalTree {
  readonly manifestEntries: readonly ReleaseManifestTreeEntry[];
  readonly sourcePaths: readonly string[];
  readonly cleanPackAllowlist: readonly string[];
  readonly channelMappings: readonly ReleaseChannelMapping[];
}

export interface ReleaseAggregateAdmissionInput {
  readonly repository: string;
  readonly channel: string;
  readonly finalTree: ReleaseAggregateFinalTree;
}

export type ReleaseAggregateFinding =
  | "invalid_manifest"
  | "unknown_channel"
  | "invalid_allowlist"
  | "missing_channel_mapping"
  | "unavailable"
  | "mismatch"
  | "invalid_distribution_plan"
  | "invalid_artifact";

export interface ReleaseAggregateAdmissionDependencies {
  readonly attestChannel: (
    input: ReleaseChannelAdapterInput,
  ) => ReleaseChannelAttestation | Promise<ReleaseChannelAttestation>;
}

export interface SealedReleaseAggregatePlan {
  readonly kind: "release-aggregate";
  readonly channel: string;
  readonly releaseId: string;
  readonly sourceRevision: string;
  readonly destinationPath: string;
  readonly expectedDigest: string;
  readonly actualDigest: string;
  readonly entries: readonly MaterializedReleaseEntry[];
}

export type ReleaseAggregateAdmissionResult =
  | { readonly ok: true; readonly plan: SealedReleaseAggregatePlan }
  | {
      readonly ok: false;
      readonly phase: "preflight" | "resolve";
      readonly error: ReleaseAggregateFinding;
    };

export interface ReleaseAggregateApplyDependencies<TStage> {
  readonly snapshotDestination: () =>
    | readonly MaterializedReleaseEntry[]
    | Promise<readonly MaterializedReleaseEntry[]>;
  readonly writeStaging: (plan: SealedReleaseAggregatePlan) => TStage | Promise<TStage>;
  readonly applyDestination: (
    stage: TStage,
    plan: SealedReleaseAggregatePlan,
  ) => void | Promise<void>;
  readonly discardStaging: (stage: TStage) => void | Promise<void>;
  readonly restoreDestination: (
    snapshot: readonly MaterializedReleaseEntry[],
  ) => void | Promise<void>;
}

export type ReleaseAggregateApplyResult =
  | { readonly ok: true; readonly applied: 1 }
  | { readonly ok: false; readonly error: "unavailable"; readonly applied: 0 };

function validRelativePath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.includes("\0") &&
    !path.split("/").some((part) => part.length === 0 || part === "." || part === "..")
  );
}

function firstManifestEntry(
  entries: readonly ReleaseManifestTreeEntry[],
): ReleaseManifestTreeEntry | null {
  const candidates = entries.filter((entry) => entry.path === CONTROL_MANIFEST);
  return candidates.length === 1 ? candidates[0] : null;
}

function selectedMapping(
  mappings: readonly ReleaseChannelMapping[],
  channel: string,
  release: ReleaseIdentity,
  sourcePaths: readonly string[],
  allowlist: ReadonlySet<string>,
): ReleaseChannelMapping | null {
  const candidates = mappings.filter((mapping) => mapping.channel === channel);
  if (candidates.length !== 1) return null;
  const mapping = candidates[0];
  if (
    mapping.releaseId !== release.releaseId ||
    mapping.sourceRevision !== release.artifactSourceCommit ||
    !REVISION.test(mapping.sourceRevision) ||
    !validRelativePath(mapping.sourcePath) ||
    !validRelativePath(mapping.destinationPath) ||
    !sourcePaths.includes(mapping.sourcePath) ||
    !allowlist.has(mapping.destinationPath)
  )
    return null;
  return mapping;
}

function immutableEntry(entry: MaterializedReleaseEntry): MaterializedReleaseEntry {
  const snapshot = new Uint8Array(entry.content);
  return Object.freeze({
    path: entry.path,
    mode: entry.mode,
    get content(): Uint8Array {
      return new Uint8Array(snapshot);
    },
  });
}

function immutableSnapshot(
  entries: readonly MaterializedReleaseEntry[],
): readonly MaterializedReleaseEntry[] {
  return Object.freeze(entries.map(immutableEntry));
}

function sealPlan(
  input: ReleaseAggregateAdmissionInput,
  release: ReleaseIdentity,
  mapping: ReleaseChannelMapping,
  attestation: Extract<ReleaseChannelAttestation, { status: "attested" }>,
): SealedReleaseAggregatePlan {
  return Object.freeze({
    kind: "release-aggregate" as const,
    channel: input.channel,
    releaseId: release.releaseId,
    sourceRevision: release.artifactSourceCommit,
    destinationPath: mapping.destinationPath,
    expectedDigest: attestation.expectedDigest,
    actualDigest: attestation.actualDigest,
    entries: immutableSnapshot(attestation.entries),
  });
}

export async function admitReleaseAggregate(
  input: ReleaseAggregateAdmissionInput,
  dependencies: ReleaseAggregateAdmissionDependencies,
): Promise<ReleaseAggregateAdmissionResult> {
  const manifestEntry = firstManifestEntry(input.finalTree.manifestEntries);
  if (!manifestEntry) return { ok: false, phase: "preflight", error: "invalid_manifest" };

  const manifest = parseReleaseManifest(manifestEntry.value);
  if (!manifest.ok) return { ok: false, phase: "preflight", error: manifest.error };

  const allowlist = new Set(input.finalTree.cleanPackAllowlist);
  if (
    allowlist.size !== input.finalTree.cleanPackAllowlist.length ||
    !allowlist.has(CONTROL_MANIFEST)
  )
    return { ok: false, phase: "preflight", error: "invalid_allowlist" };

  const selected = resolveReleaseChannel(manifest.value, input.channel);
  if (!selected.ok) return { ok: false, phase: "preflight", error: selected.error };
  const mapping = selectedMapping(
    input.finalTree.channelMappings,
    input.channel,
    selected.release,
    input.finalTree.sourcePaths,
    allowlist,
  );
  if (!mapping) return { ok: false, phase: "preflight", error: "missing_channel_mapping" };

  let attestation: ReleaseChannelAttestation;
  try {
    attestation = await dependencies.attestChannel({
      repository: input.repository,
      manifest: manifest.value,
      channel: input.channel,
    });
  } catch {
    return { ok: false, phase: "resolve", error: "unavailable" };
  }
  if (attestation.status !== "attested") {
    return {
      ok: false,
      phase: "resolve",
      error: attestation.status === "mismatch" ? "mismatch" : attestation.reason,
    };
  }
  return { ok: true, plan: sealPlan(input, selected.release, mapping, attestation) };
}

export async function applySealedReleaseAggregate<TStage>(
  plan: SealedReleaseAggregatePlan,
  dependencies: ReleaseAggregateApplyDependencies<TStage>,
): Promise<ReleaseAggregateApplyResult> {
  let snapshot: readonly MaterializedReleaseEntry[] | undefined;
  let stage: TStage | undefined;
  let discarded = false;
  try {
    snapshot = immutableSnapshot(await dependencies.snapshotDestination());
    stage = await dependencies.writeStaging(plan);
    await dependencies.applyDestination(stage, plan);
    await dependencies.discardStaging(stage);
    discarded = true;
    return { ok: true, applied: 1 };
  } catch {
    if (stage !== undefined && !discarded) {
      try {
        await dependencies.discardStaging(stage);
      } catch {
        // The destination restore below remains the authoritative rollback.
      }
    }
    if (snapshot !== undefined) {
      try {
        await dependencies.restoreDestination(snapshot);
      } catch {
        // The operation is still fail-closed; callers must not treat it as applied.
      }
    }
    return { ok: false, error: "unavailable", applied: 0 };
  }
}
