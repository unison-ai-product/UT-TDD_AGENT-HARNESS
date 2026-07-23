import { createHash } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import type {
  GenesisRebaseCommentGroup,
  GenesisRebaseCommentMemberKind,
  GenesisRebaseCommentOutboxPort,
  GenesisRebaseCommentProjectionState,
} from "../application/genesis-rebase-comment-projection.js";
import { ledgerRowDigest, migratePlanLedger } from "../ledger/schema.js";

export class SqliteGenesisRebaseCommentOutbox implements GenesisRebaseCommentOutboxPort {
  constructor(private readonly db: HarnessDb) {
    if (!migratePlanLedger(db).ok) throw new Error("plan-ledger-unavailable");
  }

  prepare(group: GenesisRebaseCommentGroup): void {
    const digest = sha(stable(group));
    const migration = this.db
      .prepare(
        `SELECT command_payload_digest, migration_certificate_id, migration_certificate_digest
         FROM genesis_rebase_migrations WHERE command_id = ?`,
      )
      .get(group.commandId);
    const certificate = this.db
      .prepare(
        `SELECT certificate_digest FROM genesis_rebase_migration_certificates
         WHERE certificate_id = ? AND command_id = ?`,
      )
      .get(group.migrationCertificateId, group.commandId);
    if (
      !migration ||
      String(migration.command_payload_digest) !== group.commandPayloadDigest ||
      String(migration.migration_certificate_id) !== group.migrationCertificateId ||
      String(migration.migration_certificate_digest) !== group.migrationCertificateDigest ||
      !certificate ||
      String(certificate.certificate_digest) !== group.migrationCertificateDigest
    )
      throw new Error("genesis-rebase-comment-migration-binding-invalid");
    const prior = this.db
      .prepare("SELECT group_digest FROM genesis_rebase_comment_groups WHERE group_id = ?")
      .get(group.groupId);
    if (prior) {
      if (String(prior.group_digest) !== digest)
        throw new Error("genesis-rebase-comment-group-conflict");
      return;
    }
    this.transaction(() => {
      const now = new Date().toISOString();
      this.db
        .prepare(
          `INSERT INTO genesis_rebase_comment_groups
           VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
        )
        .run(
          group.groupId,
          group.commandId,
          group.commandPayloadDigest,
          group.migrationCertificateId,
          group.migrationCertificateDigest,
          digest,
          now,
          now,
        );
      group.members.forEach((member, index) => {
        const targetJson = stable(member);
        this.db
          .prepare(
            `INSERT INTO genesis_rebase_comment_members
             VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, NULL, NULL, NULL, ?, NULL, NULL, NULL)`,
          )
          .run(group.groupId, member.kind, index + 1, targetJson, sha(targetJson), now);
      });
      this.appendEvent(group.groupId, null, "group_prepared", now);
    });
  }

  authorizeCreate(
    groupId: string,
    kind: GenesisRebaseCommentMemberKind,
    claim: { readonly ownerToken: string; readonly generation: number },
    checkedAt: string,
  ): "create" | "reconcile" | null {
    if (!Number.isFinite(Date.parse(checkedAt)))
      throw new Error("genesis-rebase-comment-create-intent-invalid");
    return this.transaction(() => {
      const row = this.db
        .prepare(
          `SELECT claim_owner_token, claim_generation, claim_expires_at, create_intent_at
           FROM genesis_rebase_comment_members WHERE group_id = ? AND member_kind = ?`,
        )
        .get(groupId, kind);
      if (
        !row ||
        row.claim_owner_token !== claim.ownerToken ||
        Number(row.claim_generation) !== claim.generation ||
        Date.parse(String(row.claim_expires_at)) <= Date.parse(checkedAt)
      )
        return null;
      if (row.create_intent_at !== null) return "reconcile";
      this.db
        .prepare(
          `UPDATE genesis_rebase_comment_members
           SET create_intent_owner_token = ?, create_intent_generation = ?,
               create_intent_at = ?, updated_at = ?
           WHERE group_id = ? AND member_kind = ?
             AND claim_owner_token = ? AND claim_generation = ?
             AND claim_expires_at > ? AND create_intent_at IS NULL`,
        )
        .run(
          claim.ownerToken,
          claim.generation,
          checkedAt,
          checkedAt,
          groupId,
          kind,
          claim.ownerToken,
          claim.generation,
          checkedAt,
        );
      return Number(this.db.prepare("SELECT changes() AS count").get()?.count) === 1
        ? "create"
        : null;
    });
  }

  loadGroup(groupId: string): GenesisRebaseCommentGroup {
    const group = this.db
      .prepare(
        `SELECT command_id, command_payload_digest, migration_certificate_id,
                migration_certificate_digest
         FROM genesis_rebase_comment_groups WHERE group_id = ?`,
      )
      .get(groupId);
    const members = this.db
      .prepare(
        `SELECT target_json FROM genesis_rebase_comment_members
         WHERE group_id = ? ORDER BY ordinal`,
      )
      .all(groupId);
    if (!group || members.length !== 2) throw new Error("genesis-rebase-comment-group-missing");
    return {
      groupId,
      commandId: String(group.command_id),
      commandPayloadDigest: String(group.command_payload_digest),
      migrationCertificateId: String(group.migration_certificate_id),
      migrationCertificateDigest: String(group.migration_certificate_digest),
      members: members.map((row) =>
        JSON.parse(String(row.target_json)),
      ) as unknown as GenesisRebaseCommentGroup["members"],
    };
  }

  claimMember(
    groupId: string,
    kind: GenesisRebaseCommentMemberKind,
    claim: {
      readonly ownerToken: string;
      readonly claimedAt: string;
      readonly expiresAt: string;
    },
  ): {
    readonly ownerToken: string;
    readonly generation: number;
    readonly expiresAt: string;
  } | null {
    if (
      !claim.ownerToken ||
      !Number.isFinite(Date.parse(claim.claimedAt)) ||
      !Number.isFinite(Date.parse(claim.expiresAt)) ||
      Date.parse(claim.expiresAt) <= Date.parse(claim.claimedAt)
    )
      throw new Error("genesis-rebase-comment-member-claim-invalid");
    return this.transaction(() => {
      this.db
        .prepare(
          `UPDATE genesis_rebase_comment_members
           SET claim_owner_token = ?, claim_expires_at = ?,
               claim_generation = claim_generation + 1, updated_at = ?
           WHERE group_id = ? AND member_kind = ?
             AND state IN ('pending', 'recovery_required')
             AND (claim_owner_token IS NULL OR claim_owner_token = ? OR claim_expires_at <= ?)`,
        )
        .run(
          claim.ownerToken,
          claim.expiresAt,
          claim.claimedAt,
          groupId,
          kind,
          claim.ownerToken,
          claim.claimedAt,
        );
      if (Number(this.db.prepare("SELECT changes() AS count").get()?.count) !== 1) return null;
      const row = this.db
        .prepare(
          `SELECT claim_generation FROM genesis_rebase_comment_members
           WHERE group_id = ? AND member_kind = ?`,
        )
        .get(groupId, kind);
      return {
        ownerToken: claim.ownerToken,
        generation: Number(row?.claim_generation),
        expiresAt: claim.expiresAt,
      };
    });
  }

  markMember(
    groupId: string,
    kind: GenesisRebaseCommentMemberKind,
    state: GenesisRebaseCommentProjectionState,
    remote?: { readonly commentNodeId?: string; readonly commentUrl?: string },
    claim?: { readonly ownerToken: string; readonly generation: number } | number,
  ): void {
    if (state === "pending") return;
    const now = new Date().toISOString();
    this.transaction(() => {
      const before = this.db
        .prepare(
          "SELECT claim_generation FROM genesis_rebase_comment_members WHERE group_id = ? AND member_kind = ?",
        )
        .get(groupId, kind);
      if (!before) throw new Error("genesis-rebase-comment-member-missing");
      const generation =
        typeof claim === "number" ? claim : (claim?.generation ?? Number(before.claim_generation));
      const ownerToken = typeof claim === "object" ? claim.ownerToken : null;
      this.db
        .prepare(
          `UPDATE genesis_rebase_comment_members
           SET state = ?, claim_generation = claim_generation + 1,
               claim_owner_token = NULL, claim_expires_at = NULL,
               remote_comment_node_id = ?, remote_comment_url = ?, updated_at = ?
           WHERE group_id = ? AND member_kind = ? AND claim_generation = ?
             AND (? IS NULL OR claim_owner_token = ?)`,
        )
        .run(
          state,
          remote?.commentNodeId ?? null,
          remote?.commentUrl ?? null,
          now,
          groupId,
          kind,
          generation,
          ownerToken,
          ownerToken,
        );
      if (Number(this.db.prepare("SELECT changes() AS count").get()?.count) !== 1)
        throw new Error("genesis-rebase-comment-member-cas-rejected");
      this.appendEvent(
        groupId,
        kind,
        state === "projected" ? "member_projected" : "member_recovery_required",
        now,
      );
    });
  }

  markGroup(
    groupId: string,
    state: GenesisRebaseCommentProjectionState,
    expectedGeneration?: number,
  ): void {
    if (state === "pending") return;
    const now = new Date().toISOString();
    this.transaction(() => {
      const members = this.db
        .prepare(
          "SELECT state FROM genesis_rebase_comment_members WHERE group_id = ? ORDER BY ordinal",
        )
        .all(groupId)
        .map((row) => String(row.state));
      const derived =
        members.length === 2 && members.every((member) => member === "projected")
          ? "projected"
          : "recovery_required";
      if (state !== derived) throw new Error("genesis-rebase-comment-terminal-state-invalid");
      const before = this.db
        .prepare("SELECT generation FROM genesis_rebase_comment_groups WHERE group_id = ?")
        .get(groupId);
      if (!before) throw new Error("genesis-rebase-comment-group-missing");
      const generation = expectedGeneration ?? Number(before.generation);
      this.db
        .prepare(
          `UPDATE genesis_rebase_comment_groups
           SET state = ?, generation = generation + 1, updated_at = ?
           WHERE group_id = ? AND generation = ?`,
        )
        .run(state, now, groupId, generation);
      if (Number(this.db.prepare("SELECT changes() AS count").get()?.count) !== 1)
        throw new Error("genesis-rebase-comment-group-cas-rejected");
      this.appendEvent(
        groupId,
        null,
        state === "projected" ? "group_projected" : "group_recovery_required",
        now,
      );
    });
  }

  read(
    groupId: string,
  ): { readonly state: string; readonly memberStates: readonly string[] } | undefined {
    const group = this.db
      .prepare("SELECT state FROM genesis_rebase_comment_groups WHERE group_id = ?")
      .get(groupId);
    if (!group) return undefined;
    return {
      state: String(group.state),
      memberStates: this.db
        .prepare(
          "SELECT state FROM genesis_rebase_comment_members WHERE group_id = ? ORDER BY ordinal",
        )
        .all(groupId)
        .map((row) => String(row.state)),
    };
  }

  markProjectedDrift(groupId: string, kind: GenesisRebaseCommentMemberKind): void {
    const now = new Date().toISOString();
    this.transaction(() => {
      this.db
        .prepare(
          `UPDATE genesis_rebase_comment_members
           SET state = 'recovery_required', updated_at = ?
           WHERE group_id = ? AND member_kind = ? AND state = 'projected'`,
        )
        .run(now, groupId, kind);
      if (Number(this.db.prepare("SELECT changes() AS count").get()?.count) !== 1)
        throw new Error("genesis-rebase-comment-projected-drift-cas-rejected");
      this.appendEvent(groupId, kind, "member_recovery_required", now);
    });
  }

  private appendEvent(
    groupId: string,
    memberKind: GenesisRebaseCommentMemberKind | null,
    eventKind: string,
    occurredAt = new Date().toISOString(),
  ): void {
    const prior = this.db
      .prepare(
        "SELECT sequence, event_digest FROM genesis_rebase_comment_events WHERE group_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(groupId);
    const sequence = prior ? Number(prior.sequence) + 1 : 1;
    const previous = prior ? String(prior.event_digest) : null;
    const eventId = `${groupId}:${sequence}`;
    const row = {
      event_id: eventId,
      group_id: groupId,
      sequence,
      member_kind: memberKind,
      event_kind: eventKind,
      occurred_at: occurredAt,
      previous_event_digest: previous,
    };
    const digest = ledgerRowDigest(row, "event_digest");
    this.db
      .prepare("INSERT INTO genesis_rebase_comment_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(eventId, groupId, sequence, memberKind, eventKind, occurredAt, previous, digest);
  }

  private transaction<T>(action: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = action();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
