import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseReleaseManifest, resolveReleaseChannel } from "../src/schema/release-manifest.ts";

const commit = "a".repeat(40);
const artifactDigest = `sha256:${"b".repeat(64)}`;

function releaseId(materializerVersion = "v1"): string {
  const digest = Buffer.from(artifactDigest.slice("sha256:".length), "hex");
  const payload = Buffer.concat([
    Buffer.from(materializerVersion, "ascii"),
    Buffer.from([0]),
    Buffer.from(commit, "ascii"),
    Buffer.from([0]),
    digest,
  ]);
  return `rel-sha256:${createHash("sha256").update(payload).digest("hex")}`;
}

function manifest(): Record<string, unknown> {
  const id = releaseId();
  return {
    schema_version: "v1",
    releases: {
      [id]: {
        materializerVersion: "v1",
        artifactSourceCommit: commit,
        artifactSetDigest: artifactDigest,
      },
    },
    channels: { canary: id, stable: id },
    channelOrder: ["canary", "stable"],
  };
}

function releaseRecord(): Record<string, string> {
  return (manifest().releases as Record<string, Record<string, string>>)[releaseId()];
}

function mutatedHex(value: string): string {
  const last = value.at(-1);
  return `${value.slice(0, -1)}${last === "0" ? "1" : "0"}`;
}

