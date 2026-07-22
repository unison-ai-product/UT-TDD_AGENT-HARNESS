import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { GenesisAdoptionTransaction } from "../../src/plan-asset/ledger/genesis-adoption-transaction.js";
import { SqliteGenesisProjectionOutboxStore } from "../../src/plan-asset/ledger/genesis-projection-outbox.js";
import { openHarnessDb } from "../../src/state-db/index.js";
import { migrate } from "../../src/state-db/migration.js";
import { removeTestTree } from "../support/temp-tree.js";
import { input } from "./support/genesis-adoption-fixture.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) removeTestTree(root);
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
    store.markRecoveryRequired({
      commandId: firstClaim.commandId,
      ownerToken: firstClaim.ownerToken,
      claimGeneration: firstClaim.claimGeneration,
      reason: "remote-timeout",
      occurredAt: "2026-07-22T00:01:00.000Z",
    });
    reopened.close();

    const retried = openHarnessDb(path);
    const retryStore = new SqliteGenesisProjectionOutboxStore(retried);
    expect(retryStore.pending()).toEqual([
      expect.objectContaining({ status: "recovery_required", attemptCount: 1 }),
    ]);
    const retryClaim = retryStore.claimPending(
      claim("worker:retry", "2026-07-22T00:01:30.000Z"),
    )[0];
    retryStore.markProjected({
      commandId: retryClaim.commandId,
      ownerToken: retryClaim.ownerToken,
      claimGeneration: retryClaim.claimGeneration,
      occurredAt: "2026-07-22T00:02:00.000Z",
    });
    expect(retryStore.pending()).toEqual([]);
    expect(() =>
      retryStore.markProjected({
        commandId: retryClaim.commandId,
        ownerToken: retryClaim.ownerToken,
        claimGeneration: retryClaim.claimGeneration,
        occurredAt: "2026-07-22T00:03:00.000Z",
      }),
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
    store.markProjected({
      commandId: winner.commandId,
      ownerToken: winner.ownerToken,
      claimGeneration: winner.claimGeneration,
      occurredAt: "2026-07-22T00:02:00.000Z",
    });
    expect(() =>
      store.markRecoveryRequired({
        commandId: winner.commandId,
        ownerToken: winner.ownerToken,
        claimGeneration: winner.claimGeneration,
        reason: "late-failure",
        occurredAt: "2026-07-22T00:03:00.000Z",
      }),
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
      store.markProjected({
        commandId: "genesis:issue-129:l4-31",
        ownerToken: "worker:a",
        claimGeneration: 1,
        occurredAt: "2026-07-22T00:00:32.000Z",
      }),
    ).toThrow("genesis-outbox-stale-claim-owner");
    store.markProjected({
      commandId: recovered.commandId,
      ownerToken: recovered.ownerToken,
      claimGeneration: recovered.claimGeneration,
      occurredAt: "2026-07-22T00:00:32.000Z",
    });
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

  it("U-GEN-025: 有効lease内のproduction 2 workerは単一live workerだけがremoteへ到達する", async () => {
    const path = databasePath();
    const db = openHarnessDb(path);
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    db.close();
    const root = roots.at(-1) as string;
    const worker = productionWorker(root);
    const harnessPath = join(root, "harness.sqlite");
    const remote = join(root, "remote.json");
    prepareHarnessDb(harnessPath);

    const results = await Promise.all([
      runProductionWorker(worker, path, harnessPath, remote, "normal"),
      runProductionWorker(worker, path, harnessPath, remote, "normal"),
    ]);
    expect(results.sort()).toEqual([0, 0]);
    expect(JSON.parse(readFileSync(remote, "utf8"))).toMatchObject({ create_count: 1 });
    const reopened = openHarnessDb(path);
    expect(reopened.prepare("SELECT status FROM genesis_projection_outbox").get()).toEqual({
      status: "projected",
    });
    reopened.close();
  });

  it("U-GEN-029: remote成功が再観測可能ならprocess crash後のcreate-or-getで収束する", async () => {
    const path = databasePath();
    const db = openHarnessDb(path);
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    db.close();
    const root = roots.at(-1) as string;
    const worker = productionWorker(root);
    const harnessPath = join(root, "harness.sqlite");
    const remote = join(root, "remote.json");
    prepareHarnessDb(harnessPath);

    expect(await runProductionWorker(worker, path, harnessPath, remote, "crash")).toBe(71);
    expect(JSON.parse(readFileSync(remote, "utf8"))).toMatchObject({ create_count: 1 });
    expect(await runProductionWorker(worker, path, harnessPath, remote, "normal")).toBe(0);
    expect(JSON.parse(readFileSync(remote, "utf8"))).toMatchObject({ create_count: 1 });

    const reopened = openHarnessDb(path);
    expect(reopened.prepare("SELECT status FROM genesis_projection_outbox").get()).toEqual({
      status: "projected",
    });
    expect(
      reopened
        .prepare("SELECT event_kind FROM genesis_projection_outbox_events ORDER BY sequence")
        .all(),
    ).toEqual([{ event_kind: "pending" }, { event_kind: "projected" }]);
    reopened.close();
  });

  it("U-GEN-026: claim snapshot tamperをlatest immutable event chain照合で拒否する", () => {
    const db = openHarnessDb(":memory:");
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    const store = new SqliteGenesisProjectionOutboxStore(db);
    store.claimPending(claim("worker:a", "2026-07-22T00:00:00.000Z", 30_000));
    db.prepare("UPDATE genesis_projection_claims SET owner_token = ?").run("worker:forged");
    expect(() => store.pending()).toThrow("genesis-outbox-claim-chain-invalid");
    expect(() => store.claimPending(claim("worker:b", "2026-07-22T00:00:31.000Z"))).toThrow(
      "genesis-outbox-claim-chain-invalid",
    );
    db.close();
  });

  it("U-GEN-027: stale generationはrenew/finalizeの短いtransactionで拒否される", () => {
    const db = openHarnessDb(":memory:");
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    const store = new SqliteGenesisProjectionOutboxStore(db);
    store.claimPending(claim("worker:a", "2026-07-22T00:00:00.000Z", 30_000));
    store.claimPending(claim("worker:b", "2026-07-22T00:00:31.000Z", 30_000));
    expect(() =>
      store.renewClaim({
        commandId: "genesis:issue-129:l4-31",
        ownerToken: "worker:a",
        claimGeneration: 1,
        claimedAt: "2026-07-22T00:00:32.000Z",
        expiresAt: "2026-07-22T00:01:02.000Z",
      }),
    ).toThrow("genesis-outbox-stale-claim-owner");
    expect(() =>
      store.markProjected({
        commandId: "genesis:issue-129:l4-31",
        ownerToken: "worker:a",
        claimGeneration: 1,
        occurredAt: "2026-07-22T00:00:32.000Z",
      }),
    ).toThrow("genesis-outbox-stale-claim-owner");
    db.close();
  });

  it("U-GEN-030: renewはgenerationを単調増加し旧generationのfinalizeを拒否する", () => {
    const db = openHarnessDb(":memory:");
    expect(new GenesisAdoptionTransaction(db).adopt(input())).toMatchObject({ ok: true });
    const store = new SqliteGenesisProjectionOutboxStore(db);
    const claimed = store.claimPending(claim("worker:a", "2026-07-22T00:00:00.000Z", 30_000))[0];

    const renewedGeneration = store.renewClaim({
      commandId: claimed.commandId,
      ownerToken: claimed.ownerToken,
      claimGeneration: claimed.claimGeneration,
      claimedAt: "2026-07-22T00:00:10.000Z",
      expiresAt: "2026-07-22T00:00:40.000Z",
    });
    expect(renewedGeneration).toBeGreaterThan(claimed.claimGeneration);
    expect(() =>
      store.markProjected({
        commandId: claimed.commandId,
        ownerToken: claimed.ownerToken,
        claimGeneration: claimed.claimGeneration,
        occurredAt: "2026-07-22T00:00:11.000Z",
      }),
    ).toThrow("genesis-outbox-stale-claim-owner");
    store.markProjected({
      commandId: claimed.commandId,
      ownerToken: claimed.ownerToken,
      claimGeneration: renewedGeneration,
      occurredAt: "2026-07-22T00:00:11.000Z",
    });
    expect(store.pending()).toEqual([]);
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

function claim(ownerToken: string, claimedAt: string, leaseMs = 300_000) {
  return {
    ownerToken,
    claimedAt,
    expiresAt: new Date(Date.parse(claimedAt) + leaseMs).toISOString(),
  };
}

function runProductionWorker(
  worker: string,
  planDbPath: string,
  harnessDbPath: string,
  remotePath: string,
  mode: "normal" | "crash",
) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(bunBinary(), [worker, planDbPath, harnessDbPath, remotePath, mode], {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? -1));
  });
}

