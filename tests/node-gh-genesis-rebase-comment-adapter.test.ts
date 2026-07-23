import { describe, expect, it, vi } from "vitest";
import {
  type GenesisRebaseGhExec,
  NodeGhCliGenesisRebaseCommentPort,
} from "../src/plan-asset/adapters/node-gh-genesis-rebase-comment-adapter.js";

describe("NodeGhCliGenesisRebaseCommentPort", () => {
  it("U-PA-REBASE-044: actual gh adapterはargv・windowsHide・comment bodyをexactに固定する", () => {
    const body = "line 1\nline 2\n<!-- exact body -->";
    const exec = vi
      .fn<GenesisRebaseGhExec>()
      .mockReturnValueOnce(
        JSON.stringify({
          id: "I-143",
          url: "https://github.com/owner/repository/issues/143",
          body: "issue body",
          updatedAt: "2026-07-23T00:00:00Z",
        }),
      )
      .mockReturnValueOnce(
        JSON.stringify([
          [
            {
              node_id: "IC-1",
              html_url: "https://github.com/owner/repository/issues/143#issuecomment-1",
              body,
            },
          ],
          [
            {
              node_id: "IC-2",
              html_url: "https://github.com/owner/repository/issues/143#issuecomment-2",
              body: "another comment",
            },
          ],
        ]),
      )
      .mockReturnValueOnce("");
    const port = new NodeGhCliGenesisRebaseCommentPort("owner/repository", exec);

    port.getIssue({ issueNumber: 143 });
    expect(port.listComments({ issueNumber: 143 })).toEqual([
      {
        nodeId: "IC-1",
        url: "https://github.com/owner/repository/issues/143#issuecomment-1",
        body,
      },
      {
        nodeId: "IC-2",
        url: "https://github.com/owner/repository/issues/143#issuecomment-2",
        body: "another comment",
      },
    ]);
    port.createComment({ issueNumber: 143, body });

    const options = { encoding: "utf8", windowsHide: true, timeout: 30_000 };
    expect(exec.mock.calls).toEqual([
      [
        "gh",
        ["issue", "view", "143", "--repo", "owner/repository", "--json", "id,url,body,updatedAt"],
        options,
      ],
      [
        "gh",
        ["api", "--paginate", "--slurp", "repos/owner/repository/issues/143/comments?per_page=100"],
        options,
      ],
      ["gh", ["issue", "comment", "143", "--repo", "owner/repository", "--body", body], options],
    ]);
  });

  it("U-PA-REBASE-034: invalid repository identityはGitHub観測前にfail-closeする", () => {
    expect(() => new NodeGhCliGenesisRebaseCommentPort("owner/repository/extra")).toThrow(
      "GENESIS_REBASE_GITHUB_REPOSITORY_INVALID",
    );
  });
});
