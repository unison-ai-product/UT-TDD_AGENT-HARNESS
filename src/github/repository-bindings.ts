import type { HarnessDb } from "../state-db/index";
import { type GithubBindingInput, recordGithubBinding } from "./forward-store";
import { validatePrTraceBody } from "./pr-trace";
import type { GhCommandPort } from "./project-v2";
import { NodeGhCommandPort } from "./project-v2";

export interface RepositoryBindingSyncResult {
  inspectedPullRequests: number;
  tracedPullRequests: number;
  skipped: Array<{ number: string; reason: string }>;
  bindingIds: string[];
}

const ACCEPTED_PLAN_STATUSES = new Set([
  "confirmed",
  "completed",
  "accepted",
  "merged",
  "closed",
  "documented",
]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function ciState(checks: unknown[]): NonNullable<GithubBindingInput["state"]> {
  if (checks.length === 0) return "未実行";
  const states = checks.map((value) => {
    const check = object(value);
    return text(check.conclusion || check.state || check.status).toUpperCase();
  });
  if (
    states.some((state) =>
      ["FAILURE", "FAILED", "ERROR", "TIMED_OUT", "ACTION_REQUIRED"].includes(state),
    )
  )
    return "失敗";
  if (states.some((state) => ["CANCELLED", "CANCELED", "SKIPPED"].includes(state))) return "取消";
  if (states.every((state) => ["SUCCESS", "NEUTRAL"].includes(state))) return "成功";
  return "実行中";
}

function reviewState(reviews: unknown[]): NonNullable<GithubBindingInput["state"]> {
  const states = reviews.map((value) => text(object(value).state).toUpperCase());
  if (states.includes("CHANGES_REQUESTED")) return "要修正";
  if (states.includes("APPROVED")) return "承認";
  return states.length > 0 ? "依頼中" : "未依頼";
}

function projectItemId(
  db: HarnessDb,
  repositoryId: string,
  planId: string,
  revision: string,
): string {
  const row = db
    .prepare(
      `SELECT project_item_id FROM github_project_item_projection
        WHERE repository_id = ? AND plan_id = ? AND plan_revision = ?`,
    )
    .get(repositoryId, planId, revision);
  return text(row?.project_item_id);
}

function currentRevision(db: HarnessDb, planId: string): string {
  const row = db
    .prepare(
      "SELECT source_hash FROM schedule_entries WHERE plan_id = ? ORDER BY rowid DESC LIMIT 1",
    )
    .get(planId);
  return text(row?.source_hash);
}

function planAccepted(db: HarnessDb, planId: string): boolean {
  const row = db
    .prepare("SELECT status FROM schedule_entries WHERE plan_id = ? ORDER BY rowid DESC LIMIT 1")
    .get(planId);
  return ACCEPTED_PLAN_STATUSES.has(text(row?.status));
}

function uniquePlanId(value: string): string {
  const matches = [...value.matchAll(/\bPLAN-[A-Z0-9]+-[0-9A-Za-z][0-9A-Za-z-]*/g)].map(
    (match) => match[0],
  );
  const unique = [...new Set(matches)];
  return unique.length === 1 ? (unique[0] ?? "") : "";
}

export function syncRepositoryBindings(input: {
  db: HarnessDb;
  repositoryId: string;
  gh?: GhCommandPort;
  now?: string;
}): RepositoryBindingSyncResult {
  const gh = input.gh ?? new NodeGhCommandPort();
  const payload = gh.json([
    "pr",
    "list",
    "--repo",
    input.repositoryId,
    "--state",
    "all",
    "--limit",
    "1000",
    "--json",
    "number,title,url,headRefName,headRefOid,state,mergedAt,mergeCommit,body,statusCheckRollup,reviews",
  ]);
  const pullRequests = list(payload);
  const result: RepositoryBindingSyncResult = {
    inspectedPullRequests: pullRequests.length,
    tracedPullRequests: 0,
    skipped: [],
    bindingIds: [],
  };
  for (const value of pullRequests) {
    const pullRequest = object(value);
    const number = text(pullRequest.number);
    const body = text(pullRequest.body);
    const trace = validatePrTraceBody(body);
    const fallbackPlanId =
      text(pullRequest.state).toUpperCase() === "OPEN"
        ? uniquePlanId(`${text(pullRequest.title)}\n${body}\n${text(pullRequest.headRefName)}`)
        : "";
    const planId = trace.ok ? (trace.fields.plan_id ?? "") : fallbackPlanId;
    if (!planId) {
      result.skipped.push({ number, reason: trace.findings[0]?.code ?? "plan-id-unresolved" });
      continue;
    }
    const revision = trace.fields.plan_revision ?? currentRevision(input.db, planId);
    if (!revision) {
      result.skipped.push({ number, reason: "plan-revision-missing" });
      continue;
    }
    const expectedRevision = currentRevision(input.db, planId);
    if (expectedRevision && revision !== expectedRevision) {
      result.skipped.push({ number, reason: "stale-plan-revision" });
      continue;
    }
    const headSha = text(pullRequest.headRefOid) || trace.fields.subject_head || "";
    if (trace.ok && trace.fields.subject_head && headSha !== trace.fields.subject_head) {
      result.skipped.push({ number, reason: "subject-head-mismatch" });
      continue;
    }
    const common = {
      repositoryId: input.repositoryId,
      planId,
      planRevision: revision,
      projectItemId: projectItemId(input.db, input.repositoryId, planId, revision),
      headSha,
      observedAt: input.now,
    };
    const bindings: GithubBindingInput[] = [
      {
        ...common,
        objectKind: "branch",
        objectId: text(pullRequest.headRefName),
        state: text(pullRequest.state).toLowerCase(),
      },
      {
        ...common,
        objectKind: "pull_request",
        objectId: number,
        objectUrl: text(pullRequest.url),
        state: text(pullRequest.state).toLowerCase(),
      },
      {
        ...common,
        objectKind: "check_run",
        objectId: `pr:${number}:checks:${headSha}`,
        state: ciState(list(pullRequest.statusCheckRollup)),
      },
      {
        ...common,
        objectKind: "review",
        objectId: `pr:${number}:reviews:${headSha}`,
        state: reviewState(list(pullRequest.reviews)),
      },
    ];
    if (trace.fields.issue_number) {
      bindings.push({
        ...common,
        objectKind: "issue",
        objectId: trace.fields.issue_number,
        objectUrl: `https://github.com/${input.repositoryId}/issues/${trace.fields.issue_number}`,
        state: "linked",
      });
    }
    if (pullRequest.mergedAt) {
      const mergeSha = text(object(pullRequest.mergeCommit).oid);
      const mainChecks = mergeSha
        ? object(gh.json(["api", `repos/${input.repositoryId}/commits/${mergeSha}/check-runs`]))
        : {};
      const mainCi = ciState(list(mainChecks.check_runs));
      const issueClosed = trace.fields.issue_number
        ? text(
            object(
              gh.json([
                "issue",
                "view",
                trace.fields.issue_number,
                "--repo",
                input.repositoryId,
                "--json",
                "state",
              ]),
            ).state,
          ).toUpperCase() === "CLOSED"
        : true;
      if (
        mergeSha &&
        ciState(list(pullRequest.statusCheckRollup)) === "成功" &&
        reviewState(list(pullRequest.reviews)) === "承認" &&
        mainCi === "成功" &&
        issueClosed &&
        planAccepted(input.db, planId)
      ) {
        bindings.push({
          ...common,
          objectKind: "merge",
          objectId: `pr:${number}:merge:${mergeSha}`,
          objectUrl: text(pullRequest.url),
          state: `merged:${mergeSha}`,
        });
      } else {
        result.skipped.push({ number, reason: "merge-closure-incomplete" });
      }
    }
    for (const binding of bindings) {
      if (!binding.objectId) continue;
      result.bindingIds.push(recordGithubBinding(input.db, binding));
    }
    result.tracedPullRequests += 1;
  }
  return result;
}
