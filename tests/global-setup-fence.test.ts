import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { removeTestTree } from "./support/temp-tree";

describe("global setup fence", () => {
  it("U-TESTHYGIENE-043: turns a teardown fingerprint violation into a nonzero Vitest process", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-fence-trip-"));
    const fenceRoot = join(root, "fence");
    const referenceRoot = join(root, "reference");
    const cacheRoot = join(root, "cache");
    try {
      mkdirSync(fenceRoot);
      mkdirSync(referenceRoot);
      writeFileSync(join(referenceRoot, "seed.txt"), "seed\n");
      const result = spawnSync(
        process.execPath,
        ["x", "vitest", "run", "tests/fixtures/reference-fence-trip.test.ts"],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: {
            ...process.env,
            UT_TDD_FENCE_TRIP: "1",
            UT_TDD_TEST_EXECUTION_ROOT: process.cwd(),
            UT_TDD_TEST_FENCE_ROOT: fenceRoot,
            UT_TDD_HEAD_SNAPSHOT_ROOT: referenceRoot,
            UT_TDD_VITEST_CACHE_DIR: cacheRoot,
          },
        },
      );
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain("test workspace fence violation");
    } finally {
      removeTestTree(root);
    }
  });
});
