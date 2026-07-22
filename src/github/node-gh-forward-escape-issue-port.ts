import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import type {
  ForwardEscapeIssueAdoptionPort,
  ForwardEscapeIssuePort,
  IssueBinding,
  ObservedForwardEscapeIssue,
} from "../execution/forward-escape.js";

interface GhIssueView {
  readonly number: number;
  readonly node_id: string;
  readonly html_url: string;
  readonly body: string;
  readonly updated_at: string;
}

interface GhCommentView {
  readonly node_id: string;
  readonly html_url: string;
  readonly body: string;
  readonly updated_at: string;
}

export const GH_EXECUTION_CONTRACT = Object.freeze({
  timeoutMs: 15_000,
  projectionCallLimit: 4,
  killSignal: "SIGKILL" as const,
  windowsHide: true as const,
  maxBuffer: 8 * 1024 * 1024,
});

export interface GhExecutionEvidence {
  readonly timeout_ms: number;
  readonly projection_operation_budget_ms: number;
  readonly kill_signal: "SIGKILL";
  readonly windows_hidden: true;
  readonly max_buffer_bytes: number;
}

export type GhSpawn = (
  command: string,
  args: readonly string[],
  options: {
    readonly encoding: "utf8";
    readonly windowsHide: true;
    readonly timeout: number;
    readonly killSignal: "SIGKILL";
    readonly maxBuffer: number;
  },
) => SpawnSyncReturns<string>;

export function boundedGhExecutionEvidence(): GhExecutionEvidence {
  return {
    timeout_ms: GH_EXECUTION_CONTRACT.timeoutMs,
    projection_operation_budget_ms:
      GH_EXECUTION_CONTRACT.timeoutMs * GH_EXECUTION_CONTRACT.projectionCallLimit,
    kill_signal: GH_EXECUTION_CONTRACT.killSignal,
    windows_hidden: GH_EXECUTION_CONTRACT.windowsHide,
    max_buffer_bytes: GH_EXECUTION_CONTRACT.maxBuffer,
  };
}

export function runBoundedGh(
  args: string[],
  spawn: GhSpawn = spawnSync,
  timeoutMs: number = GH_EXECUTION_CONTRACT.timeoutMs,
): string {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error("gh-command-timeout");
  const result = spawn("gh", args, {
    encoding: "utf8",
    windowsHide: GH_EXECUTION_CONTRACT.windowsHide,
    timeout: Math.min(timeoutMs, GH_EXECUTION_CONTRACT.timeoutMs),
    killSignal: GH_EXECUTION_CONTRACT.killSignal,
    maxBuffer: GH_EXECUTION_CONTRACT.maxBuffer,
  });
  if (result.status !== 0 || result.signal !== null || result.error) {
    throw new Error(
      result.error && "code" in result.error && result.error.code === "ETIMEDOUT"
        ? "gh-command-timeout"
        : "gh-command-failed",
    );
  }
  return result.stdout;
}

