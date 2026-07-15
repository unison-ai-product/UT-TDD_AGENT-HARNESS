import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEDGER_SCHEMA_VERSION,
  ledgerRowDigest,
  ledgerSchemaDdl,
  migratePlanLedger,
  openPlanLedger,
} from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../../src/state-db/index.js";

describe("PLAN Asset canonical ledger schema", () => {
  it("U-PA-009: enforces active alias and ordinal partial uniqueness", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      seedAsset(db, "plan:a");
      seedAsset(db, "plan:b");
      db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
        "alias:a",
        "plan:a",
        "PLAN-L7-1-a",
        1,
        null,
        digest,
      );
      expect(() =>
        db
          .prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)")
          .run("alias:b", "plan:b", "PLAN-L7-1-a", 1, null, digest),
      ).toThrow();
      seedRevision(db, "plan:a", 2);
      db.prepare("UPDATE plan_aliases SET valid_to_revision = ? WHERE alias_id = ?").run(
        2,
        "alias:a",
      );
      db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
        "alias:b",
        "plan:b",
        "PLAN-L7-1-a",
        1,
        null,
        digest,
      );
      db.prepare("INSERT INTO plan_id_reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        "reservation:a",
        "PLAN-L7",
        1,
        "plan:a",
        digest,
        "active",
        now,
        later,
        null,
        digest,
      );
      expect(() =>
        db
          .prepare("INSERT INTO plan_id_reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run("reservation:b", "PLAN-L7", 1, "plan:b", digest, "active", now, later, null, digest),
      ).toThrow();
      db.prepare(
        "UPDATE plan_id_reservations SET status = ?, closed_at = ? WHERE reservation_id = ?",
      ).run("released", now, "reservation:a");
      db.prepare("INSERT INTO plan_id_reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        "reservation:b",
        "PLAN-L7",
        1,
        "plan:b",
        digest,
        "active",
        now,
        later,
        null,
        digest,
      );
    } finally {
      db.close();
    }
  });

  it("U-PA-010: makes canonical history append-only and enforces revision FK", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      seedAsset(db, "plan:a");
      expect(() =>
        db.exec("UPDATE plan_assets SET identity_algorithm = 'changed' WHERE asset_id = 'plan:a'"),
      ).toThrow();
      expect(() => db.exec("DELETE FROM plan_assets WHERE asset_id = 'plan:a'")).toThrow();
      expect(() =>
        db
          .prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(
            "event:a",
            "plan:a",
            1,
            "command:a",
            digest,
            "assigned",
            "PLAN-L7-1-a",
            2,
            "test",
            now,
            digest,
          ),
      ).toThrow();
    } finally {
      db.close();
    }
  });

  it("U-PA-011: owns a dedicated versioned ledger and fails closed for stale schema", () => {
    const db = openHarnessDb(":memory:");
    try {
      expect(migratePlanLedger(db)).toMatchObject({ ok: true, version: LEDGER_SCHEMA_VERSION });
      expect(migratePlanLedger(db)).toMatchObject({ ok: true, version: LEDGER_SCHEMA_VERSION });
      expect(ledgerSchemaDdl().some((sql) => sql.includes("append-only:plan_assets"))).toBe(true);
      db.exec("DROP TRIGGER trg_plan_assets_no_update");
      expect(migratePlanLedger(db)).toMatchObject({ ok: false, ruleId: "plan-ledger-unavailable" });
      db.setUserVersion(LEDGER_SCHEMA_VERSION + 1);
      expect(migratePlanLedger(db)).toMatchObject({ ok: false, ruleId: "plan-ledger-unavailable" });
    } finally {
      db.close();
    }
    expect(() => openPlanLedger({ repoRoot: process.cwd(), path: "outside.db" })).toThrow(
      /\.ut-tdd/,
    );
    expect(() =>
      openPlanLedger({ repoRoot: process.cwd(), path: join(dirname(process.cwd()), "sibling.db") }),
    ).toThrow(/\.ut-tdd/);
    expect(() =>
      openPlanLedger({ repoRoot: process.cwd(), path: ".ut-tdd/ledger/../../../escape.db" }),
    ).toThrow(/\.ut-tdd/);
  });

  it("U-PA-011: rejects partial and current-version corrupted schemas", () => {
    const partial = openHarnessDb(":memory:");
    try {
      partial.exec("CREATE TABLE plan_assets (asset_id TEXT PRIMARY KEY)");
      expect(migratePlanLedger(partial)).toMatchObject({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
    } finally {
      partial.close();
    }
    const corrupt = openHarnessDb(":memory:");
    try {
      corrupt.setUserVersion(LEDGER_SCHEMA_VERSION);
      expect(migratePlanLedger(corrupt)).toMatchObject({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
    } finally {
      corrupt.close();
    }

    const rowCorrupt = openHarnessDb(":memory:");
    try {
      createV2Ledger(rowCorrupt);
      seedAsset(rowCorrupt, "plan:corrupt");
      insertReceipt(rowCorrupt, "plan_revision", "plan:corrupt", 1);
      replaceTrigger(rowCorrupt, "trg_append_command_receipts_no_update");
      rowCorrupt.exec(`UPDATE append_command_receipts SET receipt_digest = '${"f".repeat(64)}'`);
      restoreTrigger(rowCorrupt, "trg_append_command_receipts_no_update");
      expect(migratePlanLedger(rowCorrupt)).toEqual({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
      expect(rowCorrupt.userVersion()).toBe(2);
      expect(
        rowCorrupt
          .prepare("SELECT name FROM sqlite_master WHERE name = 'plan_draft_journal'")
          .get(),
      ).toBeUndefined();
    } finally {
      rowCorrupt.close();
    }
  });

  it("U-PADM-020: creates admission and durable draft journal tables in v3", () => {
    const db = openHarnessDb(":memory:");
    try {
      expect(migratePlanLedger(db)).toEqual({ ok: true, version: 3 });
      const names = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all()
        .map((row) => row.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "plan_admission_events",
          "plan_admission_receipts",
          "plan_draft_journal",
          "plan_draft_journal_events",
        ]),
      );
      expect(() =>
        db.exec("UPDATE plan_admission_events SET event_kind = 'admitted'"),
      ).not.toThrow();
      expect(ledgerSchemaDdl().join("\n")).toContain("append-only:plan_admission_events");
      expect(ledgerSchemaDdl().join("\n")).toContain("append-only:plan_draft_journal_events");
    } finally {
      db.close();
    }
  });

  it("U-PADM-021: fully validates v2 before migrating it atomically to v3", () => {
    const db = openHarnessDb(":memory:");
    try {
      createV2Ledger(db);
      seedAsset(db, "plan:a");
      insertReceipt(db, "plan_revision", "plan:a", 1);
      expect(migratePlanLedger(db)).toEqual({ ok: true, version: 3 });
      expect(db.userVersion()).toBe(3);
      expect(db.prepare("SELECT COUNT(*) AS n FROM plan_assets").get()?.n).toBe(1);
      expect(db.prepare("SELECT COUNT(*) AS n FROM append_command_receipts").get()?.n).toBe(1);
      expect(db.prepare("SELECT COUNT(*) AS n FROM plan_draft_journal").get()?.n).toBe(0);
      expect(db.prepare("SELECT COUNT(*) AS n FROM plan_draft_journal_events").get()?.n).toBe(0);
    } finally {
      db.close();
    }
  });

  it("U-PADM-022: rejects v1, future, partial, and corrupt v2 without mutation", () => {
    for (const version of [1, LEDGER_SCHEMA_VERSION + 1]) {
      const db = openHarnessDb(":memory:");
      try {
        db.setUserVersion(version);
        expect(migratePlanLedger(db)).toEqual({ ok: false, ruleId: "plan-ledger-unavailable" });
        expect(db.userVersion()).toBe(version);
      } finally {
        db.close();
      }
    }

    const partial = openHarnessDb(":memory:");
    try {
      partial.exec("CREATE TABLE plan_assets (asset_id TEXT PRIMARY KEY)");
      partial.setUserVersion(2);
      expect(migratePlanLedger(partial)).toEqual({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
      expect(partial.userVersion()).toBe(2);
      expect(
        partial.prepare("SELECT name FROM sqlite_master WHERE name = 'plan_draft_journal'").get(),
      ).toBeUndefined();
    } finally {
      partial.close();
    }

    const corrupt = openHarnessDb(":memory:");
    try {
      createV2Ledger(corrupt);
      corrupt.exec("DROP TRIGGER trg_plan_assets_no_update");
      expect(migratePlanLedger(corrupt)).toEqual({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
      expect(corrupt.userVersion()).toBe(2);
      expect(
        corrupt.prepare("SELECT name FROM sqlite_master WHERE name = 'plan_draft_journal'").get(),
      ).toBeUndefined();
    } finally {
      corrupt.close();
    }
  });

  it("U-PA-012: constrains global receipt subjects to real plan revisions", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      seedAsset(db, "plan:a");
      expect(() => insertReceipt(db, "plan_revision", "missing", 1)).toThrow();
      expect(() => insertReceipt(db, "reservation", "plan:a", 1)).toThrow();
      insertReceipt(db, "plan_revision", "plan:a", 1);
    } finally {
      db.close();
    }
  });

  it("U-PA-013: rejects a digest-tampered current ledger", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      seedAsset(db, "plan:a");
      insertReceipt(db, "plan_revision", "plan:a", 1);
      expect(migratePlanLedger(db)).toMatchObject({ ok: true });
      db.exec("DROP TRIGGER trg_append_command_receipts_no_update");
      db.exec(
        "UPDATE append_command_receipts SET receipt_digest = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'",
      );
      const trigger = ledgerSchemaDdl().find((sql) =>
        sql.includes("trg_append_command_receipts_no_update"),
      );
      if (!trigger) throw new Error("fixture trigger missing");
      db.exec(trigger);
      expect(migratePlanLedger(db)).toMatchObject({
        ok: false,
        ruleId: "plan-ledger-unavailable",
      });
    } finally {
      db.close();
    }
  });

  it("U-PA-013: rejects event, revision, and reduction projection tampering", () => {
    expect(() =>
      expectTamperRejected(
        (db) => seedAliasReduction(db, "plan:a"),
        (db) => db.exec("UPDATE plan_aliases SET alias = 'PLAN-L7-tampered'"),
      ),
    ).not.toThrow();
    expect(() =>
      expectTamperRejected(
        (db) => seedAliasReduction(db, "plan:a"),
        (db) => {
          replaceTrigger(db, "trg_plan_alias_events_no_update");
          db.exec("UPDATE plan_alias_events SET reason = 'tampered'");
          restoreTrigger(db, "trg_plan_alias_events_no_update");
        },
      ),
    ).not.toThrow();
    expect(() =>
      expectTamperRejected(
        (db) => seedAsset(db, "plan:a"),
        (db) => {
          replaceTrigger(db, "trg_plan_revisions_no_update");
          db.exec("UPDATE plan_revisions SET canonical_payload_json = '{\"tampered\":true}'");
          restoreTrigger(db, "trg_plan_revisions_no_update");
        },
      ),
    ).not.toThrow();
  });

  it("U-PA-023/028/029: separates derived identity from an adopted revision target", () => {
    const db = openHarnessDb(":memory:");
    try {
      migratePlanLedger(db);
      expect(() => insertMigrationEvent(db, "pending", null, null, "pending")).not.toThrow();
      expect(() => insertMigrationEvent(db, "rejected", null, null, "rejected")).not.toThrow();
      expect(() => insertMigrationEvent(db, "migrated", null, null, "missing-target")).toThrow();
      expect(() =>
        insertMigrationEvent(db, "migrated", "plan:missing", 1, "phantom-target"),
      ).toThrow();
      seedAsset(db, "plan:adopted");
      expect(() =>
        insertMigrationEvent(db, "migrated", "plan:adopted", 1, "adopted"),
      ).not.toThrow();
    } finally {
      db.close();
    }
  });
});

const digest = "a".repeat(64);
const commit = "b".repeat(40);
const now = "2026-07-13T00:00:00Z";
const later = "2026-07-14T00:00:00Z";

function createV2Ledger(db: ReturnType<typeof openHarnessDb>): void {
  const v2Ddl = ledgerSchemaDdl().filter(
    (sql) =>
      !sql.includes("plan_admission_") &&
      !sql.includes("plan_draft_journal") &&
      !sql.includes("idx_plan_draft_journal_status"),
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const sql of v2Ddl) db.exec(sql);
    db.setUserVersion(2);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function insertMigrationEvent(
  db: ReturnType<typeof openHarnessDb>,
  decision: "pending" | "migrated" | "rejected",
  targetAssetId: string | null,
  targetRevision: number | null,
  suffix: string,
): void {
  const pending = decision === "pending";
  const rejected = decision === "rejected";
  db.prepare(
    `INSERT INTO legacy_plan_migration_events (
      migration_event_id, legacy_plan_id, sequence, command_id, command_payload_digest,
      event_kind, asset_id, target_asset_id, target_revision, decision, resolved_alias,
      collision_group, loss_fields_json, reason, review_plan_id, repository_identity,
      identity_algorithm, identity_input_json, identity_digest, identity_config_path,
      identity_config_blob_oid, identity_config_content_digest, identity_config_receipt_digest,
      source_digest, occurred_at, event_digest
    ) VALUES (${Array.from({ length: 26 }, () => "?").join(",")})`,
  ).run(
    `migration-event:${suffix}`,
    `PLAN-L7-${suffix}`,
    1,
    `command:${suffix}`,
    digest,
    "observed",
    `plan:derived:${suffix}`,
    targetAssetId,
    targetRevision,
    decision,
    decision === "migrated" ? `PLAN-L7-${suffix}` : null,
    null,
    rejected ? '["loss"]' : "[]",
    "test",
    pending || rejected ? "PLAN-L7-418-review" : null,
    "owner/repository",
    "ut-tdd-plan-legacy-v1",
    "[]",
    digest,
    "ut-tdd.project.json",
    commit,
    digest,
    digest,
    digest,
    now,
    digest,
  );
}

function seedAsset(db: ReturnType<typeof openHarnessDb>, assetId: string): void {
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(assetId, now, commit, "test");
  seedRevision(db, assetId, 1);
}

function seedRevision(
  db: ReturnType<typeof openHarnessDb>,
  assetId: string,
  revision: number,
): void {
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    assetId,
    revision,
    "{}",
    createHash("sha256").update("{}").digest("hex"),
    digest,
    "docs/plans/test.md",
    commit,
    "test",
    "test",
    now,
  );
}

function insertReceipt(
  db: ReturnType<typeof openHarnessDb>,
  kind: "plan_revision" | "reservation",
  assetId: string,
  revision: number,
): void {
  const row = {
    command_id: `command:${kind}:${assetId}`,
    command_type: "test",
    subject_kind: kind,
    subject_key: assetId,
    plan_asset_id: assetId,
    plan_revision: revision,
    command_payload_digest: digest,
    result_kind: "event",
    result_ref: "event:test",
    recorded_at: now,
  };
  db.prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(row),
    ledgerRowDigest(row, "receipt_digest"),
  );
}

function seedAliasReduction(db: ReturnType<typeof openHarnessDb>, assetId: string): void {
  seedAsset(db, assetId);
  const event = {
    alias_event_id: `alias-event:${assetId}`,
    asset_id: assetId,
    sequence: 1,
    command_id: `alias-command:${assetId}`,
    command_payload_digest: digest,
    event_kind: "assigned",
    alias: "PLAN-L7-1-a",
    revision: 1,
    reason: "test",
    occurred_at: now,
  };
  const eventDigest = ledgerRowDigest(event, "event_digest");
  db.prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(event),
    eventDigest,
  );
  db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
    `alias:${assetId}`,
    assetId,
    event.alias,
    1,
    null,
    eventDigest,
  );
}

function expectTamperRejected(
  setup: (db: ReturnType<typeof openHarnessDb>) => void,
  tamper: (db: ReturnType<typeof openHarnessDb>) => void,
): void {
  const db = openHarnessDb(":memory:");
  try {
    migratePlanLedger(db);
    setup(db);
    expect(migratePlanLedger(db)).toMatchObject({ ok: true });
    tamper(db);
    expect(migratePlanLedger(db)).toMatchObject({
      ok: false,
      ruleId: "plan-ledger-unavailable",
    });
  } finally {
    db.close();
  }
}

function replaceTrigger(db: ReturnType<typeof openHarnessDb>, name: string): void {
  db.exec(`DROP TRIGGER ${name}`);
}

function restoreTrigger(db: ReturnType<typeof openHarnessDb>, name: string): void {
  const trigger = ledgerSchemaDdl().find((sql) => sql.includes(name));
  if (!trigger) throw new Error(`fixture trigger missing: ${name}`);
  db.exec(trigger);
}
