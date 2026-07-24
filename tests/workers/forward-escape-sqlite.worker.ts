import { existsSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SqliteForwardEscapeJournal } from "../../src/execution/sqlite-forward-escape-journal";
import { openHarnessDb } from "../../src/state-db/index";
import { migrate } from "../../src/state-db/migration";

const dbPath = process.env.UT_TDD_FORWARD_ESCAPE_DB;
const repoRoot = process.env.UT_TDD_FORWARD_ESCAPE_REPO;
const gate = process.env.UT_TDD_FORWARD_ESCAPE_GATE;
const ready = process.env.UT_TDD_FORWARD_ESCAPE_READY;
const enabled = [dbPath, repoRoot, gate, ready].every(
  (value) => value !== undefined && value.length > 0,
);

describe.runIf(enabled)("forward escape SQLite concurrency worker", () => {
  it("issues one convergent certificate and queue receipt", async () => {
    const db = openHarnessDb(dbPath!, { repoRoot: repoRoot! });
    migrate(db);
    try {
      const journal = new SqliteForwardEscapeJournal(db);
      writeFileSync(`${ready!}/${process.pid}`, "ready");
      while (existsSync(gate!)) {
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
      const certificate = journal.issue({
        command_id: "cmd-concurrent",
        payload_digest: "a".repeat(64),
      });
      const receipt = journal.append({
        type: "IssueProjectionQueued",
        command_id: "cmd-concurrent",
        payload_digest: "a".repeat(64),
        repository: "owner/repo",
        body_digest: "b".repeat(64),
      });
      expect(certificate.certificate_id).toMatch(/^[0-9a-f-]{36}$/);
      expect(receipt.durable).toBe(true);
      console.log(`UT_TDD_WORKER_RESULT=${JSON.stringify({ certificate, receipt })}`);
    } finally {
      db.close();
    }
  });
});
