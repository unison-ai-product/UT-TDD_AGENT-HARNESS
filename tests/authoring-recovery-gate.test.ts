import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectAuthoringRecoveryDbEvidence } from "../src/plan-admission/authoring-recovery-db-evidence";
import {
  assertNoUnresolvedAuthoringRecovery,
  findUnresolvedAuthoringRecovery,
} from "../src/plan-asset/ledger/authoring-recovery-gate";
import { ledgerRowDigest, migratePlanLedger } from "../src/plan-asset/ledger/schema";
import { type HarnessDb, openHarnessDb } from "../src/state-db/index";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("authoring recovery boundary gate", () => {
  it("draft journalはterminal allowlist以外のintent/recovery_requiredを全てblockする", () => {
    const { db, root } = fixture();
    try {
      for (const [command, status] of [
        ["command:intent", "intent"],
        ["command:recovery", "recovery_required"],
      ])
        db.prepare(
          `INSERT INTO plan_draft_journal
           (journal_id, command_id, command_payload_digest, status, requested_plan_id,
            requested_source_path, intent_recorded_at, completed_at, failure_reason, journal_digest)
           VALUES (?, ?, 'digest', ?, 'PLAN-X', 'docs/plans/X.md', '2026-07-21', ?, NULL, 'digest')`,
        ).run(`journal:${command}`, command, status, status === "intent" ? null : "2026-07-21");
      expect(findUnresolvedAuthoringRecovery(db, root).draftCommands).toEqual([
        "command:intent",
        "command:recovery",
      ]);
      db.prepare(
        "UPDATE plan_draft_journal SET status = 'committed', completed_at = '2026-07-21'",
      ).run();
      expect(findUnresolvedAuthoringRecovery(db, root).draftCommands).toEqual([]);
    } finally {
      db.close();
    }
  });

  it("F8/F9/FX: committed文字列だけでは通さずexact DB evidenceとcleanup完了を要求する", () => {
    const { db, root } = fixture();
    try {
      seedGroup(db, "committed", sha("post"), { kind: "absent" });
      writeFileSync(join(root, "target.txt"), "post");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);

      seedCommittedEvidence(db);
      for (const binding of db.prepare("SELECT * FROM authoring_command_revision_bindings").all())
        expect(binding.binding_digest).toBe(ledgerRowDigest(binding, "binding_digest"));
      expect(inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toBe("complete");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual([]);

      writeFileSync(join(root, "target.txt.tmp"), "post");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
      rmSync(join(root, "target.txt.tmp"));
      writeFileSync(join(root, ".ut-tdd-draft-token-0-published.identity"), "post");
      expect(() => assertNoUnresolvedAuthoringRecovery(db, root)).toThrow(
        /authoring-recovery-unresolved/,
      );
    } finally {
      db.close();
    }
  });

  it("偽rolled_backはDB evidence、preimage不一致、aux残存の各laneでblockする", () => {
    const { db, root } = fixture();
    try {
      seedGroup(db, "rolled_back", sha("post"), { kind: "sha256", digest: sha("pre") });
      writeFileSync(join(root, "target.txt"), "pre");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual([]);

      writeFileSync(join(root, "target.txt"), "other");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
      writeFileSync(join(root, "target.txt"), "pre");
      writeFileSync(join(root, "target.txt.rollback"), "pre");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
      rmSync(join(root, "target.txt.rollback"));
      db.prepare(
        "INSERT INTO authoring_command_revision_bindings VALUES ('redesign:1', 'asset:origin', 1, 'origin', 'now', 'digest')",
      ).run();
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
    } finally {
      db.close();
    }
  });

  it("repo外path、directory、symlink targetをregular fileとして信用しない", () => {
    const { db, root } = fixture();
    try {
      const outside = mkdtempSync(join(tmpdir(), "authoring-gate-outside-"));
      roots.push(outside);
      const real = join(outside, "real.txt");
      writeFileSync(real, "post");
      symlinkSync(outside, join(root, "linked"), "junction");
      seedGroup(db, "committed", sha("post"), { kind: "absent" }, "linked/real.txt");
      seedCommittedEvidence(db);
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
    } finally {
      db.close();
    }
  });
});

