import { describe, expect, it, vi } from "vitest";
import { NodeGhGenesisRebaseCommentAdapter } from "../src/plan-asset/adapters/node-gh-genesis-rebase-comment-adapter.js";
import {
  createGenesisRebaseCommentGroup,
  type GenesisRebaseCommentGroup,
  type GenesisRebaseCommentOutboxPort,
  GenesisRebaseCommentProjectionRunner,
} from "../src/plan-asset/application/genesis-rebase-comment-projection.js";

describe("genesis rebase two-member GitHub comment projection", () => {
  it("U-PA-REBASE-030: GETでexact commentがあればcreateせず2-member groupをprojectする", () => {
    const group = fixture();
    const github = fakeGithub(group, true);
    const outbox = fakeOutbox();
    const result = new GenesisRebaseCommentProjectionRunner(
      outbox.port,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(result).toEqual({
      groupId: group.groupId,
      state: "projected",
      projected: 2,
      recoveryRequired: 0,
    });
    expect(github.createComment).not.toHaveBeenCalled();
    expect(outbox.markGroup).toHaveBeenCalledWith(group.groupId, "projected");
  });

  it("U-PA-REBASE-031: missing commentは各issueに1回だけcreateし再GETで束縛する", () => {
    const group = fixture();
    const github = fakeGithub(group, false);
    const result = new GenesisRebaseCommentProjectionRunner(
      fakeOutbox().port,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(result.state).toBe("projected");
    expect(github.createComment).toHaveBeenCalledTimes(2);
    expect(github.createComment).toHaveBeenNthCalledWith(1, {
      issueNumber: 102,
      body: group.members[0].commentBody,
    });
  });

  it("U-PA-REBASE-032: node/url/body digest/version driftまたは片肺はrecovery_required", () => {
    const group = fixture();
    const github = fakeGithub(group, true);
    github.getIssue.mockImplementation(({ issueNumber }) => {
      const member = requireMember(group, issueNumber);
      return {
        nodeId: member.issueNodeId,
        url: member.issueUrl,
        bodyDigest: issueNumber === 143 ? "0".repeat(64) : member.issueBodyDigest,
        version: member.issueVersion,
      };
    });
    const outbox = fakeOutbox();
    const result = new GenesisRebaseCommentProjectionRunner(
      outbox.port,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(result).toMatchObject({ state: "recovery_required", projected: 1, recoveryRequired: 1 });
    expect(outbox.markGroup).toHaveBeenCalledWith(group.groupId, "recovery_required");
  });

  it("U-PA-REBASE-033: marker一致/body不一致はduplicate createせずfail-closeする", () => {
    const group = fixture();
    const github = fakeGithub(group, true);
    github.listComments.mockImplementation(({ issueNumber }) => {
      const member = requireMember(group, issueNumber);
      return [
        {
          nodeId: `IC-${issueNumber}`,
          url: `${member.issueUrl}#issuecomment-${issueNumber}`,
          body: `${member.commentBody}\nforged`,
        },
      ];
    });
    const result = new GenesisRebaseCommentProjectionRunner(
      fakeOutbox().port,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(result.state).toBe("recovery_required");
    expect(github.createComment).not.toHaveBeenCalled();
  });

  it("U-PA-REBASE-049: POST後に同marker競合が現れた場合もprojectedへ確定しない", () => {
    const group = fixture();
    const github = fakeGithub(group, false);
    github.createComment.mockImplementation(({ issueNumber, body }) => {
      const member = requireMember(group, issueNumber);
      github.listComments.mockImplementationOnce(() => [
        { nodeId: `IC-${issueNumber}`, url: `${member.issueUrl}#exact`, body },
        {
          nodeId: `IC-${issueNumber}-forged`,
          url: `${member.issueUrl}#forged`,
          body: `${body}\nforged`,
        },
      ]);
      return { nodeId: `IC-${issueNumber}`, url: `${member.issueUrl}#exact`, body };
    });
    const result = new GenesisRebaseCommentProjectionRunner(
      fakeOutbox().port,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(result.state).toBe("recovery_required");
  });
});

function fixture() {
  return createGenesisRebaseCommentGroup({
    commandId: "genesis-rebase:recovery-16",
    commandPayloadDigest: "6".repeat(64),
    groupId: "projection-group:recovery-16",
    issue102: {
      issueNodeId: "I-102",
      issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/102",
      issueBodyDigest: "1".repeat(64),
      issueVersion: "2026-07-22T06:48:49Z",
    },
    issue143: {
      issueNodeId: "I_kwDOSkkE9M8AAAABJ2W8Aw",
      issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/143",
      issueBodyDigest: "88bc7746036283c0abfeaca70ecdde01cc499383d85c8e62636fd65989fbe3a9",
      issueVersion: "2026-07-23T06:04:27Z",
    },
    metadata: metadata(),
  });
}

function metadata() {
  return {
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    source_commit: "a".repeat(40),
    predecessor_asset: "plan:historical",
    predecessor_revision_first: 1 as const,
    predecessor_revision_last: 5 as const,
    predecessor_terminal_record_digest: "1".repeat(64),
    successor_asset: "plan:successor",
    successor_revision: 1 as const,
    projection_preimage_digest: "2".repeat(64),
    issue102_body_digest: "3".repeat(64),
    issue143_body_digest: "4".repeat(64),
    migration_certificate_id: "certificate:rebase",
    migration_certificate_digest: "5".repeat(64),
    inference_forbidden: true as const,
    drive: "recovery" as const,
  };
}

function fakeGithub(group: GenesisRebaseCommentGroup, existing: boolean) {
  const comments = new Map<number, Array<{ nodeId: string; url: string; body: string }>>();
  if (existing)
    for (const member of group.members)
      comments.set(member.issueNumber, [
        {
          nodeId: `IC-${member.issueNumber}`,
          url: `${member.issueUrl}#issuecomment-${member.issueNumber}`,
          body: member.commentBody,
        },
      ]);
  return {
    getIssue: vi.fn(({ issueNumber }: { issueNumber: number }) => {
      const member = requireMember(group, issueNumber);
      return {
        nodeId: member.issueNodeId,
        url: member.issueUrl,
        bodyDigest: member.issueBodyDigest,
        version: member.issueVersion,
      };
    }),
    listComments: vi.fn(
      ({ issueNumber }: { issueNumber: number }) => comments.get(issueNumber) ?? [],
    ),
    createComment: vi.fn(({ issueNumber, body }: { issueNumber: number; body: string }) => {
      const member = requireMember(group, issueNumber);
      const comment = {
        nodeId: `IC-${issueNumber}`,
        url: `${member.issueUrl}#issuecomment-${issueNumber}`,
        body,
      };
      comments.set(issueNumber, [comment]);
      return comment;
    }),
  };
}

function fakeOutbox() {
  const prepare = vi.fn();
  let generation = 0;
  const claimMember = vi.fn(
    (_groupId: string, _kind: string, claim: { ownerToken: string; expiresAt: string }) => ({
      ownerToken: claim.ownerToken,
      generation: ++generation,
      expiresAt: claim.expiresAt,
    }),
  );
  const markMember = vi.fn();
  const markGroup = vi.fn();
  const read = vi.fn(() => ({ state: "pending", memberStates: ["pending", "pending"] }));
  const markProjectedDrift = vi.fn();
  const port: GenesisRebaseCommentOutboxPort = {
    prepare,
    claimMember,
    authorizeCreate: vi.fn(() => "create" as const),
    markMember,
    markGroup,
    read,
    markProjectedDrift,
  };
  return { port, prepare, claimMember, markMember, markGroup };
}

function requireMember(group: GenesisRebaseCommentGroup, issueNumber: number) {
  const member = group.members.find((value) => value.issueNumber === issueNumber);
  if (!member) throw new Error(`missing fixture member: ${issueNumber}`);
  return member;
}
