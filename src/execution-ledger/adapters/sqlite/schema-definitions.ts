import type { IndexDef, TableDef, TriggerDef } from "../../../schema/harness-db.js";
import {
  col,
  enumCheck,
  foreignKey,
  pk,
  requiredCol,
} from "../../../schema/harness-db-table-builders.js";

const LAYERS = Array.from({ length: 15 }, (_, index) => `L${index}`);
const STATES = Array.from({ length: 16 }, (_, index) => `E${index}`);
const DRIVE_MODELS = [
  "discovery",
  "scrum",
  "reverse",
  "redesign",
  "recovery",
  "incident",
  "refactor",
  "retrofit",
  "add-feature",
  "research",
  "design-bottomup",
  "version-up",
];
const EVENT_KINDS = [
  "escape_observed",
  "escape_classified",
  "drive_selected",
  "issue_requested",
  "issue_projected",
  "drive_plan_frozen",
  "drive_verified",
  "reentry_proposed",
  "intermediate_verified",
  "reentry_certified",
  "forward_reentered",
  "post_reentry_verified",
  "draft_pr_projected",
  "cross_review_approved",
  "merged",
  "closed_learned",
];

export const executionLedgerV5Tables: readonly TableDef[] = [
  {
    name: "execution_episodes",
    columns: [
      pk("episode_id"),
      requiredCol("recurrence_id"),
      requiredCol("origin_asset_id"),
      requiredCol("origin_revision", "INTEGER"),
      requiredCol("origin_layer"),
      requiredCol("origin_state"),
      requiredCol("escape_type"),
      requiredCol("escape_reason"),
      requiredCol("drive_model"),
      requiredCol("reentry_asset_id"),
      requiredCol("reentry_revision", "INTEGER"),
      requiredCol("reentry_layer"),
      requiredCol("reentry_state"),
      requiredCol("reentry_policy_revision"),
      requiredCol("issue_repository"),
      requiredCol("issue_title"),
      requiredCol("issue_body_digest"),
      requiredCol("source_commit"),
      requiredCol("observed_head"),
      requiredCol("policy_revision"),
      requiredCol("actor"),
      requiredCol("created_at"),
    ],
    checks: [
      enumCheck("origin_layer", LAYERS),
      enumCheck("reentry_layer", LAYERS),
      enumCheck("escape_type", [
        "blocked",
        "rejected",
        "reopened",
        "superseded",
        "preemptive",
        "defer",
      ]),
      enumCheck("drive_model", DRIVE_MODELS),
    ],
    foreignKeys: [
      foreignKey(["origin_asset_id", "origin_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
      foreignKey(["reentry_asset_id", "reentry_revision"], {
        table: "plan_revisions",
        columns: ["asset_id", "revision"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "execution_episode_events",
    columns: [
      pk("event_id"),
      requiredCol("episode_id"),
      requiredCol("event_sequence", "INTEGER"),
      requiredCol("command_id"),
      requiredCol("command_payload_digest"),
      requiredCol("event_state"),
      requiredCol("event_kind"),
      requiredCol("payload_version", "INTEGER"),
      requiredCol("canonical_payload_json"),
      requiredCol("payload_digest"),
      col("previous_event_digest"),
      requiredCol("source_commit"),
      requiredCol("observed_head"),
      requiredCol("policy_revision"),
      requiredCol("actor"),
      requiredCol("runtime"),
      requiredCol("model"),
      requiredCol("occurred_at"),
      requiredCol("event_digest"),
    ],
    unique: [["episode_id", "event_sequence"], ["command_id"]],
    checks: [enumCheck("event_state", STATES), enumCheck("event_kind", EVENT_KINDS)],
    foreignKeys: [
      foreignKey(["episode_id"], {
        table: "execution_episodes",
        columns: ["episode_id"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "drive_model_selections",
    columns: [
      requiredCol("episode_id"),
      requiredCol("selection_revision", "INTEGER"),
      requiredCol("selected_event_sequence", "INTEGER"),
      requiredCol("model"),
      requiredCol("compatibility_result"),
      requiredCol("rationale_digest"),
      requiredCol("override_used", "INTEGER"),
      col("override_actor"),
      col("override_reason"),
      col("override_evidence_digest"),
      requiredCol("selected_at"),
      requiredCol("selection_digest"),
    ],
    primaryKey: ["episode_id", "selection_revision"],
    checks: [enumCheck("model", DRIVE_MODELS), enumCheck("override_used", ["0", "1"])],
    foreignKeys: [
      foreignKey(["episode_id", "selected_event_sequence"], {
        table: "execution_episode_events",
        columns: ["episode_id", "event_sequence"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "github_projection_outbox",
    columns: [
      pk("outbox_id"),
      requiredCol("episode_id"),
      requiredCol("source_event_sequence", "INTEGER"),
      requiredCol("operation_kind"),
      requiredCol("object_kind"),
      requiredCol("repository"),
      requiredCol("target_logical_key"),
      requiredCol("intent_revision", "INTEGER"),
      requiredCol("idempotency_key"),
      requiredCol("payload_version", "INTEGER"),
      requiredCol("canonical_payload_json"),
      requiredCol("payload_digest"),
      requiredCol("status"),
      requiredCol("attempt_count", "INTEGER"),
      requiredCol("next_attempt_at"),
      col("lease_owner"),
      col("lease_expires_at"),
      col("ack_observation_id"),
      requiredCol("created_at"),
      col("last_attempt_at"),
    ],
    unique: [
      ["idempotency_key"],
      ["repository", "episode_id", "object_kind", "intent_revision"],
    ],
    checks: [enumCheck("status", ["pending", "leased", "deferred", "acknowledged", "blocked"])],
    foreignKeys: [
      foreignKey(["episode_id", "source_event_sequence"], {
        table: "execution_episode_events",
        columns: ["episode_id", "event_sequence"],
        onDelete: "RESTRICT",
      }),
    ],
  },
  {
    name: "execution_episode_projection",
    columns: [
      pk("episode_id"),
      requiredCol("current_event_sequence", "INTEGER"),
      requiredCol("current_state"),
      requiredCol("current_event_digest"),
      requiredCol("block_reason"),
      requiredCol("next_legal_actions_json"),
      requiredCol("latest_head"),
      requiredCol("merge_readiness"),
      requiredCol("drive_model"),
      requiredCol("reentry_layer"),
      requiredCol("rebuilt_at"),
    ],
    checks: [
      enumCheck("current_state", STATES),
      enumCheck("merge_readiness", ["blocked", "eligible", "merged", "closed"]),
      enumCheck("drive_model", DRIVE_MODELS),
      enumCheck("reentry_layer", LAYERS),
    ],
    foreignKeys: [
      foreignKey(["episode_id", "current_event_sequence"], {
        table: "execution_episode_events",
        columns: ["episode_id", "event_sequence"],
        onDelete: "RESTRICT",
      }),
    ],
  },
];

export const executionLedgerV5Indexes: readonly IndexDef[] = [
  {
    name: "idx_execution_episodes_recurrence",
    table: "execution_episodes",
    columns: ["recurrence_id", "created_at"],
  },
  {
    name: "idx_execution_episodes_origin",
    table: "execution_episodes",
    columns: ["origin_asset_id", "origin_revision"],
  },
  {
    name: "idx_execution_episodes_reentry",
    table: "execution_episodes",
    columns: ["reentry_asset_id", "reentry_revision"],
  },
  {
    name: "idx_execution_events_state_time",
    table: "execution_episode_events",
    columns: ["event_state", "occurred_at"],
  },
  {
    name: "idx_github_outbox_dispatch",
    table: "github_projection_outbox",
    columns: ["status", "next_attempt_at", "lease_expires_at"],
  },
  {
    name: "idx_execution_projection_readiness",
    table: "execution_episode_projection",
    columns: ["current_state", "merge_readiness"],
  },
];

const APPEND_ONLY = [
  "execution_episodes",
  "execution_episode_events",
  "drive_model_selections",
] as const;

export const executionLedgerV5Triggers: readonly TriggerDef[] = APPEND_ONLY.flatMap((table) =>
  (["UPDATE", "DELETE"] as const).map((event) => ({
    name: `trg_${table}_no_${event.toLowerCase()}`,
    table,
    timing: "BEFORE" as const,
    event,
    action: { kind: "raise-abort" as const, message: `append-only:${table}` },
  })),
);
