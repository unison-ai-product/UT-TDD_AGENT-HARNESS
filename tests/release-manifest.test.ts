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

describe("release manifest pure domain", () => {
  it("U-RELMAN-001: strict schema rejects invalid field types, unknown versions, and unknown fields", () => {
    for (const raw of [
      null,
      [],
      "manifest",
      { ...manifest(), schema_version: "v2" },
      { ...manifest(), unexpected: true },
      { ...manifest(), releases: [] },
      { ...manifest(), channels: "canary" },
      { ...manifest(), channelOrder: {} },
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
  });

  it("U-RELMAN-009: each independent release identity mutation fails closed", () => {
    const id = releaseId();
    const mutations = [
      {
        releases: { [`${id.slice(0, -1)}0`]: (manifest().releases as Record<string, unknown>)[id] },
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

  it("U-RELMAN-013: resolver only accepts own channels including prototype-named keys", () => {
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
