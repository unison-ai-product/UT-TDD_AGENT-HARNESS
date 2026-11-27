import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { expect, it } from "vitest";
import * as setupApi from "../../src/setup/index.ts";
import type { RuntimeFixture } from "./consumer-runtime-update-fixture.ts";
import {
  runtimeUpdateActivePointer,
  snapshotRuntimeUpdateTree,
} from "./consumer-runtime-update-fixture.ts";
import type { createRuntimeUpdateOracleRunner } from "./consumer-runtime-update-red-helper.ts";

type RunOracle = ReturnType<typeof createRuntimeUpdateOracleRunner>;

export function registerConsumerRuntimeUpdateWorktreeOracles(input: {
  readonly getFixture: () => RuntimeFixture;
  readonly runOracle: RunOracle;
}): void {
  it.fails("CANDIDATE-U-RTUPD-005: worktree remains pinned to A and refuses B replacement", async () => {
    const fixture = input.getFixture();
    let worktreeRoot = "";
    let absentWorktreeRoot = "";
    let worktreeBefore: string[] = [];
    let absentWorktreeBefore: string[] = [];
    await input.runOracle({
      beforeUpdate: async ({ consumerRoot }) => {
        worktreeRoot = join(dirname(consumerRoot), "linked-worktree");
        execFileSync("git", ["worktree", "add", "--quiet", worktreeRoot, "HEAD"], {
          cwd: consumerRoot,
        });
        absentWorktreeRoot = join(dirname(consumerRoot), "linked-worktree-runtime-absent");
        execFileSync("git", ["worktree", "add", "--quiet", absentWorktreeRoot, "HEAD"], {
          cwd: consumerRoot,
        });
        await setupApi.setupConsumerWorktreeRuntime({
          currentRoot: consumerRoot,
          worktreePath: worktreeRoot,
          releaseDirectory: fixture.releaseDir,
          expectedConsumerDigest: fixture.anchor,
        });
        worktreeBefore = snapshotRuntimeUpdateTree(worktreeRoot);
        absentWorktreeBefore = snapshotRuntimeUpdateTree(absentWorktreeRoot);
      },
      afterUpdate: async ({ consumerRoot, nextFixture, priorPointer }) => {
        const compiledAsset = join(
          nextFixture.releaseDir,
          setupApi.releaseArtifactFileNames(nextFixture.tag).compiledEsm,
        );
        for (const cwd of [worktreeRoot, absentWorktreeRoot]) {
          const before = snapshotRuntimeUpdateTree(cwd);
          const launch = spawnSync(
            process.execPath,
            [
              compiledAsset,
              "setup",
              "--solo",
              "--consumer-runtime-release",
              nextFixture.releaseDir,
              "--expected-consumer-digest",
              nextFixture.anchor,
            ],
            {
              cwd,
              encoding: "utf8",
              windowsHide: true,
              env: { ...process.env, CI: "true" },
            },
          );
          expect.soft(launch.status, `${launch.stdout}\n${launch.stderr}`).toBe(1);
          expect.soft(launch.stderr).toContain("worktree_entry_options_invalid");
          expect.soft(snapshotRuntimeUpdateTree(cwd)).toEqual(before);
          if (cwd === absentWorktreeRoot)
            expect.soft(existsSync(join(cwd, ".ut-tdd", "runtime"))).toBe(false);
        }
        expect(snapshotRuntimeUpdateTree(worktreeRoot)).toEqual(worktreeBefore);
        expect(snapshotRuntimeUpdateTree(absentWorktreeRoot)).toEqual(absentWorktreeBefore);

        const mainPointerBeforeAttempt = runtimeUpdateActivePointer(consumerRoot).bytes;
        const commonDir = resolve(
          consumerRoot,
          execFileSync("git", ["rev-parse", "--git-common-dir"], {
            cwd: consumerRoot,
            encoding: "utf8",
          }).trim(),
        );
        const cacheRoot = join(commonDir, "ut-tdd", "runtime-cache");
        const cacheBefore = existsSync(cacheRoot) ? snapshotRuntimeUpdateTree(cacheRoot) : [];
        await expect(
          setupApi.setupConsumerWorktreeRuntime({
            currentRoot: consumerRoot,
            worktreePath: worktreeRoot,
            releaseDirectory: nextFixture.releaseDir,
            expectedConsumerDigest: nextFixture.anchor,
          }),
        ).rejects.toThrow("consumer_runtime_update_unsupported");
        expect(snapshotRuntimeUpdateTree(worktreeRoot)).toEqual(worktreeBefore);
        expect(runtimeUpdateActivePointer(consumerRoot).bytes).toEqual(mainPointerBeforeAttempt);
        expect(runtimeUpdateActivePointer(consumerRoot).bytes).not.toEqual(priorPointer.bytes);
        expect(existsSync(cacheRoot) ? snapshotRuntimeUpdateTree(cacheRoot) : []).toEqual(
          cacheBefore,
        );
      },
    });
  });

  it.fails("CANDIDATE-U-RTUPD-006: an A-pinned linked worktree keeps running after main moves to B", async () => {
    const fixture = input.getFixture();
    let worktreeRoot = "";
    let cacheAPath = "";
    let cacheABefore: string[] = [];
    let worktreePointerBytes: Buffer = Buffer.alloc(0);
    let worktreeBundleBytes: Buffer = Buffer.alloc(0);
    let worktreeBefore: string[] = [];
    await input.runOracle({
      beforeUpdate: async ({ consumerRoot }) => {
        worktreeRoot = join(dirname(consumerRoot), "linked-worktree");
        execFileSync("git", ["worktree", "add", "--quiet", worktreeRoot, "HEAD"], {
          cwd: consumerRoot,
        });
        await setupApi.setupConsumerWorktreeRuntime({
          currentRoot: consumerRoot,
          worktreePath: worktreeRoot,
          releaseDirectory: fixture.releaseDir,
          expectedConsumerDigest: fixture.anchor,
        });
        const pointer = runtimeUpdateActivePointer(worktreeRoot);
        const commonDir = resolve(
          consumerRoot,
          execFileSync("git", ["rev-parse", "--git-common-dir"], {
            cwd: consumerRoot,
            encoding: "utf8",
          }).trim(),
        );
        const releaseId = fixture.runtime.admission_input.aggregate_input.attestation.releaseId;
        cacheAPath = join(
          commonDir,
          "ut-tdd",
          "runtime-cache",
          releaseId.slice("rel-sha256:".length),
        );
        cacheABefore = snapshotRuntimeUpdateTree(cacheAPath);
        const cachedAssets = Object.values(setupApi.releaseArtifactFileNames(fixture.tag));
        expect(readdirSync(cacheAPath).sort()).toEqual([...cachedAssets].sort());
        for (const name of cachedAssets) {
          expect(
            readFileSync(join(cacheAPath, name)).equals(
              readFileSync(join(fixture.releaseDir, name)),
            ),
            name,
          ).toBe(true);
        }
        const manifest = JSON.parse(
          readFileSync(join(pointer.bundlePath, "bundle-manifest.json"), "utf8"),
        ) as { identity: Record<string, unknown>; files: Record<string, string> };
        expect(manifest.identity).toMatchObject({
          release_id: releaseId,
          artifact_set_digest: fixture.runtime.generation.artifact_digest,
          compiled_esm_digest: fixture.runtime.generation.compiled_esm_digest,
        });
        expect(manifest.files["ut-tdd.mjs"]).toBe(fixture.runtime.generation.compiled_esm_digest);
        worktreePointerBytes = pointer.bytes;
        worktreeBundleBytes = readFileSync(join(pointer.bundlePath, "ut-tdd.mjs"));
        worktreeBefore = snapshotRuntimeUpdateTree(worktreeRoot);
      },
      afterUpdate: ({ nextPointer }) => {
        const pointer = runtimeUpdateActivePointer(worktreeRoot);
        const pointerValue = JSON.parse(pointer.bytes.toString("utf8")) as {
          bundle_path: string;
          entry_path: string;
        };
        expect(pointer.bytes).toEqual(worktreePointerBytes);
        expect(pointerValue.bundle_path).toBe(pointer.bundlePath);
        expect(pointerValue.entry_path).toBe(join(pointer.bundlePath, "ut-tdd.mjs"));
        expect(
          readFileSync(join(pointer.bundlePath, "ut-tdd.mjs")).equals(worktreeBundleBytes),
        ).toBe(true);
        expect(worktreeBundleBytes.equals(fixture.compiledBytes)).toBe(true);
        expect(snapshotRuntimeUpdateTree(worktreeRoot)).toEqual(worktreeBefore);
        expect(snapshotRuntimeUpdateTree(cacheAPath)).toEqual(cacheABefore);
        expect(nextPointer.bytes).not.toEqual(worktreePointerBytes);
        const launch = spawnSync(
          process.execPath,
          [join(worktreeRoot, ".ut-tdd", "bin", "ut-tdd.mjs"), "status", "--json"],
          {
            cwd: worktreeRoot,
            encoding: "utf8",
            windowsHide: true,
            env: { ...process.env, CI: "true" },
          },
        );
        expect(launch.status, launch.stderr).toBe(0);
        const status = JSON.parse(launch.stdout) as { mode?: unknown };
        expect(typeof status.mode).toBe("string");
        // status JSON exposes mode, not release identity; pointer->A bundle binding above
        // and this real launcher invocation together prove the pinned A runtime still runs.
        const manifest = JSON.parse(
          readFileSync(join(pointer.bundlePath, "bundle-manifest.json"), "utf8"),
        ) as { identity: { release_id: string; compiled_esm_digest: string } };
        expect(manifest.identity.release_id).toBe(
          fixture.runtime.admission_input.aggregate_input.attestation.releaseId,
        );
        expect(manifest.identity.compiled_esm_digest).toBe(
          fixture.runtime.generation.compiled_esm_digest,
        );
      },
    });
  });
}
