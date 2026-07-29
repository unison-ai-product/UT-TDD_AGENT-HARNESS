import { stableId } from "../stable-id";
import type { HarnessDb } from "../state-db/index";
import {
  deriveForwardReadiness,
  type ForwardEvidence,
  type ForwardReadinessRow,
  type ForwardScheduleEntry,
} from "./forward-readiness";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function ids(value: unknown): string[] {
  return text(value)
    .split(/[|,]/)
    .map((id) => id.trim())
    .filter(Boolean);
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

export function readGithubEvidence(db: HarnessDb): ForwardEvidence[] {
  const rows = db
    .prepare(
      `SELECT plan_id, object_kind, state, head_sha
         FROM github_object_bindings
        ORDER BY observed_at, binding_id`,
    )
    .all();
  const latestPullRequestHead = new Map<string, string>();
  for (const row of rows) {
    if (row.object_kind === "pull_request")
      latestPullRequestHead.set(text(row.plan_id), text(row.head_sha));
  }
  const evidence = new Map<string, ForwardEvidence>();
  for (const row of rows) {
    const planId = text(row.plan_id);
    if (
      (row.object_kind === "check_run" || row.object_kind === "review") &&
      latestPullRequestHead.get(planId) &&
      text(row.head_sha) !== latestPullRequestHead.get(planId)
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
    evidence.set(planId, current);
  }
  for (const row of db
    .prepare("SELECT plan_id, sync_status, head_sha FROM github_project_item_projection")
    .all()) {
    const planId = text(row.plan_id);
    const current = evidence.get(planId) ?? { planId };
    const sync = text(row.sync_status);
    if (["同期済", "遅延", "不整合", "未同期"].includes(sync))
      current.sync = sync as NonNullable<ForwardEvidence["sync"]>;
    current.headSha = text(row.head_sha) || current.headSha;
    evidence.set(planId, current);
  }
  return [...evidence.values()];
}

export function rebuildExecutionReadiness(
  db: HarnessDb,
  now = new Date().toISOString(),
  transactional = true,
): ForwardReadinessRow[] {
  const rows = deriveForwardReadiness(readForwardSchedule(db), readGithubEvidence(db));
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
  objectKind:
    | "project_item"
    | "issue"
    | "branch"
    | "pull_request"
    | "check_run"
    | "review"
    | "merge";
  objectId: string;
  objectUrl?: string;
  headSha?: string;
  state: string;
  observedAt?: string;
}

export function recordGithubBinding(db: HarnessDb, input: GithubBindingInput): string {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const existing = db
    .prepare(
      `SELECT binding_id, plan_id, plan_revision, state, head_sha, observed_at
         FROM github_object_bindings
        WHERE repository_id = ? AND object_kind = ? AND object_id = ?`,
    )
    .get(input.repositoryId, input.objectKind, input.objectId);
  if (
    existing &&
    (text(existing.plan_id) !== input.planId ||
      (text(existing.plan_revision) !== input.planRevision && input.objectKind !== "project_item"))
  ) {
    throw new Error(
      `GitHub object identity conflict: ${input.objectKind}/${input.objectId} is already bound to ${text(existing.plan_id)}@${text(existing.plan_revision)}`,
    );
  }
  if (existing && observedAt < text(existing.observed_at)) return text(existing.binding_id);
  if (
    existing &&
    observedAt === text(existing.observed_at) &&
    (text(existing.state) !== input.state || text(existing.head_sha) !== (input.headSha ?? ""))
  ) {
    const previousRank = lifecycleRank(input.objectKind, text(existing.state));
    const nextRank = lifecycleRank(input.objectKind, input.state);
    if (nextRank < previousRank) return text(existing.binding_id);
    if (nextRank === previousRank || text(existing.head_sha) !== (input.headSha ?? ""))
      throw new Error(
        `GitHub observation conflict at ${observedAt}: ${input.objectKind}/${input.objectId}`,
      );
  }
  if (
    input.objectKind === "check_run" ||
    input.objectKind === "review" ||
    input.objectKind === "merge"
  ) {
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
