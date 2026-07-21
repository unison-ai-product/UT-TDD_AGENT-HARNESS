import { createHash } from "node:crypto";
import type { HarnessDb } from "../../state-db/index.js";
import { isSecretLike } from "../../state-db/index.js";
import { ledgerRowDigest } from "./schema.js";
import { ImmediateLedgerTransaction } from "./transaction.js";

export interface AuthoringCommandGroupMember {
  readonly memberId: string;
  readonly artifactPath: string;
  readonly contentDigest: string;
  readonly expectedPreimage:
    | { readonly kind: "absent" }
    | { readonly kind: "sha256"; readonly digest: `sha256:${string}` };
}

export interface AuthoringCommandGroupInput {
  readonly groupId: string;
  readonly commandPayloadDigest: string;
  readonly occurredAt: string;
  readonly members: readonly AuthoringCommandGroupMember[];
  readonly operation?: {
    readonly repositoryIdentity: string;
    readonly baseCommit: string;
    readonly revisionBindings: readonly {
      readonly assetId: string;
      readonly revision: number;
      readonly artifactRole: string;
    }[];
  };
}

export interface AuthoringArtifactPublisher {
  /** groupId + memberId はretry時も不変なidempotency keyである。 */
  publish(input: AuthoringCommandGroupMember & { readonly groupId: string }): {
    readonly receiptDigest: string;
  };
  /** member_publishedがdurableになった後だけ一時custodyを解放する。 */
  acknowledge(input: AuthoringCommandGroupMember & { readonly groupId: string }): void;
  /** receipt 0件のnormal exception時だけ、全memberがpreimageへ戻ったことを証明する。 */
  rollback?(input: readonly (AuthoringCommandGroupMember & { readonly groupId: string })[]): void;
}

export type AuthoringCommandGroupResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly publishedMemberIds: readonly string[];
    }
  | { readonly ok: false; readonly ruleId: string };

