import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { deriveReleaseId, deriveReleaseRecordDigest } from "../../src/schema/release-manifest.ts";
import type { ConsumerRuntimeRelease } from "../../src/setup/consumer-runtime-release.ts";
import {
  copyRuntimeUpdateInstallerCase,
  type RuntimeFixture,
  removeRuntimeUpdateFixtureTree,
  runtimeUpdateActivePointer,
  runtimeUpdateRedFixtureData,
  writeRuntimeUpdateAssets,
} from "./consumer-runtime-update-fixture.ts";

function hashHex(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
}

export async function runConsumerRuntimeUpdateRetentionOracle(input: {
  readonly fixture: RuntimeFixture;
  readonly digest: string;
  readonly releaseId: string;
  readonly artifactInventoryDigest: string;
  readonly manifest: { readonly releases: Record<string, Record<string, unknown>> };
  readonly receiptUnsigned: Record<string, unknown> & {
    readonly compiled_cli: Record<string, unknown>;
  };
  readonly copyInstallerCase: (fixture: RuntimeFixture) => {
    readonly root: string;
    readonly releaseDir: string;
    readonly consumerRoot: string;
  };
  readonly installRuntime: (
    fixture: RuntimeFixture,
    options: { readonly consumerRoot: string; readonly fault?: (barrier: string) => void },
  ) => Promise<{ readonly status: "installed" | "already-installed" }>;
  readonly activePointer: (root: string) => {
    readonly path: string;
    readonly bundlePath: string;
    readonly bytes: Buffer;
  };
  readonly writeAssets: (asset: {
    readonly releaseDir: string;
    readonly tag: string;
    readonly compiledBytes: Uint8Array;
    readonly runtime: ConsumerRuntimeRelease;
  }) => string;
  readonly removeFixtureTree: (root: string) => void;
  readonly assertIdempotentReplay?: boolean;
  readonly snapshotTree?: (root: string) => string[];
  readonly beforeUpdate?: (input: {
    readonly consumerRoot: string;
    readonly priorPointer: ReturnType<typeof runtimeUpdateActivePointer>;
    readonly nextFixture: RuntimeFixture;
  }) => void | Promise<void>;
  readonly afterUpdate?: (input: {
    readonly consumerRoot: string;
    readonly priorPointer: ReturnType<typeof runtimeUpdateActivePointer>;
    readonly nextPointer: ReturnType<typeof runtimeUpdateActivePointer>;
    readonly nextFixture: RuntimeFixture;
  }) => void | Promise<void>;
  readonly expectUpdateError?: (
    error: unknown,
    input: {
      readonly consumerRoot: string;
      readonly priorPointer: ReturnType<typeof runtimeUpdateActivePointer>;
    },
  ) => void;
  readonly updateFault?: (barrier: string) => void;
  readonly sameReleaseIdWithDifferentCompiledArtifact?: boolean;
  readonly useWrongUpdateAnchor?: boolean;
}): Promise<void> {
  const testCase = input.copyInstallerCase(input.fixture);
  try {
    expect(
      await input.installRuntime(input.fixture, { consumerRoot: testCase.consumerRoot }),
    ).toMatchObject({ status: "installed" });
    const priorPointer = input.activePointer(testCase.consumerRoot);
    const priorFiles = readdirSync(priorPointer.bundlePath)
      .sort()
      .map((name) => [name, readFileSync(join(priorPointer.bundlePath, name))] as const);

    const nextTag = "v0.2.0-canary.3";
    const nextRelease = join(testCase.root, "next-release");
    mkdirSync(nextRelease);
    const nextCompiledBytes = Buffer.concat([
      input.fixture.compiledBytes,
      Buffer.from("\n// update\n"),
    ]);
    const nextReceiptValue = {
      ...input.receiptUnsigned,
      compiled_cli: { ...input.receiptUnsigned.compiled_cli, sha256: hashHex(nextCompiledBytes) },
    };
    const nextReceipt = Buffer.from(
      JSON.stringify({
        ...nextReceiptValue,
        receipt_digest: createHash("sha256").update(canonical(nextReceiptValue)).digest("hex"),
      }),
    );
    const nextRevision = input.sameReleaseIdWithDifferentCompiledArtifact
      ? input.fixture.runtime.release.source_revision
      : "f".repeat(40);
    const nextReleaseId = input.sameReleaseIdWithDifferentCompiledArtifact
      ? input.releaseId
      : deriveReleaseId("1", nextRevision, input.digest);
    const nextRecord = input.sameReleaseIdWithDifferentCompiledArtifact
      ? input.manifest.releases[input.releaseId]
      : {
          ...input.manifest.releases[input.releaseId],
          artifactSourceCommit: nextRevision,
          releaseRecordDigest: deriveReleaseRecordDigest({
            materializerVersion: "1",
            artifactSourceCommit: nextRevision,
            artifactSetDigest: input.digest,
            artifactInventoryDigest: input.artifactInventoryDigest,
            releaseAssetInventoryDigest: `sha256:${"c".repeat(64)}`,
          }),
        };
    const nextManifest = {
      schema_version: "v2" as const,
      releases: { [nextReleaseId]: nextRecord },
      channels: { canary: nextReleaseId, stable: nextReleaseId },
      channelOrder: ["canary", "stable"],
    };
    const priorAdmission = input.fixture.runtime.admission_input.aggregate_input;
    const nextRuntime: ConsumerRuntimeRelease = {
      ...input.fixture.runtime,
      release: { ...input.fixture.runtime.release, tag: nextTag, source_revision: nextRevision },
      generation: {
        ...input.fixture.runtime.generation,
        subject_revision: nextRevision,
        compiled_esm_digest: `sha256:${hashHex(nextCompiledBytes)}`,
        node_bootstrap_receipt_base64: nextReceipt.toString("base64"),
      },
      admission_input: {
        ...input.fixture.runtime.admission_input,
        control_manifest_base64: Buffer.from(JSON.stringify(nextManifest), "utf8").toString(
          "base64",
        ),
        aggregate_input: {
          ...priorAdmission,
          final_tree: {
            ...priorAdmission.final_tree,
            manifestEntries: [{ path: "release/manifest.yaml", value: nextManifest }],
            channelMappings: priorAdmission.final_tree.channelMappings.map((mapping) => ({
              ...mapping,
              releaseId: nextReleaseId,
              sourceRevision: nextRevision,
            })),
          },
          attestation: {
            ...priorAdmission.attestation,
            releaseId: nextReleaseId,
            artifactSourceCommit: nextRevision,
          },
        },
      },
    };
    const nextAnchor = input.writeAssets({
      releaseDir: nextRelease,
      tag: nextTag,
      compiledBytes: nextCompiledBytes,
      runtime: nextRuntime,
    });
    const nextFixture: RuntimeFixture = {
      ...input.fixture,
      releaseDir: nextRelease,
      tag: nextTag,
      anchor: input.useWrongUpdateAnchor ? `sha256:${"0".repeat(64)}` : nextAnchor,
      runtime: nextRuntime,
    };
    await input.beforeUpdate?.({ consumerRoot: testCase.consumerRoot, priorPointer, nextFixture });
    try {
      const result = await input.installRuntime(nextFixture, {
        consumerRoot: testCase.consumerRoot,
        ...(input.updateFault ? { fault: input.updateFault } : {}),
      });
      if (input.expectUpdateError) throw new Error("expected the runtime update to fail");
      expect(result).toMatchObject({ status: "installed" });
    } catch (error) {
      if (!input.expectUpdateError) throw error;
      input.expectUpdateError(error, { consumerRoot: testCase.consumerRoot, priorPointer });
      return;
    }
    const nextPointer = input.activePointer(testCase.consumerRoot);
    await input.afterUpdate?.({
      consumerRoot: testCase.consumerRoot,
      priorPointer,
      nextPointer,
      nextFixture,
    });
    expect(nextPointer.bytes).not.toEqual(priorPointer.bytes);
    expect(readFileSync(join(nextPointer.bundlePath, "ut-tdd.mjs"))).toEqual(nextCompiledBytes);
    expect(
      readdirSync(priorPointer.bundlePath)
        .sort()
        .map((name) => [name, readFileSync(join(priorPointer.bundlePath, name))]),
    ).toEqual(priorFiles);
    const status = spawnSync(
      process.execPath,
      [join(nextPointer.bundlePath, "ut-tdd.mjs"), "status", "--json"],
      {
        cwd: testCase.consumerRoot,
        encoding: "utf8",
        windowsHide: true,
        env: { ...process.env, CI: "true" },
      },
    );
    expect(status.status, status.stderr).toBe(0);
    if (input.assertIdempotentReplay) {
      const afterUpdate = input.snapshotTree?.(testCase.consumerRoot);
      const replay = await input.installRuntime(nextFixture, {
        consumerRoot: testCase.consumerRoot,
      });
      expect(replay).toMatchObject({ status: "already-installed" });
      expect(input.snapshotTree?.(testCase.consumerRoot)).toEqual(afterUpdate);
    }
  } finally {
    input.removeFixtureTree(testCase.root);
  }
}

