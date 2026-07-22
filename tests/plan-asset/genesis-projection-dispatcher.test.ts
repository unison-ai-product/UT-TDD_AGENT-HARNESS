import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { ForwardEscapeIssueAdoptionPort } from "../../src/execution/forward-escape";
import {
  GenesisProjectionDispatcher,
  type GenesisProjectionDispatchPort,
  openNodeGenesisProjectionDispatcher,
  runNodeGenesisProjectionDispatcher,
} from "../../src/plan-asset/application/genesis-projection-dispatcher";
import type {
  GenesisProjectionOutboxEntry,
  GenesisProjectionOutboxStore,
} from "../../src/plan-asset/ledger/genesis-projection-outbox";
import {
  ledgerRowDigest,
  migratePlanLedger,
  openPlanLedger,
} from "../../src/plan-asset/ledger/schema";
import { defaultHarnessDbPath, openHarnessDb } from "../../src/state-db";
import { removeTestTree } from "../support/temp-tree";

const entries: readonly GenesisProjectionOutboxEntry[] = [
  {
    commandId: "genesis:129:first",
    issueNumber: 129,
    issuePreimageDigest: "a".repeat(64),
    assetId: "asset-first",
    revision: 1,
    status: "recovery_required",
    attemptCount: 1,
    nextAttemptAt: "2026-07-22T07:00:00.000Z",
  },
  {
    commandId: "genesis:129:second",
    issueNumber: 129,
    issuePreimageDigest: "b".repeat(64),
    assetId: "asset-second",
    revision: 1,
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: "2026-07-22T07:00:00.000Z",
  },
];

