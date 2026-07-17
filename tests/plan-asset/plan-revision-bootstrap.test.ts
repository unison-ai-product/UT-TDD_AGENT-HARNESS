import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { deriveLegacyAssetId } from "../../src/plan-asset/adapters/legacy-plan-adapter.js";
import {
  type BootstrapLegacyPlanRevisionInput,
  LegacyPlanRevisionBootstrapTransaction,
} from "../../src/plan-asset/ledger/plan-revision-bootstrap.js";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../../src/state-db/index.js";

const opened: ReturnType<typeof openHarnessDb>[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("legacy PLAN revision bootstrap transaction", () => {
  it("U-PA-REV-BOOT-001: lossless rev1 bootstrapとrev2 appendを同一transactionで確定する", () => {
    const { db, ledger } = fixture();

    expect(ledger.bootstrap(bootstrap())).toMatchObject({
      ok: true,
      replayed: false,
      assetId: derivedAssetId(),
      revision: 2,
    });
    expect(rows(db, "plan_assets")).toBe(1);
    expect(rows(db, "plan_revisions")).toBe(2);
    expect(
      db
        .prepare(`SELECT revision, canonical_payload_json, canonical_payload_digest, source_commit
          FROM plan_revisions ORDER BY revision`)
        .all(),
    ).toEqual([
      {
        revision: 1,
        canonical_payload_json: '{"title":"legacy-v1"}',
        canonical_payload_digest: sha('{"title":"legacy-v1"}'),
        source_commit: "a".repeat(40),
      },
      {
        revision: 2,
        canonical_payload_json: '{"title":"redesign-v2"}',
        canonical_payload_digest: sha('{"title":"redesign-v2"}'),
        source_commit: "b".repeat(40),
      },
    ]);
    expect(rows(db, "plan_alias_events")).toBe(1);
    expect(rows(db, "plan_aliases")).toBe(1);
    expect(rows(db, "plan_admission_events")).toBe(1);
    expect(rows(db, "plan_admission_receipts")).toBe(1);
    expect(rows(db, "append_command_receipts")).toBe(1);
  });

  it("U-PA-REV-BOOT-002: repository identityとPLAN IDからasset IDを導出し自己申告IDを受け取らない", () => {
    const { db, ledger } = fixture();
    const input = bootstrap();

    expect("assetId" in input).toBe(false);
    expect(ledger.bootstrap(input)).toMatchObject({
      ok: true,
      assetId: derivedAssetId(),
    });
    expect(db.prepare("SELECT asset_id FROM plan_assets").get()).toEqual({
      asset_id: derivedAssetId(),
    });
  });

  it("U-PA-REV-BOOT-003: legacy rev1を指定HEAD blobとpayload/body digestへlossless束縛する", () => {
    const { db, ledger } = fixture();

    expect(
      ledger.bootstrap(
        bootstrap({
          baseCanonicalPayloadDigest: sha("tampered"),
        }),
      ),
    ).toEqual({ ok: false, ruleId: "plan-revision-bootstrap-base-digest-mismatch" });
    expect(
      ledger.bootstrap(
        bootstrap({
          baseSourceContentDigest: sha("tampered-source"),
        }),
      ),
    ).toEqual({ ok: false, ruleId: "plan-revision-bootstrap-source-preimage-mismatch" });
    expect(totalRows(db)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("U-PA-REV-BOOT-004: alias衝突またはadopt済みassetをbootstrapせずfail-closeする", () => {
    const { db, ledger } = fixture();
    seedCompetingAlias(db);
    const baseline = totalRows(db);

    expect(ledger.bootstrap(bootstrap())).toEqual({
      ok: false,
      ruleId: "plan-revision-bootstrap-alias-conflict",
    });
    expect(totalRows(db)).toEqual(baseline);
  });

  it.each([
    "plan-asset",
    "base-revision",
    "alias-event",
    "alias-current",
    "next-revision",
    "admission-event",
    "admission-receipt",
    "receipt",
  ])("U-PA-REV-BOOT-005: %s faultでrev1を含む全write setをrollbackする", (boundary) => {
    const { db } = fixture();
    const ledger = new LegacyPlanRevisionBootstrapTransaction(db, undefined, {
      after(actual) {
        if (actual === boundary) throw new Error(`fault:${boundary}`);
      },
    });

    expect(() => ledger.bootstrap(bootstrap())).toThrow(`fault:${boundary}`);
    expect(totalRows(db)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

function fixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 4 });
  return { db, ledger: new LegacyPlanRevisionBootstrapTransaction(db) };
}

function bootstrap(
  overrides: Partial<BootstrapLegacyPlanRevisionInput> = {},
): BootstrapLegacyPlanRevisionInput {
  return {
    commandId: "command:legacy-revise-1",
    planId: "PLAN-L4-31",
    repositoryIdentity: "owner/repository",
    identityAlgorithm: "ut-tdd-plan-legacy-v1",
    identityInputJson: '["owner/repository","PLAN-L4-31"]',
    identityDigest: sha('["owner/repository","PLAN-L4-31"]'),
    baseRevision: 1,
    baseCanonicalPayloadJson: '{"title":"legacy-v1"}',
    baseCanonicalPayloadDigest: sha('{"title":"legacy-v1"}'),
    baseBodyDigest: sha("legacy-body-v1"),
    baseSourcePath: "docs/plans/PLAN-L4-31.md",
    baseSourceCommit: "a".repeat(40),
    baseSourceBlobOid: "c".repeat(40),
    baseSourceContent: "---\nplan_id: PLAN-L4-31\n---\nlegacy body\n",
    baseSourceContentDigest: sha("---\nplan_id: PLAN-L4-31\n---\nlegacy body\n"),
    canonicalPayloadJson: '{"title":"redesign-v2"}',
    bodyDigest: sha("redesign-body-v2"),
    sourcePath: "docs/plans/PLAN-L4-31.md",
    sourceCommit: "b".repeat(40),
    actor: "codex",
    reason: "redesign",
    routeTupleDigest: sha("redesign|forward_merge"),
    certificateId: "certificate:legacy-revise-1",
    occurredAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

function seedCompetingAlias(db: ReturnType<typeof openHarnessDb>): void {
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    "plan:competing",
    "2026-07-16T00:00:00.000Z",
    "d".repeat(40),
    "test",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "plan:competing",
    1,
    "{}",
    sha("{}"),
    sha("body"),
    "docs/plans/competing.md",
    "d".repeat(40),
    "test",
    "collision",
    "2026-07-16T00:00:00.000Z",
  );
  db.prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "alias:competing:1",
    "plan:competing",
    1,
    "command:competing-alias",
    sha("competing-alias"),
    "assigned",
    "PLAN-L4-31",
    1,
    "collision fixture",
    "2026-07-16T00:00:00.000Z",
    sha("competing-alias-event"),
  );
  db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
    "alias-current:competing",
    "plan:competing",
    "PLAN-L4-31",
    1,
    null,
    sha("competing-alias-event"),
  );
}

function totalRows(db: ReturnType<typeof openHarnessDb>): number[] {
  return [
    "plan_assets",
    "plan_revisions",
    "plan_alias_events",
    "plan_aliases",
    "plan_admission_events",
    "plan_admission_receipts",
    "append_command_receipts",
  ].map((table) => rows(db, table));
}

function rows(db: ReturnType<typeof openHarnessDb>, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}

function derivedAssetId(): string {
  return deriveLegacyAssetId("owner/repository", "PLAN-L4-31");
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
