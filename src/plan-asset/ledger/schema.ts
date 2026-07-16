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
import {
  executionLedgerV5Indexes,
  executionLedgerV5Tables,
  executionLedgerV5Triggers,
} from "../../execution-ledger/adapters/sqlite/schema-definitions.js";

export const LEDGER_SCHEMA_VERSION = 5;

export interface LedgerSchemaMigrationFaultPort {
  after(boundary: string): void;
}

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

const v3Tables: readonly TableDef[] = [
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
      requiredCol("lease_key_version"),
      requiredCol("lease_token_hash"),
      requiredCol("occurred_at"),
      col("expires_at"),
      requiredCol("event_digest"),
    ],
    unique: [["reservation_id", "sequence"], ["command_id"]],
    checks: [
      enumCheck("event_kind", ["reserved", "released", "expired"]),
      { kind: "compare", column: "lease_key_version", operator: "!=", value: "" },
      { kind: "not-contains", column: "lease_key_version", value: "." },
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
    name: "plan_id_reservations",
    columns: [
      pk("reservation_id"),
      requiredCol("namespace"),
      requiredCol("ordinal", "INTEGER"),
      requiredCol("asset_id"),
      requiredCol("lease_key_version"),
      requiredCol("lease_token_hash"),
      requiredCol("status"),
      requiredCol("reserved_at"),
      requiredCol("expires_at"),
      col("closed_at"),
      requiredCol("last_event_digest"),
    ],
    checks: [
      enumCheck("status", ["active", "released", "expired"]),
      { kind: "compare", column: "lease_key_version", operator: "!=", value: "" },
      { kind: "not-contains", column: "lease_key_version", value: "." },
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

const v4Tables: readonly TableDef[] = [
  {
    name: "plan_admission_events",
    columns: [
      pk("admission_event_id"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      requiredCol("plan_asset_id"),
      requiredCol("plan_revision", "INTEGER"),
      requiredCol("plan_id"),
      requiredCol("source_path"),
      requiredCol("content_digest"),
      requiredCol("route_tuple_digest"),
      requiredCol("certificate_id"),
      requiredCol("certificate_digest"),
      requiredCol("occurred_at"),
      requiredCol("event_digest"),
    ],
    unique: [["command_id"], ["certificate_id"]],
    checks: [enumCheck("event_kind", ["admitted"])],
    foreignKeys: [
      foreignKey(["plan_asset_id", "plan_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_admission_receipts",
    columns: [
      pk("certificate_id"),
      requiredCol("admission_event_id"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("plan_asset_id"),
      requiredCol("plan_revision", "INTEGER"),
      requiredCol("plan_id"),
      requiredCol("source_path"),
      requiredCol("content_digest"),
      requiredCol("route_tuple_digest"),
      requiredCol("certificate_digest"),
      requiredCol("recorded_at"),
    ],
    unique: [["admission_event_id"], ["command_id"]],
    foreignKeys: [
      foreignKey(["admission_event_id"], {
        table: "plan_admission_events",
        columns: ["admission_event_id"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["plan_asset_id", "plan_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_draft_journal",
    columns: [
      pk("journal_id"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("status"),
      requiredCol("requested_plan_id"),
      requiredCol("requested_source_path"),
      col("plan_asset_id"),
      col("plan_revision", "INTEGER"),
      col("certificate_id"),
      requiredCol("intent_recorded_at"),
      col("completed_at"),
      col("failure_reason"),
      requiredCol("journal_digest"),
    ],
    unique: [["command_id"]],
    checks: [
      enumCheck("status", ["intent", "committed", "recovery_required", "rolled_back"]),
      {
        kind: "or",
        expressions: [
          {
            kind: "and",
            expressions: [
              { kind: "compare", column: "status", operator: "=", value: "intent" },
              { kind: "is-null", column: "completed_at" },
            ],
          },
          {
            kind: "and",
            expressions: [
              {
                kind: "in",
                column: "status",
                values: ["committed", "recovery_required", "rolled_back"],
              },
              { kind: "is-null", column: "completed_at", negate: true },
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
      foreignKey(["certificate_id"], {
        table: "plan_admission_receipts",
        columns: ["certificate_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "plan_draft_journal_events",
    columns: [
      pk("journal_event_id"),
      requiredCol("command_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      requiredCol("requested_plan_id"),
      requiredCol("requested_source_path"),
      col("plan_asset_id"),
      col("plan_revision", "INTEGER"),
      col("certificate_id"),
      requiredCol("occurred_at"),
      col("failure_reason"),
      col("previous_event_digest"),
      requiredCol("event_digest"),
    ],
    unique: [["command_id", "sequence"]],
    checks: [enumCheck("event_kind", ["intent", "committed", "recovery_required", "rolled_back"])],
  },
];

const v4SchemaTables: readonly TableDef[] = [...v3Tables, ...v4Tables];
const tables: readonly TableDef[] = [...v4SchemaTables, ...executionLedgerV5Tables];

const v3Indexes: readonly IndexDef[] = [
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

const v4Indexes: readonly IndexDef[] = [
  {
    name: "idx_plan_admission_events_plan_revision",
    table: "plan_admission_events",
    columns: ["plan_asset_id", "plan_revision"],
  },
  {
    name: "idx_plan_admission_receipts_plan_id",
    table: "plan_admission_receipts",
    columns: ["plan_id", "recorded_at"],
  },
  {
    name: "idx_plan_draft_journal_status",
    table: "plan_draft_journal",
    columns: ["status", "intent_recorded_at"],
  },
];

const v4SchemaIndexes: readonly IndexDef[] = [...v3Indexes, ...v4Indexes];
const indexes: readonly IndexDef[] = [...v4SchemaIndexes, ...executionLedgerV5Indexes];

const v3HistoryTables = [
  "plan_assets",
  "plan_revisions",
  "plan_alias_events",
  "plan_id_reservation_events",
  "legacy_plan_migration_events",
  "append_command_receipts",
] as const;
const v4HistoryTables = [
  "plan_admission_events",
  "plan_admission_receipts",
  "plan_draft_journal_events",
] as const;

function appendOnlyTriggers(historyTables: readonly string[]): readonly TriggerDef[] {
  return historyTables.flatMap((table) =>
    (["UPDATE", "DELETE"] as const).map((event) => ({
      name: `trg_${table}_no_${event.toLowerCase()}`,
      table,
      timing: "BEFORE" as const,
      event,
      action: { kind: "raise-abort" as const, message: `append-only:${table}` },
    })),
  );
}

const v3Triggers = appendOnlyTriggers(v3HistoryTables);
const v4Triggers = appendOnlyTriggers(v4HistoryTables);
const v4SchemaTriggers: readonly TriggerDef[] = [...v3Triggers, ...v4Triggers];
const triggers: readonly TriggerDef[] = [...v4SchemaTriggers, ...executionLedgerV5Triggers];

export function ledgerSchemaDdl(version: 3 | 4 | 5 = LEDGER_SCHEMA_VERSION): readonly string[] {
  const selectedTables = version === 3 ? v3Tables : version === 4 ? v4SchemaTables : tables;
  const selectedIndexes = version === 3 ? v3Indexes : version === 4 ? v4SchemaIndexes : indexes;
  const selectedTriggers = version === 3 ? v3Triggers : version === 4 ? v4SchemaTriggers : triggers;
  return [
    ...selectedTables.map(createTableSql),
    ...selectedIndexes.map(createIndexSql),
    ...selectedTriggers.map(createTriggerSql),
  ];
}

export function migratePlanLedger(
  db: HarnessDb,
  options: { readonly fault?: LedgerSchemaMigrationFaultPort } = {},
): { ok: true; version: number } | { ok: false; ruleId: "plan-ledger-unavailable" } {
  const version = db.userVersion();
  if (version !== 0 && version !== 2 && version !== 3 && version !== 4 && version !== 5)
    return { ok: false, ruleId: "plan-ledger-unavailable" };
  if (version === 2 && !migrateV2ToV4(db, options.fault)) {
    return { ok: false, ruleId: "plan-ledger-unavailable" };
  }
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
  if (db.userVersion() === 3) {
    if (
      !schemaMatchesVersion(db, { tables: v3Tables, indexes: v3Indexes, triggers: v3Triggers }) ||
      !ledgerRowsValid(db)
    )
      return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      // Revalidate after acquiring the writer lock so migration never extends a
      // schema or row set that changed between validation and migration.
      if (
        !schemaMatchesVersion(db, { tables: v3Tables, indexes: v3Indexes, triggers: v3Triggers }) ||
        !ledgerRowsValid(db)
      ) {
        db.exec("ROLLBACK");
        return { ok: false, ruleId: "plan-ledger-unavailable" };
      }
      for (const table of v4Tables) db.exec(createTableSql(table));
      for (const index of v4Indexes) db.exec(createIndexSql(index));
      for (const trigger of v4Triggers) db.exec(createTriggerSql(trigger));
      installV5Schema(db);
      options.fault?.after("v3-v5-schema-created");
      db.setUserVersion(LEDGER_SCHEMA_VERSION);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (db.userVersion() === 4) {
    if (
      !schemaMatchesVersion(db, {
        tables: v4SchemaTables,
        indexes: v4SchemaIndexes,
        triggers: v4SchemaTriggers,
      }) ||
      !ledgerRowsValid(db)
    )
      return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      if (
        !schemaMatchesVersion(db, {
          tables: v4SchemaTables,
          indexes: v4SchemaIndexes,
          triggers: v4SchemaTriggers,
        }) ||
        !ledgerRowsValid(db)
      ) {
        db.exec("ROLLBACK");
        return { ok: false, ruleId: "plan-ledger-unavailable" };
      }
      installV5Schema(db);
      options.fault?.after("v4-v5-schema-created");
      db.setUserVersion(LEDGER_SCHEMA_VERSION);
      if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v4-v5-verification-failed");
      db.exec("COMMIT");
    } catch {
      db.exec("ROLLBACK");
      return { ok: false, ruleId: "plan-ledger-unavailable" };
    }
  }
  return schemaMatches(db) && ledgerRowsValid(db)
    ? { ok: true, version: LEDGER_SCHEMA_VERSION }
    : { ok: false, ruleId: "plan-ledger-unavailable" };
}

function migrateV2ToV4(db: HarnessDb, fault?: LedgerSchemaMigrationFaultPort): boolean {
  if (!legacyV2ReservationSchemaValid(db) || reservationRowCount(db) !== 0) return false;
  const reservationTables = new Set(["plan_id_reservation_events", "plan_id_reservations"]);
  const reservationIndexes = indexes.filter((index) => reservationTables.has(index.table));
  const reservationTriggers = triggers.filter((trigger) => reservationTables.has(trigger.table));
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const trigger of reservationTriggers) db.exec(`DROP TRIGGER ${trigger.name}`);
    for (const index of reservationIndexes) db.exec(`DROP INDEX ${index.name}`);
    db.exec("ALTER TABLE plan_id_reservation_events RENAME TO plan_id_reservation_events_v2");
    db.exec("ALTER TABLE plan_id_reservations RENAME TO plan_id_reservations_v2");
    fault?.after("v2-v3-tables-renamed");
    for (const table of tables.filter((candidate) => reservationTables.has(candidate.name))) {
      db.exec(createTableSql(table));
    }
    fault?.after("v2-v3-tables-created");
    db.exec("DROP TABLE plan_id_reservations_v2");
    db.exec("DROP TABLE plan_id_reservation_events_v2");
    for (const index of reservationIndexes) db.exec(createIndexSql(index));
    for (const trigger of reservationTriggers) db.exec(createTriggerSql(trigger));
    fault?.after("v2-v3-schema-created");
    db.setUserVersion(3);
    if (
      !schemaMatchesVersion(db, { tables: v3Tables, indexes: v3Indexes, triggers: v3Triggers }) ||
      !ledgerRowsValid(db)
    )
      throw new Error("v2-v3-verification-failed");
    // Keep custody v3 as the validated migration boundary, but do not expose it
    // as a committed intermediate state. Admission v4 is installed in the same
    // writer transaction so every v2 upgrade is all-or-nothing.
    for (const table of v4Tables) db.exec(createTableSql(table));
    for (const index of v4Indexes) db.exec(createIndexSql(index));
    for (const trigger of v4Triggers) db.exec(createTriggerSql(trigger));
    fault?.after("v2-v4-schema-created");
    installV5Schema(db);
    fault?.after("v2-v5-schema-created");
    db.setUserVersion(LEDGER_SCHEMA_VERSION);
    if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v2-v4-verification-failed");
    db.exec("COMMIT");
    return true;
  } catch {
    db.exec("ROLLBACK");
    return false;
  }
}

function installV5Schema(db: HarnessDb): void {
  for (const table of executionLedgerV5Tables) db.exec(createTableSql(table));
  for (const index of executionLedgerV5Indexes) db.exec(createIndexSql(index));
  for (const trigger of executionLedgerV5Triggers) db.exec(createTriggerSql(trigger));
}

function legacyV2ReservationSchemaValid(db: HarnessDb): boolean {
  const actual = new Map(
    schemaObjects(db).map((row) => [`${row.type}:${row.name}`, normalizeDdl(row.sql)]),
  );
  for (const name of ["plan_id_reservation_events", "plan_id_reservations"]) {
    const table = tables.find((candidate) => candidate.name === name);
    if (!table) return false;
    const expected = normalizeDdl(createTableSql(withoutLeaseKeyVersion(table)));
    if (actual.get(`table:${name}`) !== expected) return false;
  }
  return true;
}

function withoutLeaseKeyVersion(table: TableDef): TableDef {
  return {
    ...table,
    columns: table.columns.filter((column) => column.name !== "lease_key_version"),
    checks: table.checks?.filter((check) => !checkReferencesColumn(check, "lease_key_version")),
  };
}

function checkReferencesColumn(
  check: NonNullable<TableDef["checks"]>[number],
  column: string,
): boolean {
  if (check.kind === "and" || check.kind === "or") {
    return check.expressions.some((child) => checkReferencesColumn(child, column));
  }
  if (check.kind === "not") return checkReferencesColumn(check.expression, column);
  return check.column === column;
}

function reservationRowCount(db: HarnessDb): number {
  return ["plan_id_reservation_events", "plan_id_reservations"].reduce(
    (total, table) =>
      total + Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n ?? 0),
    0,
  );
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
  return schemaMatchesVersion(db, { tables, indexes, triggers });
}

function schemaMatchesVersion(
  db: HarnessDb,
  expected: {
    tables: readonly TableDef[];
    indexes: readonly IndexDef[];
    triggers: readonly TriggerDef[];
  },
): boolean {
  const expectedObjects = new Map<string, string>([
    ...expected.tables.map(
      (table) => [`table:${table.name}`, normalizeDdl(createTableSql(table))] as const,
    ),
    ...expected.indexes.map(
      (index) => [`index:${index.name}`, normalizeDdl(createIndexSql(index))] as const,
    ),
    ...expected.triggers.map(
      (trigger) => [`trigger:${trigger.name}`, normalizeDdl(createTriggerSql(trigger))] as const,
    ),
  ]);
  const actual = schemaObjects(db);
  if (
    actual.length !== expectedObjects.size ||
    actual.some((row) => expectedObjects.get(`${row.type}:${row.name}`) !== normalizeDdl(row.sql))
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
  if (db.userVersion() >= 4) {
    for (const [table, digestColumn] of [
      ["plan_admission_events", "event_digest"],
      ["plan_draft_journal", "journal_digest"],
      ["plan_draft_journal_events", "event_digest"],
    ] as const) {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      if (rows.some((row) => row[digestColumn] !== ledgerRowDigest(row, digestColumn)))
        return false;
    }
    if (!admissionReductionsValid(db) || !draftJournalReductionsValid(db)) return false;
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
    reservationReceiptsValid(db) &&
    migrationReceiptsValid(db)
  );
}

function draftJournalReductionsValid(db: HarnessDb): boolean {
  const currents = db.prepare("SELECT * FROM plan_draft_journal").all();
  const events = db
    .prepare("SELECT * FROM plan_draft_journal_events ORDER BY command_id, sequence")
    .all();
  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const event of events) {
    const commandId = String(event.command_id);
    const bucket = grouped.get(commandId) ?? [];
    bucket.push(event);
    grouped.set(commandId, bucket);
  }
  if (currents.length !== grouped.size) return false;
  for (const current of currents) {
    const commandEvents = grouped.get(String(current.command_id));
    if (!commandEvents?.length) return false;
    let previous: string | null = null;
    for (const [index, event] of commandEvents.entries()) {
      if (Number(event.sequence) !== index + 1 || event.previous_event_digest !== previous)
        return false;
      previous = String(event.event_digest);
    }
    const latest = commandEvents.at(-1);
    if (!latest) return false;
    if (
      latest.event_kind !== current.status ||
      latest.command_payload_digest !== current.command_payload_digest ||
      latest.requested_plan_id !== current.requested_plan_id ||
      latest.requested_source_path !== current.requested_source_path ||
      latest.plan_asset_id !== current.plan_asset_id ||
      latest.plan_revision !== current.plan_revision ||
      latest.certificate_id !== current.certificate_id
    )
      return false;
  }
  return true;
}

function admissionReductionsValid(db: HarnessDb): boolean {
  const eventsWithoutReceipt = db
    .prepare(
      `SELECT COUNT(*) AS n FROM plan_admission_events event
       LEFT JOIN plan_admission_receipts receipt
         ON receipt.admission_event_id = event.admission_event_id
       WHERE receipt.certificate_id IS NULL
         OR receipt.command_id != event.command_id
         OR receipt.command_payload_digest != event.command_payload_digest
         OR receipt.plan_asset_id != event.plan_asset_id
         OR receipt.plan_revision != event.plan_revision
         OR receipt.plan_id != event.plan_id
         OR receipt.source_path != event.source_path
         OR receipt.content_digest != event.content_digest
         OR receipt.route_tuple_digest != event.route_tuple_digest
         OR receipt.certificate_id != event.certificate_id
         OR receipt.certificate_digest != event.certificate_digest
         OR receipt.recorded_at != event.occurred_at`,
    )
    .get();
  const receiptsWithoutEvent = db
    .prepare(
      `SELECT COUNT(*) AS n FROM plan_admission_receipts receipt
       LEFT JOIN plan_admission_events event
         ON event.admission_event_id = receipt.admission_event_id
       WHERE event.admission_event_id IS NULL`,
    )
    .get();
  return Number(eventsWithoutReceipt?.n ?? 0) === 0 && Number(receiptsWithoutEvent?.n ?? 0) === 0;
}

function migrationReceiptsValid(db: HarnessDb): boolean {
  const orphanEvents = db
    .prepare(
      `SELECT COUNT(*) AS n FROM legacy_plan_migration_events event
       LEFT JOIN legacy_plan_migrations current ON current.legacy_plan_id = event.legacy_plan_id
       LEFT JOIN append_command_receipts receipt ON receipt.result_ref = event.migration_event_id
       WHERE current.legacy_plan_id IS NULL OR receipt.command_id IS NULL
         OR receipt.subject_kind != 'legacy_migration'
         OR receipt.command_id != event.command_id
         OR receipt.command_payload_digest != event.command_payload_digest
         OR receipt.subject_key != event.legacy_plan_id
         OR receipt.result_kind != 'migration_event'
         OR receipt.recorded_at != event.occurred_at
         OR receipt.command_type != CASE event.event_kind
           WHEN 'observed' THEN 'migration.observe'
           WHEN 'decided' THEN 'migration.decide'
           WHEN 'revised' THEN 'migration.revise'
         END`,
    )
    .get();
  const orphanReceipts = db
    .prepare(
      `SELECT COUNT(*) AS n FROM append_command_receipts receipt
       LEFT JOIN legacy_plan_migration_events event ON event.migration_event_id = receipt.result_ref
       WHERE receipt.subject_kind = 'legacy_migration' AND event.migration_event_id IS NULL`,
    )
    .get();
  return Number(orphanEvents?.n ?? 0) === 0 && Number(orphanReceipts?.n ?? 0) === 0;
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
          "lease_key_version",
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
            "lease_key_version",
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
  const currents = db.prepare("SELECT * FROM legacy_plan_migrations").all();
  const streamCount = Number(
    db.prepare("SELECT COUNT(DISTINCT legacy_plan_id) AS n FROM legacy_plan_migration_events").get()
      ?.n ?? 0,
  );
  return (
    streamCount === currents.length &&
    currents.every((current) => {
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
    })
  );
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
