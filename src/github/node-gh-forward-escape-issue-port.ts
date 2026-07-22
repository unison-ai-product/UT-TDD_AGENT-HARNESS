import { spawnSync } from "node:child_process";
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

/** gh CLIの既存認証を使うcreate-or-get adapter。command marker完全一致だけを再利用する。 */
export class NodeGhForwardEscapeIssuePort
  implements ForwardEscapeIssuePort, ForwardEscapeIssueAdoptionPort
{
  constructor(private readonly run: (args: string[]) => string = gh) {}

  createOrGetIssue(request: Parameters<ForwardEscapeIssuePort["createOrGetIssue"]>[0]) {
    try {
      const repository = `${request.owner}/${request.repository}`;
      const marker = `command_id: ${request.idempotency_key}`;
      const existing = this.list(repository).find(
        (issue) => issue.body.includes(marker) && digest(issue.body) === request.body_digest,
      );
      const issue = existing ?? this.create(repository, request);
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
      const comments = this.listComments(request.repository, request.issue_number);
      const marked = comments.filter((comment) =>
        comment.body.split(/\r?\n/).some((line) => line.trim() === `<!-- ${marker} -->`),
      );
      if (marked.length > 1 || (marked[0] && digest(marked[0].body) !== request.body_digest))
        throw new Error("github-adoption-comment-conflict");
      const prior = marked[0];
      const comment =
        prior ?? this.createComment(request.repository, request.issue_number, request.body);
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

function gh(args: string[]): string {
  const result = spawnSync("gh", args, { encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || result.error) throw new Error("gh-command-failed");
  return result.stdout;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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
