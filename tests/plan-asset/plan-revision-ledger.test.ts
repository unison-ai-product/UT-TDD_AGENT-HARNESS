import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  type AppendPlanRevisionInput,
  PlanRevisionLedgerTransaction,
} from "../../src/plan-asset/ledger/plan-revision-ledger.js";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../../src/state-db/index.js";

const opened: ReturnType<typeof openHarnessDb>[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("PLAN revision ledger transaction", () => {
  it("U-PA-REV-001: adopt済みassetへN+1 revisionとreceiptをatomic appendする", () => {
    const { db, ledger } = fixture();
    const result = ledger.append(revision());

    expect(result).toMatchObject({ ok: true, replayed: false, revision: 2 });
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_revisions").get()?.n)).toBe(2);
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_admission_events").get()?.n)).toBe(1);
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_admission_receipts").get()?.n)).toBe(
      1,
    );
    expect(db.prepare("SELECT * FROM append_command_receipts").get()).toMatchObject({
      command_type: "plan.revise",
      subject_key: "plan:adopted:2",
      plan_revision: 2,
      result_kind: "admission_certificate",
      result_ref: "certificate:revise-1",
    });
  });

  it("U-PA-REV-002: active aliasをplanIdとassetへ一意束縛する", () => {
    const { db, ledger } = fixture();

    expect(ledger.append(revision({ planId: "PLAN-L4-999" }))).toEqual({
      ok: false,
      ruleId: "plan-revision-alias-binding-invalid",
    });
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_revisions").get()?.n)).toBe(1);
  });

  it("U-PA-REV-003: stale base revisionとbase digest差分をfail-closeする", () => {
    const { db, ledger } = fixture();

    expect(ledger.append(revision({ baseRevision: 0 }))).toEqual({
      ok: false,
      ruleId: "plan-revision-input-invalid",
    });
    expect(ledger.append(revision({ basePayloadDigest: sha("wrong") }))).toEqual({
      ok: false,
      ruleId: "plan-revision-base-digest-mismatch",
    });
    expect(ledger.append(revision()).ok).toBe(true);
    expect(ledger.append(revision({ commandId: "command:revise-2" }))).toEqual({
      ok: false,
      ruleId: "plan-revision-stale",
    });
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_revisions").get()?.n)).toBe(2);
  });

  it("U-PA-REV-004: 同一command+payloadを再演し、payload差分をconflictにする", () => {
    const { db, ledger } = fixture();
    const input = revision();
    const first = ledger.append(input);

    expect(ledger.append(input)).toEqual(first.ok ? { ...first, replayed: true } : first);
    expect(ledger.append({ ...input, reason: "different" })).toEqual({
      ok: false,
      ruleId: "plan-revision-command-conflict",
    });
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_revisions").get()?.n)).toBe(2);
  });

  it("U-PA-REV-005: prepared callback failureで全write setをrollbackする", () => {
    const { db, ledger } = fixture();

    expect(() =>
      ledger.transact(revision(), () => {
        throw new Error("publish-failed");
      }),
    ).toThrow("publish-failed");
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_revisions").get()?.n)).toBe(1);
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM append_command_receipts").get()?.n)).toBe(
      0,
    );
    expect(Number(db.prepare("SELECT COUNT(*) AS n FROM plan_admission_events").get()?.n)).toBe(0);
  });
});

function fixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 4 });
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    "plan:adopted",
    "2026-07-15T00:00:00.000Z",
    "a".repeat(40),
    "legacy-adopt-v1",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "plan:adopted",
    1,
    '{"title":"v1"}',
    sha('{"title":"v1"}'),
    sha("body-v1"),
    "docs/plans/PLAN-L4-31.md",
    "a".repeat(40),
    "migration",
    "adopt",
    "2026-07-15T00:00:00.000Z",
  );
  db.prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "alias:plan:adopted:1",
    "plan:adopted",
    1,
    "command:adopt-alias",
    sha("adopt-alias-command"),
    "assigned",
    "PLAN-L4-31",
    1,
    "adopt",
    "2026-07-15T00:00:00.000Z",
    sha("alias-event"),
  );
  db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
    "alias-current:plan:adopted",
    "plan:adopted",
    "PLAN-L4-31",
    1,
    null,
    sha("alias-event"),
  );
  return { db, ledger: new PlanRevisionLedgerTransaction(db) };
}

function revision(overrides: Partial<AppendPlanRevisionInput> = {}): AppendPlanRevisionInput {
  return {
    commandId: "command:revise-1",
    assetId: "plan:adopted",
    planId: "PLAN-L4-31",
    baseRevision: 1,
    basePayloadDigest: sha('{"title":"v1"}'),
    canonicalPayloadJson: '{"title":"v2"}',
    bodyDigest: sha("body-v2"),
    sourcePath: "docs/plans/PLAN-L4-31.md",
    sourceCommit: "b".repeat(40),
    actor: "codex",
    reason: "redesign",
    routeTupleDigest: sha("redesign|forward_merge"),
    certificateId: "certificate:revise-1",
    occurredAt: "2026-07-17T00:00:00.000Z",
    ...overrides,
  };
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