describe("GenesisProjectionDispatcher", () => {
  it("U-GEN-032: leaseはprojection全remote operation予算とfinalize予算を超えない構成を拒否する", () => {
    const fixture = setup(entries.slice(0, 1), () => ({ durable: true, state: "projected" }));
    expect(
      () =>
        new GenesisProjectionDispatcher({
          outbox: fixture.store,
          projection: fixture.projection,
          now: () => "2026-07-22T07:01:00.000Z",
          leaseMs: 20_000,
          remoteOperationBudgetMs: 60_000,
          finalizeBudgetMs: 5_000,
        }),
    ).toThrow("genesis-projection-lease-deadline-invalid");
  });

  it("U-GEN-039: 4 call途中でlease切れする2 worker構成をremote開始前に拒否する", () => {
    const fixture = setup(entries.slice(0, 1), () => ({ durable: true, state: "projected" }));
    for (const worker of ["worker:a", "worker:b"]) {
      expect(
        () =>
          new GenesisProjectionDispatcher({
            outbox: fixture.store,
            projection: fixture.projection,
            now: () => "2026-07-22T07:01:00.000Z",
            ownerToken: () => worker,
            leaseMs: 30_000,
            remoteOperationBudgetMs: 60_000,
          }),
      ).toThrow("genesis-projection-lease-deadline-invalid");
    }
    expect(fixture.projection.dispatch).not.toHaveBeenCalled();
  });

  it("U-GEN-017: restart後にpending/recovery_requiredを走査しprojected終端へ収束する", () => {
    const fixture = setup(entries, () => ({ durable: true, state: "projected" }));

    expect(fixture.dispatcher.dispatchPending()).toEqual({
      scanned: 2,
      projected: 2,
      recoveryRequired: 0,
      claimRejected: 0,
    });
    expect(fixture.projection.dispatch).toHaveBeenCalledTimes(2);
    expect(fixture.store.markProjected).toHaveBeenNthCalledWith(1, {
      commandId: "genesis:129:first",
      ownerToken: "worker:test",
      claimGeneration: 2,
      occurredAt: "2026-07-22T07:01:00.000Z",
    });
    expect(fixture.store.markProjected).toHaveBeenNthCalledWith(2, {
      commandId: "genesis:129:second",
      ownerToken: "worker:test",
      claimGeneration: 2,
      occurredAt: "2026-07-22T07:01:00.000Z",
    });
  });

  it("U-GEN-018: observe/remote失敗をrecovery_requiredへ残して後続entryを継続する", () => {
    const fixture = setup(entries, (input) => {
      if (input.commandId.endsWith("first")) throw new Error("issue-observe-failed");
      return { durable: true, state: "recovery_required" };
    });

    expect(fixture.dispatcher.dispatchPending()).toEqual({
      scanned: 2,
      projected: 0,
      recoveryRequired: 2,
      claimRejected: 0,
    });
    expect(fixture.projection.dispatch).toHaveBeenCalledTimes(2);
    expect(fixture.store.markRecoveryRequired).toHaveBeenNthCalledWith(1, {
      commandId: "genesis:129:first",
      ownerToken: "worker:test",
      claimGeneration: 2,
      reason: "issue-observe-failed",
      occurredAt: "2026-07-22T07:01:00.000Z",
    });
    expect(fixture.store.markRecoveryRequired).toHaveBeenNthCalledWith(2, {
      commandId: "genesis:129:second",
      ownerToken: "worker:test",
      claimGeneration: 2,
      reason: "genesis-adoption-projection-recovery-required",
      occurredAt: "2026-07-22T07:01:00.000Z",
    });
  });

  it("U-GEN-019: durableでない応答を成功扱いせずfail-closeする", () => {
    const fixture = setup(entries.slice(0, 1), () => ({
      durable: false,
      state: "projected",
    }));

    expect(fixture.dispatcher.dispatchPending()).toEqual({
      scanned: 1,
      projected: 0,
      recoveryRequired: 1,
      claimRejected: 0,
    });
    expect(fixture.store.markProjected).not.toHaveBeenCalled();
    expect(fixture.store.markRecoveryRequired).toHaveBeenCalledWith({
      commandId: "genesis:129:first",
      ownerToken: "worker:test",
      claimGeneration: 2,
      reason: "genesis-adoption-projection-not-durable",
      occurredAt: "2026-07-22T07:01:00.000Z",
    });
  });

  it("U-GEN-023: CLIは指定commandだけを投影し無関係なpendingを処理しない", () => {
    const fixture = setup(entries, () => ({ durable: true, state: "projected" }));

    expect(fixture.dispatcher.dispatchCommand("genesis:129:second")).toEqual({
      scanned: 1,
      projected: 1,
      recoveryRequired: 0,
      claimRejected: 0,
    });
    expect(fixture.store.claimCommand).toHaveBeenCalledWith(
      "genesis:129:second",
      expect.objectContaining({ ownerToken: "worker:test" }),
    );
    expect(fixture.projection.dispatch).toHaveBeenCalledOnce();
    expect(fixture.projection.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ commandId: "genesis:129:second" }),
    );
  });

  it("U-GEN-020: Node resourceを成功・失敗の両方でcloseする", () => {
    const close = vi.fn();
    const dispatcher = {
      dispatchPending: vi.fn(() => ({
        scanned: 0,
        projected: 0,
        recoveryRequired: 0,
        claimRejected: 0,
      })),
      dispatchCommand: vi.fn(() => ({
        scanned: 0,
        projected: 0,
        recoveryRequired: 0,
        claimRejected: 0,
      })),
    };
    expect(runNodeGenesisProjectionDispatcher(() => ({ dispatcher, close }))).toEqual({
      scanned: 0,
      projected: 0,
      recoveryRequired: 0,
      claimRejected: 0,
    });
    expect(close).toHaveBeenCalledOnce();

    const failedClose = vi.fn();
    expect(() =>
      runNodeGenesisProjectionDispatcher(() => ({
        dispatcher: {
          dispatchPending: () => {
            throw new Error("scan-failed");
          },
          dispatchCommand: () => ({
            scanned: 0,
            projected: 0,
            recoveryRequired: 0,
            claimRejected: 0,
          }),
        },
        close: failedClose,
      })),
    ).toThrow("scan-failed");
    expect(failedClose).toHaveBeenCalledOnce();
  });

  it("U-GEN-021: production compositionはPlan outboxとHARNESS journalを実2DBで再送収束する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-genesis-dispatch-"));
    mkdirSync(join(root, ".ut-tdd"), { recursive: true });
    const body = "# Genesis adoption\n";
    let failures = 1;
    const port = projectionPort(body, (request) => {
      if (failures-- > 0) return { ok: false as const, reason: "offline" };
      return {
        ok: true as const,
        comment: {
          node_id: "IC_129",
          url: "https://github.com/owner/repository/issues/129#issuecomment-129",
          body_digest: request.body_digest,
          observed_revision: "etag-comment-129",
        },
      };
    });
    seedPending(root, body);

    let resource = openNodeGenesisProjectionDispatcher({
      repoRoot: root,
      repository: "owner/repository",
      port,
      options: { remoteOperationBudgetMs: 15_000 },
    });
    expect(resource.dispatcher.dispatchCommand("genesis:129")).toEqual({
      scanned: 1,
      projected: 0,
      recoveryRequired: 1,
      claimRejected: 0,
    });
    resource.close();
    expect(readPlanStatus(root)).toBe("recovery_required");
    expect(readHarnessEvents(root)).toEqual(["IssueAdoptionQueued"]);

    resource = openNodeGenesisProjectionDispatcher({
      repoRoot: root,
      repository: "owner/repository",
      port,
      options: { remoteOperationBudgetMs: 15_000 },
    });
    expect(resource.dispatcher.dispatchCommand("genesis:129")).toEqual({
      scanned: 1,
      projected: 1,
      recoveryRequired: 0,
      claimRejected: 0,
    });
    resource.close();
    expect(readPlanStatus(root)).toBe("projected");
    expect(readHarnessEvents(root)).toEqual(["IssueAdoptionQueued", "IssueAdopted"]);
    expect(defaultHarnessDbPath(root)).not.toBe(
      join(root, ".ut-tdd", "ledger", "harness-ledger.db"),
    );
    removeTestTree(root);
  });

  it("U-GEN-034: renew失敗をentry単位で集約し後続claimの投影を継続する", () => {
    const fixture = setup(entries, () => ({ durable: true, state: "projected" }));
    vi.mocked(fixture.store.renewClaim)
      .mockImplementationOnce(() => {
        throw new Error("genesis-outbox-stale-claim-owner");
      })
      .mockReturnValueOnce(2);

    expect(fixture.dispatcher.dispatchPending()).toEqual({
      scanned: 2,
      projected: 1,
      recoveryRequired: 0,
      claimRejected: 1,
    });
    expect(fixture.projection.dispatch).toHaveBeenCalledOnce();
    expect(fixture.projection.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ commandId: "genesis:129:second" }),
    );
  });

  it("U-GEN-035: active leaseはreplayed projectedへ誤分類せずbusyでfail-closeする", () => {
    const fixture = setup(entries.slice(0, 1), () => ({ durable: true, state: "projected" }));
    vi.mocked(fixture.store.claimCommand).mockReturnValue(undefined);
    vi.mocked(fixture.store.commandState).mockReturnValue("busy");

    expect(() => fixture.dispatcher.dispatchCommand("genesis:129:first")).toThrow(
      "genesis-adoption-projection-command-busy",
    );
    expect(fixture.projection.dispatch).not.toHaveBeenCalled();
  });

  it("U-GEN-022: HARNESS DB close失敗時もPlan Ledgerをnested finallyでcloseする", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-genesis-close-"));
    mkdirSync(join(root, ".ut-tdd"), { recursive: true });
    const rawPlanDb = openPlanLedger({ repoRoot: root });
    migratePlanLedger(rawPlanDb);
    const rawHarnessDb = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
    const planClose = vi.fn(() => rawPlanDb.close());
    const harnessClose = vi.fn(() => {
      rawHarnessDb.close();
      throw new Error("harness-close-failed");
    });
    const planDb = { ...rawPlanDb, close: planClose };
    const harnessDb = { ...rawHarnessDb, close: harnessClose };
    const resource = openNodeGenesisProjectionDispatcher({
      repoRoot: root,
      repository: "owner/repository",
      port: projectionPort("# issue\n", () => ({ ok: false, reason: "unused" })),
      options: {
        remoteOperationBudgetMs: 15_000,
        openPlanDb: () => planDb,
        openHarnessDb: () => harnessDb,
        migrateHarnessDb: vi.fn(),
      },
    });

    expect(() => resource.close()).toThrow("harness-close-failed");
    expect(harnessClose).toHaveBeenCalledOnce();
    expect(planClose).toHaveBeenCalledOnce();
    removeTestTree(root);
  });
});

