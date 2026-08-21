import { createHash } from "node:crypto";
import { z } from "zod";

const SHA256_DIGEST = /^sha256:([a-f0-9]{64})$/;
const RELEASE_ID = /^rel-sha256:([a-f0-9]{64})$/;
const SOURCE_COMMIT = /^[a-f0-9]{40}$/;

const releaseRecordSchema = z
  .object({
    materializerVersion: z.string().min(1),
    artifactSourceCommit: z.string().regex(SOURCE_COMMIT),
    artifactSetDigest: z.string().regex(SHA256_DIGEST),
  })
  .strict();

const releaseIdSchema = z.string().regex(RELEASE_ID);
const channelNameSchema = z.string().min(1);

export interface ReleaseIdentity {
  readonly releaseId: string;
  readonly materializerVersion: string;
  readonly artifactSourceCommit: string;
  readonly artifactSetDigest: string;
}

export interface ReleaseManifest {
  readonly schemaVersion: "v1";
  readonly releases: Readonly<Record<string, ReleaseIdentity>>;
  readonly channels: Readonly<Record<string, string>>;
  readonly channelOrder: readonly string[];
}

export type ReleaseManifestParseResult =
  | { readonly ok: true; readonly value: ReleaseManifest }
  | { readonly ok: false; readonly error: "invalid_manifest" };

export type ReleaseChannelResolution =
  | { readonly ok: true; readonly release: ReleaseIdentity }
  | { readonly ok: false; readonly error: "unknown_channel" };

export function deriveReleaseId(
  materializerVersion: string,
  artifactSourceCommit: string,
  artifactSetDigest: string,
): string {
  const artifactDigest = Buffer.from(artifactSetDigest.slice("sha256:".length), "hex");
  const payload = Buffer.concat([
    Buffer.from(materializerVersion, "ascii"),
    Buffer.from([0]),
    Buffer.from(artifactSourceCommit, "ascii"),
    Buffer.from([0]),
    artifactDigest,
  ]);
  return `rel-sha256:${createHash("sha256").update(payload).digest("hex")}`;
}

function hasCompleteChannelOrder(
  channels: Record<string, string>,
  channelOrder: string[],
): boolean {
  const channelNames = Object.keys(channels);
  if (channelNames.length !== channelOrder.length) return false;
  const orderedNames = new Set(channelOrder);
  return (
    orderedNames.size === channelOrder.length &&
    channelNames.every((name) => orderedNames.has(name))
  );
}

interface RawReleaseManifest {
  readonly releases: Record<string, z.infer<typeof releaseRecordSchema>>;
  readonly channels: Record<string, string>;
  readonly channelOrder: string[];
}

function isOwnRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(record);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(record, key));
}

function parseRawManifest(input: unknown): RawReleaseManifest | null {
  if (
    !isOwnRecord(input) ||
    !hasExactKeys(input, ["schema_version", "releases", "channels", "channelOrder"])
  )
    return null;
  if (input.schema_version !== "v1" || !isOwnRecord(input.releases) || !isOwnRecord(input.channels))
    return null;
  if (!Array.isArray(input.channelOrder)) return null;
  const releases = Object.create(null) as Record<string, z.infer<typeof releaseRecordSchema>>;
  for (const [releaseId, record] of Object.entries(input.releases)) {
    const parsedRecord = releaseRecordSchema.safeParse(record);
    if (!releaseIdSchema.safeParse(releaseId).success || !parsedRecord.success) return null;
    releases[releaseId] = parsedRecord.data;
  }
  const channels = Object.create(null) as Record<string, string>;
  for (const [channel, releaseId] of Object.entries(input.channels)) {
    if (
      !channelNameSchema.safeParse(channel).success ||
      typeof releaseId !== "string" ||
      !releaseIdSchema.safeParse(releaseId).success
    )
      return null;
    channels[channel] = releaseId;
  }
  if (!input.channelOrder.every((channel) => channelNameSchema.safeParse(channel).success))
    return null;
  return { releases, channels, channelOrder: input.channelOrder };
}

function createImmutableManifest(raw: RawReleaseManifest): ReleaseManifest | null {
  if (!hasCompleteChannelOrder(raw.channels, raw.channelOrder)) return null;
  const releases: Record<string, ReleaseIdentity> = {};
  for (const [releaseId, record] of Object.entries(raw.releases)) {
    if (
      deriveReleaseId(
        record.materializerVersion,
        record.artifactSourceCommit,
        record.artifactSetDigest,
      ) !== releaseId
    )
      return null;
    releases[releaseId] = Object.freeze({ releaseId, ...record });
  }
  for (const releaseId of Object.values(raw.channels)) {
    if (!Object.hasOwn(releases, releaseId)) return null;
  }
  return Object.freeze({
    schemaVersion: "v1" as const,
    releases: Object.freeze(releases),
    channels: Object.freeze(Object.assign(Object.create(null), raw.channels)),
    channelOrder: Object.freeze([...raw.channelOrder]),
  });
}

export function parseReleaseManifest(input: unknown): ReleaseManifestParseResult {
  const raw = parseRawManifest(input);
  if (!raw) return { ok: false, error: "invalid_manifest" };
  const manifest = createImmutableManifest(raw);
  return manifest ? { ok: true, value: manifest } : { ok: false, error: "invalid_manifest" };
}

export function resolveReleaseChannel(
  manifest: ReleaseManifest,
  channel: string,
): ReleaseChannelResolution {
  if (!Object.hasOwn(manifest.channels, channel)) return { ok: false, error: "unknown_channel" };
  const releaseId = manifest.channels[channel];
  const release = manifest.releases[releaseId];
  return release ? { ok: true, release } : { ok: false, error: "unknown_channel" };
}