export type AuthoringCommandGroupRollbackResult =
  | { readonly ok: true; readonly replayed: boolean }
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
    if (admitted.rolledBack) return { ok: false, ruleId: "authoring-command-group-rolled-back" };
    if (admitted.committed)
      return { ok: true, replayed: true, publishedMemberIds: admitted.published };

    const published = new Set(admitted.published);
    const started = new Set(admitted.started);
    try {
      for (const member of normalized.members) {
        if (published.has(member.memberId)) {
          publisher.acknowledge({ ...member, groupId: normalized.groupId });
          continue;
        }
        if (!started.has(member.memberId))
          this.appendPhase(normalized, { kind: "member_started", memberId: member.memberId });
        const receipt = publisher.publish({ ...member, groupId: normalized.groupId });
        if (!validDigest(receipt.receiptDigest))
          throw new Error("publisher-receipt-digest-invalid");
        this.appendPhase(normalized, {
          kind: "member_published",
          memberId: member.memberId,
          receiptDigest: receipt.receiptDigest,
        });
        published.add(member.memberId);
        publisher.acknowledge({ ...member, groupId: normalized.groupId });
      }
      if (admitted.recoveryRequired && normalized.operation) {
        const assessment = recordRecoveryAssessment(
          this.db,
          normalized,
          "finalize",
          published,
          new Error("recovery-replay"),
        );
        recordRecoveryAttempt(this.db, normalized, assessment, "finalize", "started");
        recordArtifactRecovery(this.db, normalized, assessment, "finalize");
        recordRecoveryAttempt(this.db, normalized, assessment, "finalize", "succeeded");
      }
      this.appendPhase(normalized, { kind: "committed" });
      return { ok: true, replayed: admitted.replayed, publishedMemberIds: [...published] };
    } catch (error) {
      let restored = false;
      if (published.size === 0 && publisher.rollback) {
        try {
          publisher.rollback(
            normalized.members.map((member) => ({ ...member, groupId: normalized.groupId })),
          );
          restored = true;
        } catch {
          restored = false;
        }
      }
      const strategy = restored ? "rollback" : "roll_forward";
      const assessment = normalized.operation
        ? recordRecoveryAssessment(this.db, normalized, strategy, published, error)
        : undefined;
      if (restored) {
        const rolledBack = this.rollback(normalized, safeFailure(error));
        if (!rolledBack.ok) throw new Error(rolledBack.ruleId);
        if (assessment) {
          recordArtifactRecovery(this.db, normalized, assessment, "restore");
          recordRecoveryAttempt(this.db, normalized, assessment, "rollback", "succeeded");
        }
        throw error;
      }
      if (assessment)
        recordRecoveryAttempt(this.db, normalized, assessment, "roll_forward", "started");
      this.appendPhase(normalized, {
        kind: "recovery_required",
        failureReason: safeFailure(error),
      });
      throw error;
    }
  }

  /**
   * 呼出元が保持する `BEGIN IMMEDIATE` の内側でgroup intentを確定する。
   * revision write-setとpublish discovery recordの間にcrash windowを作らないための合成境界。
   */
  prepareWithinTransaction(input: AuthoringCommandGroupInput): AuthoringCommandGroupResult {
    const normalized = normalize(input);
    if (!normalized) return { ok: false, ruleId: "authoring-command-group-input-invalid" };
    const admitted = this.admitWithinTransaction(normalized);
    if (!admitted.ok) return admitted;
    if (admitted.rolledBack) return { ok: false, ruleId: "authoring-command-group-rolled-back" };
    return {
      ok: true,
      replayed: admitted.replayed,
      publishedMemberIds: admitted.published,
    };
  }

  bindRevisionsWithinTransaction(
    input: AuthoringCommandGroupInput,
    bindings: NonNullable<AuthoringCommandGroupInput["operation"]>["revisionBindings"],
  ): void {
    const normalized = normalize(input);
    if (!normalized?.operation) throw new Error("authoring-command-group-operation-required");
    for (const binding of bindings) insertRevisionBinding(this.db, normalized, binding);
  }

  appendPublishedWithinTransaction(
    input: AuthoringCommandGroupInput,
    memberId: string,
    receiptDigest: string,
  ): void {
    const normalized = normalize(input);
    if (!normalized || !validDigest(receiptDigest))
      throw new Error("authoring-command-group-input-invalid");
    const events = phaseEvents(this.db, normalized.groupId);
    if (!eventsValid(events, normalized))
      throw new Error("authoring-command-group-journal-invalid");
    const prior = events.find(
      (event) => event.member_id === memberId && event.event_kind === "member_published",
    );
    if (prior) {
      if (prior.publish_receipt_digest !== receiptDigest)
        throw new Error("authoring-command-group-receipt-conflict");
      return;
    }
    if (
      !events.some((event) => event.member_id === memberId && event.event_kind === "member_started")
    )
      insertPhase(this.db, normalized, {
        kind: "member_started",
        memberId,
        sequence: events.length + 1,
      });
    const current = phaseEvents(this.db, normalized.groupId);
    insertPhase(this.db, normalized, {
      kind: "member_published",
      memberId,
      receiptDigest,
      sequence: current.length + 1,
    });
  }

  appendTerminalWithinTransaction(
    input: AuthoringCommandGroupInput,
    kind: "committed" | "recovery_required" | "rolled_back",
    failureReason?: string,
  ): void {
    const normalized = normalize(input);
    if (!normalized) throw new Error("authoring-command-group-input-invalid");
    const events = phaseEvents(this.db, normalized.groupId);
    if (!eventsValid(events, normalized))
      throw new Error("authoring-command-group-journal-invalid");
    const terminal = events.at(-1)?.event_kind;
    if (terminal === kind) return;
    if (terminal === "committed" || terminal === "rolled_back")
      throw new Error("authoring-command-group-terminal-conflict");
    insertPhase(this.db, normalized, {
      kind,
      sequence: events.length + 1,
      failureReason,
    });
  }

  /** 外部公開前だけcommand groupをterminal rolled_backへ移す。公開済memberはroll-forwardする。 */
  rollback(input: AuthoringCommandGroupInput, reason: string): AuthoringCommandGroupRollbackResult {
    const normalized = normalize(input);
    if (!normalized || !reason.trim())
      return { ok: false, ruleId: "authoring-command-group-input-invalid" };
    return new ImmediateLedgerTransaction(this.db).run<AuthoringCommandGroupRollbackResult>(() => {
      const admitted = this.admitWithinTransaction(normalized);
      if (!admitted.ok) return { commit: false, value: admitted };
      if (admitted.committed)
        return {
          commit: false,
          value: { ok: false as const, ruleId: "authoring-command-group-committed" },
        };
      if (admitted.rolledBack)
        return { commit: true, value: { ok: true as const, replayed: true } };
      if (admitted.published.length > 0)
        return {
          commit: false,
          value: { ok: false as const, ruleId: "authoring-command-group-roll-forward-required" },
        };
      const events = phaseEvents(this.db, normalized.groupId);
      insertPhase(this.db, normalized, {
        kind: "rolled_back",
        sequence: events.length + 1,
        failureReason: safeFailure(new Error(reason)),
      });
      return { commit: true, value: { ok: true as const, replayed: false } };
    });
  }

  private admit(input: NormalizedGroup): Admission {
    return new ImmediateLedgerTransaction(this.db).run<Admission>(() => ({
      commit: true,
      value: this.admitWithinTransaction(input),
    }));
  }

  private admitWithinTransaction(input: NormalizedGroup): Admission {
    const header = this.db
      .prepare("SELECT * FROM authoring_command_group_headers WHERE group_id = ?")
      .get(input.groupId);
    if (!header) {
      insertHeaderAndMembers(this.db, input);
      if (input.operation) insertOperationDescriptor(this.db, input);
      insertPhase(this.db, input, { kind: "prepared", sequence: 1 });
      return {
        ok: true,
        replayed: false,
        committed: false,
        rolledBack: false,
        published: [],
        started: [],
        recoveryRequired: false,
      };
    }
    if (
      !headerMatches(header, input) ||
      !membersMatch(this.db, input) ||
      !operationMatches(this.db, input)
    )
      return { ok: false, ruleId: "authoring-command-group-replay-binding-invalid" };
    const events = phaseEvents(this.db, input.groupId);
    if (!eventsValid(events, input))
      return { ok: false, ruleId: "authoring-command-group-journal-invalid" };
    const published = events
      .filter((event) => event.event_kind === "member_published")
      .map((event) => String(event.member_id));
    const started = events
      .filter((event) => event.event_kind === "member_started")
      .map((event) => String(event.member_id))
      .filter((memberId) => !published.includes(memberId));
    return {
      ok: true,
      replayed: true,
      committed: events.at(-1)?.event_kind === "committed",
      rolledBack: events.at(-1)?.event_kind === "rolled_back",
      published,
      started,
      recoveryRequired: events.some((event) => event.event_kind === "recovery_required"),
    };
  }

  private appendPhase(input: NormalizedGroup, phase: Omit<PhaseAppend, "sequence">): void {
    new ImmediateLedgerTransaction(this.db).run(() => {
      const events = phaseEvents(this.db, input.groupId);
      if (!eventsValid(events, input)) throw new Error("authoring-command-group-journal-invalid");
      insertPhase(this.db, input, { ...phase, sequence: events.length + 1 });
      return { commit: true, value: undefined };
    });
  }
}

