import {
  deriveForwardReadiness,
  type ForwardEvidence,
  type ForwardReadinessRow,
  type ForwardScheduleEntry,
} from "../kernel/forward-readiness";
import { decodeMergeClosureReceipt } from "../kernel/github-closure-receipt";
import { stableId } from "../stable-id";
import { verifiedReviewLaneDigests } from "./github-review-lane-provenance";
import type { HarnessDb } from "./index";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function ids(value: unknown): string[] {
  return text(value)
    .split(/[|,]/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function hasCurrentReviewReceipt(
  db: HarnessDb,
  receipt: NonNullable<ReturnType<typeof decodeMergeClosureReceipt>>,
  repoRoot: string,
): boolean {
  const current = verifiedReviewLaneDigests(db, {
    repoRoot,
    planId: receipt.planId,
    planRevision: receipt.planRevision,
    headSha: receipt.headSha,
  });
  return (
    current?.claimBlind === receipt.reviewReceiptDigests.claimBlind &&
    current.specBlind === receipt.reviewReceiptDigests.specBlind
  );
}

function hasCurrentCheckBindings(
  db: HarnessDb,
  input: {
    repositoryId: string;
    receipt: NonNullable<ReturnType<typeof decodeMergeClosureReceipt>>;
  },
): boolean {
  const expectedObjectIds = [
    `pr:${input.receipt.prNumber}:check:${input.receipt.prCheckId}`,
    `main:${input.receipt.mergeSha}:check:${input.receipt.mainCheckId}`,
  ];
  const rows = db
    .prepare(
      `SELECT object_id
         FROM github_object_bindings
        WHERE repository_id = ?
          AND plan_id = ?
          AND plan_revision = ?
          AND object_kind = 'check_run'
          AND head_sha = ?
          AND state = '成功'
          AND object_id IN (?, ?)`,
    )
    .all(
      input.repositoryId,
      input.receipt.planId,
      input.receipt.planRevision,
      input.receipt.headSha,
      ...expectedObjectIds,
    );
  return new Set(rows.map((row) => text(row.object_id))).size === expectedObjectIds.length;
}

function lifecycleRank(kind: GithubBindingInput["objectKind"], state: string): number {
  const ranks: Partial<Record<GithubBindingInput["objectKind"], string[]>> = {
    check_run: ["未実行", "実行中", "取消", "失敗", "成功"],
    review: ["未依頼", "依頼中", "要修正", "承認"],
    pull_request: ["open", "closed", "merged"],
    branch: ["open", "active", "closed", "merged"],
    project_item: ["未同期", "遅延", "不整合", "同期済"],
  };
  return ranks[kind]?.indexOf(state) ?? 0;
}

export function readForwardSchedule(db: HarnessDb): ForwardScheduleEntry[] {
  return db
    .prepare(
      `SELECT plan_id, layer, status, current_location, rag, blocked_reason,
              predecessor_plan_ids, source_hash
         FROM schedule_entries
        ORDER BY rowid`,
    )
    .all()
    .map((row) => ({
      planId: text(row.plan_id),
      revision: text(row.source_hash) || "unknown",
      layer: text(row.layer),
      status: text(row.status),
      currentLocation: text(row.current_location),
      rag: text(row.rag),
      blockedReason: text(row.blocked_reason),
      predecessorPlanIds: ids(row.predecessor_plan_ids),
    }));
}

export function readGithubEvidence(db: HarnessDb, repoRoot = process.cwd()): ForwardEvidence[] {
  const scheduleRevisions = new Map(
    db
      .prepare("SELECT plan_id, source_hash FROM schedule_entries")
      .all()
      .map((row) => [text(row.plan_id), text(row.source_hash)]),
  );
  const rows = db
    .prepare(
      `SELECT repository_id, plan_id, plan_revision, object_kind, object_id, state, head_sha, observed_at
         FROM github_object_bindings
        ORDER BY observed_at, binding_id`,
    )
    .all()
    .filter((row) => {
      const current = scheduleRevisions.get(text(row.plan_id));
      return !current || current === text(row.plan_revision);
    });
  const pullRequests = new Map<string, Array<Record<string, unknown>>>();
  const mergeHeads = new Map<string, Set<string>>();
  for (const row of rows) {
    const planId = text(row.plan_id);
    if (row.object_kind === "pull_request")
      pullRequests.set(planId, [...(pullRequests.get(planId) ?? []), row]);
    if (row.object_kind === "merge")
      mergeHeads.set(planId, new Set([...(mergeHeads.get(planId) ?? []), text(row.head_sha)]));
  }
  const selectedHead = new Map<string, string>();
  const conflictingPlans = new Set<string>();
  for (const [planId, candidates] of pullRequests) {
    const open = candidates.filter((row) => text(row.state) === "open");
    if (open.length > 1) conflictingPlans.add(planId);
    const selected =
      open.length === 1
        ? open[0]
        : ([...candidates]
            .reverse()
            .find((row) => mergeHeads.get(planId)?.has(text(row.head_sha))) ?? candidates.at(-1));
    if (selected) selectedHead.set(planId, text(selected.head_sha));
  }
  const evidence = new Map<string, ForwardEvidence>();
  for (const row of rows) {
    const planId = text(row.plan_id);
    if (
      (row.object_kind === "check_run" || row.object_kind === "review") &&
      selectedHead.get(planId) &&
      text(row.head_sha) !== selectedHead.get(planId)
    )
      continue;
    const current = evidence.get(planId) ?? { planId };
    const state = text(row.state);
    current.headSha = text(row.head_sha) || current.headSha;
    if (
      row.object_kind === "check_run" &&
      ["未実行", "実行中", "成功", "失敗", "取消"].includes(state)
    )
      current.ci = state as NonNullable<ForwardEvidence["ci"]>;
    if (row.object_kind === "review" && ["未依頼", "依頼中", "承認", "要修正"].includes(state))
      current.review = state as NonNullable<ForwardEvidence["review"]>;
    if (
      row.object_kind === "merge" &&
      (() => {
        const receipt = decodeMergeClosureReceipt(text(row.state));
        return (
          receipt?.planId === planId &&
          receipt.planRevision === text(row.plan_revision) &&
          receipt.headSha === text(row.head_sha) &&
          text(row.object_id) === `pr:${receipt.prNumber}:merge:${receipt.mergeSha}` &&
          hasCurrentCheckBindings(db, {
            repositoryId: text(row.repository_id),
            receipt,
          }) &&
          hasCurrentReviewReceipt(db, receipt, repoRoot)
        );
      })() &&
      (!selectedHead.get(planId) || text(row.head_sha) === selectedHead.get(planId))
    )
      current.mergeVerified = true;
    evidence.set(planId, current);
  }
  for (const row of db
    .prepare(
      "SELECT plan_id, plan_revision, sync_status, head_sha FROM github_project_item_projection ORDER BY last_reconciled_at",
    )
    .all()) {
    const planId = text(row.plan_id);
    const currentRevision = scheduleRevisions.get(planId);
    if (currentRevision && currentRevision !== text(row.plan_revision)) continue;
    const current = evidence.get(planId) ?? { planId };
    const sync = text(row.sync_status);
    const projectHead = text(row.head_sha);
    const authoritativeHead = selectedHead.get(planId) || current.headSha;
    if (authoritativeHead && projectHead && authoritativeHead !== projectHead) {
      current.sync = "不整合";
      current.headSha = authoritativeHead;
      conflictingPlans.add(planId);
    } else if (["同期済", "遅延", "不整合", "未同期"].includes(sync)) {
      current.sync = sync as NonNullable<ForwardEvidence["sync"]>;
      current.headSha = authoritativeHead || projectHead || current.headSha;
    }
    evidence.set(planId, current);
  }
  for (const planId of conflictingPlans) {
    const current = evidence.get(planId) ?? { planId };
    current.sync = "不整合";
    evidence.set(planId, current);
  }
  return [...evidence.values()];
}

export function deriveStoredForwardReadiness(
  db: HarnessDb,
  repoRoot = process.cwd(),
): ForwardReadinessRow[] {
  return deriveForwardReadiness(readForwardSchedule(db), readGithubEvidence(db, repoRoot));
}

export function selectActiveProjectRows(
  rows: readonly ForwardReadinessRow[],
  existingProjectPlans: ReadonlySet<string>,
): ForwardReadinessRow[] {
  return rows.filter(
    (row) =>
      (row.readiness !== "完了" && row.readiness !== "保留") ||
      existingProjectPlans.has(row.planId),
  );
}

export function selectExistingProjectPlans(
  db: HarnessDb,
  repositoryId: string,
): ReadonlySet<string> {
  return new Set(
    db
      .prepare(
        `SELECT DISTINCT plan_id
           FROM github_project_item_projection
          WHERE repository_id = ?`,
      )
      .all(repositoryId)
      .map((row) => text(row.plan_id))
      .filter(Boolean),
  );
}

const MANUAL_GITHUB_OBSERVATION_KINDS = new Set([
  "project_item",
  "issue",
  "branch",
  "pull_request",
]);

export function isManualGithubObservationKind(kind: string): boolean {
  return MANUAL_GITHUB_OBSERVATION_KINDS.has(kind);
}

export interface RebuildExecutionReadinessInput {
  db: HarnessDb;
  now?: string;
  transactional?: boolean;
  repoRoot?: string;
}

export function rebuildExecutionReadiness(
  input: RebuildExecutionReadinessInput,
): ForwardReadinessRow[] {
  const now = input.now ?? new Date().toISOString();
  const transactional = input.transactional ?? true;
  const rows = deriveStoredForwardReadiness(input.db, input.repoRoot);
  const db = input.db;
  const write = db.prepare(
    `INSERT INTO execution_readiness_projection (
       plan_id, plan_revision, readiness, current_gate, implementation_order,
       predecessor_plan_ids, blocked_reason, unlock_condition, next_plan_ids,
       unlocked_plan_ids, computed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(plan_id) DO UPDATE SET
       plan_revision=excluded.plan_revision, readiness=excluded.readiness,
       current_gate=excluded.current_gate, implementation_order=excluded.implementation_order,
       predecessor_plan_ids=excluded.predecessor_plan_ids,
       blocked_reason=excluded.blocked_reason, unlock_condition=excluded.unlock_condition,
       next_plan_ids=excluded.next_plan_ids, unlocked_plan_ids=excluded.unlocked_plan_ids,
       computed_at=excluded.computed_at`,
  );
  if (transactional) db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM execution_readiness_projection");
    for (const row of rows) {
      write.run(
        row.planId,
        row.revision,
        row.readiness,
        row.currentGate,
        row.implementationOrder,
        row.predecessorPlanIds.join("|"),
        row.blockedReason,
        row.unlockCondition,
        row.nextPlanIds.join("|"),
        row.unlockedPlanIds.join("|"),
        now,
      );
    }
    if (transactional) db.exec("COMMIT");
  } catch (error) {
    if (transactional) db.exec("ROLLBACK");
    throw error;
  }
  return rows;
}

export interface GithubBindingInput {
  repositoryId: string;
  planId: string;
  planRevision: string;
  projectItemId?: string;
  objectKind: "project_item" | "issue" | "branch" | "pull_request" | "check_run" | "review";
  objectId: string;
  objectUrl?: string;
  headSha?: string;
  state: string;
  observedAt?: string;
}

export function recordGithubBinding(db: HarnessDb, input: GithubBindingInput): string | undefined {
  const observedAt = input.observedAt ?? new Date().toISOString();
  if (String(input.objectKind) === "merge")
    throw new Error("merge closure receipts are repository-sync only");
  const existing = db
    .prepare(
      `SELECT binding_id, plan_id, plan_revision, state, head_sha, observed_at
         FROM github_object_bindings
        WHERE repository_id = ? AND object_kind = ? AND object_id = ?`,
    )
    .get(input.repositoryId, input.objectKind, input.objectId);
  if (existing && text(existing.plan_id) !== input.planId) {
    throw new Error(
      `GitHub object identity conflict: ${input.objectKind}/${input.objectId} is already bound to ${text(existing.plan_id)}@${text(existing.plan_revision)}`,
    );
  }
  if (existing && observedAt < text(existing.observed_at)) return undefined;
  if (
    existing &&
    observedAt === text(existing.observed_at) &&
    (text(existing.state) !== input.state || text(existing.head_sha) !== (input.headSha ?? ""))
  ) {
    const previousRank = lifecycleRank(input.objectKind, text(existing.state));
    const nextRank = lifecycleRank(input.objectKind, input.state);
    if (nextRank < previousRank) return undefined;
    if (nextRank === previousRank || text(existing.head_sha) !== (input.headSha ?? ""))
      throw new Error(
        `GitHub observation conflict at ${observedAt}: ${input.objectKind}/${input.objectId}`,
      );
  }
  if (input.objectKind === "check_run" || input.objectKind === "review") {
    const pullRequest = db
      .prepare(
        `SELECT head_sha FROM github_object_bindings
          WHERE repository_id = ? AND plan_id = ? AND plan_revision = ?
            AND object_kind = 'pull_request'
          ORDER BY observed_at DESC LIMIT 1`,
      )
      .get(input.repositoryId, input.planId, input.planRevision);
    const expectedHead = text(pullRequest?.head_sha);
    if (expectedHead && input.headSha && expectedHead !== input.headSha) {
      throw new Error(
        `stale GitHub observation: ${input.objectKind} head ${input.headSha} != PR head ${expectedHead}`,
      );
    }
  }
  const bindingId = stableId(
    "github-binding",
    `${input.repositoryId}:${input.objectKind}:${input.objectId}`,
  );
  db.prepare(
    `INSERT INTO github_object_bindings (
       binding_id, repository_id, plan_id, plan_revision, project_item_id,
       object_kind, object_id, object_url, head_sha, state, observed_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(repository_id, object_kind, object_id) DO UPDATE SET
       plan_id=excluded.plan_id, plan_revision=excluded.plan_revision,
       project_item_id=excluded.project_item_id, object_url=excluded.object_url,
       head_sha=excluded.head_sha, state=excluded.state, observed_at=excluded.observed_at`,
  ).run(
    bindingId,
    input.repositoryId,
    input.planId,
    input.planRevision,
    input.projectItemId ?? "",
    input.objectKind,
    input.objectId,
    input.objectUrl ?? "",
    input.headSha ?? "",
    input.state,
    observedAt,
  );
  return bindingId;
}

export function queueGithubProjection(input: {
  db: HarnessDb;
  repositoryId: string;
  planId: string;
  planRevision: string;
  operation: string;
  payload: unknown;
  now?: string;
}): string {
  const now = input.now ?? new Date().toISOString();
  const outboxId = stableId(
    "github-outbox",
    `${input.repositoryId}:${input.planId}:${input.planRevision}:${input.operation}`,
  );
  input.db
    .prepare(
      `INSERT INTO github_projection_outbox (
         outbox_id, repository_id, plan_id, plan_revision, operation, payload_json,
         status, attempt_count, last_error, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, '', ?, ?)
       ON CONFLICT(repository_id, plan_id, plan_revision, operation) DO UPDATE SET
         payload_json=excluded.payload_json,
         status=CASE WHEN github_projection_outbox.status = 'applied' THEN 'applied' ELSE 'pending' END,
         updated_at=excluded.updated_at`,
    )
    .run(
      outboxId,
      input.repositoryId,
      input.planId,
      input.planRevision,
      input.operation,
      JSON.stringify(input.payload),
      now,
      now,
    );
  return outboxId;
}

export function markGithubProjectionApplied(
  db: HarnessDb,
  outboxIds: readonly string[],
  now = new Date().toISOString(),
): void {
  const statement = db.prepare(
    `UPDATE github_projection_outbox
        SET status = 'applied', attempt_count = attempt_count + 1, last_error = '', updated_at = ?
      WHERE outbox_id = ?`,
  );
  for (const id of outboxIds) statement.run(now, id);
}
