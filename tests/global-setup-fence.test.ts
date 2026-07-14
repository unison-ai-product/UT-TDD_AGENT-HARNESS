import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("global setup fence", () => {
  it("U-TESTHYGIENE-043: turns a sealed detached-reference teardown violation into a nonzero runner process", () => {
    const result = spawnSync(
      "bun",
      ["scripts/run-vitest-snapshot.ts", "tests/fixtures/reference-fence-trip.test.ts"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, UT_TDD_FENCE_TRIP: "1" },
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("test workspace fence violation");
  });
});
