import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    const firstClaim = store.claimPending(claim("worker:first", "2026-07-22T00:00:00.000Z"))[0];
    store.markRecoveryRequired(
      "genesis:issue-129:l4-31",
      firstClaim.ownerToken,
      "remote-timeout",
      "2026-07-22T00:01:00.000Z",
    );
    reopened.close();

    const retried = openHarnessDb(path);
    const retryStore = new SqliteGenesisProjectionOutboxStore(retried);
    expect(retryStore.pending()).toEqual([
      expect.objectContaining({ status: "recovery_required", attemptCount: 1 }),
    ]);
    const retryClaim = retryStore.claimPending(
      claim("worker:retry", "2026-07-22T00:01:30.000Z"),
    )[0];
    retryStore.markProjected(
      "genesis:issue-129:l4-31",
      retryClaim.ownerToken,
      "2026-07-22T00:02:00.000Z",
    );
    expect(retryStore.pending()).toEqual([]);
    expect(() =>
      retryStore.markProjected(
        "genesis:issue-129:l4-31",
        retryClaim.ownerToken,
        "2026-07-22T00:03:00.000Z",
      ),
    ).toThrow("genesis-outbox-stale-claim-owner");
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
    const winner = store.claimPending(claim("worker:winner", "2026-07-22T00:01:00.000Z"))[0];
    store.markProjected("genesis:issue-129:l4-31", winner.ownerToken, "2026-07-22T00:02:00.000Z");
    expect(() =>
      store.markRecoveryRequired(
        "genesis:issue-129:l4-31",
        winner.ownerToken,
        "late-failure",
        "2026-07-22T00:03:00.000Z",
      ),
    ).toThrow("genesis-outbox-stale-claim-owner");

    db.prepare(
      "UPDATE genesis_projection_outbox SET last_event_digest = ? WHERE command_id = ?",
    ).run("f".repeat(64), "genesis:issue-129:l4-31");
    db.prepare("UPDATE genesis_projection_outbox SET status = 'pending' WHERE command_id = ?").run(
      "genesis:issue-129:l4-31",
    );
    expect(() => store.pending()).toThrow("genesis-outbox-chain-invalid");
    db.close();
  });

  it("U-GEN-024: claim CASは単一winner、expiry後reclaim、stale owner terminal拒否を保証する", () => {
    const db = openHarnessDb(":memory:");
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    const store = new SqliteGenesisProjectionOutboxStore(db);
    expect(store.claimPending(claim("worker:a", "2026-07-22T00:00:00.000Z", 30_000))).toHaveLength(
      1,
    );
    expect(store.claimPending(claim("worker:b", "2026-07-22T00:00:10.000Z", 30_000))).toEqual([]);
    const recovered = store.claimPending(claim("worker:b", "2026-07-22T00:00:31.000Z", 30_000))[0];
    expect(recovered.ownerToken).toBe("worker:b");
    expect(() =>
      store.markProjected("genesis:issue-129:l4-31", "worker:a", "2026-07-22T00:00:32.000Z"),
    ).toThrow("genesis-outbox-stale-claim-owner");
    store.markProjected("genesis:issue-129:l4-31", "worker:b", "2026-07-22T00:00:32.000Z");
    expect(
      db
        .prepare(
          "SELECT event_kind, owner_token FROM genesis_projection_claim_events ORDER BY sequence",
        )
        .all(),
    ).toEqual([
      { event_kind: "claimed", owner_token: "worker:a" },
      { event_kind: "claimed", owner_token: "worker:b" },
      { event_kind: "released", owner_token: "worker:b" },
    ]);
    db.close();
  });

  it("U-GEN-025: file-backed 2 process CASでremote到達は一度だけになる", async () => {
    const path = databasePath();
    const db = openHarnessDb(path);
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    db.close();
    const worker = join(roots.at(-1) as string, "claim-worker.mjs");
    const remoteLog = join(roots.at(-1) as string, "remote.log");
    writeFileSync(worker, claimWorkerSource(), "utf8");

    const results = await Promise.all([
      runClaimWorker(worker, path, remoteLog, "worker:a"),
      runClaimWorker(worker, path, remoteLog, "worker:b"),
    ]);
    expect(results.sort()).toEqual([0, 0]);
    expect(readFileSync(remoteLog, "utf8").trim().split(/\r?\n/)).toHaveLength(1);
    const reopened = openHarnessDb(path);
    expect(
      reopened.prepare("SELECT owner_token FROM genesis_projection_claims").all(),
    ).toHaveLength(1);
    reopened.close();
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

function claim(ownerToken: string, claimedAt: string, leaseMs = 300_000) {
  return {
    ownerToken,
    claimedAt,
    expiresAt: new Date(Date.parse(claimedAt) + leaseMs).toISOString(),
  };
}

function runClaimWorker(worker: string, dbPath: string, logPath: string, owner: string) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [worker, dbPath, logPath, owner], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? -1));
  });
}

function claimWorkerSource(): string {
  return `
import { appendFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
const [path, log, owner] = process.argv.slice(2);
const db = new DatabaseSync(path);
db.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
try {
  const existing = db.prepare("SELECT claim_state, claim_expires_at FROM genesis_projection_claims WHERE command_id = ?").get("genesis:issue-129:l4-31");
  let won = false;
  if (!existing) {
    db.prepare("INSERT INTO genesis_projection_claims VALUES (?, ?, ?, ?, ?)").run("genesis:issue-129:l4-31", "active", owner, "2026-07-22T00:01:00.000Z", owner.padEnd(64, "0").slice(0, 64));
    won = true;
  }
  db.exec("COMMIT");
  if (won) appendFileSync(log, owner + "\\n", "utf8");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally { db.close(); }
`;
}
