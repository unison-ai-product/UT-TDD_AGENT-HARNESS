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
  it("U-GEN-017: restart後にpending/recovery_requiredを走査しprojected終端へ収束する", () => {
    const fixture = setup(entries, () => ({ durable: true, state: "projected" }));

    expect(fixture.dispatcher.dispatchPending()).toEqual({
      scanned: 2,
      projected: 2,
      recoveryRequired: 0,
    });
    expect(fixture.projection.dispatch).toHaveBeenCalledTimes(2);
    expect(fixture.store.markProjected).toHaveBeenNthCalledWith(
      1,
      "genesis:129:first",
      "worker:test",
      "2026-07-22T07:01:00.000Z",
    );
    expect(fixture.store.markProjected).toHaveBeenNthCalledWith(
      2,
      "genesis:129:second",
      "worker:test",
      "2026-07-22T07:01:00.000Z",
    );
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
    });
    expect(fixture.projection.dispatch).toHaveBeenCalledTimes(2);
    expect(fixture.store.markRecoveryRequired).toHaveBeenNthCalledWith(
      1,
      "genesis:129:first",
      "worker:test",
      "issue-observe-failed",
      "2026-07-22T07:01:00.000Z",
    );
    expect(fixture.store.markRecoveryRequired).toHaveBeenNthCalledWith(
      2,
      "genesis:129:second",
      "worker:test",
      "genesis-adoption-projection-recovery-required",
      "2026-07-22T07:01:00.000Z",
    );
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
    });
    expect(fixture.store.markProjected).not.toHaveBeenCalled();
    expect(fixture.store.markRecoveryRequired).toHaveBeenCalledWith(
      "genesis:129:first",
      "worker:test",
      "genesis-adoption-projection-not-durable",
      "2026-07-22T07:01:00.000Z",
    );
  });

  it("U-GEN-023: CLIは指定commandだけを投影し無関係なpendingを処理しない", () => {
    const fixture = setup(entries, () => ({ durable: true, state: "projected" }));

    expect(fixture.dispatcher.dispatchCommand("genesis:129:second")).toEqual({
      scanned: 1,
      projected: 1,
      recoveryRequired: 0,
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
      dispatchPending: vi.fn(() => ({ scanned: 0, projected: 0, recoveryRequired: 0 })),
      dispatchCommand: vi.fn(() => ({ scanned: 0, projected: 0, recoveryRequired: 0 })),
    };
    expect(runNodeGenesisProjectionDispatcher(() => ({ dispatcher, close }))).toEqual({
      scanned: 0,
      projected: 0,
      recoveryRequired: 0,
    });
    expect(close).toHaveBeenCalledOnce();

    const failedClose = vi.fn();
    expect(() =>
      runNodeGenesisProjectionDispatcher(() => ({
        dispatcher: {
          dispatchPending: () => {
            throw new Error("scan-failed");
          },
          dispatchCommand: () => ({ scanned: 0, projected: 0, recoveryRequired: 0 }),
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

    let resource = openNodeGenesisProjectionDispatcher(root, "owner/repository", port);
    expect(resource.dispatcher.dispatchCommand("genesis:129")).toEqual({
      scanned: 1,
      projected: 0,
      recoveryRequired: 1,
    });
    resource.close();
    expect(readPlanStatus(root)).toBe("recovery_required");
    expect(readHarnessEvents(root)).toEqual(["IssueAdoptionQueued"]);

    resource = openNodeGenesisProjectionDispatcher(root, "owner/repository", port);
    expect(resource.dispatcher.dispatchCommand("genesis:129")).toEqual({
      scanned: 1,
      projected: 1,
      recoveryRequired: 0,
    });
    resource.close();
    expect(readPlanStatus(root)).toBe("projected");
    expect(readHarnessEvents(root)).toEqual(["IssueAdoptionQueued", "IssueAdopted"]);
    expect(defaultHarnessDbPath(root)).not.toBe(
      join(root, ".ut-tdd", "ledger", "harness-ledger.db"),
    );
    removeTestTree(root);
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
    const resource = openNodeGenesisProjectionDispatcher(
      root,
      "owner/repository",
      projectionPort("# issue\n", () => ({ ok: false, reason: "unused" })),
      {
        openPlanDb: () => planDb,
        openHarnessDb: () => harnessDb,
        migrateHarnessDb: vi.fn(),
      },
    );

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
  const store: GenesisProjectionOutboxStore = {
    pending: vi.fn(() => pending),
    findPending: vi.fn((commandId) => pending.find((entry) => entry.commandId === commandId)),
    claimPending: vi.fn(() =>
      pending.map((entry) => ({
        ...entry,
        ownerToken: "worker:test",
        claimExpiresAt: "2026-07-22T07:01:30.000Z",
      })),
    ),
    claimCommand: vi.fn((commandId) => {
      const entry = pending.find((candidate) => candidate.commandId === commandId);
      return entry
        ? {
            ...entry,
            ownerToken: "worker:test",
            claimExpiresAt: "2026-07-22T07:01:30.000Z",
          }
        : undefined;
    }),
    markProjected: vi.fn(),
    markRecoveryRequired: vi.fn(),
  };
  const projection: GenesisProjectionDispatchPort = { dispatch: vi.fn(dispatch) };
  return {
    store,
    projection,
    dispatcher: new GenesisProjectionDispatcher(
      store,
      projection,
      () => "2026-07-22T07:01:00.000Z",
      () => "worker:test",
    ),
  };
}
