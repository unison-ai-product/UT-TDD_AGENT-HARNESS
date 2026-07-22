import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { resolveBunBinary } from "../scripts/run-vitest-snapshot.js";
import { inspectAuthoringRecoveryDbEvidence } from "../src/plan-admission/authoring-recovery-db-evidence.js";
import { canonicalPlanContentDigest } from "../src/plan-admission/diff-fence.js";
import { NodePlanAuthoringRecoveryExecutor } from "../src/plan-admission/node-plan-authoring-recovery-executor.js";
import { NodePlanAuthoringRecoveryRunner } from "../src/plan-admission/node-plan-authoring-recovery-runner.js";
import { AuthoringCommandGroupJournal } from "../src/plan-asset/ledger/authoring-command-group.js";
import { deriveAuthoringOperationArtifact } from "../src/plan-asset/ledger/authoring-operation-provenance.js";
import { derivePlanRevisionDigests } from "../src/plan-asset/ledger/plan-revision-ledger.js";
import { ledgerRowDigest, migratePlanLedger } from "../src/plan-asset/ledger/schema.js";
import type { HarnessDb } from "../src/state-db/index.js";
import { openHarnessDb } from "../src/state-db/index.js";
import { removeTestTree } from "./support/temp-tree";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) removeTestTree(root);
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

  it("assessment後に後段member custodyを失っても全memberをmutationしない", () => {
    const fixture = recoveryFixture();
    const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    const origin = join(fixture.root, "docs", "a.md");
    const replacement = join(fixture.root, "docs", "b.md");
    writeFileSync(replacement, "foreign-custody");
    const paths = [
      origin,
      replacement,
      ...["origin", "replacement"].map((memberId) =>
        join(
          fixture.root,
          `.ut-tdd-draft-authoring-${sha(`${fixture.groupId}\0${memberId}`).slice(0, 32)}-0-published.identity`,
        ),
      ),
    ];
    const before = filesystemInventory(paths);

    const db = openHarnessDb(fixture.dbPath);
    expect(() =>
      new NodePlanAuthoringRecoveryExecutor(fixture.root).execute(db, {
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(status.assessment_digest),
        expectedFencingToken: String(status.fencing_token),
      }),
    ).toThrow("artifact rollback unexpected target: docs/b.md");
    db.close();
    expect(filesystemInventory(paths)).toEqual(before);
  });

  for (const strategy of ["roll_forward", "finalize"] as const) {
    it(`${strategy} assessment後の後段custody lossでも全memberをmutationしない`, () => {
      const fixture = recoveryFixture();
      const seeded = openHarnessDb(fixture.dbPath);
      seedCompleteEvidence(seeded, fixture.groupId);
      const artifacts = seeded
        .prepare("SELECT * FROM authoring_operation_artifacts WHERE group_id = ? ORDER BY ordinal")
        .all(fixture.groupId);
      seeded.close();
      const [origin, replacement] = artifacts;
      if (!origin || !replacement) throw new Error("two recovery artifacts required");
      const makeOriginRecoverable = () => {
        const target = join(fixture.root, String(origin.target_path));
        const publishedPin = join(fixture.root, String(origin.pin_path));
        const temporary = join(fixture.root, String(origin.temporary_path));
        const temporaryPin = publishedPin.replace("published.identity", "temporary.identity");
        rmSync(target);
        rmSync(publishedPin);
        writeFileSync(temporary, recoveryPlanSource);
        linkSync(temporary, temporaryPin);
      };
      if (strategy === "roll_forward") makeOriginRecoverable();
      const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
      expect(status.strategy).toBe(strategy);
      if (strategy === "finalize") makeOriginRecoverable();
      writeFileSync(join(fixture.root, String(replacement.target_path)), "foreign-custody");
      const paths = artifacts.flatMap((artifact) => {
        const pin = join(fixture.root, String(artifact.pin_path));
        return [
          join(fixture.root, String(artifact.target_path)),
          join(fixture.root, String(artifact.temporary_path)),
          join(fixture.root, String(artifact.rollback_path)),
          pin,
          pin.replace("published.identity", "temporary.identity"),
          pin.replace("published.identity", "rollback.identity"),
        ];
      });
      const before = filesystemInventory(paths);
      const db = openHarnessDb(fixture.dbPath);
      expect(() =>
        new NodePlanAuthoringRecoveryExecutor(fixture.root).execute(db, {
          commandId: fixture.groupId,
          strategy,
          expectedAssessmentDigest: String(status.assessment_digest),
          expectedFencingToken: String(status.fencing_token),
        }),
      ).toThrow();
      db.close();
      expect(filesystemInventory(paths)).toEqual(before);
    });
  }

  for (const strategy of ["rollback", "roll_forward", "finalize"] as const) {
    it(`${strategy} member間faultで後段custodyが変化しても全memberを補償復元する`, () => {
      const fixture = recoveryFixture();
      const seeded = openHarnessDb(fixture.dbPath);
      if (strategy !== "rollback") seedCompleteEvidence(seeded, fixture.groupId);
      const artifacts = seeded
        .prepare("SELECT * FROM authoring_operation_artifacts WHERE group_id = ? ORDER BY ordinal")
        .all(fixture.groupId);
      seeded.close();
      const [origin, replacement] = artifacts;
      if (!origin || !replacement) throw new Error("two recovery artifacts required");
      const makeOriginRecoverable = () => {
        const target = join(fixture.root, String(origin.target_path));
        const publishedPin = join(fixture.root, String(origin.pin_path));
        const temporary = join(fixture.root, String(origin.temporary_path));
        const temporaryPin = publishedPin.replace("published.identity", "temporary.identity");
        rmSync(target);
        rmSync(publishedPin);
        writeFileSync(temporary, recoveryPlanSource);
        linkSync(temporary, temporaryPin);
      };
      if (strategy === "roll_forward") makeOriginRecoverable();
      const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
      expect(status.strategy).toBe(strategy);
      if (strategy === "finalize") makeOriginRecoverable();
      const paths = artifacts.flatMap((artifact) => {
        const pin = join(fixture.root, String(artifact.pin_path));
        return [
          join(fixture.root, String(artifact.target_path)),
          join(fixture.root, String(artifact.temporary_path)),
          join(fixture.root, String(artifact.rollback_path)),
          pin,
          pin.replace("published.identity", "temporary.identity"),
          pin.replace("published.identity", "rollback.identity"),
        ];
      });
      const before = filesystemInventory(paths);
      let faults = 0;
      const db = openHarnessDb(fixture.dbPath);
      expect(() =>
        new NodePlanAuthoringRecoveryExecutor(fixture.root, () => {
          faults += 1;
          if (faults !== 1) return;
          writeFileSync(join(fixture.root, String(replacement.target_path)), "member-race");
          throw new Error("member-race");
        }).execute(db, {
          commandId: fixture.groupId,
          strategy,
          expectedAssessmentDigest: String(status.assessment_digest),
          expectedFencingToken: String(status.fencing_token),
        }),
      ).toThrow("member-race");
      db.close();
      expect(filesystemInventory(paths)).toEqual(before);
    });
  }

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
      error: "plan-recovery-command-corrupt",
    });
    expect(fixture.runner.list(true)).toContainEqual(
      expect.objectContaining({ command_id: fixture.groupId, state: "committed" }),
    );
  });

  it("破損した非terminal phase chainではassessmentもfilesystem mutationも行わない", () => {
    const fixture = recoveryFixture();
    const current = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    const db = openHarnessDb(fixture.dbPath);
    const beforeAssessmentCount = Number(
      db.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()?.count,
    );
    const previous = db
      .prepare(
        "SELECT sequence, event_digest FROM authoring_command_group_phase_events WHERE group_id = ? ORDER BY sequence DESC LIMIT 1",
      )
      .get(fixture.groupId);
    db.prepare(
      `INSERT INTO authoring_command_group_phase_events
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "phase:forged-nonterminal",
      fixture.groupId,
      Number(previous?.sequence) + 1,
      digest,
      "recovery_required",
      null,
      null,
      "forged",
      now,
      previous?.event_digest,
      "forged-event-digest",
    );
    db.close();
    const target = join(fixture.root, "docs", "a.md");
    const before = readFileSync(target, "utf8");

    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(current.assessment_digest),
        execute: true,
      }),
    ).toThrow("plan-recovery-command-corrupt");
    expect(readFileSync(target, "utf8")).toBe(before);
    const verified = openHarnessDb(fixture.dbPath);
    expect(
      Number(
        verified.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()
          ?.count,
      ),
    ).toBe(beforeAssessmentCount);
    verified.close();
  });

  it("partial DB evidenceはpublic runnerでcorruptとなり全memberを変更しない", () => {
    const fixture = recoveryFixture();
    const db = openHarnessDb(fixture.dbPath);
    seedCompleteEvidence(db, fixture.groupId);
    db.exec("DROP TRIGGER trg_plan_admission_receipts_no_delete");
    db.prepare("DELETE FROM plan_admission_receipts WHERE command_id = ?").run(
      `${fixture.groupId}:replacement`,
    );
    db.close();
    const origin = join(fixture.root, "docs", "a.md");
    const replacement = join(fixture.root, "docs", "b.md");
    const before = [readFileSync(origin, "utf8"), readFileSync(replacement, "utf8")];

    expect(fixture.runner.status(fixture.groupId)).toMatchObject({ state: "corrupt", exitCode: 3 });
    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: "stale",
        execute: true,
      }),
    ).toThrow();
    expect([readFileSync(origin, "utf8"), readFileSync(replacement, "utf8")]).toEqual(before);
  });

  it("event/admission/appendを共同再計算してもpublication sourceと異なるcontentを拒否する", () => {
    const fixture = recoveryFixture();
    const db = openHarnessDb(fixture.dbPath);
    seedCompleteEvidence(db, fixture.groupId);
    const forged = revisionEvidence(
      fixture.groupId,
      "origin",
      "asset:1",
      "docs/a.md",
      sha("forged-plan-content"),
    );
    const event = db
      .prepare("SELECT * FROM plan_admission_events WHERE command_id = ?")
      .get(`${fixture.groupId}:origin`) as Record<string, unknown>;
    const append = db
      .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
      .get(`${fixture.groupId}:origin`) as Record<string, unknown>;
    db.exec("DROP TRIGGER trg_plan_admission_events_no_update");
    db.exec("DROP TRIGGER trg_plan_admission_receipts_no_update");
    db.exec("DROP TRIGGER trg_append_command_receipts_no_update");
    const forgedEvent = {
      ...event,
      command_payload_digest: forged.derived.commandPayloadDigest,
      content_digest: forged.input.contentDigest,
      certificate_digest: forged.derived.certificateDigest,
    };
    db.prepare(
      `UPDATE plan_admission_events SET command_payload_digest = ?, content_digest = ?,
         certificate_digest = ?, event_digest = ? WHERE command_id = ?`,
    ).run(
      forged.derived.commandPayloadDigest,
      forged.input.contentDigest,
      forged.derived.certificateDigest,
      ledgerRowDigest(forgedEvent, "event_digest"),
      forged.input.commandId,
    );
    db.prepare(
      `UPDATE plan_admission_receipts SET command_payload_digest = ?, content_digest = ?,
         certificate_digest = ? WHERE command_id = ?`,
    ).run(
      forged.derived.commandPayloadDigest,
      forged.input.contentDigest,
      forged.derived.certificateDigest,
      forged.input.commandId,
    );
    const forgedAppend = {
      ...append,
      command_payload_digest: forged.derived.commandPayloadDigest,
    };
    db.prepare(
      "UPDATE append_command_receipts SET command_payload_digest = ?, receipt_digest = ? WHERE command_id = ?",
    ).run(
      forged.derived.commandPayloadDigest,
      ledgerRowDigest(forgedAppend, "receipt_digest"),
      forged.input.commandId,
    );

    expect(() => inspectAuthoringRecoveryDbEvidence(db, fixture.groupId, fixture.root)).toThrow(
      "plan-recovery-db-evidence-mismatch",
    );
    db.close();
  });

  it("自己整合digestへ差し替えた非canonical artifactでもassessmentとmutationを拒否する", () => {
    const fixture = recoveryFixture();
    const current = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    const db = openHarnessDb(fixture.dbPath);
    const beforeAssessmentCount = Number(
      db.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()?.count,
    );
    const artifact = db
      .prepare("SELECT * FROM authoring_operation_artifacts WHERE group_id = ?")
      .get(fixture.groupId) as Record<string, unknown>;
    for (const trigger of db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND sql LIKE '%authoring_operation_artifacts%' AND sql LIKE '%UPDATE%'",
      )
      .all())
      db.exec(`DROP TRIGGER ${String(trigger.name)}`);
    const forged: Record<string, unknown> = { ...artifact, target_path: "docs/decoy.md" };
    db.prepare(
      "UPDATE authoring_operation_artifacts SET target_path = ?, artifact_digest = ? WHERE operation_id = ? AND member_id = ?",
    ).run(
      forged.target_path,
      ledgerRowDigest(forged, "artifact_digest"),
      forged.operation_id,
      forged.member_id,
    );
    db.close();
    const target = join(fixture.root, "docs", "a.md");
    const decoy = join(fixture.root, "docs", "decoy.md");
    writeFileSync(decoy, "decoy");

    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(current.assessment_digest),
        execute: true,
      }),
    ).toThrow("plan-recovery-command-corrupt");
    expect(readFileSync(target, "utf8")).toBe(recoveryPlanSource);
    expect(readFileSync(decoy, "utf8")).toBe("decoy");
    const verified = openHarnessDb(fixture.dbPath);
    expect(
      Number(
        verified.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()
          ?.count,
      ),
    ).toBe(beforeAssessmentCount);
    verified.close();
  });

  it("member/artifact/headerをportable aliasへ共同改ざんしてもstatus/recover mutation 0で拒否する", () => {
    const fixture = recoveryFixture();
    const current = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    const target = join(fixture.root, "docs", "a.md");
    const beforeTarget = readFileSync(target);
    const db = openHarnessDb(fixture.dbPath);
    const beforeAssessmentCount = Number(
      db.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()?.count,
    );
    for (const table of [
      "authoring_command_group_headers",
      "authoring_command_group_members",
      "authoring_operation_artifacts",
    ]) {
      for (const trigger of db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type = 'trigger' AND sql LIKE ? AND sql LIKE '%UPDATE%'`,
        )
        .all(`%${table}%`))
        db.exec(`DROP TRIGGER ${String(trigger.name)}`);
    }
    const member = db
      .prepare(
        "SELECT * FROM authoring_command_group_members WHERE group_id = ? AND member_id = 'replacement'",
      )
      .get(fixture.groupId) as Record<string, unknown>;
    const aliasPath = "docs/A.md";
    const forgedMember = { ...member, artifact_path: aliasPath };
    db.prepare(
      "UPDATE authoring_command_group_members SET artifact_path = ?, member_digest = ? WHERE group_id = ? AND member_id = ?",
    ).run(
      aliasPath,
      ledgerRowDigest(forgedMember, "member_digest"),
      fixture.groupId,
      member.member_id,
    );
    const members = db
      .prepare("SELECT * FROM authoring_command_group_members WHERE group_id = ? ORDER BY ordinal")
      .all(fixture.groupId);
    const memberSet = members.map((row) => ({
      memberId: row.member_id,
      artifactPath: row.artifact_path,
      contentDigest: row.content_digest,
      expectedPreimage: JSON.parse(String(row.expected_preimage_json)),
    }));
    const header = db
      .prepare("SELECT * FROM authoring_command_group_headers WHERE group_id = ?")
      .get(fixture.groupId) as Record<string, unknown>;
    const forgedHeader = { ...header, member_set_digest: sha(JSON.stringify(memberSet)) };
    db.prepare(
      "UPDATE authoring_command_group_headers SET member_set_digest = ?, header_digest = ? WHERE group_id = ?",
    ).run(
      forgedHeader.member_set_digest,
      ledgerRowDigest(forgedHeader, "header_digest"),
      fixture.groupId,
    );
    const artifact = db
      .prepare(
        "SELECT * FROM authoring_operation_artifacts WHERE group_id = ? AND member_id = 'replacement'",
      )
      .get(fixture.groupId) as Record<string, unknown>;
    const canonical = deriveAuthoringOperationArtifact({
      groupId: fixture.groupId,
      memberId: String(member.member_id),
      artifactPath: aliasPath,
    });
    const forgedArtifact: Record<string, unknown> = {
      ...artifact,
      target_path: aliasPath,
      temporary_path: canonical.temporaryPath,
      rollback_path: canonical.rollbackPath,
      pin_path: canonical.pinPath,
    };
    db.prepare(
      `UPDATE authoring_operation_artifacts SET target_path = ?, temporary_path = ?,
       rollback_path = ?, pin_path = ?, artifact_digest = ?
       WHERE operation_id = ? AND member_id = ?`,
    ).run(
      forgedArtifact.target_path,
      forgedArtifact.temporary_path,
      forgedArtifact.rollback_path,
      forgedArtifact.pin_path,
      ledgerRowDigest(forgedArtifact, "artifact_digest"),
      forgedArtifact.operation_id,
      forgedArtifact.member_id,
    );
    db.close();

    expect(fixture.runner.status(fixture.groupId)).toMatchObject({ state: "corrupt", exitCode: 3 });
    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(current.assessment_digest),
        execute: true,
      }),
    ).toThrow("plan-recovery-command-corrupt");
    expect(readFileSync(target)).toEqual(beforeTarget);
    const verified = openHarnessDb(fixture.dbPath);
    expect(
      Number(
        verified.prepare("SELECT COUNT(*) count FROM authoring_recovery_assessment_events").get()
          ?.count,
      ),
    ).toBe(beforeAssessmentCount);
    verified.close();
  });

  it("operation custody pathを共同改ざんしrow digestを再計算してもmutation前に拒否する", () => {
    const fixture = recoveryFixture();
    const current = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    const db = openHarnessDb(fixture.dbPath);
    const artifact = db
      .prepare("SELECT * FROM authoring_operation_artifacts WHERE group_id = ?")
      .get(fixture.groupId) as Record<string, unknown>;
    for (const trigger of db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND sql LIKE '%authoring_operation_artifacts%' AND sql LIKE '%UPDATE%'",
      )
      .all())
      db.exec(`DROP TRIGGER ${String(trigger.name)}`);
    const token = "authoring-forged-custody";
    const forged: Record<string, unknown> = {
      ...artifact,
      temporary_path: `docs/a.md.ut-tdd-draft-${token}.tmp`,
      rollback_path: `docs/a.md.ut-tdd-draft-${token}.rollback`,
      pin_path: `.ut-tdd-draft-${token}-0-published.identity`,
    };
    db.prepare(
      `UPDATE authoring_operation_artifacts
       SET temporary_path = ?, rollback_path = ?, pin_path = ?, artifact_digest = ?
       WHERE operation_id = ? AND member_id = ?`,
    ).run(
      forged.temporary_path,
      forged.rollback_path,
      forged.pin_path,
      ledgerRowDigest(forged, "artifact_digest"),
      forged.operation_id,
      forged.member_id,
    );
    db.close();

    const target = join(fixture.root, "docs", "a.md");
    expect(() =>
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "rollback",
        expectedAssessmentDigest: String(current.assessment_digest),
        execute: true,
      }),
    ).toThrow("plan-recovery-command-corrupt");
    expect(readFileSync(target, "utf8")).toBe(recoveryPlanSource);
  });

  it("roll_forwardはauxiliaryを除去して1回のcommitted terminalへ収束する", () => {
    const fixture = recoveryFixture();
    const db = openHarnessDb(fixture.dbPath);
    seedCompleteEvidence(db, fixture.groupId);
    const artifact = db
      .prepare("SELECT * FROM authoring_operation_artifacts WHERE group_id = ?")
      .get(fixture.groupId);
    db.close();
    const target = join(fixture.root, String(artifact?.target_path));
    const temporary = join(fixture.root, String(artifact?.temporary_path));
    const publishedPin = join(fixture.root, String(artifact?.pin_path));
    const temporaryPin = join(
      fixture.root,
      String(artifact?.pin_path).replace("published.identity", "temporary.identity"),
    );
    rmSync(target);
    rmSync(publishedPin);
    writeFileSync(temporary, recoveryPlanSource);
    linkSync(temporary, temporaryPin);

    const status = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(status).toMatchObject({ state: "recovery_required", strategy: "roll_forward" });
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "roll_forward",
        expectedAssessmentDigest: String(status.assessment_digest),
        execute: true,
      }),
    ).toMatchObject({ state: "committed", strategy: "roll_forward" });
    expect(fixture.runner.status(fixture.groupId)).toMatchObject({
      state: "committed",
      exitCode: 0,
    });
    expect(fixture.runner.list(true)).not.toContainEqual(
      expect.objectContaining({ command_id: fixture.groupId }),
    );
    expect(existsSync(target)).toBe(true);
    expect([temporary, publishedPin, temporaryPin].some(existsSync)).toBe(false);
    const verified = openHarnessDb(fixture.dbPath);
    expect(
      Number(
        verified
          .prepare(
            "SELECT COUNT(*) count FROM authoring_command_group_phase_events WHERE group_id = ? AND event_kind = 'committed'",
          )
          .get(fixture.groupId)?.count,
      ),
    ).toBe(1);
    expect(migratePlanLedger(verified)).toMatchObject({ ok: true });
    verified.close();
  });

  it("既存committedのsemantic recoveryはterminalを二重追記せずphase chainを保つ", () => {
    const fixture = recoveryFixture();
    const seeded = openHarnessDb(fixture.dbPath);
    seedCompleteEvidence(seeded, fixture.groupId);
    const artifact = seeded
      .prepare("SELECT * FROM authoring_operation_artifacts WHERE group_id = ?")
      .get(fixture.groupId);
    seeded.close();

    const initial = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: String(initial.strategy) as "finalize" | "roll_forward",
        expectedAssessmentDigest: String(initial.assessment_digest),
        execute: true,
      }),
    ).toMatchObject({ state: "committed" });

    const target = join(fixture.root, String(artifact?.target_path));
    const publishedPin = join(fixture.root, String(artifact?.pin_path));
    linkSync(target, publishedPin);
    const recovery = fixture.runner.status(fixture.groupId) as Record<string, unknown>;
    expect(recovery).toMatchObject({
      state: "recovery_required",
      terminal_state: "committed",
      strategy: "finalize",
    });
    expect(
      fixture.runner.recover({
        commandId: fixture.groupId,
        strategy: "finalize",
        expectedAssessmentDigest: String(recovery.assessment_digest),
        execute: true,
      }),
    ).toMatchObject({ state: "committed", strategy: "finalize" });

    const verified = openHarnessDb(fixture.dbPath);
    expect(
      Number(
        verified
          .prepare(
            "SELECT COUNT(*) count FROM authoring_command_group_phase_events WHERE group_id = ? AND event_kind = 'committed'",
          )
          .get(fixture.groupId)?.count,
      ),
    ).toBe(1);
    expect(migratePlanLedger(verified)).toMatchObject({ ok: true });
    verified.close();
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
    const interrupted = spawnSync(testBunBinary(), ["-e", script], {
      encoding: "utf8",
      windowsHide: true,
    });
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
  const groupId = "recovery:test";
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
  const originRevision = revisionEvidence(groupId, "origin", "asset:1", "docs/a.md");
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "asset:1",
    2,
    originRevision.input.canonicalPayloadJson,
    originRevision.derived.canonicalPayloadDigest,
    originRevision.input.bodyDigest,
    originRevision.input.sourcePath,
    originRevision.input.sourceCommit,
    originRevision.input.actor,
    originRevision.input.reason,
    originRevision.input.occurredAt,
  );
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    "asset:2",
    now,
    "b".repeat(40),
    "test",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "asset:2",
    1,
    "{}",
    sha("{}"),
    digest,
    "docs/b.md",
    "b".repeat(40),
    "test",
    "test",
    now,
  );
  const replacementRevision = revisionEvidence(groupId, "replacement", "asset:2", "docs/b.md");
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "asset:2",
    2,
    replacementRevision.input.canonicalPayloadJson,
    replacementRevision.derived.canonicalPayloadDigest,
    replacementRevision.input.bodyDigest,
    replacementRevision.input.sourcePath,
    replacementRevision.input.sourceCommit,
    replacementRevision.input.actor,
    replacementRevision.input.reason,
    replacementRevision.input.occurredAt,
  );
  const content = recoveryPlanSource;
  const input = {
    groupId,
    commandPayloadDigest: digest,
    occurredAt: now,
    members: [
      {
        memberId: "origin",
        artifactPath: "docs/a.md",
        contentDigest: sha(content),
        expectedPreimage: { kind: "absent" as const },
      },
      {
        memberId: "replacement",
        artifactPath: "docs/b.md",
        contentDigest: sha(content),
        expectedPreimage: { kind: "absent" as const },
      },
    ],
    operation: {
      repositoryIdentity: "owner/repo",
      baseCommit: "b".repeat(40),
      revisionBindings: [
        { assetId: "asset:1", revision: 2, artifactRole: "origin" },
        { assetId: "asset:2", revision: 2, artifactRole: "replacement" },
      ],
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
  for (const [memberId, path] of [
    ["origin", "docs/a.md"],
    ["replacement", "docs/b.md"],
  ] as const) {
    const target = join(root, path);
    writeFileSync(target, content);
    const tokenId = `authoring-${sha(`${groupId}\0${memberId}`).slice(0, 32)}`;
    linkSync(target, join(root, `.ut-tdd-draft-${tokenId}-0-published.identity`));
  }
  return {
    root,
    dbPath,
    groupId,
    runner: new NodePlanAuthoringRecoveryRunner(root, () => openHarnessDb(dbPath)),
  };
}

function filesystemInventory(paths: readonly string[]) {
  return paths.map((path) => {
    if (!existsSync(path)) return { path, exists: false as const };
    const stat = lstatSync(path);
    return {
      path,
      exists: true as const,
      ino: stat.ino,
      content: createHash("sha256").update(readFileSync(path)).digest("hex"),
    };
  });
}

function seedCompleteEvidence(db: HarnessDb, groupId: string): void {
  for (const [role, asset, path] of [
    ["origin", "asset:1", "docs/a.md"],
    ["replacement", "asset:2", "docs/b.md"],
  ] as const) {
    const commandId = `${groupId}:${role}`;
    const certificateId = `certificate:${role}`;
    const admissionEventId = `admission:${role}`;
    const revision = revisionEvidence(groupId, role, asset, path);
    const binding = {
      group_id: groupId,
      asset_id: asset,
      revision: 2,
      artifact_role: role,
      bound_at: now,
    };
    db.prepare("INSERT INTO authoring_command_revision_bindings VALUES (?, ?, ?, ?, ?, ?)").run(
      ...Object.values(binding),
      ledgerRowDigest(binding, "binding_digest"),
    );
    const admission = {
      admission_event_id: admissionEventId,
      command_id: commandId,
      command_payload_digest: revision.derived.commandPayloadDigest,
      event_kind: "admitted",
      plan_asset_id: asset,
      plan_revision: 2,
      plan_id: `PLAN-${role}`,
      source_path: path,
      content_digest: revision.input.contentDigest,
      route_tuple_digest: revision.input.routeTupleDigest,
      certificate_id: certificateId,
      certificate_digest: revision.derived.certificateDigest,
      occurred_at: now,
    };
    db.prepare(
      "INSERT INTO plan_admission_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(admission), ledgerRowDigest(admission, "event_digest"));
    db.prepare(
      "INSERT INTO plan_admission_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      certificateId,
      admissionEventId,
      commandId,
      revision.derived.commandPayloadDigest,
      asset,
      2,
      `PLAN-${role}`,
      path,
      revision.input.contentDigest,
      revision.input.routeTupleDigest,
      revision.derived.certificateDigest,
      now,
    );
    const receipt = {
      command_id: commandId,
      command_type: "plan.revise",
      subject_kind: "plan_revision",
      subject_key: `${asset}:2`,
      plan_asset_id: asset,
      plan_revision: 2,
      command_payload_digest: revision.derived.commandPayloadDigest,
      result_kind: "admission_certificate",
      result_ref: certificateId,
      recorded_at: now,
    };
    db.prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      ...Object.values(receipt),
      ledgerRowDigest(receipt, "receipt_digest"),
    );
  }
}

function revisionEvidence(
  groupId: string,
  role: string,
  assetId: string,
  sourcePath: string,
  contentDigest = recoveryPlanContentDigest,
) {
  const input = {
    commandId: `${groupId}:${role}`,
    assetId,
    planId: `PLAN-${role}`,
    baseRevision: 1,
    basePayloadDigest: sha("{}"),
    canonicalPayloadJson: JSON.stringify({ plan_id: `PLAN-${role}` }),
    contentDigest,
    bodyDigest: digest,
    sourcePath,
    sourceCommit: "b".repeat(40),
    actor: "test",
    reason: "test",
    routeTupleDigest: digest,
    certificateId: `certificate:${role}`,
    occurredAt: now,
  };
  return { input, derived: derivePlanRevisionDigests(input) };
}

const digest = "a".repeat(64);
const now = "2026-07-21T00:00:00Z";
const recoveryPlanSource = "---\nplan_id: PLAN-recovery-fixture\n---\n# Recovery fixture\n";
const recoveryPlanContentDigest = requireCanonicalDigest(recoveryPlanSource);
function requireCanonicalDigest(source: string): string {
  const value = canonicalPlanContentDigest(source)?.slice(7);
  if (!value) throw new Error("recovery fixture must be a canonical PLAN");
  return value;
}
function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function testBunBinary(): string {
  if (process.env.UT_TDD_BUN_BINARY) return process.env.UT_TDD_BUN_BINARY;
  const npmExecPath = process.env.npm_execpath;
  if (process.platform === "win32" && npmExecPath?.toLowerCase().endsWith("bunx.exe")) {
    return join(dirname(npmExecPath), "bun.exe");
  }
  return resolveBunBinary();
}
