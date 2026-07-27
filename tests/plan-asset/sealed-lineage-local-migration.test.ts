import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.js";

const opened: HarnessDb[] = [];

afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("sealed lineage local migration", () => {
  it("U-PA-SEAL-001: tracked historyを推測で再構築せずsealし、同一aliasのsuccessor rev1を作る", async () => {
    const { db, transaction } = await fixture();

    expect(transaction.migrate(input())).toMatchObject({
      ok: true,
      replayed: false,
      successorAssetId: "plan:recovery-16-successor",
      successorRevision: 1,
    });
    expect(count(db, "plan_revisions")).toBe(1);
    expect(count(db, "sealed_plan_lineages")).toBe(1);
    expect(count(db, "plan_lineage_migration_certificates")).toBe(1);
    expect(count(db, "genesis_issue_custody")).toBe(1);
    expect(count(db, "plan_admission_receipts")).toBe(1);
    expect(
      db.prepare("SELECT asset_id FROM plan_aliases WHERE alias = ?").get(PLAN_ID),
    ).toEqual({ asset_id: "plan:recovery-16-successor" });
  });

  it("U-PA-SEAL-002: same payload replayは冪等、history改変はconflictとしてwrite 0", async () => {
    const { db, transaction } = await fixture();
    const command = input();
    expect(transaction.migrate(command)).toMatchObject({ ok: true, replayed: false });
    const baseline = counts(db);
    expect(transaction.migrate(command)).toMatchObject({ ok: true, replayed: true });
    expect(transaction.migrate({ ...command, historicalTailDigest: digest("tampered") })).toEqual({
      ok: false,
      ruleId: "sealed-lineage-command-conflict",
    });
    expect(counts(db)).toEqual(baseline);
  });

  it.each(
    ["asset", "revision", "alias", "admission", "custody", "seal", "certificate", "receipt"] as const,
  )(
    "U-PA-SEAL-003: %s faultで全writeをrollbackする",
    async (boundary) => {
      const { db, Transaction } = await baseFixture();
      const transaction = new Transaction(db, {
        after(actual) {
          if (actual === boundary) throw new Error(`fault:${boundary}`);
        },
      });
      expect(() => transaction.migrate(input())).toThrow(`fault:${boundary}`);
      expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    },
  );
});

const PLAN_ID = "PLAN-RECOVERY-16-plan-revision-authoring";

type Boundary =
  | "asset"
  | "revision"
  | "alias"
  | "admission"
  | "custody"
  | "seal"
  | "certificate"
  | "receipt";

interface MigrationInput {
  commandId: string;
  planId: string;
  historicalAssetId: string;
  historicalTerminalRevision: number;
  historicalTailDigest: string;
  historicalProjectionPath: string;
  historicalProjectionBlobOid: string;
  historicalProjectionContentDigest: string;
  successorAssetId: string;
  canonicalPayloadJson: string;
  canonicalPayloadDigest: string;
  bodyDigest: string;
  sourcePath: string;
  sourceCommit: string;
  actor: string;
  occurredAt: string;
  certificateDigest: string;
  sourceAuthorityDigest: string;
  reviewedImplementationAuthorityDigest: string;
  trustedStatus: "draft";
  issue: {
    number: number;
    episodeId: string;
    preimageDigest: string;
  };
}

interface MigrationResult {
  ok: boolean;
  replayed?: boolean;
  successorAssetId?: string;
  successorRevision?: number;
  ruleId?: string;
}

interface Transaction {
  migrate(input: MigrationInput): MigrationResult;
}

interface TransactionConstructor {
  new (db: HarnessDb, fault?: { after(boundary: Boundary): void }): Transaction;
}

async function loadTransaction(): Promise<TransactionConstructor> {
  const modulePath = "../../src/plan-asset/ledger/sealed-lineage-local-migration.js";
  const module = (await import(/* @vite-ignore */ modulePath)) as Record<string, unknown>;
  expect(module.SealedLineageLocalMigration).toBeTypeOf("function");
  return module.SealedLineageLocalMigration as TransactionConstructor;
}

async function baseFixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db).ok).toBe(true);
  return { db, Transaction: await loadTransaction() };
}

async function fixture() {
  const value = await baseFixture();
  return { ...value, transaction: new value.Transaction(value.db) };
}

function input(): MigrationInput {
  const payload = `{"plan_id":"${PLAN_ID}","status":"draft"}`;
  return {
    commandId: "seal-lineage:recovery-16:v1",
    planId: PLAN_ID,
    historicalAssetId: "plan:890b18d79d85d8d7cc2591c7146af5e2",
    historicalTerminalRevision: 3,
    historicalTailDigest: digest("record-3"),
    historicalProjectionPath: "docs/governance/plan-admission-receipts.json",
    historicalProjectionBlobOid: "b".repeat(40),
    historicalProjectionContentDigest: digest("tracked projection"),
    successorAssetId: "plan:recovery-16-successor",
    canonicalPayloadJson: payload,
    canonicalPayloadDigest: digest(payload),
    bodyDigest: digest("body"),
    sourcePath: "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md",
    sourceCommit: "a".repeat(40),
    actor: "codex",
    occurredAt: "2026-07-27T03:30:00.000Z",
    certificateDigest: digest("certificate"),
    sourceAuthorityDigest: digest("trusted source"),
    reviewedImplementationAuthorityDigest: digest("reviewed implementation"),
    trustedStatus: "draft",
    issue: {
      number: 102,
      episodeId: "E4-102",
      preimageDigest: digest("issue 102"),
    },
  };
}

function counts(db: HarnessDb): number[] {
  return [
    "plan_assets",
    "plan_revisions",
    "plan_aliases",
    "sealed_plan_lineages",
    "plan_lineage_migration_certificates",
    "genesis_issue_custody",
    "plan_admission_receipts",
    "append_command_receipts",
  ].map((table) => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n));
}

function count(db: HarnessDb, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
