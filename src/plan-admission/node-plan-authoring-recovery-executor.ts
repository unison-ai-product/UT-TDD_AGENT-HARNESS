import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { ledgerRowDigest } from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import { inspectAuthoringRecoveryDbEvidence } from "./authoring-recovery-db-evidence.js";
import { NodeAtomicDraftPublisher } from "./node-atomic-draft-publisher.js";

type Strategy = "rollback" | "roll_forward" | "finalize";

export class NodePlanAuthoringRecoveryExecutor {
  constructor(
    private readonly repoRoot: string,
    private readonly injectFault: (point: "after-artifact-mutation") => void = () => undefined,
  ) {}

  execute(
    db: HarnessDb,
    input: {
      commandId: string;
      strategy: Strategy;
      expectedAssessmentDigest: string;
      expectedFencingToken: string;
    },
  ): { state: "rolled_back" | "committed"; strategy: Strategy } {
    db.exec("BEGIN IMMEDIATE");
    try {
      const snapshot = loadSnapshot(db, input.commandId);
      if (
        snapshot.assessmentDigest !== input.expectedAssessmentDigest ||
        snapshot.fencingToken !== input.expectedFencingToken
      )
        throw new Error("plan-recovery-assessment-drift");
      if (snapshot.strategy !== input.strategy)
        throw new Error("plan-recovery-strategy-ineligible");
      const publisher = new NodeAtomicDraftPublisher({ rootDir: this.repoRoot });
      if (input.strategy === "rollback") {
        if (snapshot.evidenceLane !== "zero") throw new Error("plan-recovery-db-evidence-present");
        for (const artifact of snapshot.artifacts) {
          publisher.restoreSingleArtifactPublication(artifactCapability(artifact));
          verifyRestored(this.repoRoot, artifact);
          this.injectFault("after-artifact-mutation");
        }
        appendRecoveryEvidence(db, snapshot, "restore");
        appendTerminal(db, snapshot, "rolled_back");
        const result = { state: "rolled_back" as const, strategy: input.strategy };
        db.exec("COMMIT");
        return result;
      }
      if (snapshot.evidenceLane !== "complete")
        throw new Error("plan-recovery-db-evidence-incomplete");
      const alreadyFinalized = snapshot.artifacts.every(
        (artifact) =>
          digestMatches(safe(this.repoRoot, artifact.targetPath), artifact.postimage) &&
          auxiliaryPaths(artifact).every((path) => !existsSync(safe(this.repoRoot, path))),
      );
      if (alreadyFinalized) {
        if (input.strategy !== "finalize") throw new Error("plan-recovery-strategy-ineligible");
        appendRecoveryEvidence(db, snapshot, "finalize");
        appendPublishedAndCommitted(db, snapshot);
        const result = { state: "committed" as const, strategy: input.strategy };
        db.exec("COMMIT");
        return result;
      }
      for (const artifact of snapshot.artifacts) {
        const capability = artifactCapability(artifact);
        publisher.recoverSingleArtifactPublication(capability);
        publisher.verifySingleArtifactCustody(capability);
        this.injectFault("after-artifact-mutation");
      }
      for (const artifact of snapshot.artifacts) {
        const capability = artifactCapability(artifact);
        publisher.resumeSingleArtifactCleanup(capability);
        verifyFinalized(this.repoRoot, artifact);
      }
      appendRecoveryEvidence(db, snapshot, input.strategy);
      appendPublishedAndCommitted(db, snapshot);
      const result = { state: "committed" as const, strategy: input.strategy };
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

type Artifact = {
  memberId: string;
  targetPath: string;
  temporaryPath: string;
  rollbackPath: string;
  publishedPinPath: string;
  preimage: { kind: "absent" } | { kind: "sha256"; digest: `sha256:${string}` };
  postimage: `sha256:${string}`;
  contentDigest: string;
};
type Snapshot = {
  commandId: string;
  commandPayloadDigest: string;
  occurredAt: string;
  operationId: string;
  assessmentDigest: string;
  fencingToken: string;
  strategy: Strategy;
  artifacts: Artifact[];
  published: Set<string>;
  lastEventDigest: string;
  lastSequence: number;
  lastEventKind: string;
  started: Set<string>;
  evidenceLane: "zero" | "complete";
};

function loadSnapshot(db: HarnessDb, commandId: string): Snapshot {
  const row = db
    .prepare(
      `SELECT header.command_payload_digest, header.created_at, operation.operation_id,
            assessment.strategy, assessment.assessment_digest, assessment.fencing_token
     FROM authoring_command_group_headers header
     JOIN authoring_operation_descriptors operation ON operation.group_id = header.group_id
     JOIN authoring_recovery_assessment_events assessment ON assessment.operation_id = operation.operation_id
     WHERE header.group_id = ? AND assessment.sequence = (
       SELECT MAX(current.sequence) FROM authoring_recovery_assessment_events current
       WHERE current.operation_id = operation.operation_id)`,
    )
    .get(commandId);
  if (!row) throw new Error("plan-recovery-command-corrupt");
  const phase = db
    .prepare(
      "SELECT * FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence",
    )
    .all(commandId);
  if (phase.length === 0) throw new Error("plan-recovery-command-corrupt");
  const artifacts = db
    .prepare(
      `SELECT artifact.*, member.content_digest FROM authoring_operation_artifacts artifact
     JOIN authoring_command_group_members member
       ON member.group_id = artifact.group_id AND member.member_id = artifact.member_id
     WHERE artifact.operation_id = ? ORDER BY artifact.ordinal`,
    )
    .all(row.operation_id)
    .map(
      (value): Artifact => ({
        memberId: String(value.member_id),
        targetPath: String(value.target_path),
        temporaryPath: String(value.temporary_path),
        rollbackPath: String(value.rollback_path),
        publishedPinPath: String(value.pin_path),
        preimage: JSON.parse(String(value.expected_preimage_json)),
        postimage: String(value.postimage_digest) as `sha256:${string}`,
        contentDigest: String(value.content_digest),
      }),
    );
  if (artifacts.length === 0) throw new Error("plan-recovery-command-corrupt");
  const last = phase.at(-1);
  if (!last) throw new Error("plan-recovery-command-corrupt");
  const evidenceLane = inspectAuthoringRecoveryDbEvidence(db, commandId);
  return {
    commandId,
    commandPayloadDigest: String(row.command_payload_digest),
    occurredAt: String(row.created_at),
    operationId: String(row.operation_id),
    assessmentDigest: String(row.assessment_digest),
    fencingToken: String(row.fencing_token),
    strategy: String(row.strategy) as Strategy,
    artifacts,
    published: new Set(
      phase.filter((p) => p.event_kind === "member_published").map((p) => String(p.member_id)),
    ),
    started: new Set(
      phase.filter((p) => p.event_kind === "member_started").map((p) => String(p.member_id)),
    ),
    lastEventDigest: String(last.event_digest),
    lastSequence: Number(last.sequence),
    lastEventKind: String(last.event_kind),
    evidenceLane,
  };
}

function artifactCapability(artifact: Artifact) {
  return {
    tokenId: tokenId(artifact.publishedPinPath),
    path: artifact.targetPath,
    preimage: artifact.preimage,
    postimage: artifact.postimage,
  };
}

function tokenId(pinPath: string): string {
  const match = pinPath.match(/\.ut-tdd-draft-([A-Za-z0-9_-]+)-0-published\.identity$/);
  if (!match?.[1]) throw new Error("plan-recovery-pin-invalid");
  return match[1];
}
function verifyFinalized(root: string, artifact: Artifact): void {
  assertDigest(safe(root, artifact.targetPath), artifact.postimage);
  assertAuxZero(root, artifact);
}
function verifyRestored(root: string, artifact: Artifact): void {
  const target = safe(root, artifact.targetPath);
  if (artifact.preimage.kind === "absent") {
    if (existsSync(target)) throw new Error("plan-recovery-restore-mismatch");
  } else assertDigest(target, artifact.preimage.digest);
  assertAuxZero(root, artifact);
}
function assertAuxZero(root: string, artifact: Artifact): void {
  if (auxiliaryPaths(artifact).some((path) => existsSync(safe(root, path))))
    throw new Error("plan-recovery-auxiliary-remains");
}
function auxiliaryPaths(artifact: Artifact): string[] {
  return [
    artifact.temporaryPath,
    artifact.rollbackPath,
    artifact.publishedPinPath,
    artifact.publishedPinPath.replace("published.identity", "temporary.identity"),
    artifact.publishedPinPath.replace("published.identity", "rollback.identity"),
  ];
}
function safe(root: string, path: string): string {
  if (isAbsolute(path)) throw new Error("plan-recovery-path-invalid");
  const value = resolve(root, path);
  const rel = relative(root, value);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("plan-recovery-path-invalid");
  return value;
}
function assertDigest(path: string, digest: string): void {
  if (!digestMatches(path, digest)) throw new Error("plan-recovery-digest-mismatch");
}
function digestMatches(path: string, digest: string): boolean {
  return (
    existsSync(path) &&
    lstatSync(path).isFile() &&
    !lstatSync(path).isSymbolicLink() &&
    `sha256:${sha(readFileSync(path))}` === digest
  );
}
function appendRecoveryEvidence(
  db: HarnessDb,
  snapshot: Snapshot,
  action: "restore" | "roll_forward" | "finalize",
): void {
  const latest = db
    .prepare(
      "SELECT assessment_digest, fencing_token FROM authoring_recovery_assessment_events WHERE operation_id = ? ORDER BY sequence DESC LIMIT 1",
    )
    .get(snapshot.operationId);
  if (
    latest?.assessment_digest !== snapshot.assessmentDigest ||
    latest?.fencing_token !== snapshot.fencingToken
  )
    throw new Error("plan-recovery-assessment-drift");
  for (const artifact of snapshot.artifacts) {
    const previous = db
      .prepare(
        "SELECT sequence, event_digest FROM authoring_artifact_recovery_events WHERE operation_id = ? AND member_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(snapshot.operationId, artifact.memberId);
    const sequence = Number(previous?.sequence ?? 0) + 1;
    const row = {
      recovery_event_id: `artifact-recovery:${snapshot.operationId}:${artifact.memberId}:${sequence}`,
      operation_id: snapshot.operationId,
      member_id: artifact.memberId,
      sequence,
      action,
      result: "succeeded",
      before_state_json: "{}",
      after_state_json: JSON.stringify({
        verified: true,
        auxiliaryCount: 0,
      }),
      assessment_digest: snapshot.assessmentDigest,
      fencing_token: snapshot.fencingToken,
      actor: "plan-recovery-cli",
      occurred_at: snapshot.occurredAt,
      failure_reason: null,
      previous_event_digest: previous?.event_digest ?? null,
    };
    db.prepare(
      "INSERT INTO authoring_artifact_recovery_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
  }
  const previousAttempt = db
    .prepare(
      "SELECT sequence, event_digest FROM authoring_recovery_attempt_events WHERE operation_id = ? ORDER BY sequence DESC LIMIT 1",
    )
    .get(snapshot.operationId);
  const attemptSequence = Number(previousAttempt?.sequence ?? 0) + 1;
  const attempt = {
    attempt_event_id: `attempt:${snapshot.operationId}:${attemptSequence}`,
    operation_id: snapshot.operationId,
    sequence: attemptSequence,
    assessment_digest: snapshot.assessmentDigest,
    fencing_token: snapshot.fencingToken,
    strategy: action === "restore" ? "rollback" : action,
    result: "succeeded",
    actor: "plan-recovery-cli",
    occurred_at: snapshot.occurredAt,
    failure_reason: null,
    previous_event_digest: previousAttempt?.event_digest ?? null,
  };
  db.prepare(
    "INSERT INTO authoring_recovery_attempt_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(...Object.values(attempt), ledgerRowDigest(attempt, "event_digest"));
}

function appendPublishedAndCommitted(db: HarnessDb, snapshot: Snapshot): void {
  if (isTerminalPhase(snapshot.lastEventKind)) return;
  let sequence = snapshot.lastSequence;
  let previous = snapshot.lastEventDigest;
  for (const artifact of snapshot.artifacts.filter((a) => !snapshot.published.has(a.memberId))) {
    if (!snapshot.started.has(artifact.memberId))
      ({ sequence, previous } = appendPhase(
        db,
        snapshot,
        sequence,
        previous,
        "member_started",
        artifact,
      ));
    ({ sequence, previous } = appendPhase(
      db,
      snapshot,
      sequence,
      previous,
      "member_published",
      artifact,
    ));
  }
  appendPhase(db, snapshot, sequence, previous, "committed");
}
function appendTerminal(db: HarnessDb, snapshot: Snapshot, kind: "rolled_back"): void {
  if (isTerminalPhase(snapshot.lastEventKind)) return;
  appendPhase(db, snapshot, snapshot.lastSequence, snapshot.lastEventDigest, kind);
}
function isTerminalPhase(kind: string): boolean {
  return kind === "committed" || kind === "rolled_back";
}
function appendPhase(
  db: HarnessDb,
  snapshot: Snapshot,
  sequence: number,
  previous: string,
  kind: "member_started" | "member_published" | "committed" | "rolled_back",
  artifact?: Artifact,
) {
  const next = sequence + 1;
  const row = {
    phase_event_id: `authoring-group:${snapshot.commandId}:${next}`,
    group_id: snapshot.commandId,
    sequence: next,
    command_payload_digest: snapshot.commandPayloadDigest,
    event_kind: kind,
    member_id: artifact?.memberId ?? null,
    publish_receipt_digest:
      kind === "member_published" && artifact
        ? sha(
            `${snapshot.commandId}\0${artifact.memberId}\0${artifact.targetPath}\0${artifact.contentDigest}`,
          )
        : null,
    failure_reason: null,
    occurred_at: snapshot.occurredAt,
    previous_event_digest: previous,
  };
  const digest = ledgerRowDigest(row, "event_digest");
  db.prepare(
    "INSERT INTO authoring_command_group_phase_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(...Object.values(row), digest);
  return { sequence: next, previous: digest };
}
function sha(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
