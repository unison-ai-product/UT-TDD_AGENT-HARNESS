import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveNodeBinary } from "../scripts/run-vitest-snapshot.ts";

describe("global setup fence", () => {
  it("U-TESTHYGIENE-043: turns a sealed detached-reference teardown violation into a nonzero runner process", () => {
    // PLAN-L7-462 step 2: runner 実発火 oracle は node 直 spawn (bun/.cmd shell 経由なし)。
    const result = spawnSync(
      resolveNodeBinary(),
      ["scripts/run-vitest-snapshot.ts", "tests/fixtures/reference-fence-trip.test.ts"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        windowsHide: true,
        env: { ...process.env, UT_TDD_FENCE_TRIP: "1" },
      },
    );
    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("test workspace fence violation");
  });

  it("U-FENCE-011: parent runner preserves managed foreign activity as exit code 2", async () => {
    const marker = `.ut-tdd-fence-foreign-trip-${process.pid}.txt`;
    const workerScript = `
      const { existsSync, writeFileSync } = require("node:fs");
      const { join } = require("node:path");
      const { pathToFileURL } = require("node:url");
      const root = process.env.UT_TDD_FENCE_SOURCE_ROOT;
      const marker = process.env.UT_TDD_FENCE_FOREIGN_MARKER;
      const modulePath = process.env.UT_TDD_FENCE_MODULE;
      const deadline = Date.now() + 120000;
      const poll = async () => {
        if (!root || !marker || !modulePath) process.exit(3);
        const { createSnapshotFenceProducer, snapshotFenceRunPath } =
          await import(pathToFileURL(modulePath).href);
        const runPath = snapshotFenceRunPath(root);
        if (!runPath) process.exit(5);
        if (!existsSync(runPath)) {
          if (Date.now() >= deadline) process.exit(4);
          return setTimeout(poll, 25);
        }
        const producer = createSnapshotFenceProducer({ repoRoot: root });
        producer.observe({ sessionId: "external-provider-e2e", now: new Date().toISOString() });
        writeFileSync(join(root, marker), "foreign activity\\n", "utf8");
        producer.observe({ sessionId: "external-provider-e2e", now: new Date().toISOString() });
        process.exit(0);
      };
      poll();
    `;
    const worker = spawn(resolveNodeBinary(), ["-e", workerScript], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: "ignore",
      env: {
        ...process.env,
        UT_TDD_FENCE_SOURCE_ROOT: process.cwd(),
        UT_TDD_FENCE_MODULE: join(process.cwd(), "src", "runtime", "snapshot-fence.ts"),
        UT_TDD_FENCE_FOREIGN_MARKER: marker,
      },
    });
    const result = spawnSync(
      resolveNodeBinary(),
      ["scripts/run-vitest-snapshot.ts", "tests/snapshot-fence.test.ts"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        windowsHide: true,
        env: {
          ...process.env,
        },
      },
    );
    try {
      expect(result.status).toBe(2);
      expect(`${result.stdout}\n${result.stderr}`).toContain(
        "fence_indeterminate_foreign_activity",
      );
    } finally {
      if (worker.exitCode === null) {
        worker.kill();
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 2_000);
          worker.once("exit", () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }
      rmSync(join(process.cwd(), marker), { force: true });
    }
  });
});
