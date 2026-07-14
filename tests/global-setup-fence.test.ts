import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { resolveBunBinary } from "../scripts/run-vitest-snapshot";

describe("global setup fence", () => {
  it("U-TESTHYGIENE-043: turns a sealed detached-reference teardown violation into a nonzero runner process", () => {
    const bun = resolveBunBinary();
    const result = spawnSync(
      bun,
      ["scripts/run-vitest-snapshot.ts", "tests/fixtures/reference-fence-trip.test.ts"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, UT_TDD_FENCE_TRIP: "1" },
        // Node worker on Windows cannot spawn the bare "bun" npm shim (bun.cmd) without a shell.
        shell: bun === "bun" && process.platform === "win32",
      },
    );
    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("test workspace fence violation");
  });
});
