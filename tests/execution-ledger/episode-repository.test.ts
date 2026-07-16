import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type {
  ClassifyEscapeCommand,
  RequestForwardEscape,
  RequestIssueProjectionCommand,
  SelectDriveModelCommand,
} from "../../src/execution-ledger/domain/execution-episode.js";
import { SqliteExecutionEpisodeRepository } from "../../src/execution-ledger/adapters/sqlite/episode-repository.js";
import { ledgerSchemaDdl, migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { openHarnessDb, type HarnessDb } from "../../src/state-db/index.js";

const SHA = "a".repeat(40);
const DIGEST = "b".repeat(64);
const CUSTODY = { runtime: "codex", model: "test-model" } as const;
const TABLES = [
  "execution_episodes",
  "execution_episode_events",
  "execution_episode_projection",
  "append_command_receipts",
  "drive_model_selections",
  "github_projection_outbox",
] as const;

describe("SqliteExecutionEpisodeRepository (PLAN-L7-436)", () => {
  it("U-EXEP-008: E0 root/event/projection/receiptを1 transactionで作成しoutboxは作らない", () => {
    withLedger((db) => {
      const repository = new SqliteExecutionEpisodeRepository(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({
        ok: true,
        status: "created",
        eventIds: [expect.stringMatching(/^event:/)],
        outboxIds: [],
        snapshot: { state: "E0", nextLegalCommands: ["classify_escape"] },
      });
      expect(counts(db)).toEqual({
        append_command_receipts: 1,
        drive_model_selections: 0,
        execution_episode_events: 1,
        execution_episode_projection: 1,
        execution_episodes: 1,
        github_projection_outbox: 0,
      });
    });
  });

  it("U-EXEP-005: same command/payloadをwrite 0でreplayし異payloadを拒否する", () => {
    withLedger((db) => {
      const repository = new SqliteExecutionEpisodeRepository(db);
      const created = repository.request(request(), CUSTODY);
      const before = counts(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({
        ok: true,
        status: "replayed",
        eventIds: created.ok ? created.eventIds : [],
      });
      expect(counts(db)).toEqual(before);
      expect(repository.request(request({ escapeReason: "changed after retry" }), CUSTODY)).toMatchObject({
        ok: false,
        violations: [{ ruleId: "episode-command-payload-conflict" }],
      });
      expect(counts(db)).toEqual(before);
    });
  });

  it.each(["episode-root", "episode-event", "episode-projection", "receipt"] as const)(
    "U-EXEP-008: %s faultで4面を全rollbackする",
    (boundary) => {
      withLedger((db) => {
        const repository = new SqliteExecutionEpisodeRepository(db, undefined, {
          after(current) {
            if (current === boundary) throw new Error(`fault:${boundary}`);
          },
        });
        expect(() => repository.request(request(), CUSTODY)).toThrow(`fault:${boundary}`);
        expect(counts(db)).toEqual({
          append_command_receipts: 0,
          drive_model_selections: 0,
          execution_episode_events: 0,
          execution_episode_projection: 0,
          execution_episodes: 0,
          github_projection_outbox: 0,
        });
      });
    },
  );

  it("U-EXEP-006: replay前に保存済みrow全体を検証しDB改変を成功として隠さない", () => {
    withLedger((db) => {
      const repository = new SqliteExecutionEpisodeRepository(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({ ok: true, status: "created" });
      db.exec("DROP TRIGGER trg_execution_episode_events_no_update");
      db.prepare("UPDATE execution_episode_events SET event_state = 'E1'").run();
      const trigger = ledgerSchemaDdl().find((sql) =>
        sql.includes("trg_execution_episode_events_no_update"),
      );
      if (!trigger) throw new Error("event update trigger DDL missing");
      db.exec(trigger);

      expect(repository.request(request(), CUSTODY)).toMatchObject({
        ok: false,
        violations: [{ ruleId: "episode-ledger-integrity-invalid" }],
      });
    });
  });

  it("U-EXEP-008: E1-E3をevent/selection/outbox/projection/receiptの単一transactionで追記する", () => {
    withLedger((db) => {
      const repository = new SqliteExecutionEpisodeRepository(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({ ok: true });

      expect(repository.transition(classify(), CUSTODY)).toMatchObject({
        ok: true,
        status: "created",
        snapshot: { state: "E1", nextLegalCommands: ["select_drive_model"] },
      });
      expect(counts(db)).toMatchObject({
        append_command_receipts: 2,
        drive_model_selections: 0,
        execution_episode_events: 2,
        github_projection_outbox: 0,
      });

      expect(repository.transition(selectDrive(), CUSTODY)).toMatchObject({
        ok: true,
        status: "created",
        snapshot: { state: "E2", nextLegalCommands: ["request_issue_projection"] },
      });
      expect(counts(db)).toMatchObject({
        append_command_receipts: 3,
        drive_model_selections: 1,
        execution_episode_events: 3,
        github_projection_outbox: 0,
      });

      expect(repository.transition(requestIssue(), CUSTODY)).toMatchObject({
        ok: true,
        status: "created",
        outboxIds: [expect.stringMatching(/^outbox:/)],
        snapshot: { state: "E3", nextLegalCommands: ["confirm_issue_projection"] },
      });
      expect(counts(db)).toEqual({
        append_command_receipts: 4,
        drive_model_selections: 1,
        execution_episode_events: 4,
        execution_episode_projection: 1,
        execution_episodes: 1,
        github_projection_outbox: 1,
      });
      expect(
        db.prepare("SELECT event_sequence FROM execution_episode_events ORDER BY event_sequence").all(),
      ).toEqual([{ event_sequence: 0 }, { event_sequence: 1 }, { event_sequence: 2 }, { event_sequence: 3 }]);
    });
  });

  it("U-EXEP-005: E1 command再送をwrite 0でreplayし、異payloadを構造化拒否する", () => {
    withLedger((db) => {
      const repository = new SqliteExecutionEpisodeRepository(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({ ok: true });
      const created = repository.transition(classify(), CUSTODY);
      const before = counts(db);
      expect(repository.transition(classify(), CUSTODY)).toMatchObject({
        ok: true,
        status: "replayed",
        eventIds: created.ok ? created.eventIds : [],
      });
      expect(counts(db)).toEqual(before);
      expect(
        repository.transition(
          { ...classify(), classificationRuleRevision: "escape-classification:v2" },
          CUSTODY,
        ),
      ).toMatchObject({
        ok: false,
        violations: [{ ruleId: "episode-command-payload-conflict" }],
      });
      expect(counts(db)).toEqual(before);
    });
  });

  it("U-EXEP-006: E1追記後もE0 receipt replayを正規台帳として受理する", () => {
    withLedger((db) => {
      const repository = new SqliteExecutionEpisodeRepository(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({ ok: true });
      expect(repository.transition(classify(), CUSTODY)).toMatchObject({ ok: true });
      const before = counts(db);
      expect(repository.request(request(), CUSTODY)).toMatchObject({
        ok: true,
        status: "replayed",
      });
      expect(counts(db)).toEqual(before);
    });
  });
});

function transitionEnvelope<const TSequence extends 1 | 2 | 3>(sequence: TSequence) {
  return {
    commandId: `command:recovery-70:e${sequence}`,
    episodeId: "episode:recovery-70",
    expectedSequence: sequence,
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    occurredAt: `2026-07-16T08:3${sequence}:00.000Z`,
  };
}

function classify(): ClassifyEscapeCommand {
  return {
    type: "classify_escape",
    ...transitionEnvelope(1),
    escapeType: "reopened",
    classificationRuleRevision: "escape-classification:v1",
    verificationTarget: {
      kind: "assumption",
      assetId: "plan:doctor-singleton",
      revision: 1,
      statementDigest: DIGEST,
    },
  };
}

function selectDrive(): SelectDriveModelCommand {
  return {
    type: "select_drive_model",
    ...transitionEnvelope(2),
    model: "recovery",
    compatibilityResult: "compatible",
    rationaleDigest: DIGEST,
    selectionRevision: 1,
  };
}

function requestIssue(): RequestIssueProjectionCommand {
  return {
    type: "request_issue_projection",
    ...transitionEnvelope(3),
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    intentRevision: 1,
    labels: ["forward-escape", "drive:recovery"],
  };
}

function request(overrides: Partial<RequestForwardEscape> = {}): RequestForwardEscape {
  return {
    type: "request_forward_escape",
    commandId: "command:recovery-70",
    episodeId: "episode:recovery-70",
    recurrenceId: "recurrence:doctor-slo",
    routeMode: "recovery",
    escapeType: "reopened",
    escapeReason: "full doctor exceeds the Recovery release floor",
    routeSignal: "regression_dev",
    requestedDriveModel: "recovery",
    origin: {
      assetId: "plan:doctor-singleton",
      revision: 1,
      observedRevision: 1,
      layer: "L7",
      state: "accepted",
    },
    reentry: {
      assetId: "plan:doctor-scoped-execution",
      revision: 1,
      layer: "L7",
      state: "implementing",
      policyRevision: "policy:forward-v1",
    },
    issue: {
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      title: "Recovery: doctor full scope SLO",
      bodyDigest: DIGEST,
    },
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    occurredAt: "2026-07-16T08:30:00.000Z",
    ...overrides,
  };
}

function withLedger(run: (db: HarnessDb) => void): void {
  const db = openHarnessDb(":memory:");
  try {
    expect(migratePlanLedger(db)).toEqual({ ok: true, version: 5 });
    seedPlan(db, "plan:doctor-singleton");
    seedPlan(db, "plan:doctor-scoped-execution");
    run(db);
  } finally {
    db.close();
  }
}

function seedPlan(db: HarnessDb, assetId: string): void {
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    assetId,
    "2026-07-16T00:00:00.000Z",
    SHA,
    "sha256-v1",
  );
  const payload = "{}";
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    assetId,
    1,
    payload,
    createHash("sha256").update(payload).digest("hex"),
    DIGEST,
    "docs/plans/test.md",
    SHA,
    "test",
    "fixture",
    "2026-07-16T00:00:00.000Z",
  );
}

function counts(db: HarnessDb): Record<string, number> {
  return Object.fromEntries(
    TABLES.map((table) => [
      table,
      Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count ?? 0),
    ]),
  );
}
