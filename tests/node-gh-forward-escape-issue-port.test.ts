import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { NodeGhForwardEscapeIssuePort } from "../src/github/node-gh-forward-escape-issue-port.js";

const body = "body\ncommand_id: episode-102";
const bodyDigest = createHash("sha256").update(body).digest("hex");
const issue = {
  number: 102,
  node_id: "I_node",
  html_url: "https://github.com/owner/repository/issues/102",
  body,
  updated_at: "2026-07-22T00:00:00Z",
};

describe("NodeGhForwardEscapeIssuePort", () => {
  it("全pageからcommand markerとbody digestが一致する既存Issueを再利用する", () => {
    const run = vi.fn((_args: string[]) => JSON.stringify([[], [issue]]));
    const result = new NodeGhForwardEscapeIssuePort(run).createOrGetIssue(request());
    expect(result).toMatchObject({ ok: true, binding: { issue_number: 102, node_id: "I_node" } });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toContain("--paginate");
  });

  it("既存IssueがなければREST POST結果をbindingへ固定する", () => {
    const run = vi
      .fn<(args: string[]) => string>()
      .mockReturnValueOnce(JSON.stringify([[]]))
      .mockReturnValueOnce(JSON.stringify(issue));
    const result = new NodeGhForwardEscapeIssuePort(run).createOrGetIssue(request());
    expect(result).toMatchObject({ ok: true, binding: { body_digest: bodyDigest } });
    expect(run.mock.calls[1]?.[0]).toContain("POST");
  });
});

function request() {
  return {
    idempotency_key: "episode-102",
    owner: "owner",
    repository: "repository",
    title: "Redesign issue",
    body,
    body_digest: bodyDigest,
    labels: ["drive:redesign"],
  };
}