function seedPending(root: string, body: string): void {
  const db = openPlanLedger({ repoRoot: root });
  migratePlanLedger(db);
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    "asset-129",
    "2026-07-22T07:00:00.000Z",
    "a".repeat(40),
    "ut-tdd-plan-legacy-v1",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "asset-129",
    1,
    "{}",
    sha("{}"),
    sha("plan-body"),
    "docs/plans/PLAN-L7-452.md",
    "a".repeat(40),
    "codex",
    "genesis-adoption",
    "2026-07-22T07:00:00.000Z",
  );
  const custody = {
    command_id: "genesis:129",
    issue_number: 129,
    episode_id: "issue:129",
    drive_model: "redesign",
    issue_preimage_digest: sha(body),
    plan_asset_id: "asset-129",
    plan_revision: 1,
    custody_state: "committed",
    recorded_at: "2026-07-22T07:00:00.000Z",
  };
  db.prepare("INSERT INTO genesis_issue_custody VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(custody),
    ledgerRowDigest(custody, "custody_digest"),
  );
  const payloadJson = JSON.stringify({
    assetId: "asset-129",
    issueNumber: 129,
    issuePreimageDigest: sha(body),
    revision: 1,
  });
  const payloadDigest = sha(payloadJson);
  const event = {
    outbox_event_id: "genesis-outbox:genesis:129:1",
    command_id: "genesis:129",
    sequence: 1,
    event_kind: "pending",
    payload_digest: payloadDigest,
    occurred_at: "2026-07-22T07:00:00.000Z",
    failure_reason: null,
    previous_event_digest: null,
  };
  const eventDigest = ledgerRowDigest(event, "event_digest");
  db.prepare("INSERT INTO genesis_projection_outbox_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(event),
    eventDigest,
  );
  db.prepare("INSERT INTO genesis_projection_outbox VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "genesis:129",
    "pending",
    payloadJson,
    payloadDigest,
    0,
    event.occurred_at,
    null,
    null,
    eventDigest,
  );
  db.close();
}

