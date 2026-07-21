import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { IssueBinding } from "../src/execution/forward-escape";
import { SqliteForwardEscapeJournal } from "../src/execution/sqlite-forward-escape-journal";
import { SqliteIssueProjectionEvidenceResolver } from "../src/plan-admission/issue-projection-evidence-resolver";
import { openHarnessDb } from "../src/state-db";
import { migrate } from "../src/state-db/migration";

const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

function projectedFixture() {
  const db = openHarnessDb(":memory:");
  migrate(db);
  const journal = new SqliteForwardEscapeJournal(db);
  const episodeId = "E4-102";
  const payloadDigest = "a".repeat(64);
  const repository = "unison-ai-product/UT-TDD_AGENT-HARNESS";
  const bodyDigest = "b".repeat(64);
  journal.issue({ command_id: episodeId, payload_digest: payloadDigest });
  journal.append({
    type: "IssueProjectionQueued",
    command_id: episodeId,
    payload_digest: payloadDigest,
    repository,
    body_digest: bodyDigest,
  });
  const binding: IssueBinding = {
    repository,
    issue_number: 102,
    node_id: "I_kwDO-test",
    url: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/102",
    body_digest: bodyDigest,
    observed_revision: "2026-07-21T00:00:00Z",
  };
  const receipt = journal.append({
    type: "IssueProjected",
    command_id: episodeId,
    payload_digest: payloadDigest,
    binding,
  });
  return { db, episodeId, binding, receipt };
}

describe("SqliteIssueProjectionEvidenceResolver", () => {
  it("E4 durable receiptをepisode/issue/body bindingから解決してcaller digestと照合する", () => {
    const { db, episodeId, binding, receipt } = projectedFixture();
    try {
      const result = new SqliteIssueProjectionEvidenceResolver(db).resolve({
        issueId: 102,
        episodeId,
        projectionDigest: `sha256:${receipt.event_digest}`,
      });
      expect(result).toEqual({
        issueId: 102,
        episodeId,
        projectionDigest: `sha256:${receipt.event_digest}`,
        repository: binding.repository,
        bodyDigest: `sha256:${binding.body_digest}`,
      });
    } finally {
      db.close();
    }
  });

  it.each([
    ["caller digest捏造", { projectionDigest: `sha256:${"f".repeat(64)}` }],
    ["別issue", { issueId: 103 }],
    ["別episode", { episodeId: "E4-103" }],
  ])("%sをfail-closeする", (_name, override) => {
    const { db, episodeId, receipt } = projectedFixture();
    try {
      expect(() =>
        new SqliteIssueProjectionEvidenceResolver(db).resolve({
          issueId: 102,
          episodeId,
          projectionDigest: `sha256:${receipt.event_digest}`,
          ...override,
        }),
      ).toThrow("issue-projection-evidence-invalid");
    } finally {
      db.close();
    }
  });

  it("DB内E4 event_jsonまたはdigest chain改変をfail-closeする", () => {
    const { db, episodeId, receipt } = projectedFixture();
    try {
      const row = db
        .prepare(
          "SELECT event_json FROM forward_escape_projection_events WHERE command_id = ? AND sequence = 2",
        )
        .get(episodeId);
      const event = JSON.parse(String(row?.event_json));
      event.binding.body_digest = sha("forged-body");
      db.prepare(
        "UPDATE forward_escape_projection_events SET event_json = ? WHERE command_id = ? AND sequence = 2",
      ).run(JSON.stringify(event), episodeId);

      expect(() =>
        new SqliteIssueProjectionEvidenceResolver(db).resolve({
          issueId: 102,
          episodeId,
          projectionDigest: `sha256:${receipt.event_digest}`,
        }),
      ).toThrow("issue-projection-evidence-invalid");
    } finally {
      db.close();
    }
  });
});
