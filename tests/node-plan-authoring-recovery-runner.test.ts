import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { linkSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { resolveBunBinary } from "../scripts/run-vitest-snapshot.js";
import { inspectAuthoringRecoveryDbEvidence } from "../src/plan-admission/authoring-recovery-db-evidence.js";
import { NodePlanAuthoringRecoveryRunner } from "../src/plan-admission/node-plan-authoring-recovery-runner.js";
import { AuthoringCommandGroupJournal } from "../src/plan-asset/ledger/authoring-command-group.js";
import { ledgerRowDigest, migratePlanLedger } from "../src/plan-asset/ledger/schema.js";
import type { HarnessDb } from "../src/state-db/index.js";
import { openHarnessDb } from "../src/state-db/index.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("NodePlanAuthoringRecoveryRunner", () => {
  it("件数だけ揃った異物DB証拠をcompleteに昇格しない", () => {
    const rows = {
      append_command_receipts: [
        { command_id: "group:origin", plan_asset_id: "asset:1", plan_revision: 1 },
        { command_id: "group:replacement", plan_asset_id: "asset:2", plan_revision: 1 },
      ],
      plan_admission_receipts: [
        { command_id: "group:origin", plan_asset_id: "asset:1", plan_revision: 1 },
        { command_id: "group:replacement", plan_asset_id: "asset:2", plan_revision: 1 },
      ],
      authoring_command_revision_bindings: [
        { asset_id: "asset:1", revision: 1, artifact_role: "origin" },
        { asset_id: "asset:2", revision: 1, artifact_role: "origin" },
      ],
    };
    const db = {
      prepare(sql: string) {
        const table = Object.keys(rows).find((name) => sql.includes(name));
        return {
          all: () => (table ? rows[table as keyof typeof rows] : []),
          get: () => ({}),
        };
      },
    } as unknown as HarnessDb;
    expect(() => inspectAuthoringRecoveryDbEvidence(db, "group")).toThrow(
      "plan-recovery-db-evidence-mismatch",
    );
  });

  it("statusをclean=0/unresolved=2/corrupt=3へ分類する", () => {
    const fixture = recoveryFixture();
    expect(fixture.runner.status("missing")).toMatchObject({ state: "corrupt", exitCode: 3 });
    expect(fixture.runner.status(fixture.groupId)).toMatchObject({
      state: "recovery_required",
      exitCode: 2,
    });
    expect(
      new NodePlanAuthoringRecoveryRunner(fixture.root, () => {
        throw new Error("ledger-corrupt");
      }).status(fixture.groupId),
    ).toMatchObject({ state: "corrupt", exitCode: 3, error: "ledger-corrupt" });
  });

  it("DB evidence 0件はdry-run後に全N rollbackする", () => {
    const fixture = recoveryFixture();
    const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        execute: false,
      }),
    ).toMatchObject({ dry_run: true });
    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        execute: true,
      }),
    ).toThrow("plan-recovery-assessment-required");
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(status.assessment_digest),
        execute: true,
      }),
    ).toEqual({ state: "rolled_back", strategy: "rollback", dry_run: false });
    expect(fixture.runner.status(fixture.groupId)).toMatchObject({
      state: "rolled_back",
      exitCode: 0,
    });
  });

  it("DB evidence 0件の偽committed terminalをcleanとして報告しない", () => {
    const fixture = recoveryFixture();
    const db = openHarnessDb(fixture.dbPath);
    const previous = db
      .prepare(
        "SELECT sequence, event_digest FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(fixture.groupId);
    const row = {
      phase_event_id: "phase:fake-terminal",
      group_id: fixture.groupId,
      sequence: Number(previous?.sequence) + 1,
      command_payload_digest: digest,
      event_kind: "committed",
      member_id: null,
      publish_receipt_digest: null,
      failure_reason: null,
      occurred_at: now,
      previous_event_digest: previous?.event_digest,
    };
    db.prepare(
      "INSERT INTO authoring_command_group_phase_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(row), ledgerRowDigest(row, "event_digest"));
    db.close();

    expect(fixture.runner.status(fixture.groupId)).toMatchObject({
      state: "corrupt",
      exitCode: 3,
      error: "plan-recovery-terminal-evidence-conflict",
    });
  });

  it("assessment 0件のkill状態をfresh statusが査定し、executor途中kill後も再開できる", () => {
    const fixture = recoveryFixture(true);
    const before = openHarnessDb(fixture.dbPath);
    expect(
      before.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()
        ?.count,
    ).toBe(0);
    before.close();
    const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(status).toMatchObject({ state: "prepared", exitCode: 2 });
    const executorUrl = pathToFileURL(
      join(process.cwd(), "src/plan-admission/node-plan-authoring-recovery-executor.ts"),
    ).href;
    const dbUrl = pathToFileURL(join(process.cwd(), "src/state-db/index.ts")).href;
    const command = {
      commandId: fixture.groupId,
      strategy: "rollback",
      expectedAssessmentDigest: status.assessment_digest,
      expectedFencingToken: status.fencing_token,
    };
    const script = `
      import { NodePlanAuthoringRecoveryExecutor } from ${JSON.stringify(executorUrl)};
      import { openHarnessDb } from ${JSON.stringify(dbUrl)};
      const db = openHarnessDb(${JSON.stringify(fixture.dbPath)});
      new NodePlanAuthoringRecoveryExecutor(${JSON.stringify(fixture.root)}, () => process.exit(86)).execute(db, ${JSON.stringify(command)});
    `;
    const interrupted = spawnSync(testBunBinary(), ["-e", script], { encoding: "utf8" });
    expect(interrupted.status, interrupted.error?.message ?? interrupted.stderr).toBe(86);
    const resumedStatus = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(resumedStatus).toMatchObject({
      state: "prepared",
      exitCode: 2,
    });
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(resumedStatus.assessment_digest),
        execute: true,
      }),
    ).toMatchObject({ state: "rolled_back" });
  });
});

