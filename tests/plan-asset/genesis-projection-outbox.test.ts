import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GenesisAdoptionTransaction } from "../../src/plan-asset/ledger/genesis-adoption-transaction.js";
import { SqliteGenesisProjectionOutboxStore } from "../../src/plan-asset/ledger/genesis-projection-outbox.js";
import { openHarnessDb } from "../../src/state-db/index.js";
import { input } from "./support/genesis-adoption-fixture.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("genesis projection outbox", () => {
  it("U-GEN-016: file-backed close/reopen後もpending custodyとevent chainを復元する", () => {
    const path = databasePath();
    const first = openHarnessDb(path);
    expect(new GenesisAdoptionTransaction(first).adopt(input())).toMatchObject({ ok: true });
    first.close();

    const reopened = openHarnessDb(path);
    const store = new SqliteGenesisProjectionOutboxStore(reopened);
    expect(store.pending()).toEqual([
      expect.objectContaining({
        commandId: "genesis:issue-129:l4-31",
        issueNumber: 129,
        status: "pending",
        attemptCount: 0,
      }),
    ]);
    store.markRecoveryRequired(
      "genesis:issue-129:l4-31",
      "remote-timeout",
      "2026-07-22T00:01:00.000Z",
    );
    reopened.close();

    const retried = openHarnessDb(path);
    const retryStore = new SqliteGenesisProjectionOutboxStore(retried);
    expect(retryStore.pending()).toEqual([
      expect.objectContaining({ status: "recovery_required", attemptCount: 1 }),
    ]);
    retryStore.markProjected("genesis:issue-129:l4-31", "2026-07-22T00:02:00.000Z");
    expect(retryStore.pending()).toEqual([]);
    retryStore.markProjected("genesis:issue-129:l4-31", "2026-07-22T00:03:00.000Z");
    expect(
      retried
        .prepare("SELECT event_kind FROM genesis_projection_outbox_events ORDER BY sequence")
        .all(),
    ).toEqual([
      { event_kind: "pending" },
      { event_kind: "recovery_required" },
      { event_kind: "projected" },
    ]);
    retried.close();
  });

  it("U-GEN-017: snapshot/eventの共同不整合とterminal逆遷移を拒否する", () => {
    const db = openHarnessDb(":memory:");
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    const store = new SqliteGenesisProjectionOutboxStore(db);
    store.markProjected("genesis:issue-129:l4-31", "2026-07-22T00:02:00.000Z");
    expect(() =>
      store.markRecoveryRequired(
        "genesis:issue-129:l4-31",
        "late-failure",
        "2026-07-22T00:03:00.000Z",
      ),
    ).toThrow("genesis-outbox-terminal-conflict");

    db.prepare(
      "UPDATE genesis_projection_outbox SET last_event_digest = ? WHERE command_id = ?",
    ).run("f".repeat(64), "genesis:issue-129:l4-31");
    db.prepare("UPDATE genesis_projection_outbox SET status = 'pending' WHERE command_id = ?").run(
      "genesis:issue-129:l4-31",
    );
    expect(() => store.pending()).toThrow("genesis-outbox-chain-invalid");
    db.close();
  });

  it("U-GEN-018: append-only custody/eventはUPDATE/DELETE tamperをschema authorityで拒否する", () => {
    const db = openHarnessDb(":memory:");
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    expect(() => db.exec("DELETE FROM genesis_issue_custody")).toThrow(
      "append-only:genesis_issue_custody",
    );
    expect(() =>
      db.exec("UPDATE genesis_projection_outbox_events SET event_kind = 'projected'"),
    ).toThrow("append-only:genesis_projection_outbox_events");
    db.close();
  });
});

function databasePath(): string {
  const root = mkdtempSync(join(process.cwd(), ".ut-tdd", "genesis-outbox-test-"));
  roots.push(root);
  return join(root, "ledger.sqlite");
}
