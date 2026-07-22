import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteForwardEscapeJournal } from "../src/execution/sqlite-forward-escape-journal.js";
import { NodeIssueProjectionEvidenceResolver } from "../src/plan-admission/node-issue-projection-evidence-resolver.js";
import { defaultHarnessDbPath, openHarnessDb } from "../src/state-db/index.js";
import { migrate } from "../src/state-db/migration.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("NodeIssueProjectionEvidenceResolver", () => {
  it("plan ledgerではなくmain HARNESS evidence DBのE4を解決する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-e4-resolver-"));
    roots.push(root);
    const db = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
    migrate(db);
    const journal = new SqliteForwardEscapeJournal(db);
    const payloadDigest = "a".repeat(64);
    journal.issue({ command_id: "episode-102", payload_digest: payloadDigest });
    journal.append({
      type: "IssueProjectionQueued",
      command_id: "episode-102",
      payload_digest: payloadDigest,
      repository: "owner/repository",
      body_digest: "b".repeat(64),
    });
    const receipt = journal.append({
      type: "IssueProjected",
      command_id: "episode-102",
      payload_digest: payloadDigest,
      binding: {
        repository: "owner/repository",
        issue_number: 102,
        node_id: "I_node",
        url: "https://github.com/owner/repository/issues/102",
        body_digest: "b".repeat(64),
        observed_revision: "etag-1",
      },
    });
    db.close();

    expect(
      new NodeIssueProjectionEvidenceResolver(root).resolve({
        issueId: 102,
        episodeId: "episode-102",
        projectionDigest: `sha256:${receipt.event_digest}`,
      }),
    ).toMatchObject({ issueId: 102, repository: "owner/repository" });
  });

  it("main HARNESS DBにE4がなければfail-closeする", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-e4-separated-"));
    roots.push(root);
    expect(() =>
      new NodeIssueProjectionEvidenceResolver(root).resolve({
        issueId: 102,
        episodeId: "episode-102",
        projectionDigest: `sha256:${"f".repeat(64)}`,
      }),
    ).toThrow("issue-projection-evidence-invalid");
  });
});