function recoveryFixture(withoutAssessment = false) {
  const executionRoot = process.env.UT_TDD_TEST_EXECUTION_ROOT;
  if (!executionRoot) throw new Error("detached test execution root is required");
  const root = mkdtempSync(join(executionRoot, ".ut-tdd", "recovery-runner-"));
  roots.push(root);
  mkdirSync(join(root, ".ut-tdd"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  const dbPath = join(root, ".ut-tdd", "harness.db");
  const db = openHarnessDb(dbPath);
  migratePlanLedger(db);
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    "asset:1",
    now,
    "b".repeat(40),
    "test",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "asset:1",
    1,
    "{}",
    sha("{}"),
    digest,
    "docs/a.md",
    "b".repeat(40),
    "test",
    "test",
    now,
  );
  const groupId = "recovery:test";
  const memberId = "origin";
  const content = "postimage";
  const input = {
    groupId,
    commandPayloadDigest: digest,
    occurredAt: now,
    members: [
      {
        memberId,
        artifactPath: "docs/a.md",
        contentDigest: sha(content),
        expectedPreimage: { kind: "absent" as const },
      },
    ],
    operation: {
      repositoryIdentity: "owner/repo",
      baseCommit: "b".repeat(40),
      revisionBindings: [{ assetId: "asset:1", revision: 1, artifactRole: memberId }],
    },
  };
  const journal = new AuthoringCommandGroupJournal(db);
  if (withoutAssessment) {
    expect(journal.prepareWithinTransaction(input)).toMatchObject({ ok: true });
  } else {
    expect(() =>
      journal.execute(input, {
        publish() {
          throw new Error("crash");
        },
        acknowledge() {},
      }),
    ).toThrow("crash");
  }
  db.close();
  const target = join(root, "docs", "a.md");
  writeFileSync(target, content);
  const tokenId = `authoring-${sha(`${groupId}\0${memberId}`).slice(0, 32)}`;
  linkSync(target, join(root, `.ut-tdd-draft-${tokenId}-0-published.identity`));
  return {
    root,
    dbPath,
    groupId,
    runner: new NodePlanAuthoringRecoveryRunner(root, () => openHarnessDb(dbPath)),
  };
}

const digest = "a".repeat(64);
const now = "2026-07-21T00:00:00Z";
function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function testBunBinary(): string {
  const npmExecPath = process.env.npm_execpath;
  if (process.platform === "win32" && npmExecPath?.toLowerCase().endsWith("bunx.exe")) {
    return join(dirname(npmExecPath), "bun.exe");
  }
  return resolveBunBinary();
}
