import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { LegacyMigrationLedger } from "../../src/plan-asset/ledger/legacy-migration-ledger.js";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../../src/state-db/index.js";

describe("legacy migration ledger application", () => {
  it("U-PA-026: atomically observes once and rejects a competing state command", () => {
    withLedger(({ db, ledger }) => {
      expect(ledger.observe(input())).toMatchObject({ ok: true, replayed: false });
      expect(counts(db)).toEqual([1, 1, 1]);
      expect(ledger.observe({ ...input(), commandId: "command:other" })).toMatchObject({
        ok: false,
        ruleId: "plan-migration-state-conflict",
      });
      expect(counts(db)).toEqual([1, 1, 1]);
    });
  });

  it("U-PA-027: replays the same command and rejects a different payload", () => {
    withLedger(({ db, ledger }) => {
      const first = ledger.observe(input());
      expect(ledger.observe({ ...input(), occurredAt: "2026-07-13T01:00:00Z" })).toMatchObject({
        ok: true,
        replayed: true,
        resultRef: first.ok ? first.resultRef : "",
      });
      expect(ledger.observe({ ...input(), reason: "different" })).toMatchObject({
        ok: false,
        ruleId: "plan-migration-command-conflict",
      });
      expect(counts(db)).toEqual([1, 1, 1]);
    });
  });

  it("U-PA-029: rejects without creating a PlanAsset revision or alias", () => {
    withLedger(({ db, ledger }) => {
      expect(ledger.observe(input())).toMatchObject({ ok: true });
      expect(
        ledger.reject({
          legacyPlanId: input().legacyPlanId,
          lossFields: ["frontmatter.unsupported"],
          reason: "lossless migration unavailable",
          reviewPlanId: "PLAN-L7-418-review",
          commandId: "command:reject",
          occurredAt: "2026-07-13T01:00:00Z",
          expectedSequence: 1,
          expectedDecision: "pending",
        }),
      ).toMatchObject({ ok: true, replayed: false });
      expect(counts(db)).toEqual([2, 1, 2]);
      expect(
        ["plan_assets", "plan_revisions", "plan_alias_events", "plan_aliases"].map((table) =>
          count(db, table),
        ),
      ).toEqual([0, 0, 0, 0]);
      expect(migratePlanLedger(db)).toMatchObject({ ok: true });
    });
  });

  it("U-PA-028: atomically adopts a canonical revision and alias", () => {
    withLedger(({ db, ledger }) => {
      expect(ledger.observe(input())).toMatchObject({ ok: true });
      const payload = JSON.stringify({ legacyPlanId: input().legacyPlanId, migrated: true });
      expect(
        ledger.adopt({
          legacyPlanId: input().legacyPlanId,
          resolvedAlias: input().legacyPlanId,
          canonicalPayloadJson: payload,
          canonicalPayloadDigest: sha256(payload),
          bodyDigest: "1".repeat(64),
          sourcePath: "docs/plans/PLAN-L7-1-a.md",
          sourceCommit: "2".repeat(40),
          actor: "migration:test",
          reason: "lossless canonical adoption",
          commandId: "command:adopt",
          occurredAt: "2026-07-13T01:00:00Z",
          expectedSequence: 1,
          expectedDecision: "pending",
        }),
      ).toMatchObject({ ok: true, replayed: false });
      expect(counts(db)).toEqual([2, 1, 2]);
      expect(
        ["plan_assets", "plan_revisions", "plan_alias_events", "plan_aliases"].map((table) =>
          count(db, table),
        ),
      ).toEqual([1, 1, 1, 1]);
      expect(migratePlanLedger(db)).toMatchObject({ ok: true });
    });
  });
});

function input() {
  return {
    legacyPlanId: "PLAN-L7-1-a",
    assetId: `plan:legacy:${"a".repeat(64)}`,
    collisionGroup: null,
    reason: "inventory observed",
    reviewPlanId: "PLAN-L7-418-review",
    repositoryIdentity: "owner/repository",
    identityAlgorithm: "ut-tdd-plan-legacy-v1",
    identityInputJson: "[]",
    identityDigest: "b".repeat(64),
    identityConfigPath: "ut-tdd.project.json",
    identityConfigBlobOid: "c".repeat(40),
    identityConfigContentDigest: "d".repeat(64),
    identityConfigReceiptDigest: "e".repeat(64),
    sourceDigest: "f".repeat(64),
    commandId: "command:observe",
    occurredAt: "2026-07-13T00:00:00Z",
    expectedSequence: 0 as const,
  };
}

function withLedger(
  run: (fixture: { db: ReturnType<typeof openHarnessDb>; ledger: LegacyMigrationLedger }) => void,
): void {
  const db = openHarnessDb(":memory:");
  try {
    migratePlanLedger(db);
    run({ db, ledger: new LegacyMigrationLedger(db) });
  } finally {
    db.close();
  }
}

function counts(db: ReturnType<typeof openHarnessDb>): readonly number[] {
  return ["legacy_plan_migration_events", "legacy_plan_migrations", "append_command_receipts"].map(
    (table) => count(db, table),
  );
}

function count(db: ReturnType<typeof openHarnessDb>, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n ?? 0);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
