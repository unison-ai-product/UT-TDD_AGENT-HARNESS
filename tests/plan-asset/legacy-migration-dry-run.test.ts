import { describe, expect, it } from "vitest";
import {
  HeadTargetRegistry,
  LegacyMigrationDryRun,
  type MigrationDecisionPort,
} from "../../src/plan-asset/application/legacy-migration-dry-run.js";

describe("legacy migration dry-run", () => {
  it("U-PA-038: proves exact files and directory families against non-empty HEAD blobs", () => {
    const registry = HeadTargetRegistry.from([
      ["docs/process/forward/README.md", 10],
      ["docs/empty.md", 0],
    ]);
    expect(registry.hasNonEmpty("docs/process/forward/")).toBe(true);
    expect(registry.hasNonEmpty("docs/process/forward")).toBe(true);
    expect(registry.hasNonEmpty("docs/empty.md")).toBe(false);
    expect(registry.hasNonEmpty("docs/missing/")).toBe(false);
  });

  it("U-PA-039: re-verifies snapshot OID and content digest from the bound HEAD object", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    const sample = result.records[0];
    const oid = git(["rev-parse", `${result.sourceCommit}:${sample.sourcePath}`]).trim();
    const bytes = execFileSync("git", ["-C", process.cwd(), "cat-file", "blob", oid]);
    expect(oid).toBe(sample.sourceBlobOid);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sample.sourceContentDigest);
  });

  it("U-PA-034: emits an exactly-once HEAD-bound record for every inventory item", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    expect(result.total).toBe(741);
    expect(result.emitted).toBe(result.total);
    expect(new Set(result.records.map((item) => item.legacyPlanId)).size).toBe(result.total);
    expect(new Set(result.records.map((item) => item.sourceCommit))).toEqual(
      new Set([result.sourceCommit]),
    );
    expect(result.reportDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("U-PA-035: applies all 41 explicit reviewed rekey decisions", () => {
    const result = new LegacyMigrationDryRun().run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    expect(result.collisionGroups).toBe(20);
    expect(result.collisionItems).toBe(41);
    expect(result.decisionCounts).toEqual({ migrated: 700, rekeyed: 41, rejected: 0, pending: 0 });
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("U-PA-036: detects a decision manifest that targets another inventory identity", () => {
    const wrong: MigrationDecisionPort = {
      decide(item) {
        return {
          legacyPlanId: `${item.legacyPlanId}-wrong`,
          decision: "migrated",
          resolvedAlias: item.legacyPlanId,
          collisionGroup: null,
          lossFields: [],
          reason: "fixture",
          reviewPlanId: null,
        };
      },
    };
    const result = new LegacyMigrationDryRun(wrong).run(process.cwd());
    if (!("records" in result)) throw new Error(result.ruleId);
    expect(result.ok).toBe(false);
    expect(
      result.findings.some((item) => item.ruleId === "plan-migration-preview-id-mismatch"),
    ).toBe(true);
  });

  it("U-PA-037: is deterministic for the same HEAD and decision port", () => {
    const first = new LegacyMigrationDryRun().run(process.cwd());
    const second = new LegacyMigrationDryRun().run(process.cwd());
    expect(second).toEqual(first);
  });
});

function git(args: readonly string[]): string {
  return execFileSync("git", ["-C", process.cwd(), ...args], { encoding: "utf8" });
}

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
