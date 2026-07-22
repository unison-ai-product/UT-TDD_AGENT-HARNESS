import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  boundedGhExecutionEvidence,
  type GhSpawn,
  NodeGhForwardEscapeIssuePort,
  runBoundedGh,
} from "../src/github/node-gh-forward-escape-issue-port.js";

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
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0]?.[0]).toContain("--paginate");
  });

  it("既存IssueがなければREST POST結果をbindingへ固定する", () => {
    const run = vi
      .fn<(args: string[]) => string>()
      .mockReturnValueOnce(JSON.stringify([[]]))
      .mockReturnValueOnce(JSON.stringify(issue))
      .mockReturnValueOnce(JSON.stringify([[issue]]));
    const result = new NodeGhForwardEscapeIssuePort(run).createOrGetIssue(request());
    expect(result).toMatchObject({ ok: true, binding: { body_digest: bodyDigest } });
    expect(run.mock.calls[1]?.[0]).toContain("POST");
    expect(run.mock.calls[2]?.[0]).toContain("--paginate");
  });

  it("U-EXISSUE-010: Issue POST後の全page再観測が0件・重複・digest conflictならfail-closeする", () => {
    const matching = issue;
    for (const observed of [
      [[]],
      [[matching, { ...matching, node_id: "I_duplicate", number: 103 }]],
      [[{ ...matching, body: `${body}\nmutated` }]],
    ]) {
      const run = vi
        .fn<(args: string[]) => string>()
        .mockReturnValueOnce(JSON.stringify([[]]))
        .mockReturnValueOnce(JSON.stringify(matching))
        .mockReturnValueOnce(JSON.stringify(observed));
      expect(new NodeGhForwardEscapeIssuePort(run).createOrGetIssue(request())).toEqual({
        ok: false,
        reason: "github-request-failed",
      });
      expect(run).toHaveBeenCalledTimes(3);
    }
  });

  it("既存Issueを番号GETし、canonical adoption commentだけを作成する", () => {
    const commentBody = "contract\n<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->";
    const comment = {
      node_id: "IC_node",
      html_url: `${issue.html_url}#issuecomment-1`,
      body: commentBody,
      updated_at: "2026-07-22T01:00:00Z",
    };
    const run = vi
      .fn<(args: string[]) => string>()
      .mockReturnValueOnce(JSON.stringify(issue))
      .mockReturnValueOnce(JSON.stringify([[]]))
      .mockReturnValueOnce(JSON.stringify(comment))
      .mockReturnValueOnce(JSON.stringify([[comment]]));
    const port = new NodeGhForwardEscapeIssuePort(run);

    expect(port.observeIssue({ repository: "owner/repository", issue_number: 102 })).toMatchObject({
      issue_number: 102,
      body,
      body_digest: bodyDigest,
    });
    expect(
      port.createOrGetMetadataComment({
        repository: "owner/repository",
        issue_number: 102,
        idempotency_key: "episode-102",
        body: commentBody,
        body_digest: createHash("sha256").update(commentBody).digest("hex"),
      }),
    ).toMatchObject({ ok: true, comment: { node_id: "IC_node" } });
    expect(run.mock.calls[0]?.[0]).toEqual(["api", "repos/owner/repository/issues/102"]);
    expect(run.mock.calls[1]?.[0]).toContain(
      "repos/owner/repository/issues/102/comments?per_page=100",
    );
    expect(run.mock.calls[2]?.[0]).toContain("POST");
    expect(run.mock.calls[3]?.[0]).toContain("--paginate");
  });

  it.each([
    ["改変", ["mutated\n<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->"]],
    [
      "重複",
      [
        "expected\n<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->",
        "expected\n<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->",
      ],
    ],
  ])("U-EXISSUE-ADOPT-006: 同じadoption markerの%s commentはPOSTせずfail-closeする", (_case, bodies) => {
    const conflicting = {
      node_id: "IC_bad",
      html_url: `${issue.html_url}#issuecomment-1`,
      updated_at: "2026-07-22T01:00:00Z",
    };
    const run = vi.fn((_args: string[]) =>
      JSON.stringify([[...bodies.map((commentBody) => ({ ...conflicting, body: commentBody }))]]),
    );
    const expected = "expected\n<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->";
    const result = new NodeGhForwardEscapeIssuePort(run).createOrGetMetadataComment({
      repository: "owner/repository",
      issue_number: 102,
      idempotency_key: "episode-102",
      body: expected,
      body_digest: createHash("sha256").update(expected).digest("hex"),
    });
    expect(result).toEqual({ ok: false, reason: "github-request-failed" });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).not.toContain("POST");
  });

  it("command markerはprefix一致させず別command commentを無視する", () => {
    const other = {
      node_id: "IC_other",
      html_url: `${issue.html_url}#issuecomment-100`,
      body: "<!-- ut-tdd:forward-escape-adoption/v1 episode-1020 -->",
      updated_at: "2026-07-22T01:00:00Z",
    };
    const expected = "<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->";
    const created = { ...other, node_id: "IC_new", body: expected };
    const run = vi
      .fn<(args: string[]) => string>()
      .mockReturnValueOnce(JSON.stringify([[other]]))
      .mockReturnValueOnce(JSON.stringify(created))
      .mockReturnValueOnce(JSON.stringify([[other, created]]));
    expect(
      new NodeGhForwardEscapeIssuePort(run).createOrGetMetadataComment({
        repository: "owner/repository",
        issue_number: 102,
        idempotency_key: "episode-102",
        body: expected,
        body_digest: createHash("sha256").update(expected).digest("hex"),
      }),
    ).toMatchObject({ ok: true, comment: { node_id: "IC_new" } });
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("U-EXISSUE-ADOPT-007: POST後の全page再観測が0件・重複・digest conflictならfail-closeする", () => {
    const expected = "<!-- ut-tdd:forward-escape-adoption/v1 episode-102 -->";
    const expectedDigest = createHash("sha256").update(expected).digest("hex");
    const matching = { ...issue, body: expected };
    for (const observed of [
      [[]],
      [[matching, { ...matching, node_id: "IC_duplicate" }]],
      [[{ ...matching, body: `${expected}\nmutated` }]],
    ]) {
      const run = vi
        .fn<(args: string[]) => string>()
        .mockReturnValueOnce(JSON.stringify([[]]))
        .mockReturnValueOnce(JSON.stringify(matching))
        .mockReturnValueOnce(JSON.stringify(observed));
      expect(
        new NodeGhForwardEscapeIssuePort(run).createOrGetMetadataComment({
          repository: "owner/repository",
          issue_number: 102,
          idempotency_key: "episode-102",
          body: expected,
          body_digest: expectedDigest,
        }),
      ).toEqual({ ok: false, reason: "github-request-failed" });
      expect(run).toHaveBeenCalledTimes(3);
    }
  });

  it("U-EXISSUE-ADOPT-008: gh execution contractはWindows非表示・hard deadline・killを固定する", () => {
    const spawn = vi.fn<GhSpawn>(() => ({
      pid: 1,
      output: [null, "[]", ""],
      stdout: "[]",
      stderr: "",
      status: 0,
      signal: null,
      error: undefined,
    }));
    expect(runBoundedGh(["api", "repos/owner/repository/issues"], spawn)).toBe("[]");
    expect(spawn).toHaveBeenCalledWith(
      "gh",
      ["api", "repos/owner/repository/issues"],
      expect.objectContaining({
        windowsHide: true,
        timeout: 15_000,
        killSignal: "SIGKILL",
        maxBuffer: 8 * 1024 * 1024,
      }),
    );
    expect(boundedGhExecutionEvidence()).toEqual({
      timeout_ms: 15_000,
      kill_signal: "SIGKILL",
      windows_hidden: true,
      max_buffer_bytes: 8 * 1024 * 1024,
    });
  });

  it("U-EXISSUE-ADOPT-009: deadline到達は成功へ読み替えない", () => {
    const timeout = Object.assign(new Error("timed out"), { code: "ETIMEDOUT" });
    const spawn = vi.fn<GhSpawn>(() => ({
      pid: 1,
      output: [null, "", ""],
      stdout: "",
      stderr: "",
      status: null,
      signal: "SIGKILL",
      error: timeout,
    }));
    expect(() => runBoundedGh(["api"], spawn)).toThrow("gh-command-timeout");
  });

  it("GitHub issues endpointが返すPull Requestはadoption対象にしない", () => {
    const run = vi.fn(() => JSON.stringify({ ...issue, pull_request: { url: "api/pr/102" } }));
    expect(() =>
      new NodeGhForwardEscapeIssuePort(run).observeIssue({
        repository: "owner/repository",
        issue_number: 102,
      }),
    ).toThrow("github-issue-observation-invalid");
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
