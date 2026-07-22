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
  killSignal: "SIGKILL" as const,
  windowsHide: true as const,
  maxBuffer: 8 * 1024 * 1024,
});

export interface GhExecutionEvidence {
  readonly timeout_ms: number;
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
    kill_signal: GH_EXECUTION_CONTRACT.killSignal,
    windows_hidden: GH_EXECUTION_CONTRACT.windowsHide,
    max_buffer_bytes: GH_EXECUTION_CONTRACT.maxBuffer,
  };
}

export function runBoundedGh(args: string[], spawn: GhSpawn = spawnSync): string {
  const result = spawn("gh", args, {
    encoding: "utf8",
    windowsHide: GH_EXECUTION_CONTRACT.windowsHide,
    timeout: GH_EXECUTION_CONTRACT.timeoutMs,
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

  constructor(private readonly run: (args: string[]) => string = runBoundedGh) {}

  createOrGetIssue(request: Parameters<ForwardEscapeIssuePort["createOrGetIssue"]>[0]) {
    try {
      const repository = `${request.owner}/${request.repository}`;
      const marker = `command_id: ${request.idempotency_key}`;
      const existing = selectMarked(this.list(repository), marker, request.body_digest, true);
      if (!existing) this.create(repository, request);
      const issue = selectMarked(this.list(repository), marker, request.body_digest, true);
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
      this.run(["api", `repos/${request.repository}/issues/${request.issue_number}`]),
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
    try {
      const marker = `ut-tdd:forward-escape-adoption/v1 ${request.idempotency_key}`;
      const exactMarker = `<!-- ${marker} -->`;
      const prior = selectMarked(
        this.listComments(request.repository, request.issue_number),
        exactMarker,
        request.body_digest,
        true,
      );
      if (!prior) this.createComment(request.repository, request.issue_number, request.body);
      const comment = selectMarked(
        this.listComments(request.repository, request.issue_number),
        exactMarker,
        request.body_digest,
        true,
      );
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

  private list(repository: string): GhIssueView[] {
    const pages = JSON.parse(
      this.run([
        "api",
        "--paginate",
        "--slurp",
        `repos/${repository}/issues?state=all&per_page=100`,
      ]),
    ) as GhIssueView[][];
    return pages.flat().filter((issue) => !Reflect.has(issue, "pull_request"));
  }

  private create(
    repository: string,
    request: Parameters<ForwardEscapeIssuePort["createOrGetIssue"]>[0],
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
    return JSON.parse(this.run(args)) as GhIssueView;
  }

  private listComments(repository: string, issueNumber: number): GhCommentView[] {
    const pages = JSON.parse(
      this.run([
        "api",
        "--paginate",
        "--slurp",
        `repos/${repository}/issues/${issueNumber}/comments?per_page=100`,
      ]),
    ) as GhCommentView[][];
    return pages.flat();
  }

  private createComment(repository: string, issueNumber: number, body: string): GhCommentView {
    return JSON.parse(
      this.run([
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

function selectMarked<T extends { readonly body: string }>(
  values: readonly T[],
  marker: string,
  expectedDigest: string,
  exactLine = false,
): T | undefined {
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
