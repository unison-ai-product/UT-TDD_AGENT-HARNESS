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
    expectTamperRejected(
      (db) => seedAliasReduction(db, "plan:a"),
      (db) => db.exec("UPDATE plan_aliases SET alias = 'PLAN-L7-tampered'"),
    );
    expectTamperRejected(
      (db) => seedAliasReduction(db, "plan:a"),
      (db) => {
        replaceTrigger(db, "trg_plan_alias_events_no_update");
        db.exec("UPDATE plan_alias_events SET reason = 'tampered'");
        restoreTrigger(db, "trg_plan_alias_events_no_update");
      },
    );
    expectTamperRejected(
      (db) => seedAsset(db, "plan:a"),
      (db) => {
        replaceTrigger(db, "trg_plan_revisions_no_update");
        db.exec("UPDATE plan_revisions SET canonical_payload_json = '{\"tampered\":true}'");
        restoreTrigger(db, "trg_plan_revisions_no_update");
      },
    );
  });
});

const digest = "a".repeat(64);
const commit = "b".repeat(40);
const now = "2026-07-13T00:00:00Z";
const later = "2026-07-14T00:00:00Z";

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