function bunBinary(): string {
  const configured = process.env.UT_TDD_BUN_BINARY;
  if (configured && existsSync(configured)) return configured;
  const appData = process.env.APPDATA;
  const bundled = appData ? join(appData, "npm", "node_modules", "bun", "bin", "bun.exe") : "";
  if (bundled && existsSync(bundled)) return bundled;
  throw new Error("native-bun-binary-missing");
}

function prepareHarnessDb(path: string): void {
  const db = openHarnessDb(path);
  try {
    migrate(db);
  } finally {
    db.close();
  }
}

function productionWorker(root: string): string {
  const worker = join(root, "production-projection-worker.ts");
  writeFileSync(worker, productionWorkerSource(), "utf8");
  return worker;
}

function productionWorkerSource(): string {
  const dispatcher = pathToFileURL(
    join(process.cwd(), "src", "plan-asset", "application", "genesis-projection-dispatcher.ts"),
  ).href;
  const ghPort = pathToFileURL(
    join(process.cwd(), "src", "github", "node-gh-forward-escape-issue-port.ts"),
  ).href;
  return `
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { openNodeGenesisProjectionDispatcher } from ${JSON.stringify(dispatcher)};
import { NodeGhForwardEscapeIssuePort } from ${JSON.stringify(ghPort)};

const [planDbPath, harnessDbPath, remotePath, mode] = process.argv.slice(2);
const repository = "unison-ai-product/UT-TDD_AGENT-HARNESS";
const issueBody = "issue-129-preimage";
const issueUrl = "https://github.com/" + repository + "/issues/129";
const runGh = (args) => {
  const endpoint = args.find((arg) => arg.startsWith("repos/"));
  if (endpoint?.includes("/comments?")) {
    const comments = existsSync(remotePath) ? [JSON.parse(readFileSync(remotePath, "utf8")).comment] : [];
    return JSON.stringify([comments]);
  }
  if (args.includes("POST") && endpoint?.endsWith("/comments")) {
    const body = args.find((arg) => arg.startsWith("body="))?.slice(5) ?? "";
    const comment = {
      node_id: "IC_GENESIS_129",
      html_url: issueUrl + "#issuecomment-1",
      body,
      updated_at: "2026-07-22T00:00:01.000Z",
    };
    writeFileSync(remotePath, JSON.stringify({ create_count: 1, comment }), { encoding: "utf8", flag: "wx" });
    if (mode === "crash") process.exit(71);
    return JSON.stringify(comment);
  }
  return JSON.stringify({
    number: 129,
    node_id: "I_GENESIS_129",
    html_url: issueUrl,
    body: issueBody,
    updated_at: "2026-07-22T00:00:00.000Z",
  });
};

const resource = openNodeGenesisProjectionDispatcher({
  repoRoot: process.cwd(),
  repository,
  port: new NodeGhForwardEscapeIssuePort(runGh),
  options: {
    planLedgerPath: planDbPath,
    harnessDbPath,
    now: () => mode === "crash" ? "2026-07-22T00:00:00.000Z" : "2026-07-22T00:00:01.000Z",
    ownerToken: () => "worker:" + process.pid,
    leaseMs: 1,
  },
});
try {
  resource.dispatcher.dispatchPending();
} finally {
  resource.close();
}
`;
}
