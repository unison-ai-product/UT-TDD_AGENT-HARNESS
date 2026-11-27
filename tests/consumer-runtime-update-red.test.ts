import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { expect, it, vi } from "vitest";
import * as setupApi from "../src/setup/index.ts";
import {
  copyRuntimeUpdateInstallerCase,
  createRuntimeUpdateFixture,
  type RuntimeFixture,
  removeRuntimeUpdateFixtureTree,
  runtimeUpdateActivePointer,
  snapshotRuntimeUpdateTree,
} from "./support/consumer-runtime-update-fixture.ts";
import { runtimePointerIo } from "./support/consumer-runtime-update-fs-spy.ts";
import {
  createRuntimeUpdateOracleRunner,
  createRuntimeUpdateRollbackOracle,
  registerLauncherCompatibilityRejectionTests,
} from "./support/consumer-runtime-update-red-helper.ts";
import { registerConsumerRuntimeUpdateWorktreeOracles } from "./support/consumer-runtime-update-worktree-oracles.ts";
import { describe, heavyAfterAll, heavyBeforeAll } from "./support/hook-bounds.ts";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const { createRuntimeUpdateFsSpy } = await import("./support/consumer-runtime-update-fs-spy.ts");
  return createRuntimeUpdateFsSpy(actual);
});

