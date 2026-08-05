import { createHash } from "node:crypto";
import { parse } from "yaml";
import { z } from "zod";

const commitSchema = z.string().regex(/^[a-f0-9]{40}$/, "artifactSourceCommit must be a lowercase SHA-1");
const digestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/, "artifactSetDigest must be sha256:<lowercase hex>");
const releaseIdSchema = z.string().regex(/^rel-sha256:[a-f0-9]{64}$/, "invalid releaseId");
const materializerVersionSchema = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/, "invalid materializerVersion");

const releaseRecordInputSchema = z
  .object({
    materializerVersion: materializerVersionSchema,
    artifactSourceCommit: commitSchema,
    artifactSetDigest: digestSchema,
  })
  .strict();

const manifestInputSchema = z
  .object({
    schemaVersion: z.literal(1),
    releases: z.record(releaseIdSchema, releaseRecordInputSchema),
    channels: z.record(z.string().min(1), releaseIdSchema),
  })
  .strict();

export interface ReleaseRecord extends z.infer<typeof releaseRecordInputSchema> {
  releaseId: string;
}

export interface ReleaseManifest {
  schemaVersion: 1;
  releases: Record<string, ReleaseRecord>;
  channels: Record<string, string>;
}

export type ReleaseManifestParseResult =
  | { ok: true; manifest: ReleaseManifest }
  | { ok: false; errors: string[] };

export function deriveReleaseId(input: z.infer<typeof releaseRecordInputSchema>): string {
  const digestBytes = Buffer.from(input.artifactSetDigest.slice("sha256:".length), "hex");
  const payload = Buffer.concat([
    Buffer.from(input.materializerVersion, "ascii"),
    Buffer.from([0]),
    Buffer.from(input.artifactSourceCommit, "ascii"),
    Buffer.from([0]),
    digestBytes,
  ]);
  return `rel-sha256:${createHash("sha256").update(payload).digest("hex")}`;
}

/** S2のcontrol-plane parser。I/Oを持たず、materializerやGit object解決より先に不変条件を閉じる。 */
export function parseReleaseManifest(source: string): ReleaseManifestParseResult {
  let raw: unknown;
  try {
    raw = parse(source);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)] };
  }
  const parsed = manifestInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  }

  const releases: Record<string, ReleaseRecord> = {};
  const errors: string[] = [];
  for (const [releaseId, record] of Object.entries(parsed.data.releases)) {
    const derived = deriveReleaseId(record);
    if (releaseId !== derived) {
      errors.push(`releases.${releaseId}: releaseId does not match immutable record`);
      continue;
    }
    releases[releaseId] = { releaseId, ...record };
  }
  for (const [channel, releaseId] of Object.entries(parsed.data.channels)) {
    if (!(releaseId in releases)) errors.push(`channels.${channel}: referenced release is absent`);
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: { schemaVersion: 1, releases, channels: parsed.data.channels } };
}

export type ReleaseChannelResolution =
  | { ok: true; release: ReleaseRecord }
  | { ok: false; code: "unknown_channel" };

export function resolveReleaseChannel(
  manifest: ReleaseManifest,
  channel: string,
): ReleaseChannelResolution {
  const releaseId = manifest.channels[channel];
  if (!releaseId) return { ok: false, code: "unknown_channel" };
  return { ok: true, release: manifest.releases[releaseId]! };
}
