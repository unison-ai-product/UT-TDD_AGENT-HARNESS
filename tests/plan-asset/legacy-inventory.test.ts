import { describe, expect, it } from "vitest";
import {
  inventoryProjectionDigest,
  parseLegacyPlanSource,
} from "../../src/plan-asset/adapters/legacy-plan-inventory.ts";

describe("legacy PLAN fixture contracts", () => {
  it("U-PA-021: fixes the canonical projection digest with an independent fixture oracle", () => {
    const projection = {
      sourceCommit: "1".repeat(40),
      repositoryIdentity: "owner/repository",
      collisions: [["PLAN-L7-1", ["PLAN-L7-1-a", "PLAN-L7-1-b"]]],
      items: [["docs/plans/PLAN-L7-1-a.md", "PLAN-L7-1-a", "plan:legacy:a"]],
    } as const;
    const expected = "2de67b9ca087811f3f87b9bb958d38d04eafb2321737559be87670d24d52b782";
    expect(inventoryProjectionDigest(projection)).toBe(expected);
    expect(inventoryProjectionDigest({ ...projection, sourceCommit: "2".repeat(40) })).not.toBe(
      expected,
    );
  });

  it.each([
    ["anchor", "extra: &base value\ncopy: *base"],
    ["merge", "base: &base { enabled: true }\nextra:\n  <<: *base"],
    ["tag", "extra: !custom value"],
    ["non-string key", "extra:\n  1: value"],
    ["unsafe integer", `extra: ${Number.MAX_SAFE_INTEGER + 1}`],
  ])("U-PA-022: rejects lossless-incompatible YAML %s", (_kind, extra) => {
    expect(
      parseLegacyPlanSource(`---\nplan_id: PLAN-L7-999-fixture\n${extra}\n---\nbody\n`),
    ).toBeNull();
  });
});
