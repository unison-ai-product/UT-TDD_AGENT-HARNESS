import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { ForwardEscapeIssuePort, IssueBinding } from "../execution/forward-escape.js";

interface GhIssueView {
  readonly number: number;
  readonly node_id: string;
  readonly html_url: string;
  readonly body: string;
  readonly updated_at: string;
}

/** gh CLIの既存認証を使うcreate-or-get adapter。command marker完全一致だけを再利用する。 */
export class NodeGhForwardEscapeIssuePort implements ForwardEscapeIssuePort {
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