describe("release manifest pure domain", () => {
  it("U-RELMAN-001: strict schema rejects missing fields, invalid types, formats, and unknown fields", () => {
    for (const raw of [
      null,
      [],
      "manifest",
      { ...manifest(), schema_version: "v2" },
      { ...manifest(), unexpected: true },
      { ...manifest(), releases: { [releaseId()]: { ...releaseRecord(), unexpected: true } } },
      { ...manifest(), releases: undefined },
      { ...manifest(), channelOrder: undefined },
      { ...manifest(), schema_version: { version: "v1" } },
      { ...manifest(), schema_version: [] },
      { ...manifest(), schema_version: 1 },
      { ...manifest(), schema_version: null },
      { ...manifest(), releases: { invalid: releaseRecord() } },
      { ...manifest(), releases: [] },
      { ...manifest(), releases: "releases" },
      { ...manifest(), releases: 1 },
      { ...manifest(), releases: null },
      { ...manifest(), channels: { "": releaseId() } },
      { ...manifest(), channels: [] },
      { ...manifest(), channels: "channels" },
      { ...manifest(), channels: 1 },
      { ...manifest(), channels: null },
      { ...manifest(), channelOrder: { order: [] } },
      { ...manifest(), channelOrder: [""] },
      { ...manifest(), channelOrder: "channelOrder" },
      { ...manifest(), channelOrder: 1 },
      { ...manifest(), channelOrder: null },
      { ...manifest(), schema_version: "V1" },
      {
        ...manifest(),
        releases: {
          [releaseId()]: { ...releaseRecord(), artifactSourceCommit: "A".repeat(40) },
        },
      },
      {
        ...manifest(),
        releases: {
          [releaseId()]: { ...releaseRecord(), artifactSourceCommit: "a".repeat(39) },
        },
      },
      {
        ...manifest(),
        releases: {
          [releaseId()]: { ...releaseRecord(), artifactSetDigest: "sha256:" },
        },
      },
      {
        ...manifest(),
        releases: {
          [`rel-sha256:${"A".repeat(64)}`]: releaseRecord(),
        },
      },
    ]) {
      expect(parseReleaseManifest(raw)).toEqual({ ok: false, error: "invalid_manifest" });
    }
  });

  it("U-RELMAN-002: unknown channel returns unknown_channel without a release", () => {
    const parsed = parseReleaseManifest(manifest());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(resolveReleaseChannel(parsed.value, "preview")).toEqual({
      ok: false,
      error: "unknown_channel",
    });
  });

  it("U-RELMAN-007: custom channels require a complete, unique own-key channelOrder", () => {
    const valid = manifest();
    const id = releaseId();
    (valid.channels as Record<string, string>).preview = id;
    valid.channelOrder = ["canary", "preview", "stable"];
    expect(parseReleaseManifest(valid).ok).toBe(true);

    const missingOrder = manifest();
    (missingOrder.channels as Record<string, string>).preview = id;
    delete missingOrder.channelOrder;
    expect(parseReleaseManifest(missingOrder)).toEqual({
      ok: false,
      error: "invalid_manifest",
    });

    for (const order of [
      ["canary", "stable"],
      ["canary", "preview", "preview", "stable"],
      ["canary", "preview", "stable", "other"],
    ]) {
      const invalid = manifest();
      (invalid.channels as Record<string, string>).preview = id;
      invalid.channelOrder = order;
      expect(parseReleaseManifest(invalid)).toEqual({ ok: false, error: "invalid_manifest" });
    }

    const duplicateAtMatchingLength = manifest();
    (duplicateAtMatchingLength.channels as Record<string, string>).preview = id;
    duplicateAtMatchingLength.channelOrder = ["canary", "preview", "preview"];
    expect(parseReleaseManifest(duplicateAtMatchingLength)).toEqual({
      ok: false,
      error: "invalid_manifest",
    });

    const unknownReleaseReference = manifest();
    (unknownReleaseReference.channels as Record<string, string>).preview = releaseId("v2");
    unknownReleaseReference.channelOrder = ["canary", "stable", "preview"];
    expect(parseReleaseManifest(unknownReleaseReference)).toEqual({
      ok: false,
      error: "invalid_manifest",
    });
  });

  it("U-RELMAN-009: each independent release identity mutation fails closed", () => {
    const id = releaseId();
    const mutatedId = mutatedHex(id);
    const mutations = [
      {
        releases: { [mutatedId]: (manifest().releases as Record<string, unknown>)[id] },
        channels: { canary: mutatedId, stable: mutatedId },
      },
      {
        releases: {
          [id]: {
            materializerVersion: "v1",
            artifactSourceCommit: `c${commit.slice(1)}`,
            artifactSetDigest: artifactDigest,
          },
        },
      },
      {
        releases: {
          [id]: {
            materializerVersion: "v1",
            artifactSourceCommit: commit,
            artifactSetDigest: `sha256:c${"b".repeat(63)}`,
          },
        },
      },
    ];
    for (const mutation of mutations) {
      expect(parseReleaseManifest({ ...manifest(), ...mutation })).toEqual({
        ok: false,
        error: "invalid_manifest",
      });
    }
  });

  it("U-RELMAN-013: resolver pins unknown_channel and only accepts frozen own channels", () => {
    const parsed = parseReleaseManifest(manifest());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    for (const channel of ["toString", "constructor", "__proto__"]) {
      expect(resolveReleaseChannel(parsed.value, channel)).toEqual({
        ok: false,
        error: "unknown_channel",
      });
    }
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.releases)).toBe(true);
    expect(Object.isFrozen(parsed.value.channels)).toBe(true);
    expect(Object.isFrozen(parsed.value.channelOrder)).toBe(true);

    const withOwnPrototypeNames = manifest();
    const ownChannels = Object.create(null) as Record<string, string>;
    Object.assign(ownChannels, withOwnPrototypeNames.channels);
    for (const channel of ["toString", "constructor", "__proto__"]) {
      Object.defineProperty(ownChannels, channel, {
        value: releaseId(),
        enumerable: true,
      });
    }
    withOwnPrototypeNames.channels = ownChannels;
    withOwnPrototypeNames.channelOrder = [
      "canary",
      "stable",
      "toString",
      "constructor",
      "__proto__",
    ];
    const ownParsed = parseReleaseManifest(withOwnPrototypeNames);
    expect(ownParsed.ok).toBe(true);
    if (!ownParsed.ok) return;
    for (const channel of ["toString", "constructor", "__proto__"]) {
      expect(resolveReleaseChannel(ownParsed.value, channel)).toMatchObject({ ok: true });
    }
  });
});