/** gh CLIの既存認証を使うcreate-or-get adapter。command marker完全一致だけを再利用する。 */
export class NodeGhForwardEscapeIssuePort
  implements ForwardEscapeIssuePort, ForwardEscapeIssueAdoptionPort
{
  readonly executionEvidence = boundedGhExecutionEvidence();
  readonly projectionBudgetEvidence = Object.freeze({
    operation_timeout_ms: this.executionEvidence.projection_operation_budget_ms,
  });

  constructor(
    private readonly run: (args: string[], timeoutMs?: number) => string = (args, timeoutMs) =>
      runBoundedGh(args, spawnSync, timeoutMs),
    private readonly now: () => number = Date.now,
  ) {}

  createOrGetIssue(request: Parameters<ForwardEscapeIssuePort["createOrGetIssue"]>[0]) {
    const run = this.operationRunner(3);
    try {
      const repository = `${request.owner}/${request.repository}`;
      const marker = `command_id: ${request.idempotency_key}`;
      const existing = selectMarked({
        values: this.list(repository, run),
        marker,
        expectedDigest: request.body_digest,
        exactLine: true,
      });
      if (!existing) this.create(repository, request, run);
      const issue = selectMarked({
        values: this.list(repository, run),
        marker,
        expectedDigest: request.body_digest,
        exactLine: true,
      });
      if (!issue) throw new Error("github-issue-marker-not-observed");
      return { ok: true as const, binding: binding(repository, issue) };
    } catch {
      return { ok: false as const, reason: "github-request-failed" };
    }
  }

  observeIssue(
    request: Parameters<ForwardEscapeIssueAdoptionPort["observeIssue"]>[0],
  ): ObservedForwardEscapeIssue {
    const issue = JSON.parse(
      this.operationRunner(1)([
        "api",
        `repos/${request.repository}/issues/${request.issue_number}`,
      ]),
    ) as GhIssueView;
    if (
      issue.number !== request.issue_number ||
      Reflect.has(issue, "pull_request") ||
      typeof issue.body !== "string" ||
      !issue.node_id ||
      !issue.html_url ||
      !issue.updated_at
    )
      throw new Error("github-issue-observation-invalid");
    return { ...binding(request.repository, issue), body: issue.body };
  }

  createOrGetMetadataComment(
    request: Parameters<ForwardEscapeIssueAdoptionPort["createOrGetMetadataComment"]>[0],
  ) {
    const run = this.operationRunner(3);
    try {
      const marker = `ut-tdd:forward-escape-adoption/v1 ${request.idempotency_key}`;
      const exactMarker = `<!-- ${marker} -->`;
      const prior = selectMarked({
        values: this.listComments(request.repository, request.issue_number, run),
        marker: exactMarker,
        expectedDigest: request.body_digest,
        exactLine: true,
      });
      if (!prior) this.createComment(request.repository, request.issue_number, request.body, run);
      const comment = selectMarked({
        values: this.listComments(request.repository, request.issue_number, run),
        marker: exactMarker,
        expectedDigest: request.body_digest,
        exactLine: true,
      });
      if (!comment) throw new Error("github-adoption-comment-not-observed");
      return {
        ok: true as const,
        comment: {
          node_id: comment.node_id,
          url: comment.html_url,
          body_digest: digest(comment.body),
          observed_revision: comment.updated_at,
        },
      };
    } catch {
      return { ok: false as const, reason: "github-request-failed" };
    }
  }

  private operationRunner(callLimit: number): (args: string[]) => string {
    const deadline = this.now() + GH_EXECUTION_CONTRACT.timeoutMs * callLimit;
    return (args) => {
      const remaining = deadline - this.now();
      if (remaining < 1) throw new Error("gh-operation-timeout");
      return this.run(args, Math.min(GH_EXECUTION_CONTRACT.timeoutMs, remaining));
    };
  }

  private list(repository: string, run: (args: string[]) => string): GhIssueView[] {
    const pages = JSON.parse(
      run(["api", "--paginate", "--slurp", `repos/${repository}/issues?state=all&per_page=100`]),
    ) as GhIssueView[][];
    return pages.flat().filter((issue) => !Reflect.has(issue, "pull_request"));
  }

  private create(
    repository: string,
    request: Parameters<ForwardEscapeIssuePort["createOrGetIssue"]>[0],
    run: (args: string[]) => string,
  ): GhIssueView {
    const args = [
      "api",
      "--method",
      "POST",
      `repos/${repository}/issues`,
      "--field",
      `title=${request.title}`,
      "--field",
      `body=${request.body}`,
    ];
    for (const label of request.labels) args.push("--field", `labels[]=${label}`);
    return JSON.parse(run(args)) as GhIssueView;
  }

  private listComments(
    repository: string,
    issueNumber: number,
    run: (args: string[]) => string,
  ): GhCommentView[] {
    const pages = JSON.parse(
      run([
        "api",
        "--paginate",
        "--slurp",
        `repos/${repository}/issues/${issueNumber}/comments?per_page=100`,
      ]),
    ) as GhCommentView[][];
    return pages.flat();
  }

  private createComment(
    repository: string,
    issueNumber: number,
    body: string,
    run: (args: string[]) => string,
  ): GhCommentView {
    return JSON.parse(
      run([
        "api",
        "--method",
        "POST",
        `repos/${repository}/issues/${issueNumber}/comments`,
        "--field",
        `body=${body}`,
      ]),
    ) as GhCommentView;
  }
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function selectMarked<T extends { readonly body: string }>(input: {
  readonly values: readonly T[];
  readonly marker: string;
  readonly expectedDigest: string;
  readonly exactLine?: boolean;
}): T | undefined {
  const { values, marker, expectedDigest, exactLine = false } = input;
  const marked = values.filter((value) =>
    exactLine
      ? value.body.split(/\r?\n/).some((line) => line.trim() === marker)
      : value.body.includes(marker),
  );
  if (marked.length > 1) throw new Error("github-marker-duplicate");
  if (marked[0] && digest(marked[0].body) !== expectedDigest)
    throw new Error("github-marker-digest-conflict");
  return marked[0];
}

function binding(repository: string, issue: GhIssueView): IssueBinding {
  return {
    repository,
    issue_number: issue.number,
    node_id: issue.node_id,
    url: issue.html_url,
    body_digest: digest(issue.body),
    observed_revision: issue.updated_at,
  };
}
