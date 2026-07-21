import { createHash } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import { isSecretLike } from "../../state-db/index.js";
import { ledgerRowDigest } from "./schema.js";
import { ImmediateLedgerTransaction } from "./transaction.js";

export interface AuthoringCommandGroupMember {
  readonly memberId: string;
  readonly artifactPath: string;
  readonly contentDigest: string;
}

export interface AuthoringCommandGroupInput {
  readonly groupId: string;
  readonly commandPayloadDigest: string;
  readonly occurredAt: string;
  readonly members: readonly AuthoringCommandGroupMember[];
}

export interface AuthoringArtifactPublisher {
  /** groupId + memberId はretry時も不変なidempotency keyである。 */
  publish(input: AuthoringCommandGroupMember & { readonly groupId: string }): {
    readonly receiptDigest: string;
  };
}

export type AuthoringCommandGroupResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly publishedMemberIds: readonly string[];
    }
  | { readonly ok: false; readonly ruleId: string };

/**
 * N成果物publishをSQLite phase journalへ閉じる。外部publisherは同じgroup/member keyを
 * 再送されても同じ結果を返す責務を持ち、process crash後は記録済memberをskipして再開する。
 */
export class AuthoringCommandGroupJournal {
  constructor(private readonly db: HarnessDb) {}

  execute(
    input: AuthoringCommandGroupInput,
    publisher: AuthoringArtifactPublisher,
  ): AuthoringCommandGroupResult {
    const normalized = normalize(input);
    if (!normalized) return { ok: false, ruleId: "authoring-command-group-input-invalid" };
    const admitted = this.admit(normalized);
    if (!admitted.ok) return admitted;
    if (admitted.committed)
      return { ok: true, replayed: true, publishedMemberIds: admitted.published };

    const published = new Set(admitted.published);
    try {
      for (const member of normalized.members) {
        if (published.has(member.memberId)) continue;
        const receipt = publisher.publish({ ...member, groupId: normalized.groupId });
        if (!validDigest(receipt.receiptDigest))
          throw new Error("publisher-receipt-digest-invalid");
        this.appendPhase(normalized, "member_published", member.memberId, receipt.receiptDigest);
        published.add(member.memberId);
      }
      this.appendPhase(normalized, "committed");
      return { ok: true, replayed: admitted.replayed, publishedMemberIds: [...published] };
    } catch (error) {
      this.appendPhase(normalized, "recovery_required", undefined, undefined, safeFailure(error));
      throw error;
    }
  }

  private admit(input: NormalizedGroup): Admission {
    return new ImmediateLedgerTransaction(this.db).run<Admission>(() => {
      const header = this.db
        .prepare("SELECT * FROM authoring_command_group_headers WHERE group_id = ?")
        .get(input.groupId);
      if (!header) {
        insertHeaderAndMembers(this.db, input);
        insertPhase(this.db, input, "prepared", 1);
        return {
          commit: true,
          value: { ok: true, replayed: false, committed: false, published: [] },
        };
      }
      if (!headerMatches(header, input) || !membersMatch(this.db, input))
        return {
          commit: false,
          value: { ok: false, ruleId: "authoring-command-group-replay-binding-invalid" },
        };
      const events = phaseEvents(this.db, input.groupId);
      if (!eventsValid(events, input))
        return {
          commit: false,
          value: { ok: false, ruleId: "authoring-command-group-journal-invalid" },
        };
      const published = events
        .filter((event) => event.event_kind === "member_published")
        .map((event) => String(event.member_id));
      return {
        commit: true,
        value: {
          ok: true,
          replayed: true,
          committed: events.at(-1)?.event_kind === "committed",
          published,
        },
      };
    });
  }

  private appendPhase(
    input: NormalizedGroup,
    kind: PhaseKind,
    memberId?: string,
    receiptDigest?: string,
    failureReason?: string,
  ): void {
    new ImmediateLedgerTransaction(this.db).run(() => {
      const events = phaseEvents(this.db, input.groupId);
      if (!eventsValid(events, input)) throw new Error("authoring-command-group-journal-invalid");
      insertPhase(this.db, input, kind, events.length + 1, memberId, receiptDigest, failureReason);
      return { commit: true, value: undefined };
    });
  }
}

type PhaseKind =
  | "prepared"
  | "member_published"
  | "committed"
  | "recovery_required"
  | "rolled_back";
type NormalizedGroup = Omit<AuthoringCommandGroupInput, "members"> & {
  readonly members: readonly AuthoringCommandGroupMember[];
  readonly memberSetDigest: string;
};
type Admission =
  | { readonly ok: false; readonly ruleId: string }
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly committed: boolean;
      readonly published: readonly string[];
    };

