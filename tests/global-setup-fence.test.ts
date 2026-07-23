import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { resolveNodeBinary } from "../scripts/run-vitest-snapshot";

describe("global setup fence", () => {
  it("U-TESTHYGIENE-043: turns a sealed detached-reference teardown violation into a nonzero runner process", () => {
    const result = spawnSync(
      process.env.UT_TDD_NODE_BINARY ?? resolveNodeBinary(),
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
  }, 120_000);
});