function recordArtifactRecovery(
  db: HarnessDb,
  input: NormalizedGroup,
  assessment: RecoveryAssessment,
  action: "restore" | "roll_forward" | "finalize",
): void {
  new ImmediateLedgerTransaction(db).run(() => {
    for (const member of input.members) {
      const row = {
        recovery_event_id: `artifact-recovery:${assessment.operationId}:${member.memberId}:1`,
        operation_id: assessment.operationId,
        member_id: member.memberId,
        sequence: 1,
        action,
        result: "succeeded",
        before_state_json: stableJson({ expectedPreimage: member.expectedPreimage }),
        after_state_json: stableJson({ restored: true }),
        assessment_digest: assessment.digest,
        fencing_token: assessment.fencingToken,
        actor: "authoring-command-group",
        occurred_at: input.occurredAt,
        failure_reason: null,
        previous_event_digest: null,
      };
      db.prepare(
        "INSERT INTO authoring_artifact_recovery_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
    }
    return { commit: true, value: undefined };
  });
}

type RecoveryStrategy = "rollback" | "roll_forward" | "finalize";
interface RecoveryAssessment {
  readonly operationId: string;
  readonly digest: string;
  readonly fencingToken: string;
}

function recordRecoveryAssessment(
  db: HarnessDb,
  input: NormalizedGroup,
  strategy: RecoveryStrategy,
  published: ReadonlySet<string>,
  error: unknown,
): RecoveryAssessment {
  return new ImmediateLedgerTransaction(db).run(() => {
    const operationId = `authoring:${sha(input.groupId).slice(0, 32)}`;
    const previous = db
      .prepare(
        "SELECT sequence, event_digest FROM authoring_recovery_assessment_events WHERE operation_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(operationId);
    const sequence = Number(previous?.sequence ?? 0) + 1;
    const assessmentJson = stableJson({
      failure: safeFailure(error),
      published: [...published].sort(),
      strategy,
    });
    const assessmentDigest = sha(assessmentJson);
    const fencingToken = `fence:${sha(`${operationId}\0${sequence}\0${previous?.event_digest ?? ""}`).slice(0, 32)}`;
    const row = {
      assessment_event_id: `assessment:${operationId}:${sequence}`,
      operation_id: operationId,
      sequence,
      strategy,
      assessment_json: assessmentJson,
      assessment_digest: assessmentDigest,
      fencing_token: fencingToken,
      occurred_at: input.occurredAt,
      previous_event_digest: previous?.event_digest ?? null,
    };
    db.prepare(
      "INSERT INTO authoring_recovery_assessment_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
    return {
      commit: true,
      value: { operationId, digest: assessmentDigest, fencingToken },
    };
  });
}

function recordRecoveryAttempt(
  db: HarnessDb,
  input: NormalizedGroup,
  assessment: RecoveryAssessment,
  strategy: RecoveryStrategy,
  result: "started" | "succeeded",
): void {
  new ImmediateLedgerTransaction(db).run(() => {
    const previous = db
      .prepare(
        "SELECT sequence, event_digest FROM authoring_recovery_attempt_events WHERE operation_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(assessment.operationId);
    const sequence = Number(previous?.sequence ?? 0) + 1;
    const row = {
      attempt_event_id: `attempt:${assessment.operationId}:${sequence}`,
      operation_id: assessment.operationId,
      sequence,
      assessment_digest: assessment.digest,
      fencing_token: assessment.fencingToken,
      strategy,
      result,
      actor: "authoring-command-group",
      occurred_at: input.occurredAt,
      failure_reason: null,
      previous_event_digest: previous?.event_digest ?? null,
    };
    db.prepare(
      "INSERT INTO authoring_recovery_attempt_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
    return { commit: true, value: undefined };
  });
}

function operationMatches(db: HarnessDb, input: NormalizedGroup): boolean {
  const descriptor = db
    .prepare("SELECT * FROM authoring_operation_descriptors WHERE group_id = ?")
    .get(input.groupId);
  if (!input.operation) return !descriptor;
  if (
    !descriptor ||
    descriptor.descriptor_digest !== ledgerRowDigest(descriptor, "descriptor_digest")
  )
    return false;
  const bindings = db
    .prepare(
      "SELECT asset_id, revision, artifact_role FROM authoring_command_revision_bindings WHERE group_id = ? ORDER BY asset_id, revision",
    )
    .all(input.groupId);
  const expected = [...input.operation.revisionBindings].sort((a, b) =>
    `${a.assetId}\0${a.revision}`.localeCompare(`${b.assetId}\0${b.revision}`),
  );
  return (
    descriptor.repository_identity === input.operation.repositoryIdentity &&
    descriptor.base_commit === input.operation.baseCommit &&
    Number(descriptor.artifact_count) === input.members.length &&
    (bindings.length === 0 ||
      (bindings.length === expected.length &&
        bindings.every(
          (row, index) =>
            row.asset_id === expected[index]?.assetId &&
            Number(row.revision) === expected[index]?.revision &&
            row.artifact_role === expected[index]?.artifactRole,
        )))
  );
}

function insertOperationDescriptor(db: HarnessDb, input: NormalizedGroup): void {
  const operation = input.operation;
  if (!operation) return;
  const operationId = `authoring:${sha(input.groupId).slice(0, 32)}`;
  const descriptor = {
    operation_id: operationId,
    group_id: input.groupId,
    command_payload_digest: input.commandPayloadDigest,
    repository_identity: operation.repositoryIdentity,
    base_commit: operation.baseCommit,
    artifact_count: input.members.length,
    prepared_at: input.occurredAt,
  };
  db.prepare("INSERT INTO authoring_operation_descriptors VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(descriptor),
    ledgerRowDigest(descriptor, "descriptor_digest"),
  );
  input.members.forEach((member, index) => {
    const tokenId = `authoring-${sha(`${input.groupId}\0${member.memberId}`).slice(0, 32)}`;
    const suffix = `.ut-tdd-draft-${tokenId}`;
    const row = {
      operation_id: operationId,
      group_id: input.groupId,
      member_id: member.memberId,
      ordinal: index + 1,
      artifact_role: member.memberId,
      target_path: member.artifactPath,
      temporary_path: `${member.artifactPath}${suffix}.tmp`,
      rollback_path: `${member.artifactPath}${suffix}.rollback`,
      pin_path: `.ut-tdd-draft-${tokenId}-0-published.identity`,
      expected_preimage_json: stableJson(member.expectedPreimage),
      postimage_digest: `sha256:${member.contentDigest}`,
    };
    db.prepare(
      "INSERT INTO authoring_operation_artifacts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "artifact_digest"));
  });
}

function insertRevisionBinding(
  db: HarnessDb,
  input: NormalizedGroup,
  binding: NonNullable<AuthoringCommandGroupInput["operation"]>["revisionBindings"][number],
): void {
  const existing = db
    .prepare(
      "SELECT * FROM authoring_command_revision_bindings WHERE group_id = ? AND asset_id = ? AND revision = ?",
    )
    .get(input.groupId, binding.assetId, binding.revision);
  if (existing) {
    if (
      existing.artifact_role !== binding.artifactRole ||
      existing.bound_at !== input.occurredAt ||
      existing.binding_digest !== ledgerRowDigest(existing, "binding_digest")
    )
      throw new Error("authoring-command-revision-binding-conflict");
    return;
  }
  const row = {
    group_id: input.groupId,
    asset_id: binding.assetId,
    revision: binding.revision,
    artifact_role: binding.artifactRole,
    bound_at: input.occurredAt,
  };
  db.prepare("INSERT INTO authoring_command_revision_bindings VALUES (?, ?, ?, ?, ?, ?)").run(
    ...Object.values(row),
    ledgerRowDigest(row, "binding_digest"),
  );
}

type PhaseKind =
  | "prepared"
  | "member_started"
  | "member_published"
  | "committed"
  | "recovery_required"
  | "rolled_back";
interface PhaseAppend {
  readonly kind: PhaseKind;
  readonly sequence: number;
  readonly memberId?: string;
  readonly receiptDigest?: string;
  readonly failureReason?: string;
}
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
      readonly rolledBack: boolean;
      readonly published: readonly string[];
      readonly started: readonly string[];
      readonly recoveryRequired: boolean;
    };

function normalize(input: AuthoringCommandGroupInput): NormalizedGroup | undefined {
  const members = input.members
    .map((member) => ({
      memberId: member.memberId,
      artifactPath: member.artifactPath,
      contentDigest: member.contentDigest,
      expectedPreimage: JSON.parse(
        stableJson(member.expectedPreimage),
      ) as AuthoringCommandGroupMember["expectedPreimage"],
    }))
    .sort((a, b) => a.memberId.localeCompare(b.memberId));
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
        !validPreimage(member.expectedPreimage) ||
        isSecretLike(member.artifactPath),
    ) ||
    (input.operation !== undefined &&
      (!input.operation.repositoryIdentity ||
        !/^[a-f0-9]{40}$/.test(input.operation.baseCommit) ||
        input.operation.revisionBindings.some(
          (binding) => !binding.assetId || binding.revision < 1 || !binding.artifactRole,
        )))
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
      expected_preimage_json: stableJson(member.expectedPreimage),
    };
    db.prepare("INSERT INTO authoring_command_group_members VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      ...Object.values(row),
      ledgerRowDigest(row, "member_digest"),
    );
  });
}

function insertPhase(db: HarnessDb, input: NormalizedGroup, phase: PhaseAppend): void {
  const previous = db
    .prepare(
      "SELECT event_digest FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence DESC LIMIT 1",
    )
    .get(input.groupId);
  const row = {
    phase_event_id: `authoring-group:${input.groupId}:${phase.sequence}`,
    group_id: input.groupId,
    sequence: phase.sequence,
    command_payload_digest: input.commandPayloadDigest,
    event_kind: phase.kind,
    member_id: phase.memberId ?? null,
    publish_receipt_digest: phase.receiptDigest ?? null,
    failure_reason: phase.failureReason ?? null,
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
        row.expected_preimage_json === stableJson(expected.expectedPreimage) &&
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
  const started = new Set<string>();
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
    if (kind === "member_started") {
      if (
        !memberId ||
        published.has(memberId) ||
        started.has(memberId) ||
        event.publish_receipt_digest !== null ||
        !input.members.some((m) => m.memberId === memberId)
      )
        return false;
      started.add(memberId);
    } else if (kind === "member_published") {
      if (
        !memberId ||
        !started.has(memberId) ||
        published.has(memberId) ||
        !input.members.some((m) => m.memberId === memberId)
      )
        return false;
      if (!validDigest(String(event.publish_receipt_digest))) return false;
      published.add(memberId);
      started.delete(memberId);
    } else if (kind === "committed") {
      if (
        published.size !== input.members.length ||
        memberId ||
        event.publish_receipt_digest !== null
      )
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

function safeFailure(error: unknown): string {
  const value = error instanceof Error ? error.name : "publisher-failure";
  return isSecretLike(value) ? "publisher-failure" : value.slice(0, 80);
}

function validDigest(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

function validPreimage(value: AuthoringCommandGroupMember["expectedPreimage"]): boolean {
  return (
    value.kind === "absent" ||
    (value.kind === "sha256" && /^sha256:[a-f0-9]{64}$/.test(value.digest))
  );
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