function fixture(): { db: HarnessDb; root: string } {
  const db = openHarnessDb(":memory:");
  expect(migratePlanLedger(db)).toMatchObject({ ok: true });
  db.exec("PRAGMA foreign_keys = OFF");
  const root = mkdtempSync(join(tmpdir(), "authoring-gate-"));
  roots.push(root);
  return { db, root };
}

function seedGroup(
  db: HarnessDb,
  phase: "committed" | "rolled_back",
  postimage: string,
  preimage: { kind: "absent" } | { kind: "sha256"; digest: string },
  targetPath = "target.txt",
): void {
  db.prepare("INSERT INTO authoring_command_group_headers VALUES (?, ?, ?, ?, ?, ?)").run(
    "redesign:1",
    "payload",
    "members",
    1,
    "2026-07-21",
    "header",
  );
  db.prepare("INSERT INTO authoring_command_group_members VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "redesign:1",
    "source",
    1,
    targetPath,
    postimage.replace("sha256:", ""),
    JSON.stringify(preimage),
    "member",
  );
  db.prepare(
    `INSERT INTO authoring_command_group_phase_events
     VALUES ('phase:1', 'redesign:1', 1, 'payload', ?, NULL, NULL, NULL, '2026-07-21', NULL, 'event')`,
  ).run(phase);
  db.prepare("INSERT INTO authoring_operation_descriptors VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    "operation:1",
    "redesign:1",
    "payload",
    "repo",
    "commit",
    1,
    "2026-07-21",
    "descriptor",
  );
  db.prepare(
    "INSERT INTO authoring_operation_artifacts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    "operation:1",
    "redesign:1",
    "source",
    1,
    "source",
    targetPath,
    "target.txt.tmp",
    "target.txt.rollback",
    ".ut-tdd-draft-token-0-published.identity",
    JSON.stringify(preimage),
    postimage,
    "artifact",
  );
}

function seedCommittedEvidence(db: HarnessDb): void {
  for (const role of ["origin", "replacement"] as const) {
    const asset = `asset:${role}`;
    const commandId = `redesign:1:${role}`;
    const certificateId = `certificate:${role}`;
    const admissionEventId = `admission:${role}`;
    db.prepare("INSERT INTO plan_assets VALUES (?, 'now', 'commit', 'sha256-v1')").run(asset);
    db.prepare(
      "INSERT INTO plan_revisions VALUES (?, 1, '{}', 'payload', 'body', ?, 'commit', 'actor', 'reason', 'now')",
    ).run(asset, `${role}.md`);
    const binding = {
      group_id: "redesign:1",
      asset_id: asset,
      revision: 1,
      artifact_role: role,
      bound_at: "now",
    };
    db.prepare("INSERT INTO authoring_command_revision_bindings VALUES (?, ?, ?, ?, ?, ?)").run(
      ...Object.values(binding),
      ledgerRowDigest(binding, "binding_digest"),
    );
    const admission = {
      admission_event_id: admissionEventId,
      command_id: commandId,
      command_payload_digest: "payload",
      event_kind: "admitted",
      plan_asset_id: asset,
      plan_revision: 1,
      plan_id: `PLAN-${role}`,
      source_path: `${role}.md`,
      content_digest: "content",
      route_tuple_digest: "route",
      certificate_id: certificateId,
      certificate_digest: "certificate",
      occurred_at: "now",
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
      "payload",
      asset,
      1,
      `PLAN-${role}`,
      `${role}.md`,
      "content",
      "route",
      "certificate",
      "now",
    );
    const receipt = {
      command_id: commandId,
      command_type: "plan.revise",
      subject_kind: "plan_revision",
      subject_key: `${asset}:1`,
      plan_asset_id: asset,
      plan_revision: 1,
      command_payload_digest: "payload",
      result_kind: "admission_certificate",
      result_ref: certificateId,
      recorded_at: "now",
    };
    db.prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      ...Object.values(receipt),
      ledgerRowDigest(receipt, "receipt_digest"),
    );
  }
}

function sha(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
