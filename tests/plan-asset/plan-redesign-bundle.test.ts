import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  PlanRedesignBundleCoordinator,
  type RedesignBundleInput,
} from "../../src/plan-asset/ledger/plan-redesign-bundle.js";
import { ledgerRowDigest, migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../../src/state-db/index.js";

const opened: ReturnType<typeof openHarnessDb>[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("Redesign bundle coordinator", () => {
  it("U-PA-REDESIGN-001: replacementとorigin correctionを一つのtransactionで確定する", () => {
    const { db, coordinator } = fixture();
    const published: string[] = [];
    const result = coordinator.transact(bundle(), (prepared) => {
      published.push(prepared.replacement.assetId, prepared.origin.assetId);
    });

    expect(result).toMatchObject({ ok: true, replayed: false });
    expect(published).toEqual(["plan:replacement", "plan:origin"]);
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(4);
    expect(Number(db.prepare("SELECT COUNT(*) n FROM append_command_receipts").get()?.n)).toBe(2);
  });

  it("U-PA-REDESIGN-002: 片肺publish faultは両revisionをrollbackする", () => {
    const { db, coordinator } = fixture();

    expect(() =>
      coordinator.transact(bundle(), () => {
        throw new Error("second-artifact-publish-failed");
      }),
    ).toThrow("second-artifact-publish-failed");
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(2);
    expect(Number(db.prepare("SELECT COUNT(*) n FROM append_command_receipts").get()?.n)).toBe(0);
  });

  it("U-PA-REDESIGN-003: replayは両bindingが揃う場合だけ成功し、片肺改ざんを拒否する", () => {
    const { db, coordinator } = fixture();
    expect(coordinator.transact(bundle(), () => undefined)).toMatchObject({ ok: true });
    expect(coordinator.transact(bundle(), () => undefined)).toMatchObject({
      ok: true,
      replayed: true,
    });
    for (const row of db
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE ?")
      .all("%UPDATE ON append_command_receipts%")) {
      db.exec(`DROP TRIGGER ${String(row.name)}`);
    }
    db.prepare("UPDATE append_command_receipts SET result_ref = ? WHERE command_id = ?").run(
      "tampered",
      "redesign:98:origin",
    );
    expect(coordinator.transact(bundle(), () => undefined)).toEqual({
      ok: false,
      ruleId: "plan-revision-receipt-binding-invalid",
    });
  });

  it.each([
    ["stale origin", { origin: { baseRevision: 0 } }, "plan-revision-input-invalid"],
    [
      "supersedes欠落",
      { replacementPayload: '{"status":"draft"}' },
      "plan-redesign-bundle-supersedes-missing",
    ],
    [
      "back-reference欠落",
      { originSource: "origin correction only" },
      "plan-redesign-bundle-origin-back-reference-missing",
    ],
  ])("U-PA-REDESIGN-004: %sをwrite前にfail-closeする", (_name, change, ruleId) => {
    const { db, coordinator } = fixture();
    expect(coordinator.transact(bundle(change), () => undefined)).toEqual({ ok: false, ruleId });
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(2);
  });
});

function fixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 6 });
  seed(db, "plan:origin", "PLAN-L4-31");
  seed(db, "plan:replacement", "PLAN-L6-88");
  return { db, coordinator: new PlanRedesignBundleCoordinator(db) };
}

function seed(db: ReturnType<typeof openHarnessDb>, assetId: string, planId: string): void {
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    assetId,
    "2026-07-20T00:00:00.000Z",
    "a".repeat(40),
    "legacy-adopt-v1",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    assetId,
    1,
    '{"status":"draft"}',
    sha('{"status":"draft"}'),
    sha("body-v1"),
    `docs/plans/${planId}.md`,
    "a".repeat(40),
    "migration",
    "adopt",
    "2026-07-20T00:00:00.000Z",
  );
  const event = {
    alias_event_id: `alias:${assetId}:1`,
    asset_id: assetId,
    sequence: 1,
    command_id: `adopt:${assetId}`,
    command_payload_digest: sha(`adopt:${assetId}`),
    event_kind: "assigned",
    alias: planId,
    revision: 1,
    reason: "adopt",
    occurred_at: "2026-07-20T00:00:00.000Z",
  };
  const digest = ledgerRowDigest(event, "event_digest");
  db.prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(event),
    digest,
  );
  db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
    `alias-current:${assetId}`,
    assetId,
    planId,
    1,
    null,
    digest,
  );
}

function bundle(change: Record<string, unknown> = {}): RedesignBundleInput {
  const replacementPayload = String(
    change.replacementPayload ?? '{"status":"draft","supersedes":["PLAN-L4-31"]}',
  );
  const replacementSource = "PLAN-L6-88 replacement supersedes PLAN-L4-31";
  const originSource = String(change.originSource ?? "訂正: PLAN-L6-88 が後継として置換する。");
  const common = {
    baseRevision: 1,
    basePayloadDigest: sha('{"status":"draft"}'),
    bodyDigest: sha("body-v2"),
    sourceCommit: "b".repeat(40),
    actor: "codex",
    reason: "redesign",
    routeTupleDigest: sha("redesign|forward_merge"),
    occurredAt: "2026-07-21T00:00:00.000Z",
  };
  return {
    commandId: "redesign:98",
    replacement: {
      ...common,
      commandId: "redesign:98:replacement",
      assetId: "plan:replacement",
      planId: "PLAN-L6-88",
      canonicalPayloadJson: replacementPayload,
      contentDigest: sha(replacementSource),
      sourceContent: replacementSource,
      sourcePath: "docs/plans/PLAN-L6-88.md",
      certificateId: "certificate:replacement",
    },
    origin: {
      ...common,
      ...(change.origin as object),
      commandId: "redesign:98:origin",
      assetId: "plan:origin",
      planId: "PLAN-L4-31",
      canonicalPayloadJson: '{"status":"draft"}',
      contentDigest: sha(originSource),
      sourceContent: originSource,
      sourcePath: "docs/plans/PLAN-L4-31.md",
      certificateId: "certificate:origin",
    },
  };
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
