import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import type {
  GenesisRebaseCommentProjectionPort,
  GenesisRebaseCommentTarget,
} from "../application/genesis-rebase-comment-projection.js";

export interface ObservedGithubComment {
  readonly nodeId: string;
  readonly url: string;
  readonly body: string;
}

export interface GenesisRebaseGithubCommentPort {
  getIssue(input: { readonly issueNumber: number }): {
    readonly nodeId: string;
    readonly url: string;
    readonly bodyDigest: string;
    readonly version: string;
  };
  listComments(input: { readonly issueNumber: number }): readonly ObservedGithubComment[];
  createComment(input: {
    readonly issueNumber: number;
    readonly body: string;
  }): ObservedGithubComment;
}

export type GenesisRebaseGhExec = (
  command: string,
  args: readonly string[],
  options: { readonly encoding: "utf8"; readonly windowsHide: true; readonly timeout: 30_000 },
) => string;

const directGhExec: GenesisRebaseGhExec = (command, args) =>
  execFileSync(command, [...args], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 30_000,
  });

/** GitHub commentのGET/create exact-once adapter。 */
export class NodeGhGenesisRebaseCommentAdapter implements GenesisRebaseCommentProjectionPort {
  constructor(private readonly github: GenesisRebaseGithubCommentPort) {}

  project(target: GenesisRebaseCommentTarget, authorizeCreate: () => boolean) {
    const issue = this.github.getIssue({ issueNumber: target.issueNumber });
    if (
      issue.nodeId !== target.issueNodeId ||
      issue.url !== target.issueUrl ||
      issue.bodyDigest !== target.issueBodyDigest ||
      issue.version !== target.issueVersion
    )
      return { state: "recovery_required" as const };

    const marker = target.commentBody.split("\n", 1)[0];
    const observed = classifyMarkerComments({
      comments: this.github.listComments({ issueNumber: target.issueNumber }),
      marker,
      expectedBody: target.commentBody,
      expectedDigest: target.commentBodyDigest,
    });
    if (observed.kind === "exact") return projected(observed.comment);
    if (observed.kind === "conflict") return { state: "recovery_required" as const };

    // The durable intent is recorded only after the full reconciliation GET.
    // A pre-existing intent means an earlier POST may have had an ambiguous
    // outcome, so it is never safe to POST automatically.
    if (!authorizeCreate()) return { state: "recovery_required" as const };
    this.github.createComment({ issueNumber: target.issueNumber, body: target.commentBody });
    const postimage = classifyMarkerComments({
      comments: this.github.listComments({ issueNumber: target.issueNumber }),
      marker,
      expectedBody: target.commentBody,
      expectedDigest: target.commentBodyDigest,
    });
    return postimage.kind === "exact"
      ? projected(postimage.comment)
      : { state: "recovery_required" as const };
  }
}

export function classifyMarkerComments(input: {
  readonly comments: readonly ObservedGithubComment[];
  readonly marker: string;
  readonly expectedBody: string;
  readonly expectedDigest: string;
}):
  | { readonly kind: "absent" }
  | { readonly kind: "conflict" }
  | { readonly kind: "exact"; readonly comment: ObservedGithubComment } {
  const matching = input.comments.filter((comment) => comment.body.startsWith(input.marker));
  const exact = matching.filter(
    (comment) => comment.body === input.expectedBody && sha(comment.body) === input.expectedDigest,
  );
  return exact.length === 1 && matching.length === 1 && exact[0]
    ? { kind: "exact", comment: exact[0] }
    : matching.length === 0
      ? { kind: "absent" }
      : { kind: "conflict" };
}

export class NodeGhCliGenesisRebaseCommentPort implements GenesisRebaseGithubCommentPort {
  private readonly repository: string;

  constructor(
    repository: string,
    private readonly exec: GenesisRebaseGhExec = directGhExec,
  ) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
      throw new Error("GENESIS_REBASE_GITHUB_REPOSITORY_INVALID");
    this.repository = repository;
  }

  getIssue(input: { readonly issueNumber: number }) {
    const issue = JSON.parse(
      this.run([
        "issue",
        "view",
        String(input.issueNumber),
        "--repo",
        this.repository,
        "--json",
        "id,url,body,updatedAt",
      ]),
    ) as { id: string; url: string; body: string; updatedAt: string };
    return {
      nodeId: issue.id,
      url: issue.url,
      bodyDigest: sha(issue.body),
      version: issue.updatedAt,
    };
  }

  listComments(input: { readonly issueNumber: number }): readonly ObservedGithubComment[] {
    const pages = JSON.parse(
      this.run([
        "api",
        "--paginate",
        "--slurp",
        `repos/${this.repository}/issues/${input.issueNumber}/comments?per_page=100`,
      ]),
    ) as Array<Array<{ node_id: string; html_url: string; body: string }>>;
    return pages.flat().map((comment) => ({
      nodeId: comment.node_id,
      url: comment.html_url,
      body: comment.body,
    }));
  }

  createComment(input: { readonly issueNumber: number; readonly body: string }) {
    this.run([
      "issue",
      "comment",
      String(input.issueNumber),
      "--repo",
      this.repository,
      "--body",
      input.body,
    ]);
    return { nodeId: "", url: "", body: input.body };
  }

  private run(args: readonly string[]): string {
    return this.exec("gh", args, { encoding: "utf8", windowsHide: true, timeout: 30_000 });
  }
}

function projected(comment: ObservedGithubComment) {
  return { state: "projected" as const, commentNodeId: comment.nodeId, commentUrl: comment.url };
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
