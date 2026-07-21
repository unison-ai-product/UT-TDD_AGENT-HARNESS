import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { groupIsSemanticallyTerminal } from "../plan-asset/ledger/authoring-recovery-gate.js";
import {
  authoringCommandGroupValid,
  authoringOperationGroupValid,
  ledgerRowDigest,
} from "../plan-asset/ledger/schema.js";
import type { HarnessDb } from "../state-db/index.js";
import { inspectAuthoringRecoveryDbEvidence } from "./authoring-recovery-db-evidence.js";

export function ensureAuthoringRecoveryAssessment(
  db: HarnessDb,
  repoRoot: string,
  commandId: string,
): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    const context = loadContext(db, commandId);
    if (!context) {
      db.exec("COMMIT");
      return;
    }
    if (!authoringCommandGroupValid(db, commandId) || !authoringOperationGroupValid(db, commandId))
      throw new Error("plan-recovery-command-corrupt");
    if (
      ["committed", "rolled_back"].includes(context.state) &&
      groupIsSemanticallyTerminal(db, repoRoot, commandId, context.state)
    ) {
      db.exec("COMMIT");
      return;
    }
    const evidence = { lane: inspectAuthoringRecoveryDbEvidence(db, commandId) };
    if (
      (context.state === "committed" && evidence.lane !== "complete") ||
      (context.state === "rolled_back" && evidence.lane !== "zero")
    )
      throw new Error("plan-recovery-terminal-evidence-conflict");
    const custody = inspectCustody(repoRoot, context.artifacts, context.published.length, evidence);
    const latest = db
      .prepare(
        "SELECT * FROM authoring_recovery_assessment_events WHERE operation_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(context.operationId);
    let latestCustody: string | undefined;
    try {
      latestCustody = String(JSON.parse(String(latest?.assessment_json)).custodyDigest ?? "");
    } catch {
      latestCustody = undefined;
    }
    if (latestCustody === custody.digest && latest?.strategy === custody.strategy) {
      db.exec("COMMIT");
      return;
    }
    const sequence = Number(latest?.sequence ?? 0) + 1;
    const assessmentJson = stableJson({
      custodyDigest: custody.digest,
      evidence: evidence.lane,
      phaseState: context.state,
      published: context.published,
      strategy: custody.strategy,
    });
    const assessmentDigest = sha(assessmentJson);
    const fencingToken = `fence:${sequence}:${sha(`${context.operationId}\0${sequence}\0${randomUUID()}`)}`;
    const row = {
      assessment_event_id: `assessment:${context.operationId}:${sequence}`,
      operation_id: context.operationId,
      sequence,
      strategy: custody.strategy,
      assessment_json: assessmentJson,
      assessment_digest: assessmentDigest,
      fencing_token: fencingToken,
      occurred_at: new Date().toISOString(),
      previous_event_digest: latest?.event_digest ?? null,
    };
    db.prepare(
      "INSERT INTO authoring_recovery_assessment_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

type Artifact = {
  target: string;
  temporary: string;
  rollback: string;
  publishedPin: string;
  preimage: { kind: "absent" } | { kind: "sha256"; digest: string };
  postimage: string;
};

function loadContext(db: HarnessDb, commandId: string) {
  const header = db
    .prepare(
      `SELECT operation.operation_id, phase.event_kind
       FROM authoring_command_group_headers header
       JOIN authoring_operation_descriptors operation ON operation.group_id = header.group_id
       JOIN authoring_command_group_phase_events phase ON phase.group_id = header.group_id
       WHERE header.group_id = ? AND phase.sequence = (
         SELECT MAX(latest.sequence) FROM authoring_command_group_phase_events latest
         WHERE latest.group_id = header.group_id)`,
    )
    .get(commandId);
  if (!header) return undefined;
  const artifacts = db
    .prepare(
      `SELECT target_path, temporary_path, rollback_path, pin_path,
              expected_preimage_json, postimage_digest
       FROM authoring_operation_artifacts WHERE operation_id = ? ORDER BY ordinal`,
    )
    .all(header.operation_id)
    .map(
      (row): Artifact => ({
        target: String(row.target_path),
        temporary: String(row.temporary_path),
        rollback: String(row.rollback_path),
        publishedPin: String(row.pin_path),
        preimage: JSON.parse(String(row.expected_preimage_json)),
        postimage: String(row.postimage_digest),
      }),
    );
  const memberCount = Number(
    db
      .prepare("SELECT member_count FROM authoring_command_group_headers WHERE group_id = ?")
      .get(commandId)?.member_count,
  );
  if (artifacts.length === 0 || artifacts.length !== memberCount)
    throw new Error("plan-recovery-command-corrupt");
  const published = db
    .prepare(
      "SELECT member_id FROM authoring_command_group_phase_events WHERE group_id = ? AND event_kind = 'member_published' ORDER BY member_id",
    )
    .all(commandId)
    .map((row) => String(row.member_id));
  return {
    operationId: String(header.operation_id),
    state: String(header.event_kind),
    artifacts,
    published,
  };
}

function inspectCustody(
  root: string,
  artifacts: Artifact[],
  publishedCount: number,
  evidence: { lane: "zero" | "complete" },
) {
  const states = artifacts.map((artifact) => inspectArtifact(root, artifact));
  const allPost = states.every((state) => state.target === "postimage");
  const rollbackCapable = states.every((state) => state.rollbackCapable);
  const allNonPostStaged = states.every(
    (state) => state.target === "postimage" || state.temporaryPostimage,
  );
  const strategy =
    evidence.lane === "zero"
      ? rollbackCapable
        ? "rollback"
        : "none"
      : allPost
        ? "finalize"
        : allNonPostStaged
          ? "roll_forward"
          : "none";
  if (strategy === "none") throw new Error("plan-recovery-custody-ambiguous");
  return { strategy, digest: sha(stableJson({ evidence: evidence.lane, publishedCount, states })) };
}

function inspectArtifact(root: string, artifact: Artifact) {
  const target = safe(root, artifact.target);
  const temporary = safe(root, artifact.temporary);
  const rollback = safe(root, artifact.rollback);
  const publishedPin = safe(root, artifact.publishedPin);
  const temporaryPin = safe(
    root,
    artifact.publishedPin.replace("published.identity", "temporary.identity"),
  );
  const rollbackPin = safe(
    root,
    artifact.publishedPin.replace("published.identity", "rollback.identity"),
  );
  const targetState = digestMatches(target, artifact.postimage)
    ? "postimage"
    : artifact.preimage.kind === "absent" && !existsSync(target)
      ? "preimage"
      : artifact.preimage.kind === "sha256" && digestMatches(target, artifact.preimage.digest)
        ? "preimage"
        : existsSync(target)
          ? "other"
          : "missing";
  validateOptional(temporary, artifact.postimage);
  validateOptional(temporaryPin, artifact.postimage);
  if (existsSync(temporary) && existsSync(temporaryPin))
    assertSameIdentity(temporary, temporaryPin);
  if (existsSync(temporaryPin) && !existsSync(temporary))
    throw new Error("plan-recovery-custody-ambiguous");
  if (artifact.preimage.kind === "sha256") {
    validateOptional(rollback, artifact.preimage.digest);
    validateOptional(rollbackPin, artifact.preimage.digest);
    if (existsSync(rollback) && existsSync(rollbackPin)) assertSameIdentity(rollback, rollbackPin);
    if (existsSync(rollbackPin) !== existsSync(rollback))
      throw new Error("plan-recovery-custody-ambiguous");
  } else if (existsSync(rollback) || existsSync(rollbackPin)) {
    throw new Error("plan-recovery-custody-ambiguous");
  }
  validateOptional(publishedPin, artifact.postimage);
  if (targetState === "postimage" && existsSync(publishedPin))
    assertSameIdentity(target, publishedPin);
  if (existsSync(publishedPin) && targetState !== "postimage")
    throw new Error("plan-recovery-custody-ambiguous");
  const publishedIdentity =
    targetState === "postimage" && existsSync(publishedPin) && sameIdentity(target, publishedPin);
  const rollbackIdentity =
    artifact.preimage.kind === "absent"
      ? true
      : existsSync(rollback) && existsSync(rollbackPin) && sameIdentity(rollback, rollbackPin);
  const rollbackCapable =
    targetState === "preimage" ||
    (artifact.preimage.kind === "absent" && targetState === "missing") ||
    (targetState === "postimage" && publishedIdentity && rollbackIdentity);
  return {
    target: targetState,
    temporaryPostimage: digestMatches(temporary, artifact.postimage),
    auxiliaryCount: [temporary, rollback, publishedPin, temporaryPin, rollbackPin].filter(
      existsSync,
    ).length,
    rollbackCapable,
  };
}

function safe(root: string, path: string): string {
  if (isAbsolute(path)) throw new Error("plan-recovery-path-invalid");
  const value = resolve(root, path);
  const rel = relative(root, value);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("plan-recovery-path-invalid");
  return value;
}
function validateOptional(path: string, digest: string): void {
  if (existsSync(path) && !digestMatches(path, digest))
    throw new Error("plan-recovery-custody-ambiguous");
}
function digestMatches(path: string, digest: string): boolean {
  if (!existsSync(path)) return false;
  const stat = lstatSync(path);
  return stat.isFile() && !stat.isSymbolicLink() && `sha256:${sha(readFileSync(path))}` === digest;
}
function assertSameIdentity(left: string, right: string): void {
  const a = lstatSync(left);
  const b = lstatSync(right);
  if (a.dev !== b.dev || a.ino !== b.ino) throw new Error("plan-recovery-identity-mismatch");
}
function sameIdentity(left: string, right: string): boolean {
  const a = lstatSync(left);
  const b = lstatSync(right);
  return a.dev === b.dev && a.ino === b.ino;
}
function sha(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
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
