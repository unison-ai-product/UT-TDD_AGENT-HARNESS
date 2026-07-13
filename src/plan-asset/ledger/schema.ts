import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  createIndexSql,
  createTableSql,
  createTriggerSql,
  type IndexDef,
  type TableDef,
  type TriggerDef,
} from "../../schema/harness-db.js";
import {
  col,
  enumCheck,
  foreignKey,
  pk,
  requiredCol,
} from "../../schema/harness-db-table-builders.js";
import { type HarnessDb, openHarnessDb } from "../../state-db/index.js";

export const LEDGER_SCHEMA_VERSION = 2;

function migrationTargetCheck() {
  return {
    kind: "or" as const,
    expressions: [
      {
        kind: "and" as const,
        expressions: [
          { kind: "in" as const, column: "decision", values: ["pending", "rejected"] },
          { kind: "is-null" as const, column: "target_asset_id" },
          { kind: "is-null" as const, column: "target_revision" },
        ],
      },
      {
        kind: "and" as const,
        expressions: [
          { kind: "in" as const, column: "decision", values: ["migrated", "rekeyed"] },
          { kind: "is-null" as const, column: "target_asset_id", negate: true },
          { kind: "is-null" as const, column: "target_revision", negate: true },
        ],
      },
    ],
  };
}

