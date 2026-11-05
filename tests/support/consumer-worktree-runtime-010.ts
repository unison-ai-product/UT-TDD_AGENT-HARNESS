import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  digestConsumerRuntimeValue,
} from "../../src/setup/consumer-node-runtime.ts";
import { verifyConsumerRuntimeReleaseAssets } from "../../src/setup/consumer-runtime-release.ts";
import {
  type ConsumerWorktreeRuntimeFixture,
  runConsumerWorktreeCommand,
  runtimeIdentity,
  WORKTREE_RUNTIME_TAG_B,
} from "./consumer-worktree-runtime.ts";

function malformedReleaseIds(releaseId: string): readonly string[] {
  const hash = releaseId.slice("rel-sha256:".length);
  return [
    `bad-sha256:${hash}`,
    `rel-sha256:${hash.slice(0, -1)}`,
    `rel-sha256:A${hash.slice(1)}`,
    `rel-sha256:${hash.slice(0, 32)}/${hash.slice(33)}`,
  ];
}

function mutateMainActiveReleaseId(
  fixture: ConsumerWorktreeRuntimeFixture,
  releaseId: string,
): () => void {
  const pointerPath = join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json");
  const pointerBytes = readFileSync(pointerPath);
  const pointer = JSON.parse(pointerBytes.toString("utf8")) as Record<string, unknown>;
  const manifestPath = join(String(pointer.bundle_path), "bundle-manifest.json");
  const manifestBytes = readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as Record<string, unknown>;
  const identity = manifest.identity as Record<string, unknown>;
  identity.release_id = releaseId;
  const bundleDigest = digestConsumerRuntimeValue({
    identity,
    files: manifest.files,
    history_sequence: manifest.history_sequence,
    prior_bundle_digest: manifest.prior_bundle_digest,
    prior_history_tip_digest: manifest.prior_history_tip_digest,
  });
  manifest.bundle_digest = bundleDigest;
  pointer.bundle_digest = bundleDigest;
  writeFileSync(manifestPath, `${canonicalJson(manifest)}\n`);
  writeFileSync(pointerPath, `${canonicalJson(pointer)}\n`);
  return () => {
    writeFileSync(manifestPath, manifestBytes);
    writeFileSync(pointerPath, pointerBytes);
  };
}

function snapshotTree(path: string): string {
  return JSON.stringify(
    readdirSync(path, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) =>
        entry.isDirectory()
          ? [entry.name, snapshotTree(join(path, entry.name))]
          : [entry.name, readFileSync(join(path, entry.name)).toString("hex")],
      ),
  );
}

function replaceCacheWithRelease(cache: string, release: string): void {
  rmSync(cache, { recursive: true, force: true });
  mkdirSync(cache, { recursive: true });
  for (const name of readdirSync(release))
    writeFileSync(join(cache, name), readFileSync(join(release, name)));
}

