import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type AuthoringArtifactPublisher,
  AuthoringCommandGroupJournal,
} from "../../src/plan-asset/ledger/authoring-command-group.js";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.js";

const opened: HarnessDb[] = [];
const paths: string[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
  for (const path of paths.splice(0)) rmSync(path, { force: true });
});

describe("authoring command group durable journal", () => {
  it("U-PA-GROUP-001: N成果物を決定順でpublishし、完全replayでは副作用を再送しない", () => {
    const db = memoryDb();
    const calls: string[] = [];
    const journal = new AuthoringCommandGroupJournal(db);
    const publisher = recordingPublisher(calls);

    expect(journal.execute(group(), publisher)).toEqual({
      ok: true,
      replayed: false,
      publishedMemberIds: ["design", "plan", "test"],
    });
    expect(journal.execute(group(), publisher)).toMatchObject({ ok: true, replayed: true });
    expect(calls).toEqual(["design", "plan", "test"]);
  });

  it("U-PA-GROUP-002: member途中faultをrecovery_requiredへ記録し、再開時は完了memberをskipする", () => {
    const db = memoryDb();
    const calls: string[] = [];
    let fail = true;
    const publisher: AuthoringArtifactPublisher = {
      publish(member) {
        calls.push(member.memberId);
        if (member.memberId === "plan" && fail) {
          fail = false;
          throw new Error("disk-full");
        }
        return { receiptDigest: sha(`${member.groupId}:${member.memberId}`) };
      },
      acknowledge() {},
    };
    const journal = new AuthoringCommandGroupJournal(db);
    expect(() => journal.execute(group(), publisher)).toThrow("disk-full");
    expect(
      db
        .prepare("SELECT event_kind FROM authoring_command_group_phase_events ORDER BY sequence")
        .all(),
    ).toEqual([
      { event_kind: "prepared" },
      { event_kind: "member_started" },
      { event_kind: "member_published" },
      { event_kind: "member_started" },
      { event_kind: "recovery_required" },
    ]);
    expect(journal.execute(group(), publisher)).toMatchObject({ ok: true, replayed: true });
    expect(calls).toEqual(["design", "plan", "plan", "test"]);
  });

  it("U-PA-GROUP-003: process close/reopen後もdurable phaseから再開する", () => {
    const path = dbPath();
    let db = diskDb(path);
    let first = true;
    expect(() =>
      new AuthoringCommandGroupJournal(db).execute(group(), {
        publish(member) {
          if (member.memberId === "plan" && first) {
            first = false;
            throw new Error("process-crash-boundary");
          }
          return { receiptDigest: sha(member.memberId) };
        },
        acknowledge() {},
      }),
    ).toThrow("process-crash-boundary");
    db.close();
    opened.splice(opened.indexOf(db), 1);

    db = diskDb(path);
    expect(
      new AuthoringCommandGroupJournal(db).execute(group(), {
        publish: (member) => ({ receiptDigest: sha(member.memberId) }),
        acknowledge() {},
      }),
    ).toMatchObject({ ok: true, replayed: true });
    expect(
      db
        .prepare(
          "SELECT event_kind FROM authoring_command_group_phase_events ORDER BY sequence DESC LIMIT 1",
        )
        .get(),
    ).toEqual({ event_kind: "committed" });
  });

  it("U-PA-GROUP-004: payload/member replay差替えとdigest再計算改ざんをfail-closeする", () => {
    const db = memoryDb();
    const journal = new AuthoringCommandGroupJournal(db);
    journal.execute(group(), recordingPublisher([]));
    expect(
      journal.execute(
        { ...group(), commandPayloadDigest: sha("different") },
        recordingPublisher([]),
      ),
    ).toEqual({ ok: false, ruleId: "authoring-command-group-replay-binding-invalid" });

    db.exec("DROP TRIGGER trg_authoring_command_group_members_no_update");
    db.exec(
      "UPDATE authoring_command_group_members SET artifact_path = 'tampered.md' WHERE member_id = 'plan'",
    );
    expect(journal.execute(group(), recordingPublisher([]))).toEqual({
      ok: false,
      ruleId: "authoring-command-group-replay-binding-invalid",
    });
    expect(migratePlanLedger(db)).toEqual({ ok: false, ruleId: "plan-ledger-unavailable" });
  });
});

function group() {
  return {
    groupId: "redesign:98:bundle",
    commandPayloadDigest: sha("redesign-command"),
    occurredAt: "2026-07-21T04:00:00.000Z",
    members: [
      {
        memberId: "test",
        artifactPath: "docs/test-design/test.md",
        contentDigest: sha("test"),
        expectedPreimage: { kind: "absent" },
      },
      {
        memberId: "plan",
        artifactPath: "docs/plans/plan.md",
        contentDigest: sha("plan"),
        expectedPreimage: { kind: "absent" },
      },
      {
        memberId: "design",
        artifactPath: "docs/design/design.md",
        contentDigest: sha("design"),
        expectedPreimage: { kind: "absent" },
      },
    ],
  } as const;
}

function recordingPublisher(calls: string[]): AuthoringArtifactPublisher {
  return {
    publish(member) {
      calls.push(member.memberId);
      return { receiptDigest: sha(`${member.groupId}:${member.memberId}`) };
    },
    acknowledge() {},
  };
}

function memoryDb(): HarnessDb {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
  return db;
}

function dbPath(): string {
  const dir = join(process.cwd(), ".ut-tdd");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `authoring-group-${randomUUID()}.db`);
  paths.push(path);
  return path;
}

function diskDb(path: string): HarnessDb {
  const db = openHarnessDb(path);
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
  return db;
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