function normalize(input: AuthoringCommandGroupInput): NormalizedGroup | undefined {
  const members = [...input.members].sort((a, b) => a.memberId.localeCompare(b.memberId));
  if (
    !input.groupId ||
    !validDigest(input.commandPayloadDigest) ||
    !input.occurredAt ||
    members.length === 0 ||
    new Set(members.map((member) => member.memberId)).size !== members.length ||
    new Set(members.map((member) => member.artifactPath)).size !== members.length ||
    members.some(
      (member) =>
        !member.memberId ||
        !member.artifactPath ||
        !validDigest(member.contentDigest) ||
        isSecretLike(member.artifactPath),
    )
  )
    return undefined;
  return { ...input, members, memberSetDigest: sha(JSON.stringify(members)) };
}

function insertHeaderAndMembers(db: HarnessDb, input: NormalizedGroup): void {
  const header = {
    group_id: input.groupId,
    command_payload_digest: input.commandPayloadDigest,
    member_set_digest: input.memberSetDigest,
    member_count: input.members.length,
    created_at: input.occurredAt,
  };
  db.prepare("INSERT INTO authoring_command_group_headers VALUES (?, ?, ?, ?, ?, ?)").run(
    ...Object.values(header),
    ledgerRowDigest(header, "header_digest"),
  );
  input.members.forEach((member, index) => {
    const row = {
      group_id: input.groupId,
      member_id: member.memberId,
      ordinal: index + 1,
      artifact_path: member.artifactPath,
      content_digest: member.contentDigest,
    };
    db.prepare("INSERT INTO authoring_command_group_members VALUES (?, ?, ?, ?, ?, ?)").run(
      ...Object.values(row),
      ledgerRowDigest(row, "member_digest"),
    );
  });
}

function insertPhase(
  db: HarnessDb,
  input: NormalizedGroup,
  eventKind: PhaseKind,
  sequence: number,
  memberId?: string,
  receiptDigest?: string,
  failureReason?: string,
): void {
  const previous = db
    .prepare(
      "SELECT event_digest FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence DESC LIMIT 1",
    )
    .get(input.groupId);
  const row = {
    phase_event_id: `authoring-group:${input.groupId}:${sequence}`,
    group_id: input.groupId,
    sequence,
    command_payload_digest: input.commandPayloadDigest,
    event_kind: eventKind,
    member_id: memberId ?? null,
    publish_receipt_digest: receiptDigest ?? null,
    failure_reason: failureReason ?? null,
    occurred_at: input.occurredAt,
    previous_event_digest: previous?.event_digest ?? null,
  };
  db.prepare(
    "INSERT INTO authoring_command_group_phase_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
}

function headerMatches(row: Record<string, unknown>, input: NormalizedGroup): boolean {
  return (
    row.command_payload_digest === input.commandPayloadDigest &&
    row.member_set_digest === input.memberSetDigest &&
    Number(row.member_count) === input.members.length &&
    row.created_at === input.occurredAt &&
    row.header_digest === ledgerRowDigest(row, "header_digest")
  );
}

function membersMatch(db: HarnessDb, input: NormalizedGroup): boolean {
  const rows = db
    .prepare("SELECT * FROM authoring_command_group_members WHERE group_id = ? ORDER BY ordinal")
    .all(input.groupId);
  return (
    rows.length === input.members.length &&
    rows.every((row, index) => {
      const expected = input.members[index];
      return (
        row.member_id === expected?.memberId &&
        row.artifact_path === expected.artifactPath &&
        row.content_digest === expected.contentDigest &&
        Number(row.ordinal) === index + 1 &&
        row.member_digest === ledgerRowDigest(row, "member_digest")
      );
    })
  );
}

function phaseEvents(db: HarnessDb, groupId: string): Record<string, unknown>[] {
  return db
    .prepare(
      "SELECT * FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence",
    )
    .all(groupId);
}

function eventsValid(events: readonly Record<string, unknown>[], input: NormalizedGroup): boolean {
  if (events.length === 0 || events[0]?.event_kind !== "prepared") return false;
  let previous: string | null = null;
  const published = new Set<string>();
  let terminal = false;
  for (const [index, event] of events.entries()) {
    const kind = String(event.event_kind);
    const memberId = event.member_id === null ? undefined : String(event.member_id);
    if (
      terminal ||
      Number(event.sequence) !== index + 1 ||
      event.command_payload_digest !== input.commandPayloadDigest ||
      event.previous_event_digest !== previous ||
      event.event_digest !== ledgerRowDigest(event, "event_digest")
    )
      return false;
    if (kind === "prepared" && index !== 0) return false;
    if (kind === "member_published") {
      if (
        !memberId ||
        published.has(memberId) ||
        !input.members.some((m) => m.memberId === memberId)
      )
        return false;
      if (!validDigest(String(event.publish_receipt_digest))) return false;
      published.add(memberId);
    } else if (kind === "committed") {
      if (
        published.size !== input.members.length ||
        memberId ||
        event.publish_receipt_digest !== null
      )
        return false;
      terminal = true;
    } else if (kind === "rolled_back") terminal = true;
    previous = String(event.event_digest);
  }
  return true;
}

function safeFailure(error: unknown): string {
  const value = error instanceof Error ? error.name : "publisher-failure";
  return isSecretLike(value) ? "publisher-failure" : value.slice(0, 80);
}

function validDigest(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
