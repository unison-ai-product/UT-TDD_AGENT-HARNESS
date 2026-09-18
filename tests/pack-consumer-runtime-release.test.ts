import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertProducerPathsOutsideHome } from "../src/cli/distribution.ts";
import {
  deriveArtifactInventoryDigest,
  deriveReleaseId,
  deriveReleaseRecordDigest,
} from "../src/schema/release-manifest.ts";
import {
  type ConsumerRuntimeRelease,
  ConsumerRuntimeReleaseValidationError,
  validateConsumerRuntimeRelease,
} from "../src/setup/consumer-runtime-release.ts";
import {
  digestConsumerRuntimeBytes,
  digestMaterializedReleaseEntries,
  releaseArtifactFileNames,
} from "../src/setup/index.ts";

const revision = "a".repeat(40);
const digest = digestMaterializedReleaseEntries([
  { path: "src/entry.ts", mode: "100644", content: Buffer.from("a", "utf8") },
]);
const compiledDigest = `sha256:${"b".repeat(64)}`;
const releaseId = deriveReleaseId("1", revision, digest);
const publicationArtifacts = [
  {
    sourcePath: "releases/canary/entry.ts",
    destinationPath: "src/entry.ts",
    mode: "100644" as const,
    size: 1,
    contentDigest: digestConsumerRuntimeBytes(Buffer.from("a", "utf8")),
  },
];
const artifactInventoryDigest = deriveArtifactInventoryDigest(publicationArtifacts);
const releaseRecordDigest = deriveReleaseRecordDigest({
  materializerVersion: "1",
  artifactSourceCommit: revision,
  artifactSetDigest: digest,
  artifactInventoryDigest,
  releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
});
const manifest = {
  schema_version: "v2" as const,
  releases: {
    [releaseId]: {
      materializerVersion: "1",
      artifactSourceCommit: revision,
      artifactSetDigest: digest,
      artifactInventoryDigest,
      releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
      releaseRecordDigest,
      artifacts: publicationArtifacts,
    },
  },
  channels: { canary: releaseId, stable: releaseId },
  channelOrder: ["canary", "stable"],
};

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
};

const receiptUnsigned = {
  schema_version: 2,
  generation_id: "node-fixture",
  subject_revision: revision,
  runtime: "node",
  node: { path: "C:/toolchain/node.exe", version: "v24.13.0", sha256: "c".repeat(64) },
  npm: { cli_path: "C:/toolchain/npm-cli.js", version: "11.6.2", sha256: "d".repeat(64) },
  toolchain_provenance_sha256: "e".repeat(64),
  package_lock_sha256: "f".repeat(64),
  tsconfig_node: { path: "tsconfig.node.json", sha256: "0".repeat(64) },
  builder: { path: "scripts/build-node.mjs", policy: "compiled-esm-only", sha256: "1".repeat(64) },
  compiled_cli: { path: "ut-tdd.mjs", sha256: "b".repeat(64), local_version: "0.0.0" },
  source_graph_sha256: "3".repeat(64),
  source_files: [],
  external_dependencies: [],
  external_dependency_closure_sha256: "4".repeat(64),
};
const receipt = Buffer.from(
  JSON.stringify({
    ...receiptUnsigned,
    receipt_digest: createHash("sha256").update(canonical(receiptUnsigned)).digest("hex"),
  }),
);

function validDocument(): ConsumerRuntimeRelease {
  return {
    schema_version: "ut-tdd.consumer-runtime.v1",
    release: {
      tag: "v0.2.0-canary.2",
      source_revision: revision,
      materializer_version: "1",
      product_id: "ut-tdd",
    },
    generation: {
      generation_id: "node-fixture",
      subject_revision: revision,
      artifact_digest: digest,
      compiled_esm_digest: compiledDigest,
      node_bootstrap_receipt_base64: receipt.toString("base64"),
    },
    admission_input: {
      aggregate_input: {
        repository: "fixture/pack",
        channel: "canary",
        final_tree: {
          manifestEntries: [{ path: "release/manifest.yaml", value: manifest }],
          sourcePaths: ["releases/canary/entry.ts"],
          cleanPackAllowlist: ["release/manifest.yaml", "src/entry.ts"],
          channelMappings: [
            {
              channel: "canary",
              releaseId,
              sourceRevision: revision,
              sourcePath: "releases/canary/entry.ts",
              destinationPath: "src/entry.ts",
            },
          ],
        },
        attestation: {
          status: "attested",
          releaseId,
          artifactSourceCommit: revision,
          expectedDigest: digest,
          actualDigest: digest,
          entries: [{ path: "src/entry.ts", mode: "100644", content_base64: "YQ==" }],
        },
      },
      control_manifest_base64: Buffer.from(JSON.stringify(manifest), "utf8").toString("base64"),
    },
  };
}