export function createRuntimeUpdateOracleRunner(
  getFixture: () => RuntimeFixture,
  installRuntime: Parameters<typeof runConsumerRuntimeUpdateRetentionOracle>[0]["installRuntime"],
): (
  options?: Partial<Parameters<typeof runConsumerRuntimeUpdateRetentionOracle>[0]>,
) => Promise<void> {
  return (options = {}) =>
    runConsumerRuntimeUpdateRetentionOracle({
      fixture: getFixture(),
      ...runtimeUpdateRedFixtureData,
      copyInstallerCase: copyRuntimeUpdateInstallerCase,
      installRuntime,
      activePointer: runtimeUpdateActivePointer,
      writeAssets: writeRuntimeUpdateAssets,
      removeFixtureTree: removeRuntimeUpdateFixtureTree,
      ...options,
    });
}

export function registerLauncherCompatibilityRejectionTests(input: {
  readonly getFixture: () => RuntimeFixture;
  readonly copyInstallerCase: (fixture: RuntimeFixture) => {
    readonly root: string;
    readonly releaseDir: string;
    readonly consumerRoot: string;
  };
  readonly installRuntime: (fixture: RuntimeFixture, consumerRoot: string) => Promise<unknown>;
  readonly activePointer: (root: string) => {
    readonly path: string;
    readonly bundlePath: string;
    readonly bytes: Buffer;
  };
  readonly removeFixtureTree: (root: string) => void;
}): void {
  for (const [title, candidate] of [
    [
      "file set",
      (prior: Record<string, unknown>) => ({
        ...prior,
        files: {
          ...(prior.files as Record<string, unknown>),
          "unexpected-file.json": `sha256:${"0".repeat(64)}`,
        },
      }),
    ],
    [
      "history format",
      (prior: Record<string, unknown>) => ({ ...prior, history_sequence: "not-a-number" }),
    ],
  ] as const) {
    it(`U-RTUPD-008 control: incompatible bundle ${title} is denied by existing validator`, async () => {
      const fixture = input.getFixture();
      const testCase = input.copyInstallerCase(fixture);
      try {
        await input.installRuntime(fixture, testCase.consumerRoot);
        const pointer = input.activePointer(testCase.consumerRoot);
        const prior = JSON.parse(
          readFileSync(join(pointer.bundlePath, "bundle-manifest.json"), "utf8"),
        ) as Record<string, unknown>;
        const validate = Reflect.get(
          await import("../../src/setup/index.ts"),
          "validateConsumerNodeRuntimeBundle",
        ) as ((bundle: unknown) => string | null) | undefined;
        expect(typeof validate).toBe("function");
        expect(validate?.(candidate(prior))).toMatch(/^consumer_runtime_/);
        expect(readFileSync(pointer.path)).toEqual(pointer.bytes);
      } finally {
        input.removeFixtureTree(testCase.root);
      }
    });
  }
}

