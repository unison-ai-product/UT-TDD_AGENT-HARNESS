import {
  deriveForwardReadiness,
  type ForwardEvidence,
  type ForwardReadinessRow,
  type ForwardScheduleEntry,
} from "../kernel/forward-readiness.ts";
import { decodeMergeClosureReceipt } from "../kernel/github-closure-receipt.ts";
import { verifiedReviewLaneDigests } from "./github-review-lane-provenance.ts";
import type { HarnessDb } from "./index.ts";

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

export function readForwardSchedule(db: HarnessDb): ForwardScheduleEntry[] {
  return db
    .prepare(
      `SELECT plan_id, layer, status, current_location, rag, blocked_reason,
              predecessor_plan_ids, plan_revision
         FROM schedule_entries
        WHERE NULLIF(plan_revision, '') IS NOT NULL
        ORDER BY rowid`,
    )
    .all()
    .map((row) => ({
      planId: text(row.plan_id),
      revision: text(row.plan_revision) || "unknown",
      layer: text(row.layer),
      status: text(row.status),
      currentLocation: text(row.current_location),
      rag: text(row.rag),
      blockedReason: text(row.blocked_reason),
      predecessorPlanIds: ids(row.predecessor_plan_ids),
    }));
}

export function readGithubEvidence(
  db: HarnessDb,
  repoRoot = process.cwd(),
  repositoryId = "",
): ForwardEvidence[] {
  const scheduleRevisions = new Map(
    db
      .prepare(
        "SELECT plan_id, plan_revision FROM schedule_entries WHERE NULLIF(plan_revision, '') IS NOT NULL",
      )
      .all()
      .map((row) => [text(row.plan_id), text(row.plan_revision)]),
  );
  const rows = db
    .prepare(
      `SELECT repository_id, plan_id, plan_revision, object_kind, object_id, state, head_sha, observed_at
         FROM github_object_bindings
        WHERE (? = '' OR repository_id = ?)
        ORDER BY observed_at, binding_id`,
    )
    .all(repositoryId, repositoryId)
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
    if (conflictingPlans.has(planId)) continue;
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
      `SELECT plan_id, plan_revision, sync_status, head_sha
         FROM github_project_item_projection
        WHERE (? = '' OR repository_id = ?)
        ORDER BY last_reconciled_at`,
    )
    .all(repositoryId, repositoryId)) {
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
  repositoryId = "",
): ForwardReadinessRow[] {
  return deriveForwardReadiness(
    readForwardSchedule(db),
    readGithubEvidence(db, repoRoot, repositoryId),
  );
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
