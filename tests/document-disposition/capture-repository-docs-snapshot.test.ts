import { describe, expect, it, vi } from "vitest";
import { captureRepositoryDocsSnapshot } from "../../src/document-disposition/application/capture-repository-docs-snapshot";
import type {
  GitObjectSnapshotPort,
  GitObjectTreeSnapshot,
} from "../../src/document-disposition/ports/git-object-snapshot";

const FULL_COMMIT = "1".repeat(40);
const ROOT_TREE = "2".repeat(40);
const SELECTION_DIGEST = "a".repeat(64);
const RAW_PATH_STREAM = Uint8Array.from(
  Buffer.from(
    "2e75742d7464642f6d656d6f72792f706f6c6963792e6d64004147454e54532e6d6400646f63732f612e6d6400",
    "hex",
  ),
);

const TREE_SNAPSHOT: GitObjectTreeSnapshot = {
  commitOid: FULL_COMMIT,
  repositoryTreeOid: ROOT_TREE,
  rawPathStream: RAW_PATH_STREAM,
  members: [
    {
      pathBytes: Uint8Array.from(Buffer.from(".ut-tdd/memory/policy.md", "utf8")),
      blobOid: "3".repeat(40),
      contentSha256: "b".repeat(64),
      fileMode: "100644",
      zone: "runtime_policy",
    },
    {
      pathBytes: Uint8Array.from(Buffer.from("AGENTS.md", "utf8")),
      blobOid: "4".repeat(40),
      contentSha256: "c".repeat(64),
      fileMode: "100644",
      zone: "root_policy",
    },
    {
      pathBytes: Uint8Array.from(Buffer.from("docs/a.md", "utf8")),
      blobOid: "5".repeat(40),
      contentSha256: "d".repeat(64),
      fileMode: "100644",
      zone: "docs_tree",
    },
  ],
  zones: [
    { zone: "docs_tree", memberCount: 1, treeOid: "6".repeat(40) },
    { zone: "root_policy", memberCount: 1 },
    { zone: "runtime_policy", memberCount: 1 },
    { zone: "skills", memberCount: 0 },
    { zone: "github_policy", memberCount: 0 },
  ],
};

function port(snapshot: GitObjectTreeSnapshot = TREE_SNAPSHOT): GitObjectSnapshotPort {
  return { readTree: vi.fn().mockResolvedValue(snapshot) };
}

const INPUT = {
  repositoryIdentity: "repo:example/harness",
  commitOid: FULL_COMMIT,
  repositoryTreeOid: ROOT_TREE,
  selectionRevision: "repository-documents-v1",
  selectionDigest: SELECTION_DIGEST,
} as const;

describe("captureRepositoryDocsSnapshot", () => {
  it("U-DOCLEDGER-001: Git objectの全zoneをcanonical snapshot identityへ固定する", async () => {
    const git = port();

    const result = await captureRepositoryDocsSnapshot(INPUT, git);

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        snapshotId:
          "document-snapshot:sha256:a65024541d119c33211fef4549360319bee489ed2e2b8e07f9e21b5998745b52",
        snapshotDigest: "a65024541d119c33211fef4549360319bee489ed2e2b8e07f9e21b5998745b52",
        pathStreamSha256: "cbbb3a2a0a6248e0697e6a12b8b1d293d482d0c6d7ddf902c2a9fbbf1e77d579",
        memberSetDigest: "6f75de8715fcf9334ba259daadfff55b5bb5e32f172132a4a8da2e0610912ddf",
        trackedCount: 3,
        members: [
          expect.objectContaining({ path: ".ut-tdd/memory/policy.md", zone: "runtime_policy" }),
          expect.objectContaining({ path: "AGENTS.md", zone: "root_policy" }),
          expect.objectContaining({ path: "docs/a.md", zone: "docs_tree" }),
        ],
      }),
    });
    expect(git.readTree).toHaveBeenCalledWith(INPUT);
  });

  it.each([
    ["short commit", { ...INPUT, commitOid: "1234567" }],
    ["symbolic commit", { ...INPUT, commitOid: "HEAD" }],
  ])("U-DOCLEDGER-002: %sはport呼出し前にrevision missingで拒否する", async (_label, input) => {
    const git = port();

    const result = await captureRepositoryDocsSnapshot(input, git);

    expect(result).toEqual({
      ok: false,
      errors: [
        expect.objectContaining({
          ruleId: "docs-snapshot-revision-missing",
          exitCode: 1,
        }),
      ],
    });
    expect(git.readTree).not.toHaveBeenCalled();
  });

  it.each([
    [
      "tree mismatch",
      { ...TREE_SNAPSHOT, repositoryTreeOid: "f".repeat(40) },
      "docs-snapshot-stream-malformed",
    ],
    [
      "NUL terminator missing",
      { ...TREE_SNAPSHOT, rawPathStream: RAW_PATH_STREAM.slice(0, -1) },
      "docs-snapshot-stream-malformed",
    ],
    [
      "required zone missing",
      {
        ...TREE_SNAPSHOT,
        zones: TREE_SNAPSHOT.zones.filter(({ zone }) => zone !== "github_policy"),
      },
      "doc-selection-unclassified",
    ],
    [
      "zone count mismatch",
      {
        ...TREE_SNAPSHOT,
        zones: TREE_SNAPSHOT.zones.map((zone) =>
          zone.zone === "docs_tree" ? { ...zone, memberCount: 2 } : zone,
        ),
      },
      "doc-selection-unclassified",
    ],
    [
      "malformed blob OID",
      {
        ...TREE_SNAPSHOT,
        members: TREE_SNAPSHOT.members.map((member, index) =>
          index === 0 ? { ...member, blobOid: "not-an-oid" } : member,
        ),
      },
      "docs-snapshot-stream-malformed",
    ],
    [
      "invalid UTF-8 path",
      {
        ...TREE_SNAPSHOT,
        rawPathStream: Uint8Array.from([0xff, 0, ...Buffer.from("AGENTS.md\0docs/a.md\0", "utf8")]),
        members: TREE_SNAPSHOT.members.map((member, index) =>
          index === 0 ? { ...member, pathBytes: Uint8Array.from([0xff]) } : member,
        ),
      },
      "docs-snapshot-stream-malformed",
    ],
  ])("U-DOCLEDGER-002: %sをfail-closeする", async (_label, snapshot, ruleId) => {
    const result = await captureRepositoryDocsSnapshot(INPUT, port(snapshot));

    expect(result).toEqual({
      ok: false,
      errors: [expect.objectContaining({ ruleId, exitCode: 1 })],
    });
  });
});