export function captureRuntimeUpdateRollback(
  pointer: ReturnType<typeof runtimeUpdateActivePointer>,
  tree: string[],
) {
  return {
    bytes: readFileSync(pointer.path),
    mode: statSync(pointer.path, { bigint: true }).mode,
    tree,
  };
}

export function expectRuntimeUpdateRollback(
  pointer: ReturnType<typeof runtimeUpdateActivePointer>,
  before: ReturnType<typeof captureRuntimeUpdateRollback> | undefined,
  tree: string[],
): void {
  expect(before).toBeDefined();
  if (!before) return;
  expect(readFileSync(pointer.path)).toEqual(before.bytes);
  expect(statSync(pointer.path, { bigint: true }).mode).toBe(before.mode);
  expect(tree).toEqual(before.tree);
}

export function createRuntimeUpdateRollbackOracle(snapshotTree: (root: string) => string[]) {
  let before: ReturnType<typeof captureRuntimeUpdateRollback> | undefined;
  return {
    beforeUpdate: ({
      consumerRoot,
      priorPointer,
    }: {
      readonly consumerRoot: string;
      readonly priorPointer: ReturnType<typeof runtimeUpdateActivePointer>;
    }) => {
      before = captureRuntimeUpdateRollback(priorPointer, snapshotTree(consumerRoot));
    },
    assert: (consumerRoot: string, pointer: ReturnType<typeof runtimeUpdateActivePointer>) =>
      expectRuntimeUpdateRollback(pointer, before, snapshotTree(consumerRoot)),
  };
}