describe("Pack consumer runtime release producer contract", () => {
  it("U-PACKRT-001: names the exact five release assets and excludes manifest.json", () => {
    expect(releaseArtifactFileNames("v0.2.0-canary.2")).toEqual({
      tarball: "v0.2.0-canary.2.tar.gz",
      checksum: "v0.2.0-canary.2.tar.gz.sha256",
      compiledEsm: "v0.2.0-canary.2.ut-tdd.mjs",
      consumerRuntime: "v0.2.0-canary.2.consumer-runtime.json",
      consumerChecksum: "v0.2.0-canary.2.consumer.sha256",
    });
    expect(Object.values(releaseArtifactFileNames("v0.2.0-canary.2"))).not.toContain(
      "v0.2.0-canary.2.manifest.json",
    );
  });

  it("U-PACKRT-002: rejects missing, unknown, and wrong-typed schema fields", () => {
    const document = validDocument() as unknown as Record<string, unknown>;
    expect(() => validateConsumerRuntimeRelease({ ...document, unexpected: true })).toThrow(
      ConsumerRuntimeReleaseValidationError,
    );
    expect(() =>
      validateConsumerRuntimeRelease({
        ...document,
        release: { ...(document.release as object), product_id: 42 },
      }),
    ).toThrow(ConsumerRuntimeReleaseValidationError);
    expect(() =>
      validateConsumerRuntimeRelease({
        ...document,
        generation: { ...(document.generation as object), generation_id: undefined },
      }),
    ).toThrow(ConsumerRuntimeReleaseValidationError);
  });

  it("U-PACKRT-003: validates the sealed receipt as part of the schema boundary", () => {
    expect(validateConsumerRuntimeRelease(validDocument())).toMatchObject({
      schema_version: "ut-tdd.consumer-runtime.v1",
    });
    const mutated = validDocument();
    const value = JSON.parse(
      Buffer.from(mutated.generation.node_bootstrap_receipt_base64, "base64").toString("utf8"),
    );
    value.generation_id = "node-other";
    const invalid = {
      ...mutated,
      generation: {
        ...mutated.generation,
        node_bootstrap_receipt_base64: Buffer.from(JSON.stringify(value)).toString("base64"),
      },
    };
    expect(() => validateConsumerRuntimeRelease(invalid)).toThrow(
      ConsumerRuntimeReleaseValidationError,
    );
  });

  it("U-PACKRT-004: accepts the schema without any producer workspace path field", () => {
    expect(validateConsumerRuntimeRelease(validDocument()).release.product_id).toBe("ut-tdd");
  });

  it("U-PACKRT-003: injects the home directory for producer path fail-close checks", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-home-"));
    const outside = mkdtempSync(join(tmpdir(), "ut-tdd-packrt-outside-"));
    try {
      expect(() =>
        assertProducerPathsOutsideHome({
          repoRoot: root,
          receipt: {
            node: { path: join(outside, "node.exe") },
            npm: { cli_path: join(outside, "npm-cli.js") },
          },
          homeDirectory: root,
        }),
      ).toThrow("user-home scoped");
      expect(() =>
        assertProducerPathsOutsideHome({
          repoRoot: outside,
          receipt: {
            node: { path: join(root, "node.exe") },
            npm: { cli_path: join(outside, "npm-cli.js") },
          },
          homeDirectory: root,
        }),
      ).toThrow("user-home scoped");
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
