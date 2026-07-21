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
import { deriveLegacyAssetId } from "../adapters/legacy-plan-adapter.js";
import { committedRevisionPredicateForSchema } from "./revision-visibility.js";

export const LEDGER_SCHEMA_VERSION = 8;

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

const v5Tables: readonly TableDef[] = [
  {
    name: "legacy_plan_bootstrap_provenance",
    columns: [
      requiredCol("asset_id"),
      requiredCol("revision", "INTEGER"),
      requiredCol("source_path"),
      requiredCol("source_commit"),
      requiredCol("source_blob_oid"),
      requiredCol("source_content_digest"),
      requiredCol("repository_identity"),
      requiredCol("identity_algorithm"),
      requiredCol("identity_input_json"),
      requiredCol("identity_digest"),
      requiredCol("recorded_at"),
      requiredCol("provenance_digest"),
    ],
    primaryKey: ["asset_id", "revision"],
    foreignKeys: [
      foreignKey(["asset_id", "revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
];

const v6Tables: readonly TableDef[] = [
  {
    name: "plan_draft_artifact_operation_events",
    columns: [
      pk("operation_event_id"),
      requiredCol("command_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      requiredCol("operation_json"),
      requiredCol("operation_digest"),
      col("failure_reason"),
      requiredCol("occurred_at"),
      col("previous_event_digest"),
      requiredCol("event_digest"),
    ],
    unique: [["command_id", "sequence"]],
    checks: [enumCheck("event_kind", ["pending", "completed", "legacy_unknown"])],
  },
];

const v7Tables: readonly TableDef[] = [
  {
    name: "authoring_command_group_headers",
    columns: [
      pk("group_id"),
      requiredCol("command_payload_digest"),
      requiredCol("member_set_digest"),
      requiredCol("member_count", "INTEGER"),
      requiredCol("created_at"),
      requiredCol("header_digest"),
    ],
    checks: [{ kind: "compare", column: "member_count", operator: ">", value: 0 }],
  },
  {
    name: "authoring_command_group_members",
    columns: [
      requiredCol("group_id"),
      requiredCol("member_id"),
      requiredCol("ordinal", "INTEGER"),
      requiredCol("artifact_path"),
      requiredCol("content_digest"),
      requiredCol("expected_preimage_json"),
      requiredCol("member_digest"),
    ],
    primaryKey: ["group_id", "member_id"],
    unique: [
      ["group_id", "ordinal"],
      ["group_id", "artifact_path"],
    ],
    checks: [{ kind: "compare", column: "ordinal", operator: ">", value: 0 }],
    foreignKeys: [
      foreignKey(["group_id"], {
        table: "authoring_command_group_headers",
        columns: ["group_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "authoring_command_group_phase_events",
    columns: [
      pk("phase_event_id"),
      requiredCol("group_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("command_payload_digest"),
      requiredCol("event_kind"),
      col("member_id"),
      col("publish_receipt_digest"),
      col("failure_reason"),
      requiredCol("occurred_at"),
      col("previous_event_digest"),
      requiredCol("event_digest"),
    ],
    unique: [["group_id", "sequence"]],
    checks: [
      enumCheck("event_kind", [
        "prepared",
        "member_started",
        "member_published",
        "committed",
        "recovery_required",
        "rolled_back",
      ]),
    ],
    foreignKeys: [
      foreignKey(["group_id"], {
        table: "authoring_command_group_headers",
        columns: ["group_id"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["group_id", "member_id"], {
        table: "authoring_command_group_members",
        columns: ["group_id", "member_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
];

const v8Tables: readonly TableDef[] = [
  {
    name: "authoring_operation_descriptors",
    columns: [
      pk("operation_id"),
      requiredCol("group_id"),
      requiredCol("command_payload_digest"),
      requiredCol("repository_identity"),
      requiredCol("base_commit"),
      requiredCol("artifact_count", "INTEGER"),
      requiredCol("prepared_at"),
      requiredCol("descriptor_digest"),
    ],
    unique: [["group_id"], ["operation_id", "group_id"]],
    checks: [{ kind: "compare", column: "artifact_count", operator: ">", value: 0 }],
    foreignKeys: [
      foreignKey(["group_id"], {
        table: "authoring_command_group_headers",
        columns: ["group_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "authoring_operation_artifacts",
    columns: [
      requiredCol("operation_id"),
      requiredCol("group_id"),
      requiredCol("member_id"),
      requiredCol("ordinal", "INTEGER"),
      requiredCol("artifact_role"),
      requiredCol("target_path"),
      requiredCol("temporary_path"),
      requiredCol("rollback_path"),
      requiredCol("pin_path"),
      requiredCol("expected_preimage_json"),
      requiredCol("postimage_digest"),
      requiredCol("artifact_digest"),
    ],
    primaryKey: ["operation_id", "member_id"],
    unique: [
      ["operation_id", "ordinal"],
      ["operation_id", "target_path"],
    ],
    checks: [{ kind: "compare", column: "ordinal", operator: ">", value: 0 }],
    foreignKeys: [
      foreignKey(["operation_id"], {
        table: "authoring_operation_descriptors",
        columns: ["operation_id"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["operation_id", "group_id"], {
        table: "authoring_operation_descriptors",
        columns: ["operation_id", "group_id"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["group_id", "member_id"], {
        table: "authoring_command_group_members",
        columns: ["group_id", "member_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "authoring_command_revision_bindings",
    columns: [
      requiredCol("group_id"),
      requiredCol("asset_id"),
      requiredCol("revision", "INTEGER"),
      requiredCol("artifact_role"),
      requiredCol("bound_at"),
      requiredCol("binding_digest"),
    ],
    primaryKey: ["group_id", "asset_id", "revision"],
    foreignKeys: [
      foreignKey(["group_id"], {
        table: "authoring_command_group_headers",
        columns: ["group_id"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["asset_id", "revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "authoring_recovery_assessment_events",
    columns: [
      pk("assessment_event_id"),
      requiredCol("operation_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("strategy"),
      requiredCol("assessment_json"),
      requiredCol("assessment_digest"),
      requiredCol("fencing_token"),
      requiredCol("occurred_at"),
      col("previous_event_digest"),
      requiredCol("event_digest"),
    ],
    unique: [["operation_id", "sequence"]],
    checks: [
      enumCheck("strategy", ["rollback", "roll_forward", "finalize", "none"]),
      { kind: "compare", column: "sequence", operator: ">", value: 0 },
    ],
    foreignKeys: [
      foreignKey(["operation_id"], {
        table: "authoring_operation_descriptors",
        columns: ["operation_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "authoring_recovery_attempt_events",
    columns: [
      pk("attempt_event_id"),
      requiredCol("operation_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("assessment_digest"),
      requiredCol("fencing_token"),
      requiredCol("strategy"),
      requiredCol("result"),
      requiredCol("actor"),
      requiredCol("occurred_at"),
      col("failure_reason"),
      col("previous_event_digest"),
      requiredCol("event_digest"),
    ],
    unique: [["operation_id", "sequence"]],
    checks: [
      enumCheck("strategy", ["rollback", "roll_forward", "finalize"]),
      enumCheck("result", ["started", "succeeded", "failed", "refused"]),
    ],
    foreignKeys: [
      foreignKey(["operation_id"], {
        table: "authoring_operation_descriptors",
        columns: ["operation_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "authoring_artifact_recovery_events",
    columns: [
      pk("recovery_event_id"),
      requiredCol("operation_id"),
      requiredCol("member_id"),
      requiredCol("sequence", "INTEGER"),
      requiredCol("action"),
      requiredCol("result"),
      requiredCol("before_state_json"),
      requiredCol("after_state_json"),
      requiredCol("assessment_digest"),
      requiredCol("fencing_token"),
      requiredCol("actor"),
      requiredCol("occurred_at"),
      col("failure_reason"),
      col("previous_event_digest"),
      requiredCol("event_digest"),
    ],
    unique: [["operation_id", "member_id", "sequence"]],
    checks: [
      enumCheck("action", ["inspect", "restore", "roll_forward", "finalize"]),
      enumCheck("result", ["succeeded", "failed", "refused"]),
    ],
    foreignKeys: [
      foreignKey(["operation_id", "member_id"], {
        table: "authoring_operation_artifacts",
        columns: ["operation_id", "member_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
];

const tables: readonly TableDef[] = [
  ...v3Tables,
  ...v4Tables,
  ...v5Tables,
  ...v6Tables,
  ...v7Tables,
  ...v8Tables,
];

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

const v5Indexes: readonly IndexDef[] = [
  {
    name: "idx_legacy_bootstrap_source_blob",
    table: "legacy_plan_bootstrap_provenance",
    columns: ["source_commit", "source_blob_oid"],
  },
];

const v6Indexes: readonly IndexDef[] = [
  {
    name: "idx_plan_draft_artifact_operations_command",
    table: "plan_draft_artifact_operation_events",
    columns: ["command_id", "sequence"],
  },
];
const v7Indexes: readonly IndexDef[] = [
  {
    name: "idx_authoring_command_group_phase",
    table: "authoring_command_group_phase_events",
    columns: ["group_id", "sequence"],
  },
];
const v8Indexes: readonly IndexDef[] = [
  {
    name: "idx_authoring_revision_binding_revision",
    table: "authoring_command_revision_bindings",
    columns: ["asset_id", "revision"],
  },
  {
    name: "idx_authoring_recovery_assessment",
    table: "authoring_recovery_assessment_events",
    columns: ["operation_id", "sequence"],
  },
  {
    name: "idx_authoring_recovery_attempt",
    table: "authoring_recovery_attempt_events",
    columns: ["operation_id", "sequence"],
  },
  {
    name: "idx_authoring_artifact_recovery",
    table: "authoring_artifact_recovery_events",
    columns: ["operation_id", "member_id", "sequence"],
  },
];

const indexes: readonly IndexDef[] = [
  ...v3Indexes,
  ...v4Indexes,
  ...v5Indexes,
  ...v6Indexes,
  ...v7Indexes,
  ...v8Indexes,
];

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
const v5HistoryTables = ["legacy_plan_bootstrap_provenance"] as const;
const v6HistoryTables = ["plan_draft_artifact_operation_events"] as const;
const v7HistoryTables = [
  "authoring_command_group_headers",
  "authoring_command_group_members",
  "authoring_command_group_phase_events",
] as const;
const v8HistoryTables = [
  "authoring_operation_descriptors",
  "authoring_operation_artifacts",
  "authoring_command_revision_bindings",
  "authoring_recovery_assessment_events",
  "authoring_recovery_attempt_events",
  "authoring_artifact_recovery_events",
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
const v5Triggers = appendOnlyTriggers(v5HistoryTables);
const v6Triggers = appendOnlyTriggers(v6HistoryTables);
const v7Triggers = appendOnlyTriggers(v7HistoryTables);
const v8Triggers = appendOnlyTriggers(v8HistoryTables);
const triggers: readonly TriggerDef[] = [
  ...v3Triggers,
  ...v4Triggers,
  ...v5Triggers,
  ...v6Triggers,
  ...v7Triggers,
  ...v8Triggers,
];

export function ledgerSchemaDdl(): readonly string[] {
  return [
    ...tables.map(createTableSql),
    ...indexes.map(createIndexSql),
    ...triggers.map(createTriggerSql),
  ];
}

export function migratePlanLedger(
  db: HarnessDb,
  options: { readonly fault?: LedgerSchemaMigrationFaultPort } = {},
): { ok: true; version: number } | { ok: false; ruleId: "plan-ledger-unavailable" } {
  const version = db.userVersion();
  if (
    version !== 0 &&
    version !== 2 &&
    version !== 3 &&
    version !== 4 &&
    version !== 5 &&
    version !== 6 &&
    version !== 7 &&
    version !== LEDGER_SCHEMA_VERSION
  )
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
      installV5(db);
      installV6(db, 3);
      installV7(db);
      installV8(db, options.fault);
      if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v3-v8-verification-failed");
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (db.userVersion() === 4) {
    if (!v4LedgerValid(db)) return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!v4LedgerValid(db)) {
        db.exec("ROLLBACK");
        return { ok: false, ruleId: "plan-ledger-unavailable" };
      }
      installV5(db);
      installV6(db, 4);
      installV7(db);
      installV8(db, options.fault);
      if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v4-v8-verification-failed");
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (db.userVersion() === 5) {
    if (!v5LedgerValid(db)) return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!v5LedgerValid(db)) {
        db.exec("ROLLBACK");
        return { ok: false, ruleId: "plan-ledger-unavailable" };
      }
      installV6(db, 5);
      installV7(db);
      installV8(db, options.fault);
      if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v5-v8-verification-failed");
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (db.userVersion() === 6) {
    if (!v6LedgerValid(db)) return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!v6LedgerValid(db)) {
        db.exec("ROLLBACK");
        return { ok: false, ruleId: "plan-ledger-unavailable" };
      }
      installV7(db);
      installV8(db, options.fault);
      if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v6-v8-verification-failed");
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  if (db.userVersion() === 7) {
    if (!v7LedgerValid(db)) return { ok: false, ruleId: "plan-ledger-unavailable" };
    db.exec("BEGIN IMMEDIATE");
    try {
      if (!v7LedgerValid(db)) {
        db.exec("ROLLBACK");
        return { ok: false, ruleId: "plan-ledger-unavailable" };
      }
      installV8(db, options.fault);
      if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v7-v8-verification-failed");
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

function v4LedgerValid(db: HarnessDb): boolean {
  return (
    schemaMatchesVersion(db, {
      tables: [...v3Tables, ...v4Tables],
      indexes: [...v3Indexes, ...v4Indexes],
      triggers: [...v3Triggers, ...v4Triggers],
    }) && ledgerRowsValid(db)
  );
}

function v5LedgerValid(db: HarnessDb): boolean {
  return (
    schemaMatchesVersion(db, {
      tables: [...v3Tables, ...v4Tables, ...v5Tables],
      indexes: [...v3Indexes, ...v4Indexes, ...v5Indexes],
      triggers: [...v3Triggers, ...v4Triggers, ...v5Triggers],
    }) && ledgerRowsValid(db)
  );
}

function v6LedgerValid(db: HarnessDb): boolean {
  return (
    schemaMatchesVersion(db, {
      tables: [...v3Tables, ...v4Tables, ...v5Tables, ...v6Tables],
      indexes: [...v3Indexes, ...v4Indexes, ...v5Indexes, ...v6Indexes],
      triggers: [...v3Triggers, ...v4Triggers, ...v5Triggers, ...v6Triggers],
    }) && ledgerRowsValid(db)
  );
}

function v7LedgerValid(db: HarnessDb): boolean {
  return (
    schemaMatchesVersion(db, {
      tables: [...v3Tables, ...v4Tables, ...v5Tables, ...v6Tables, ...v7Tables],
      indexes: [...v3Indexes, ...v4Indexes, ...v5Indexes, ...v6Indexes, ...v7Indexes],
      triggers: [...v3Triggers, ...v4Triggers, ...v5Triggers, ...v6Triggers, ...v7Triggers],
    }) && ledgerRowsValid(db)
  );
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
    installV5(db);
    installV6(db, 2);
    installV7(db);
    installV8(db, fault);
    if (!schemaMatches(db) || !ledgerRowsValid(db)) throw new Error("v2-v8-verification-failed");
    db.exec("COMMIT");
    return true;
  } catch {
    db.exec("ROLLBACK");
    return false;
  }
}

function installV5(db: HarnessDb): void {
  for (const table of v5Tables) db.exec(createTableSql(table));
  for (const index of v5Indexes) db.exec(createIndexSql(index));
  for (const trigger of v5Triggers) db.exec(createTriggerSql(trigger));
  db.setUserVersion(5);
}

function installV6(db: HarnessDb, sourceSchemaVersion: 2 | 3 | 4 | 5): void {
  for (const table of v6Tables) db.exec(createTableSql(table));
  backfillLegacyUnknownDraftCleanup(db, sourceSchemaVersion);
  for (const index of v6Indexes) db.exec(createIndexSql(index));
  for (const trigger of v6Triggers) db.exec(createTriggerSql(trigger));
  db.setUserVersion(6);
}

function installV7(db: HarnessDb): void {
  for (const table of v7Tables) db.exec(createTableSql(table));
  for (const index of v7Indexes) db.exec(createIndexSql(index));
  for (const trigger of v7Triggers) db.exec(createTriggerSql(trigger));
  db.setUserVersion(7);
}

function installV8(db: HarnessDb, fault?: LedgerSchemaMigrationFaultPort): void {
  for (const table of v8Tables) db.exec(createTableSql(table));
  fault?.after("v7-v8-tables-created");
  for (const index of v8Indexes) db.exec(createIndexSql(index));
  fault?.after("v7-v8-indexes-created");
  for (const trigger of v8Triggers) db.exec(createTriggerSql(trigger));
  fault?.after("v7-v8-triggers-created");
  db.setUserVersion(LEDGER_SCHEMA_VERSION);
  fault?.after("v7-v8-user-version-set");
}

function backfillLegacyUnknownDraftCleanup(
  db: HarnessDb,
  sourceSchemaVersion: 2 | 3 | 4 | 5,
): void {
  const journals = db
    .prepare(
      `SELECT journal.*, event.event_digest AS latest_event_digest
       FROM plan_draft_journal journal
       JOIN plan_draft_journal_events event ON event.command_id = journal.command_id
       WHERE status = 'committed'
         AND event.sequence = (
           SELECT MAX(latest.sequence) FROM plan_draft_journal_events latest
           WHERE latest.command_id = journal.command_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM plan_draft_artifact_operation_events operation
           WHERE operation.command_id = journal.command_id
         )
       ORDER BY command_id`,
    )
    .all();
  for (const journal of journals) {
    const commandId = String(journal.command_id);
    const payloadDigest = String(journal.command_payload_digest);
    const reason = "旧schemaにはartifact cleanup provenanceが存在せず完了状態を証明できない";
    const operationJson = JSON.stringify({
      operation: "legacy_unknown",
      sourceSchemaVersion,
      journalDigest: String(journal.journal_digest),
      latestJournalEventDigest: String(journal.latest_event_digest),
      reason,
    });
    const operationDigest = createHash("sha256").update(operationJson).digest("hex");
    const row = {
      operation_event_id: `artifact-operation:${commandId}:legacy-unknown`,
      command_id: commandId,
      sequence: 1,
      command_payload_digest: payloadDigest,
      event_kind: "legacy_unknown",
      operation_json: operationJson,
      operation_digest: operationDigest,
      failure_reason: reason,
      occurred_at: String(journal.completed_at),
      previous_event_digest: null,
    };
    db.prepare(
      "INSERT INTO plan_draft_artifact_operation_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
  }
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
  if (db.userVersion() >= 5) {
    const rows = db.prepare("SELECT * FROM legacy_plan_bootstrap_provenance").all();
    if (rows.some((row) => row.provenance_digest !== ledgerRowDigest(row, "provenance_digest")))
      return false;
    if (!bootstrapProvenanceValid(db)) return false;
  }
  if (db.userVersion() >= 6 && !artifactOperationEventsValid(db)) return false;
  if (db.userVersion() >= 7 && !authoringCommandGroupsValid(db)) return false;
  if (db.userVersion() >= 8 && !authoringRecoveryRowsValid(db)) return false;
  const revisions = db
    .prepare(
      `SELECT canonical_payload_json, canonical_payload_digest FROM plan_revisions revision
       WHERE ${committedRevisionPredicateForSchema(db, "revision")}`,
    )
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

function authoringRecoveryRowsValid(db: HarnessDb): boolean {
  for (const [table, digestColumn] of [
    ["authoring_operation_descriptors", "descriptor_digest"],
    ["authoring_operation_artifacts", "artifact_digest"],
    ["authoring_command_revision_bindings", "binding_digest"],
  ] as const) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.some((row) => row[digestColumn] !== ledgerRowDigest(row, digestColumn))) return false;
  }
  const descriptors = db.prepare("SELECT * FROM authoring_operation_descriptors").all();
  for (const descriptor of descriptors) {
    const artifacts = db
      .prepare(
        "SELECT * FROM authoring_operation_artifacts WHERE operation_id = ? ORDER BY ordinal",
      )
      .all(descriptor.operation_id);
    if (
      artifacts.length !== Number(descriptor.artifact_count) ||
      artifacts.some(
        (artifact, index) =>
          Number(artifact.ordinal) !== index + 1 ||
          !validExpectedPreimageJson(artifact.expected_preimage_json),
      )
    )
      return false;
  }
  for (const [table, partition] of [
    ["authoring_recovery_assessment_events", ["operation_id"]],
    ["authoring_recovery_attempt_events", ["operation_id"]],
    ["authoring_artifact_recovery_events", ["operation_id", "member_id"]],
  ] as const) {
    const rows = db
      .prepare(`SELECT * FROM ${table} ORDER BY ${partition.join(", ")}, sequence`)
      .all();
    const state = new Map<string, { sequence: number; digest: string }>();
    for (const row of rows) {
      const key = partition.map((column) => String(row[column])).join("\u0000");
      const previous = state.get(key);
      if (
        Number(row.sequence) !== (previous?.sequence ?? 0) + 1 ||
        row.previous_event_digest !== (previous?.digest ?? null) ||
        row.event_digest !== ledgerRowDigest(row, "event_digest")
      )
        return false;
      state.set(key, { sequence: Number(row.sequence), digest: String(row.event_digest) });
    }
  }
  return true;
}

function authoringCommandGroupsValid(db: HarnessDb): boolean {
  const headers = db.prepare("SELECT * FROM authoring_command_group_headers").all();
  return headers.every((header) => authoringCommandGroupRowValid(db, header));
}

/** recovery gateから単一command groupのdigest chainと遷移を再検証する。 */
export function authoringCommandGroupValid(db: HarnessDb, groupId: string): boolean {
  const header = db
    .prepare("SELECT * FROM authoring_command_group_headers WHERE group_id = ?")
    .get(groupId);
  return Boolean(header && authoringCommandGroupRowValid(db, header));
}

function authoringCommandGroupRowValid(db: HarnessDb, header: Record<string, unknown>): boolean {
  if (header.header_digest !== ledgerRowDigest(header, "header_digest")) return false;
  const members = db
    .prepare("SELECT * FROM authoring_command_group_members WHERE group_id = ? ORDER BY ordinal")
    .all(header.group_id);
  if (
    members.length !== Number(header.member_count) ||
    members.some(
      (member, index) =>
        Number(member.ordinal) !== index + 1 ||
        !validExpectedPreimageJson(member.expected_preimage_json) ||
        member.member_digest !== ledgerRowDigest(member, "member_digest"),
    )
  )
    return false;
  const memberSet = members.map((member) => ({
    memberId: member.member_id,
    artifactPath: member.artifact_path,
    contentDigest: member.content_digest,
    expectedPreimage: JSON.parse(String(member.expected_preimage_json)),
  }));
  if (
    header.member_set_digest !==
    createHash("sha256").update(JSON.stringify(memberSet)).digest("hex")
  )
    return false;
  const events = db
    .prepare(
      "SELECT * FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence",
    )
    .all(header.group_id);
  if (events.length === 0 || events[0]?.event_kind !== "prepared") return false;
  let previous: string | null = null;
  const published = new Set<string>();
  const started = new Set<string>();
  let terminal = false;
  for (const [index, event] of events.entries()) {
    const kind = String(event.event_kind);
    const memberId = event.member_id === null ? undefined : String(event.member_id);
    if (
      terminal ||
      Number(event.sequence) !== index + 1 ||
      event.command_payload_digest !== header.command_payload_digest ||
      event.previous_event_digest !== previous ||
      event.event_digest !== ledgerRowDigest(event, "event_digest")
    )
      return false;
    if (kind === "prepared" && index !== 0) return false;
    if (kind === "member_started") {
      if (
        !memberId ||
        started.has(memberId) ||
        published.has(memberId) ||
        event.publish_receipt_digest !== null ||
        !members.some((member) => member.member_id === memberId)
      )
        return false;
      started.add(memberId);
    } else if (kind === "member_published") {
      if (
        !memberId ||
        !started.has(memberId) ||
        published.has(memberId) ||
        !members.some((member) => member.member_id === memberId) ||
        !/^[a-f0-9]{64}$/.test(String(event.publish_receipt_digest))
      )
        return false;
      published.add(memberId);
      started.delete(memberId);
    } else if (kind === "committed") {
      if (published.size !== members.length || memberId || event.publish_receipt_digest !== null)
        return false;
      terminal = true;
    } else if (kind === "recovery_required") {
      if (memberId || event.publish_receipt_digest !== null || !event.failure_reason) return false;
    } else if (kind === "rolled_back") {
      if (memberId || event.publish_receipt_digest !== null) return false;
      terminal = true;
    } else if (kind !== "prepared") return false;
    previous = String(event.event_digest);
  }
  return true;
}

function validExpectedPreimageJson(value: unknown): boolean {
  try {
    const parsed = JSON.parse(String(value)) as Record<string, unknown>;
    const keys = Object.keys(parsed).sort();
    return (
      (parsed.kind === "absent" && keys.length === 1 && keys[0] === "kind") ||
      (parsed.kind === "sha256" &&
        keys.join(",") === "digest,kind" &&
        typeof parsed.digest === "string" &&
        /^sha256:[a-f0-9]{64}$/.test(parsed.digest))
    );
  } catch {
    return false;
  }
}

function artifactOperationEventsValid(db: HarnessDb): boolean {
  const rows = db
    .prepare("SELECT * FROM plan_draft_artifact_operation_events ORDER BY command_id, sequence")
    .all();
  const previous = new Map<string, string>();
  const sequence = new Map<string, number>();
  const completed = new Set<string>();
  const legacyUnknown = new Set<string>();
  for (const row of rows) {
    const commandId = String(row.command_id);
    const expectedSequence = (sequence.get(commandId) ?? 0) + 1;
    if (
      Number(row.sequence) !== expectedSequence ||
      row.previous_event_digest !== (previous.get(commandId) ?? null) ||
      row.operation_digest !==
        createHash("sha256").update(String(row.operation_json)).digest("hex") ||
      row.event_digest !== ledgerRowDigest(row, "event_digest")
    )
      return false;
    if (row.event_kind === "legacy_unknown") {
      if (
        expectedSequence !== 1 ||
        row.previous_event_digest !== null ||
        !legacyUnknownOperationValid(db, row)
      )
        return false;
      legacyUnknown.add(commandId);
      sequence.set(commandId, expectedSequence);
      previous.set(commandId, String(row.event_digest));
      continue;
    }
    if (
      (expectedSequence === 1 && row.event_kind !== "pending") ||
      legacyUnknown.has(commandId) ||
      completed.has(commandId) ||
      !db
        .prepare(
          `SELECT 1 FROM plan_draft_journal
           WHERE command_id = ? AND status = 'committed' AND command_payload_digest = ?`,
        )
        .get(commandId, row.command_payload_digest)
    )
      return false;
    if (row.event_kind === "completed") completed.add(commandId);
    sequence.set(commandId, expectedSequence);
    previous.set(commandId, String(row.event_digest));
  }
  const committed = db
    .prepare("SELECT command_id FROM plan_draft_journal WHERE status = 'committed'")
    .all();
  return committed.every((row) => sequence.has(String(row.command_id)));
}

function legacyUnknownOperationValid(db: HarnessDb, row: Record<string, unknown>): boolean {
  let operation: unknown;
  try {
    operation = JSON.parse(String(row.operation_json));
  } catch {
    return false;
  }
  if (
    !isRecord(operation) ||
    Object.keys(operation).sort().join(",") !==
      "journalDigest,latestJournalEventDigest,operation,reason,sourceSchemaVersion"
  )
    return false;
  const journal = db
    .prepare(
      `SELECT journal.journal_digest, journal.command_payload_digest,
        event.event_digest AS latest_event_digest
       FROM plan_draft_journal journal
       JOIN plan_draft_journal_events event ON event.command_id = journal.command_id
       WHERE journal.command_id = ? AND journal.status = 'committed'
         AND event.sequence = (
           SELECT MAX(latest.sequence) FROM plan_draft_journal_events latest
           WHERE latest.command_id = journal.command_id
         )`,
    )
    .get(row.command_id);
  const reason = "旧schemaにはartifact cleanup provenanceが存在せず完了状態を証明できない";
  return (
    operation.operation === "legacy_unknown" &&
    [4, 5].includes(Number(operation.sourceSchemaVersion)) &&
    row.command_payload_digest === journal?.command_payload_digest &&
    operation.journalDigest === journal?.journal_digest &&
    operation.latestJournalEventDigest === journal?.latest_event_digest &&
    operation.reason === reason &&
    row.failure_reason === reason
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bootstrapProvenanceValid(db: HarnessDb): boolean {
  const rows = db
    .prepare(
      `SELECT provenance.*, revision.source_path AS revision_source_path,
        revision.source_commit AS revision_source_commit,
        asset.created_source_commit, asset.identity_algorithm AS asset_identity_algorithm,
        alias.alias
       FROM legacy_plan_bootstrap_provenance provenance
       JOIN plan_revisions revision
         ON revision.asset_id = provenance.asset_id AND revision.revision = provenance.revision
         AND ${committedRevisionPredicateForSchema(db, "revision")}
       JOIN plan_assets asset ON asset.asset_id = provenance.asset_id
       LEFT JOIN plan_aliases alias
         ON alias.asset_id = provenance.asset_id AND alias.valid_from_revision = 1`,
    )
    .all();
  return rows.every((row) => {
    const identityInput = JSON.stringify([row.repository_identity, row.alias]);
    return (
      Number(row.revision) === 1 &&
      row.identity_algorithm === "ut-tdd-plan-legacy-v1" &&
      row.asset_identity_algorithm === row.identity_algorithm &&
      row.source_path === row.revision_source_path &&
      row.source_commit === row.revision_source_commit &&
      row.source_commit === row.created_source_commit &&
      row.identity_input_json === identityInput &&
      row.identity_digest === createHash("sha256").update(identityInput).digest("hex") &&
      row.asset_id === deriveLegacyAssetId(String(row.repository_identity), String(row.alias)) &&
      /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(String(row.source_commit)) &&
      /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(String(row.source_blob_oid)) &&
      /^[a-f0-9]{64}$/.test(String(row.source_content_digest))
    );
  });
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
