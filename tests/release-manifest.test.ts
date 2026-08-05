import { describe, expect, it } from "vitest";
import {
  deriveReleaseId,
  parseReleaseManifest,
  resolveReleaseChannel,
} from "../src/schema/release-manifest";

const commit = "0123456789abcdef0123456789abcdef01234567";
const digest = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const releaseId = deriveReleaseId({
  materializerVersion: "pack-v1",
  artifactSourceCommit: commit,
  artifactSetDigest: digest,
});

function manifestYaml(extraChannels = ""): string {
  return [
    "schemaVersion: 1",
    "releases:",
    `  ${releaseId}:`,
    "    materializerVersion: pack-v1",
    `    artifactSourceCommit: ${commit}`,
    `    artifactSetDigest: ${digest}`,
    "channels:",
    `  canary: ${releaseId}`,
    extraChannels,
  ]
    .filter(Boolean)
    .join("\n");
}

describe("release manifest domain", () => {
  it("U-RELMAN-001: schemaVersion・必須 field・未知 field が不正なら fail-close する", () => {
    const missing = parseReleaseManifest(manifestYaml().replace("artifactSetDigest", "missingDigest"));
    expect(missing.ok).toBe(false);

    const unknownVersion = parseReleaseManifest(manifestYaml().replace("schemaVersion: 1", "schemaVersion: 2"));
    expect(unknownVersion.ok).toBe(false);

    const unknownField = parseReleaseManifest(manifestYaml().replace("materializerVersion: pack-v1", "materializerVersion: pack-v1\n    extra: no"));
    expect(unknownField.ok).toBe(false);
  });

  it("U-RELMAN-002: 未知 channel は unknown_channel で解決を止める", () => {
    const parsed = parseReleaseManifest(manifestYaml());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(resolveReleaseChannel(parsed.manifest, "stable")).toEqual({
      ok: false,
      code: "unknown_channel",
    });
  });

  it("U-RELMAN-007: 順序を仮定せず任意名の channel pointer を受理する", () => {
    const parsed = parseReleaseManifest(manifestYaml(`  beta: ${releaseId}`));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(resolveReleaseChannel(parsed.manifest, "beta")).toEqual({
      ok: true,
      release: expect.objectContaining({ releaseId, artifactSourceCommit: commit }),
    });
  });

  it("U-RELMAN-009: record と map key の release identity は導出式と一致しなければならない", () => {
    const badRecord = parseReleaseManifest(manifestYaml().replace(commit, `${commit.slice(0, -1)}8`));
    expect(badRecord.ok).toBe(false);

    const badKey = parseReleaseManifest(manifestYaml().replace(releaseId, `${releaseId.slice(0, -1)}8`));
    expect(badKey.ok).toBe(false);
  });
});