export function registerConsumerWorktreeRuntime010Tests(
  getFixture: () => ConsumerWorktreeRuntimeFixture,
): void {
  it("prerequisite: cache A/B, Windows-safe key path, and six independent targets are valid", () => {
    const fixture = getFixture();
    const commonDirResult = spawnSync("git", ["rev-parse", "--git-common-dir"], {
      cwd: fixture.main,
      encoding: "utf8",
      windowsHide: true,
      timeout: 10_000,
    });
    expect(commonDirResult.status, commonDirResult.stderr).toBe(0);
    const commonDir = resolve(fixture.main, commonDirResult.stdout.trim());
    expect(fixture.cache).toBe(
      join(commonDir, "ut-tdd", "runtime-cache", fixture.releaseId.slice("rel-sha256:".length)),
    );
    expect(basename(fixture.cache)).toMatch(/^[0-9a-f]{64}$/);
    expect(basename(fixture.cache)).not.toContain(":");
    expect(snapshotTree(fixture.cache)).toBe(snapshotTree(fixture.release));
    expect(snapshotTree(fixture.cacheB)).toBe(snapshotTree(fixture.releaseB));
    expect(fixture.releaseId).not.toBe(fixture.releaseIdB);
    for (const id of ["010-a", "010-prefix", "010-length", "010-upper", "010-separator", "010-b"])
      expect(statSync(join(fixture.linked[id], ".git")).isFile()).toBe(true);

    const [prefix, length, uppercase, separator] = malformedReleaseIds(fixture.releaseId);
    expect(new Set(malformedReleaseIds(fixture.releaseId)).size).toBe(4);
    expect(prefix).toMatch(/^bad-sha256:[0-9a-f]{64}$/);
    expect(length).toMatch(/^rel-sha256:[0-9a-f]{63}$/);
    expect(uppercase).toMatch(/^rel-sha256:A[0-9a-f]{63}$/);
    expect(separator).toMatch(/^rel-sha256:[0-9a-f]{32}\/[0-9a-f]{31}$/);
  });

  it("prerequisite: malformed active identities retain a coordinated pointer and bundle digest", () => {
    const fixture = getFixture();
    const pointerPath = join(fixture.main, ".ut-tdd", "runtime", "activation", "active.json");
    const originalPointer = readFileSync(pointerPath);
    const pointer = JSON.parse(originalPointer.toString("utf8")) as Record<string, unknown>;
    const manifestPath = join(String(pointer.bundle_path), "bundle-manifest.json");
    const originalManifest = readFileSync(manifestPath);
    expect(runtimeIdentity(fixture.main).release_id).toBe(fixture.releaseId);
    for (const releaseId of malformedReleaseIds(fixture.releaseId)) {
      const restore = mutateMainActiveReleaseId(fixture, releaseId);
      try {
        const mutatedPointer = JSON.parse(readFileSync(pointerPath, "utf8")) as Record<
          string,
          unknown
        >;
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
        expect((manifest.identity as Record<string, unknown>).release_id).toBe(releaseId);
        expect(manifest.bundle_digest).toBe(mutatedPointer.bundle_digest);
        expect(manifest.bundle_digest).toBe(
          digestConsumerRuntimeValue({
            identity: manifest.identity,
            files: manifest.files,
            history_sequence: manifest.history_sequence,
            prior_bundle_digest: manifest.prior_bundle_digest,
            prior_history_tip_digest: manifest.prior_history_tip_digest,
          }),
        );
      } finally {
        restore();
      }
      expect(readFileSync(pointerPath)).toEqual(originalPointer);
      expect(readFileSync(manifestPath)).toEqual(originalManifest);
    }
  });

  it.fails("CANDIDATE-U-CWTRT-010: installs A through its lowercase hex cache key", () => {
    const fixture = getFixture();
    const target = fixture.linked["010-a"];
    const cacheBefore = snapshotTree(dirname(fixture.cache));
    const targetBefore = snapshotTree(target);
    const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", target]);
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(basename(fixture.cache)).toBe(fixture.releaseId.slice("rel-sha256:".length));
    expect(basename(fixture.cache)).not.toContain(":");
    expect(runtimeIdentity(target).release_id).toBe(fixture.releaseId);
    expect(snapshotTree(dirname(fixture.cache))).toBe(cacheBefore);
    expect(snapshotTree(target)).not.toBe(targetBefore);
  });

  for (const [targetId, malformedIndex] of [
    ["010-prefix", 0],
    ["010-length", 1],
    ["010-upper", 2],
    ["010-separator", 3],
  ] as const) {
    describe(targetId, () => {
      it.fails("CANDIDATE-U-CWTRT-010: rejects malformed main release_id without cache aliasing", () => {
        const fixture = getFixture();
        const releaseId = malformedReleaseIds(fixture.releaseId)[malformedIndex];
        if (!releaseId) throw new Error("malformed release ID fixture is missing");
        const cacheRoot = dirname(fixture.cache);
        const cacheBefore = snapshotTree(cacheRoot);
        const target = fixture.linked[targetId];
        const targetBefore = snapshotTree(target);
        const restore = mutateMainActiveReleaseId(fixture, releaseId);
        try {
          const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", target]);
          expect(`${result.stdout}\n${result.stderr}`).toContain(
            "worktree_entry_main_not_activated",
          );
          expect(result.status).not.toBe(0);
          expect(snapshotTree(cacheRoot)).toBe(cacheBefore);
          expect(snapshotTree(target)).toBe(targetBefore);
          expect(existsSync(join(target, ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(false);
          expect(existsSync(join(target, ".ut-tdd", "runtime", "activation", "active.json"))).toBe(
            false,
          );
        } finally {
          restore();
        }
      });
    });
  }

  it.fails("CANDIDATE-U-CWTRT-010: rejects B under A's cache key and rolls back", () => {
    const fixture = getFixture();
    const bVerification = verifyConsumerRuntimeReleaseAssets({
      releaseDirectory: fixture.releaseB,
      tag: WORKTREE_RUNTIME_TAG_B,
      expectedConsumerDigest: fixture.anchorB,
      executingModulePath: join(fixture.main, ".ut-tdd", "bin", "ut-tdd.mjs"),
    });
    expect(bVerification.document.release.tag).toBe(WORKTREE_RUNTIME_TAG_B);
    expect(fixture.releaseIdB).not.toBe(fixture.releaseId);
    const cacheRoot = dirname(fixture.cache);
    const cacheBefore = snapshotTree(cacheRoot);
    const target = fixture.linked["010-b"];
    const targetBefore = snapshotTree(target);
    replaceCacheWithRelease(fixture.cache, fixture.releaseB);
    try {
      expect(snapshotTree(fixture.cache)).toBe(snapshotTree(fixture.releaseB));
      expect(snapshotTree(fixture.cacheB)).toBe(snapshotTree(fixture.releaseB));
      const result = runConsumerWorktreeCommand(fixture.main, ["setup", "--worktree", target]);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(
        /consumer_runtime_[a-z_]+|worktree_entry_pin_mismatch/,
      );
      expect(result.status).not.toBe(0);
      expect(snapshotTree(target)).toBe(targetBefore);
      expect(existsSync(join(target, ".ut-tdd", "bin", "ut-tdd.mjs"))).toBe(false);
      expect(existsSync(join(target, ".ut-tdd", "runtime", "activation", "active.json"))).toBe(
        false,
      );
    } finally {
      replaceCacheWithRelease(fixture.cache, fixture.release);
    }
    expect(snapshotTree(cacheRoot)).toBe(cacheBefore);
  });
}