function readPlanStatus(root: string): string {
  const db = openPlanLedger({ repoRoot: root });
  try {
    return String(db.prepare("SELECT status FROM genesis_projection_outbox").get()?.status);
  } finally {
    db.close();
  }
}

function readHarnessEvents(root: string): string[] {
  const db = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
  try {
    return db
      .prepare("SELECT event_json FROM forward_escape_projection_events ORDER BY sequence")
      .all()
      .map((row) => String((JSON.parse(String(row.event_json)) as { type: string }).type));
  } finally {
    db.close();
  }
}

function projectionPort(
  body: string,
  create: ForwardEscapeIssueAdoptionPort["createOrGetMetadataComment"],
): ForwardEscapeIssueAdoptionPort {
  return {
    observeIssue: () => ({
      repository: "owner/repository",
      issue_number: 129,
      node_id: "I_129",
      url: "https://github.com/owner/repository/issues/129",
      body,
      body_digest: sha(body),
      observed_revision: "etag-129",
    }),
    createOrGetMetadataComment: create,
  };
}

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

function setup(
  pending: readonly GenesisProjectionOutboxEntry[],
  dispatch: GenesisProjectionDispatchPort["dispatch"],
) {
  const markProjected = vi.fn();
  const markRecoveryRequired = vi.fn();
  const store: GenesisProjectionOutboxStore = {
    pending: vi.fn(() => pending),
    findPending: vi.fn((commandId) => pending.find((entry) => entry.commandId === commandId)),
    claimPending: vi.fn(() =>
      pending.map((entry) => ({
        ...entry,
        ownerToken: "worker:test",
        claimExpiresAt: "2026-07-22T07:01:30.000Z",
        claimGeneration: 1,
      })),
    ),
    claimCommand: vi.fn((commandId) => {
      const entry = pending.find((candidate) => candidate.commandId === commandId);
      return entry
        ? {
            ...entry,
            ownerToken: "worker:test",
            claimExpiresAt: "2026-07-22T07:01:30.000Z",
            claimGeneration: 1,
          }
        : undefined;
    }),
    commandState: vi.fn(() => "missing" as const),
    markProjected,
    markRecoveryRequired,
    renewClaim: vi.fn(() => 2),
  };
  const projection: GenesisProjectionDispatchPort = { dispatch: vi.fn(dispatch) };
  return {
    store,
    projection,
    dispatcher: new GenesisProjectionDispatcher({
      outbox: store,
      projection,
      now: () => "2026-07-22T07:01:00.000Z",
      ownerToken: () => "worker:test",
      remoteOperationBudgetMs: 15_000,
    }),
  };
}
