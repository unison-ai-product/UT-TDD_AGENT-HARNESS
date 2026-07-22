import { describe, expect, it, vi } from "vitest";
import {
  GenesisProjectionDispatcher,
  type GenesisProjectionDispatchPort,
  runNodeGenesisProjectionDispatcher,
} from "../../src/plan-asset/application/genesis-projection-dispatcher";
import type {
  GenesisProjectionOutboxEntry,
  GenesisProjectionOutboxStore,
} from "../../src/plan-asset/ledger/genesis-projection-outbox";

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
      "2026-07-22T07:01:00.000Z",
    );
    expect(fixture.store.markProjected).toHaveBeenNthCalledWith(
      2,
      "genesis:129:second",
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
      "issue-observe-failed",
      "2026-07-22T07:01:00.000Z",
    );
    expect(fixture.store.markRecoveryRequired).toHaveBeenNthCalledWith(
      2,
      "genesis:129:second",
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
      "genesis-adoption-projection-not-durable",
      "2026-07-22T07:01:00.000Z",
    );
  });

  it("U-GEN-020: Node resourceを成功・失敗の両方でcloseする", () => {
    const close = vi.fn();
    const dispatcher = {
      dispatchPending: vi.fn(() => ({ scanned: 0, projected: 0, recoveryRequired: 0 })),
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
        },
        close: failedClose,
      })),
    ).toThrow("scan-failed");
    expect(failedClose).toHaveBeenCalledOnce();
  });
});

function setup(
  pending: readonly GenesisProjectionOutboxEntry[],
  dispatch: GenesisProjectionDispatchPort["dispatch"],
) {
  const store: GenesisProjectionOutboxStore = {
    pending: vi.fn(() => pending),
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
    ),
  };
}