describe("consumer runtime update Red candidates", () => {
  let fixture: RuntimeFixture;

  heavyBeforeAll("pack", async () => {
    fixture = await createRuntimeUpdateFixture();
  });

  heavyAfterAll("teardown", () => {
    if (fixture) removeRuntimeUpdateFixtureTree(fixture.root);
  });

  const runOracle = createRuntimeUpdateOracleRunner(
    () => fixture,
    (releaseFixture, installOptions) =>
      setupApi.installConsumerRuntimeRelease({
        releaseDirectory: releaseFixture.releaseDir,
        expectedConsumerDigest: releaseFixture.anchor,
        consumerRoot: installOptions.consumerRoot,
        tag: releaseFixture.tag,
        executingModulePath: join(
          releaseFixture.releaseDir,
          setupApi.releaseArtifactFileNames(releaseFixture.tag).compiledEsm,
        ),
        runtimeOnly: true,
        ...(installOptions.fault ? { fault: installOptions.fault } : {}),
      }),
  );

  it("U-RTUPD-001: updates main runtime and retains prior generation", async () => {
    await runOracle();
  });

  it("U-RTUPD-009: replaying the updated Release is write-zero", async () => {
    await runOracle({ assertIdempotentReplay: true, snapshotTree: snapshotRuntimeUpdateTree });
  });

  it("U-RTUPD-003: actual active pointer EPERM is attempted once", async () => {
    let treeBefore = [] as string[];
    let priorMode: bigint | number | undefined;
    try {
      await runOracle({
        beforeUpdate: ({ consumerRoot, priorPointer }) => {
          runtimePointerIo.enabled = true;
          runtimePointerIo.failRenameWithEperm = true;
          runtimePointerIo.failPointerModeRestore = false;
          runtimePointerIo.renameEpermRaised = false;
          runtimePointerIo.pointerRenameCompleted = false;
          runtimePointerIo.activePointerPath = priorPointer.path;
          runtimePointerIo.renameCalls = [];
          runtimePointerIo.tempWrites = [];
          runtimePointerIo.directWrites = [];
          runtimePointerIo.pointerDeletes = [];
          runtimePointerIo.observations = [];
          treeBefore = snapshotRuntimeUpdateTree(consumerRoot);
          priorMode = statSync(priorPointer.path, { bigint: true }).mode;
        },
        expectUpdateError: (error, { consumerRoot, priorPointer }) => {
          expect(error).toBeDefined();
          expect(runtimePointerIo.renameCalls).toHaveLength(1);
          expect(runtimePointerIo.directWrites).toEqual([]);
          expect(runtimePointerIo.pointerDeletes).toEqual([]);
          expect(runtimePointerIo.observations.length).toBeGreaterThanOrEqual(2);
          expect(new Set(runtimePointerIo.observations)).toEqual(
            new Set([priorPointer.bytes.toString("utf8")]),
          );
          const rename = runtimePointerIo.renameCalls[0];
          if (!rename) throw new Error("expected one active pointer rename");
          expect(rename.destination).toBe(priorPointer.path.replaceAll("\\", "/"));
          expect(readFileSync(priorPointer.path)).toEqual(priorPointer.bytes);
          expect(statSync(priorPointer.path, { bigint: true }).mode).toBe(priorMode);
          expect(
            readdirSync(dirname(priorPointer.path)).filter((name) =>
              /^\.active-.*\.tmp$/.test(name),
            ),
          ).toEqual([]);
          expect(snapshotRuntimeUpdateTree(consumerRoot)).toEqual(treeBefore);
        },
      });
    } finally {
      runtimePointerIo.enabled = false;
      runtimePointerIo.failRenameWithEperm = false;
      runtimePointerIo.failPointerModeRestore = false;
      runtimePointerIo.renameEpermRaised = false;
      runtimePointerIo.pointerRenameCompleted = false;
      runtimePointerIo.activePointerPath = "";
    }
  });

  it("U-RTUPD-010: active pointer is published by one atomic rename", async () => {
    try {
      await runOracle({
        beforeUpdate: ({ priorPointer }) => {
          runtimePointerIo.enabled = true;
          runtimePointerIo.failRenameWithEperm = false;
          runtimePointerIo.failPointerFsync = false;
          runtimePointerIo.pointerRenameCompleted = false;
          runtimePointerIo.activePointerPath = priorPointer.path;
          runtimePointerIo.renameCalls = [];
          runtimePointerIo.tempWrites = [];
          runtimePointerIo.directWrites = [];
          runtimePointerIo.observations = [];
        },
        afterUpdate: ({ priorPointer, nextPointer }) => {
          expect(runtimePointerIo.directWrites).toEqual([]);
          expect(runtimePointerIo.tempWrites).toHaveLength(1);
          expect(runtimePointerIo.renameCalls).toHaveLength(1);
          const rename = runtimePointerIo.renameCalls[0];
          if (!rename) throw new Error("expected one active pointer rename");
          expect(rename.destination).toBe(priorPointer.path.replaceAll("\\", "/"));
          expect(dirname(rename.source)).toBe(dirname(rename.destination));
          expect(rename.source).toMatch(/\/\.active-[^/]+\.tmp$/);
          expect(rename.before).toBe(priorPointer.bytes.toString("utf8"));
          expect(rename.after).toBe(nextPointer.bytes.toString("utf8"));
          expect(runtimePointerIo.observations).toContain(rename.before);
          expect(runtimePointerIo.observations).toContain(rename.after);
          for (const observation of runtimePointerIo.observations) {
            const pointer = JSON.parse(observation) as Record<string, unknown>;
            expect(Object.keys(pointer).sort()).toEqual([
              "bundle_digest",
              "bundle_path",
              "entry_path",
            ]);
            expect([rename.before, rename.after]).toContain(observation);
          }
        },
      });
    } finally {
      runtimePointerIo.enabled = false;
      runtimePointerIo.failRenameWithEperm = false;
      runtimePointerIo.failPointerFsync = false;
      runtimePointerIo.pointerRenameCompleted = false;
      runtimePointerIo.activePointerPath = "";
    }
  });

  const windowsRestoreTest = process.platform === "win32" ? it : it.skip;
  windowsRestoreTest("U-RTUPD-003: pointer mode restore failure is indeterminate", async () => {
    try {
      await runOracle({
        beforeUpdate: ({ priorPointer }) => {
          runtimePointerIo.enabled = true;
          runtimePointerIo.failRenameWithEperm = true;
          runtimePointerIo.failPointerModeRestore = true;
          runtimePointerIo.renameEpermRaised = false;
          runtimePointerIo.restorePointerMode = Number(statSync(priorPointer.path).mode & 0o777);
          runtimePointerIo.activePointerPath = priorPointer.path;
          runtimePointerIo.renameCalls = [];
          runtimePointerIo.directWrites = [];
          runtimePointerIo.pointerDeletes = [];
          runtimePointerIo.observations = [];
        },
        expectUpdateError: (error, { priorPointer }) => {
          expect(String(error)).toContain("consumer_runtime_indeterminate");
          expect(runtimePointerIo.renameCalls).toHaveLength(1);
          expect(readFileSync(priorPointer.path)).toEqual(priorPointer.bytes);
          expect(runtimePointerIo.directWrites).toEqual([]);
          expect(runtimePointerIo.pointerDeletes).toEqual([]);
          expect(runtimePointerIo.observations.length).toBeGreaterThanOrEqual(2);
          expect(new Set(runtimePointerIo.observations)).toEqual(
            new Set([priorPointer.bytes.toString("utf8")]),
          );
        },
      });
    } finally {
      runtimePointerIo.enabled = false;
      runtimePointerIo.failRenameWithEperm = false;
      runtimePointerIo.failPointerModeRestore = false;
      runtimePointerIo.renameEpermRaised = false;
      runtimePointerIo.activePointerPath = "";
    }
  });

  it("U-RTUPD-003: post-publication fsync failure does not roll back", async () => {
    try {
      await runOracle({
        beforeUpdate: ({ priorPointer }) => {
          runtimePointerIo.enabled = true;
          runtimePointerIo.failPointerFsync = true;
          runtimePointerIo.pointerRenameCompleted = false;
          runtimePointerIo.activePointerPath = priorPointer.path;
          runtimePointerIo.renameCalls = [];
          runtimePointerIo.directWrites = [];
          runtimePointerIo.pointerDeletes = [];
          runtimePointerIo.observations = [];
        },
        expectUpdateError: (error, { priorPointer }) => {
          expect(String(error)).toContain("consumer_runtime_indeterminate");
          expect(runtimePointerIo.renameCalls).toHaveLength(1);
          expect(runtimePointerIo.failPointerFsync).toBe(false);
          expect(readFileSync(priorPointer.path)).not.toEqual(priorPointer.bytes);
          expect(runtimePointerIo.directWrites).toEqual([]);
          expect(runtimePointerIo.pointerDeletes).toEqual([]);
          const [rename] = runtimePointerIo.renameCalls;
          if (!rename) throw new Error("expected one active pointer rename");
          expect(new Set(runtimePointerIo.observations)).toEqual(
            new Set([priorPointer.bytes.toString("utf8"), rename.after]),
          );
          const published = JSON.parse(readFileSync(priorPointer.path, "utf8")) as {
            bundle_path: string;
          };
          expect(published.bundle_path).not.toBe(
            (JSON.parse(priorPointer.bytes.toString("utf8")) as { bundle_path: string })
              .bundle_path,
          );
          expect(existsSync(published.bundle_path)).toBe(true);
        },
      });
    } finally {
      runtimePointerIo.enabled = false;
      runtimePointerIo.failPointerFsync = false;
      runtimePointerIo.pointerRenameCompleted = false;
      runtimePointerIo.activePointerPath = "";
    }
  });

  it.each([
    {
      name: "pre-publication failure restores the consumer tree",
      barrier: "atomicRenameActivePointerCAS",
      message: "injected before active pointer rename",
    },
    {
      name: "staging failure removes the uncommitted generation",
      barrier: "writeGenerationAndReceipt",
      message: "injected generation materialization failure",
    },
  ])("U-RTUPD-002: $name", async ({ barrier, message }) => {
    const rollback = createRuntimeUpdateRollbackOracle(snapshotRuntimeUpdateTree);
    let injected = false;
    try {
      await runOracle({
        beforeUpdate: ({ consumerRoot, priorPointer }) => {
          rollback.beforeUpdate({ consumerRoot, priorPointer });
          runtimePointerIo.enabled = true;
          runtimePointerIo.activePointerPath = priorPointer.path;
          runtimePointerIo.directWrites = [];
          runtimePointerIo.pointerDeletes = [];
          runtimePointerIo.observations = [];
        },
        updateFault: (point) => {
          if (point === barrier) {
            readFileSync(runtimePointerIo.activePointerPath);
            injected = true;
            throw new Error(message);
          }
        },
        expectUpdateError: (error, { consumerRoot, priorPointer }) => {
          expect(injected).toBe(true);
          expect(String(error)).toContain(message);
          rollback.assert(consumerRoot, priorPointer);
          expect(runtimePointerIo.directWrites).toEqual([]);
          expect(runtimePointerIo.pointerDeletes).toEqual([]);
          expect(runtimePointerIo.observations.length).toBeGreaterThanOrEqual(2);
          expect(new Set(runtimePointerIo.observations)).toEqual(
            new Set([priorPointer.bytes.toString("utf8")]),
          );
        },
      });
    } finally {
      runtimePointerIo.enabled = false;
      runtimePointerIo.activePointerPath = "";
    }
  });

  it("U-RTUPD-002: wrong external anchor denies before writing", async () => {
    const rollback = createRuntimeUpdateRollbackOracle(snapshotRuntimeUpdateTree);
    await runOracle({
      useWrongUpdateAnchor: true,
      beforeUpdate: rollback.beforeUpdate,
      expectUpdateError: (error, { consumerRoot, priorPointer }) => {
        expect(String(error)).toContain("consumer_runtime_anchor_mismatch");
        rollback.assert(consumerRoot, priorPointer);
      },
    });
  });

  it("U-RTUPD-002: changed compiled byte is denied with a valid anchor", async () => {
    const rollback = createRuntimeUpdateRollbackOracle(snapshotRuntimeUpdateTree);
    await runOracle({
      beforeUpdate: ({ consumerRoot, priorPointer, nextFixture }) => {
        rollback.beforeUpdate({ consumerRoot, priorPointer });
        const asset = join(
          nextFixture.releaseDir,
          setupApi.releaseArtifactFileNames(nextFixture.tag).compiledEsm,
        );
        const bytes = readFileSync(asset);
        bytes.writeUInt8(bytes.readUInt8(0) ^ 1, 0);
        writeFileSync(asset, bytes);
      },
      expectUpdateError: (error, { consumerRoot, priorPointer }) => {
        expect(String(error)).toContain("consumer_runtime_digest_mismatch");
        rollback.assert(consumerRoot, priorPointer);
      },
    });
  });

  it("U-RTUPD-004: same release ID with changed artifact is denied", async () => {
    let treeBefore = [] as string[];
    await runOracle({
      sameReleaseIdWithDifferentCompiledArtifact: true,
      beforeUpdate: ({ consumerRoot }) => {
        treeBefore = snapshotRuntimeUpdateTree(consumerRoot);
      },
      expectUpdateError: (error, { consumerRoot, priorPointer }) => {
        expect(String(error)).toContain("generation_receipt_mismatch");
        expect(readFileSync(priorPointer.path)).toEqual(priorPointer.bytes);
        expect(snapshotRuntimeUpdateTree(consumerRoot)).toEqual(treeBefore);
      },
    });
  });

  registerConsumerRuntimeUpdateWorktreeOracles({ getFixture: () => fixture, runOracle });

  it("U-RTUPD-007: operation ID and history bind B to A", async () => {
    await runOracle({
      afterUpdate: ({ priorPointer, nextPointer, nextFixture }) => {
        const priorManifest = JSON.parse(
          readFileSync(join(priorPointer.bundlePath, "bundle-manifest.json"), "utf8"),
        ) as {
          bundle_digest: string;
          history_sequence: number;
          identity: { operation_id: string };
        };
        const nextManifest = JSON.parse(
          readFileSync(join(nextPointer.bundlePath, "bundle-manifest.json"), "utf8"),
        ) as {
          bundle_digest: string;
          history_sequence: number;
          prior_bundle_digest: string;
          prior_history_tip_digest: string;
          identity: { operation_id: string; generation_id: string };
        };
        const priorHistory = readFileSync(join(priorPointer.bundlePath, "history.jsonl"), "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line) as { record_digest: string });
        const expectedOperationId = `packrt-${createHash("sha256")
          .update(`${nextFixture.tag}\0${nextFixture.runtime.generation.generation_id}`)
          .digest("hex")
          .slice(0, 24)}`;
        expect(nextManifest.identity.operation_id).toBe(expectedOperationId);
        expect(nextManifest.identity.operation_id).not.toBe(priorManifest.identity.operation_id);
        expect(nextManifest.prior_bundle_digest).toBe(priorManifest.bundle_digest);
        expect(nextManifest.prior_history_tip_digest).toBe(priorHistory.at(-1)?.record_digest);
        expect(nextManifest.history_sequence).toBe(priorManifest.history_sequence + 1);
      },
    });
  });

  it("U-RTUPD-008: compatible updates retain launcher and seven-file bundle shape", async () => {
    let priorLauncher: Buffer = Buffer.alloc(0);
    await runOracle({
      beforeUpdate: ({ consumerRoot }) => {
        priorLauncher = readFileSync(join(consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs"));
      },
      afterUpdate: ({ consumerRoot, nextPointer }) => {
        expect(readFileSync(join(consumerRoot, ".ut-tdd", "bin", "ut-tdd.mjs"))).toEqual(
          priorLauncher,
        );
        expect(readdirSync(nextPointer.bundlePath).sort()).toEqual([
          "bundle-manifest.json",
          "consumer-receipt.json",
          "history.jsonl",
          "marker.json",
          "node-bootstrap-receipt.json",
          "operation-state.json",
          "ut-tdd.mjs",
        ]);
        const history = readFileSync(join(nextPointer.bundlePath, "history.jsonl"), "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line) as Record<string, unknown>);
        expect(history.length).toBeGreaterThan(0);
        expect(history.every((record) => Number.isSafeInteger(record.history_sequence))).toBe(true);
        expect(
          history.every((record) => /^sha256:[a-f0-9]{64}$/.test(String(record.record_digest))),
        ).toBe(true);
      },
    });
  });

  registerLauncherCompatibilityRejectionTests({
    getFixture: () => fixture,
    copyInstallerCase: copyRuntimeUpdateInstallerCase,
    installRuntime: (releaseFixture, consumerRoot) =>
      setupApi.installConsumerRuntimeRelease({
        releaseDirectory: releaseFixture.releaseDir,
        expectedConsumerDigest: releaseFixture.anchor,
        consumerRoot,
        tag: releaseFixture.tag,
        executingModulePath: join(
          releaseFixture.releaseDir,
          setupApi.releaseArtifactFileNames(releaseFixture.tag).compiledEsm,
        ),
        runtimeOnly: true,
      }),
    activePointer: runtimeUpdateActivePointer,
    removeFixtureTree: removeRuntimeUpdateFixtureTree,
  });

  it("U-RTUPD-011: failed bundle cleanup is indeterminate", async () => {
    let treeBefore = [] as string[];
    let priorBundleFiles: Array<readonly [string, Buffer]> = [];
    let priorMode = 0n;
    try {
      await runOracle({
        beforeUpdate: ({ consumerRoot, priorPointer }) => {
          runtimePointerIo.enabled = true;
          runtimePointerIo.failRenameWithEperm = true;
          runtimePointerIo.failBundleCleanup = true;
          runtimePointerIo.activePointerPath = priorPointer.path;
          runtimePointerIo.priorBundlePath = priorPointer.bundlePath;
          runtimePointerIo.renameCalls = [];
          runtimePointerIo.cleanupCalls = [];
          priorMode = statSync(priorPointer.path, { bigint: true }).mode;
          treeBefore = snapshotRuntimeUpdateTree(consumerRoot);
          priorBundleFiles = readdirSync(priorPointer.bundlePath)
            .sort()
            .map((name) => [name, readFileSync(join(priorPointer.bundlePath, name))] as const);
        },
        expectUpdateError: (error, { consumerRoot, priorPointer }) => {
          expect(String(error)).toContain("consumer_runtime_indeterminate");
          expect(runtimePointerIo.renameCalls).toHaveLength(1);
          expect(runtimePointerIo.cleanupCalls.length).toBeGreaterThan(0);
          const cleanupPath = runtimePointerIo.cleanupCalls[0];
          if (!cleanupPath) throw new Error("expected a bundle cleanup attempt");
          expect(existsSync(cleanupPath)).toBe(true);
          expect(readFileSync(priorPointer.path)).toEqual(priorPointer.bytes);
          expect(statSync(priorPointer.path, { bigint: true }).mode).toBe(priorMode);
          expect(
            readdirSync(priorPointer.bundlePath)
              .sort()
              .map((name) => [name, readFileSync(join(priorPointer.bundlePath, name))]),
          ).toEqual(priorBundleFiles);
          expect(snapshotRuntimeUpdateTree(consumerRoot)).not.toEqual(treeBefore);
        },
      });
    } finally {
      runtimePointerIo.enabled = false;
      runtimePointerIo.failRenameWithEperm = false;
      runtimePointerIo.failBundleCleanup = false;
      runtimePointerIo.activePointerPath = "";
      runtimePointerIo.priorBundlePath = "";
    }
  });
});
