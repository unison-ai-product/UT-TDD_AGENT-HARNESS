import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { linkSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { NodePlanAuthoringRecoveryRunner } from "../src/plan-admission/node-plan-authoring-recovery-runner.js";
import { AuthoringCommandGroupJournal } from "../src/plan-asset/ledger/authoring-command-group.js";
import { migratePlanLedger } from "../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../src/state-db/index.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("NodePlanAuthoringRecoveryRunner", () => {
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

  it("dry-runを既定にし、digest+fence再照合後にroll-forwardを実行する", () => {
    const fixture = recoveryFixture();
    const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "roll_forward",
        execute: false,
      }),
    ).toMatchObject({ dry_run: true });
    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "roll_forward",
        execute: true,
      }),
    ).toThrow("plan-recovery-assessment-required");
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "roll_forward",
        expectedAssessmentDigest: String(status.assessment_digest),
        execute: true,
      }),
    ).toEqual({ state: "committed", strategy: "roll_forward", dry_run: false });
    expect(fixture.runner.status(fixture.groupId)).toMatchObject({
      state: "committed",
      exitCode: 0,
    });
  });

  it("FS mutation途中kill後もSQLite lockが解放されfresh connectionで再開できる", () => {
    const fixture = recoveryFixture();
    const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    const executorUrl = pathToFileURL(
      join(process.cwd(), "src/plan-admission/node-plan-authoring-recovery-executor.ts"),
    ).href;
    const dbUrl = pathToFileURL(join(process.cwd(), "src/state-db/index.ts")).href;
    const command = {
      commandId: fixture.groupId,
      strategy: "roll_forward",
      expectedAssessmentDigest: status.assessment_digest,
      expectedFencingToken: status.fencing_token,
    };
    const script = `
      import { NodePlanAuthoringRecoveryExecutor } from ${JSON.stringify(executorUrl)};
      import { openHarnessDb } from ${JSON.stringify(dbUrl)};
      const db = openHarnessDb(${JSON.stringify(fixture.dbPath)});
      new NodePlanAuthoringRecoveryExecutor(${JSON.stringify(fixture.root)}, () => process.exit(86)).execute(db, ${JSON.stringify(command)});
    `;
    expect(spawnSync(process.execPath, ["-e", script], { encoding: "utf8" }).status).toBe(86);
    expect(fixture.runner.status(fixture.groupId)).toMatchObject({
      state: "recovery_required",
      exitCode: 2,
    });
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "roll_forward",
        expectedAssessmentDigest: String(status.assessment_digest),
        execute: true,
      }),
    ).toMatchObject({ state: "committed" });
  });
});

function recoveryFixture() {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-recovery-runner-"));
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
  expect(() =>
    new AuthoringCommandGroupJournal(db).execute(input, {
      publish() {
        throw new Error("crash");
      },
      acknowledge() {},
    }),
  ).toThrow("crash");
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