const tables: readonly TableDef[] = [
  {
    name: "plan_assets",
    columns: [
      pk("asset_id"),
      requiredCol("created_at"),
      requiredCol("created_source_commit"),
      requiredCol("identity_algorithm"),
    ],
  },
  {
    name: "plan_revisions",
    columns: [
      requiredCol("asset_id"),
      requiredCol("revision", "INTEGER"),
      requiredCol("canonical_payload_json"),
      requiredCol("canonical_payload_digest"),
      requiredCol("body_digest"),
      requiredCol("source_path"),
      requiredCol("source_commit"),
      requiredCol("actor"),
      requiredCol("reason"),
      requiredCol("created_at"),
    ],
    primaryKey: ["asset_id", "revision"],
    foreignKeys: [
      foreignKey(["asset_id"], {
        table: "plan_assets",
        columns: ["asset_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_alias_events",
    columns: [
      pk("alias_event_id"),
      requiredCol("asset_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      requiredCol("alias"),
      requiredCol("revision", "INTEGER"),
      requiredCol("reason"),
      requiredCol("occurred_at"),
      requiredCol("event_digest"),
    ],
    unique: [["asset_id", "sequence"], ["command_id"]],
    checks: [enumCheck("event_kind", ["assigned", "retired"])],
    foreignKeys: [
      foreignKey(["asset_id", "revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_aliases",
    columns: [
      pk("alias_id"),
      requiredCol("asset_id"),
      requiredCol("alias"),
      requiredCol("valid_from_revision", "INTEGER"),
      col("valid_to_revision", "INTEGER"),
      requiredCol("last_event_digest"),
    ],
    foreignKeys: [
      foreignKey(["asset_id", "valid_from_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["asset_id", "valid_to_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_id_reservation_events",
    columns: [
      pk("reservation_event_id"),
      requiredCol("reservation_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      requiredCol("namespace"),
      requiredCol("ordinal", "INTEGER"),
      requiredCol("asset_id"),
      requiredCol("lease_token_hash"),
      requiredCol("occurred_at"),
      col("expires_at"),
      requiredCol("event_digest"),
    ],
    unique: [["reservation_id", "sequence"], ["command_id"]],
    checks: [enumCheck("event_kind", ["reserved", "released", "expired"])],
    foreignKeys: [
      foreignKey(["asset_id"], {
        table: "plan_assets",
        columns: ["asset_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_id_reservations",
    columns: [
      pk("reservation_id"),
      requiredCol("namespace"),
      requiredCol("ordinal", "INTEGER"),
      requiredCol("asset_id"),
      requiredCol("lease_token_hash"),
      requiredCol("status"),
      requiredCol("reserved_at"),
      requiredCol("expires_at"),
      col("closed_at"),
      requiredCol("last_event_digest"),
    ],
    checks: [
      enumCheck("status", ["active", "released", "expired"]),
      {
        kind: "or",
        expressions: [
          {
            kind: "and",
            expressions: [
              { kind: "compare", column: "status", operator: "=", value: "active" },
              { kind: "is-null", column: "closed_at" },
            ],
          },
          {
            kind: "and",
            expressions: [
              { kind: "in", column: "status", values: ["released", "expired"] },
              { kind: "is-null", column: "closed_at", negate: true },
            ],
          },
        ],
      },
    ],
    foreignKeys: [
      foreignKey(["asset_id"], {
        table: "plan_assets",
        columns: ["asset_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "legacy_plan_migration_events",
    columns: [
      pk("migration_event_id"),
      requiredCol("legacy_plan_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      requiredCol("asset_id"),
      col("target_asset_id"),
      col("target_revision", "INTEGER"),
      requiredCol("decision"),
      col("resolved_alias"),
      col("collision_group"),
      requiredCol("loss_fields_json"),
      requiredCol("reason"),
      col("review_plan_id"),
      requiredCol("repository_identity"),
      requiredCol("identity_algorithm"),
      requiredCol("identity_input_json"),
      requiredCol("identity_digest"),
      requiredCol("identity_config_path"),
      requiredCol("identity_config_blob_oid"),
      requiredCol("identity_config_content_digest"),
      requiredCol("identity_config_receipt_digest"),
      requiredCol("source_digest"),
      requiredCol("occurred_at"),
      requiredCol("event_digest"),
    ],
    unique: [["legacy_plan_id", "sequence"], ["command_id"]],
    checks: [
      enumCheck("event_kind", ["observed", "decided", "revised"]),
      enumCheck("decision", ["pending", "migrated", "rekeyed", "rejected"]),
      {
        kind: "or",
        expressions: [
          {
            kind: "not",
            expression: { kind: "compare", column: "decision", operator: "=", value: "pending" },
          },
          {
            kind: "and",
            expressions: [
              { kind: "is-null", column: "resolved_alias" },
              { kind: "is-null", column: "review_plan_id", negate: true },
            ],
          },
        ],
      },
      migrationTargetCheck(),
    ],
    foreignKeys: [
      foreignKey(["target_asset_id", "target_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "legacy_plan_migrations",
    columns: [
      pk("migration_id"),
      requiredCol("legacy_plan_id"),
      requiredCol("asset_id"),
      col("target_asset_id"),
      col("target_revision", "INTEGER"),
      requiredCol("decision"),
      col("resolved_alias"),
      col("collision_group"),
      requiredCol("loss_fields_json"),
      requiredCol("reason"),
      col("review_plan_id"),
      requiredCol("identity_digest"),
      requiredCol("source_digest"),
      requiredCol("last_event_digest"),
    ],
    unique: [["legacy_plan_id"]],
    checks: [
      enumCheck("decision", ["pending", "migrated", "rekeyed", "rejected"]),
      migrationTargetCheck(),
    ],
    foreignKeys: [
      foreignKey(["target_asset_id", "target_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "append_command_receipts",
    columns: [
      pk("command_id"),
      requiredCol("command_type"),
      requiredCol("subject_kind"),
      requiredCol("subject_key"),
      col("plan_asset_id"),
      col("plan_revision", "INTEGER"),
      requiredCol("command_payload_digest"),
      requiredCol("result_kind"),
      requiredCol("result_ref"),
      requiredCol("recorded_at"),
      requiredCol("receipt_digest"),
    ],
    checks: [
      enumCheck("subject_kind", ["plan_revision", "reservation", "legacy_migration"]),
      {
        kind: "or",
        expressions: [
          {
            kind: "and",
            expressions: [
              { kind: "compare", column: "subject_kind", operator: "=", value: "plan_revision" },
              { kind: "is-null", column: "plan_asset_id", negate: true },
              { kind: "is-null", column: "plan_revision", negate: true },
            ],
          },
          {
            kind: "and",
            expressions: [
              { kind: "in", column: "subject_kind", values: ["reservation", "legacy_migration"] },
              { kind: "is-null", column: "plan_asset_id" },
              { kind: "is-null", column: "plan_revision" },
            ],
          },
        ],
      },
    ],
    foreignKeys: [
      foreignKey(["plan_asset_id", "plan_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
];

const indexes: readonly IndexDef[] = [
  { name: "idx_plan_assets_created_at", table: "plan_assets", columns: ["created_at"] },
  {
    name: "idx_plan_assets_source_commit",
    table: "plan_assets",
    columns: ["created_source_commit"],
  },
  {
    name: "idx_plan_alias_events_asset_sequence",
    table: "plan_alias_events",
    columns: ["asset_id", "sequence"],
  },
  { name: "idx_plan_alias_events_alias", table: "plan_alias_events", columns: ["alias"] },
  {
    name: "uq_plan_aliases_active",
    table: "plan_aliases",
    columns: ["alias"],
    unique: true,
    predicate: { kind: "is-null", column: "valid_to_revision" },
  },
  {
    name: "idx_plan_aliases_asset_revision",
    table: "plan_aliases",
    columns: ["asset_id", "valid_from_revision", "valid_to_revision"],
  },
  {
    name: "idx_plan_revisions_payload_digest",
    table: "plan_revisions",
    columns: ["canonical_payload_digest"],
  },
  {
    name: "idx_plan_reservation_events_namespace_ordinal",
    table: "plan_id_reservation_events",
    columns: ["namespace", "ordinal"],
  },
  {
    name: "uq_plan_reservations_active",
    table: "plan_id_reservations",
    columns: ["namespace", "ordinal"],
    unique: true,
    predicate: { kind: "equals", column: "status", value: "active" },
  },
  {
    name: "idx_plan_reservations_status_expiry",
    table: "plan_id_reservations",
    columns: ["status", "expires_at"],
  },
  {
    name: "idx_legacy_migration_events_decision_collision",
    table: "legacy_plan_migration_events",
    columns: ["decision", "collision_group"],
  },
  {
    name: "idx_legacy_migrations_decision_collision",
    table: "legacy_plan_migrations",
    columns: ["decision", "collision_group"],
  },
  {
    name: "idx_append_receipts_subject",
    table: "append_command_receipts",
    columns: ["subject_kind", "subject_key"],
  },
  {
    name: "idx_append_receipts_type_time",
    table: "append_command_receipts",
    columns: ["command_type", "recorded_at"],
  },
];

const historyTables = [
  "plan_assets",
  "plan_revisions",
  "plan_alias_events",
  "plan_id_reservation_events",
  "legacy_plan_migration_events",
  "append_command_receipts",
] as const;
const triggers: readonly TriggerDef[] = historyTables.flatMap((table) =>
  (["UPDATE", "DELETE"] as const).map((event) => ({
    name: `trg_${table}_no_${event.toLowerCase()}`,
    table,
    timing: "BEFORE" as const,
    event,
    action: { kind: "raise-abort" as const, message: `append-only:${table}` },
  })),
);

export function ledgerSchemaDdl(): readonly string[] {
  return [
    ...tables.map(createTableSql),
    ...indexes.map(createIndexSql),
    ...triggers.map(createTriggerSql),
  ];
}

export function migratePlanLedger(
  db: HarnessDb,
): { ok: true; version: number } | { ok: false; ruleId: "plan-ledger-unavailable" } {
  const version = db.userVersion();
  if (version !== 0 && version !== LEDGER_SCHEMA_VERSION)
    return { ok: false, ruleId: "plan-ledger-unavailable" };
  if (version === 0) {
    if (schemaObjects(db).length > 0) return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const ddl of ledgerSchemaDdl()) db.exec(ddl);
      db.setUserVersion(LEDGER_SCHEMA_VERSION);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return schemaMatches(db) && ledgerRowsValid(db)
    ? { ok: true, version: LEDGER_SCHEMA_VERSION }
    : { ok: false, ruleId: "plan-ledger-unavailable" };
}

export function ledgerRowDigest(
  row: Readonly<Record<string, unknown>>,
  digestColumn: string,
): string {
  const frame = Object.entries(row)
    .filter(([key]) => key !== digestColumn)
    .sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right)));
  return createHash("sha256").update(JSON.stringify(frame)).digest("hex");
}

function schemaObjects(db: HarnessDb): readonly { type: string; name: string; sql: string }[] {
  return db
    .prepare(
      "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    )
    .all()
    .map((row) => ({
      type: String(row.type),
      name: String(row.name),
      sql: String(row.sql ?? ""),
    }));
}

function schemaMatches(db: HarnessDb): boolean {
  const expected = new Map<string, string>([
    ...tables.map((table) => [`table:${table.name}`, normalizeDdl(createTableSql(table))] as const),
    ...indexes.map(
      (index) => [`index:${index.name}`, normalizeDdl(createIndexSql(index))] as const,
    ),
    ...triggers.map(
      (trigger) => [`trigger:${trigger.name}`, normalizeDdl(createTriggerSql(trigger))] as const,
    ),
  ]);
  const actual = schemaObjects(db);
  if (
    actual.length !== expected.size ||
    actual.some((row) => expected.get(`${row.type}:${row.name}`) !== normalizeDdl(row.sql))
  )
    return false;
  const integrity = db.prepare("PRAGMA integrity_check").get();
  const foreignKeys = db.prepare("PRAGMA foreign_key_check").all();
  return String(integrity?.integrity_check ?? "") === "ok" && foreignKeys.length === 0;
}

function ledgerRowsValid(db: HarnessDb): boolean {
  for (const [table, digestColumn] of [
    ["plan_alias_events", "event_digest"],
    ["plan_id_reservation_events", "event_digest"],
    ["legacy_plan_migration_events", "event_digest"],
    ["append_command_receipts", "receipt_digest"],
  ] as const) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.some((row) => row[digestColumn] !== ledgerRowDigest(row, digestColumn))) return false;
  }
  const revisions = db
    .prepare("SELECT canonical_payload_json, canonical_payload_digest FROM plan_revisions")
    .all();
  if (
    revisions.some(
      (row) =>
        createHash("sha256").update(String(row.canonical_payload_json)).digest("hex") !==
        row.canonical_payload_digest,
    )
  )
    return false;
  return (
    aliasReductionsValid(db) &&
    reservationReductionsValid(db) &&
    migrationReductionsValid(db) &&
    reservationReceiptsValid(db)
  );
}

function reservationReceiptsValid(db: HarnessDb): boolean {
  const orphanEvents = db
    .prepare(
      `SELECT COUNT(*) AS n FROM plan_id_reservation_events event
       LEFT JOIN plan_id_reservations current ON current.reservation_id = event.reservation_id
       LEFT JOIN append_command_receipts receipt ON receipt.result_ref = event.reservation_event_id
       WHERE current.reservation_id IS NULL OR receipt.command_id IS NULL
         OR receipt.subject_kind != 'reservation'
         OR receipt.command_id != event.command_id
         OR receipt.command_payload_digest != event.command_payload_digest
         OR receipt.subject_key != event.reservation_id
         OR receipt.result_kind != 'reservation_event'
         OR receipt.recorded_at != event.occurred_at
         OR receipt.command_type != CASE event.event_kind
           WHEN 'reserved' THEN 'reservation.reserve'
           WHEN 'released' THEN 'reservation.release'
           WHEN 'expired' THEN 'reservation.expire'
         END`,
    )
    .get();
  const orphanReceipts = db
    .prepare(
      `SELECT COUNT(*) AS n FROM append_command_receipts receipt
       LEFT JOIN plan_id_reservation_events event ON event.reservation_event_id = receipt.result_ref
       WHERE receipt.subject_kind = 'reservation' AND event.reservation_event_id IS NULL`,
    )
    .get();
  return Number(orphanEvents?.n ?? 0) === 0 && Number(orphanReceipts?.n ?? 0) === 0;
}

function aliasReductionsValid(db: HarnessDb): boolean {
  return db
    .prepare("SELECT * FROM plan_aliases")
    .all()
    .every((current) => {
      const stream = db
        .prepare(
          "SELECT * FROM plan_alias_events WHERE asset_id = ? AND alias = ? ORDER BY sequence",
        )
        .all(current.asset_id, current.alias);
      if (stream.length === 0) return false;
      const assigned = stream.find((event) => event.event_kind === "assigned");
      const latest = stream.at(-1);
      if (!assigned || !latest || current.last_event_digest !== latest.event_digest) return false;
      if (!sameFields(current, latest, ["asset_id", "alias"])) return false;
      if (current.valid_from_revision !== assigned.revision) return false;
      return latest.event_kind === "assigned"
        ? current.valid_to_revision == null
        : latest.event_kind === "retired" && current.valid_to_revision === latest.revision;
    });
}

function reservationReductionsValid(db: HarnessDb): boolean {
  return db
    .prepare("SELECT * FROM plan_id_reservations")
    .all()
    .every((current) => {
      const stream = db
        .prepare(
          "SELECT * FROM plan_id_reservation_events WHERE reservation_id = ? ORDER BY sequence",
        )
        .all(current.reservation_id);
      const first = stream[0];
      const latest = stream.at(-1);
      if (!first || !latest || first.event_kind !== "reserved" || !continuous(stream)) return false;
      if (current.last_event_digest !== latest.event_digest) return false;
      if (
        !sameFields(current, first, [
          "reservation_id",
          "namespace",
          "ordinal",
          "asset_id",
          "lease_token_hash",
        ])
      )
        return false;
      if (
        !stream.every((event) =>
          sameFields(first, event, [
            "reservation_id",
            "namespace",
            "ordinal",
            "asset_id",
            "lease_token_hash",
          ]),
        )
      )
        return false;
      const status = latest.event_kind === "reserved" ? "active" : latest.event_kind;
      return (
        current.status === status &&
        current.reserved_at === first.occurred_at &&
        current.expires_at === first.expires_at &&
        (status === "active" ? current.closed_at == null : current.closed_at === latest.occurred_at)
      );
    });
}

function migrationReductionsValid(db: HarnessDb): boolean {
  return db
    .prepare("SELECT * FROM legacy_plan_migrations")
    .all()
    .every((current) => {
      const stream = db
        .prepare(
          "SELECT * FROM legacy_plan_migration_events WHERE legacy_plan_id = ? ORDER BY sequence",
        )
        .all(current.legacy_plan_id);
      const latest = stream.at(-1);
      if (!latest || !continuous(stream) || current.last_event_digest !== latest.event_digest)
        return false;
      return sameFields(current, latest, [
        "legacy_plan_id",
        "asset_id",
        "target_asset_id",
        "target_revision",
        "decision",
        "resolved_alias",
        "collision_group",
        "loss_fields_json",
        "reason",
        "review_plan_id",
        "identity_digest",
        "source_digest",
      ]);
    });
}

function continuous(stream: readonly Readonly<Record<string, unknown>>[]): boolean {
  return stream.every((event, index) => event.sequence === index + 1);
}

function sameFields(
  left: Readonly<Record<string, unknown>>,
  right: Readonly<Record<string, unknown>>,
  fields: readonly string[],
): boolean {
  return fields.every((field) => left[field] === right[field]);
}

function normalizeDdl(sql: string): string {
  return sql
    .replace(/\bIF NOT EXISTS\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;$/, "");
}

export function openPlanLedger(input: { repoRoot: string; path?: string }): HarnessDb {
  const path = input.path ?? join(input.repoRoot, ".ut-tdd", "ledger", "harness-ledger.db");
  return openHarnessDb(path, { repoRoot: input.repoRoot });
}
