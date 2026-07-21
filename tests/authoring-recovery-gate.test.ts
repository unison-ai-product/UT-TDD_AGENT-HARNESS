import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectAuthoringRecoveryDbEvidence } from "../src/plan-admission/authoring-recovery-db-evidence";
import { canonicalPlanContentDigest } from "../src/plan-admission/diff-fence";
import { deriveAuthoringOperationArtifact } from "../src/plan-asset/ledger/authoring-operation-provenance";
import {
  assertNoUnresolvedAuthoringRecovery,
  findUnresolvedAuthoringRecovery,
  groupIsSemanticallyTerminal,
} from "../src/plan-asset/ledger/authoring-recovery-gate";
import { derivePlanRevisionDigests } from "../src/plan-asset/ledger/plan-revision-ledger";
import {
  authoringCommandGroupValid,
  authoringOperationGroupValid,
  ledgerRowDigest,
  migratePlanLedger,
} from "../src/plan-asset/ledger/schema";
import { type HarnessDb, openHarnessDb } from "../src/state-db/index";

const roots: string[] = [];
const canonicalFixtureArtifact = deriveAuthoringOperationArtifact({
  groupId: "redesign:1",
  memberId: "origin",
  artifactPath: "target.txt",
});
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
      seedGroup(db, "committed", sha(originPlanSource), { kind: "absent" });
      expect(
        authoringCommandGroupValid(db, "redesign:1"),
        JSON.stringify({
          header: db.prepare("SELECT * FROM authoring_command_group_headers").get(),
          members: db.prepare("SELECT * FROM authoring_command_group_members").all(),
          events: db.prepare("SELECT * FROM authoring_command_group_phase_events").all(),
        }),
      ).toBe(true);
      writeFileSync(join(root, "target.txt"), originPlanSource);
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);

      seedCommittedEvidence(db, root);
      for (const artifact of db.prepare("SELECT * FROM authoring_operation_artifacts").all())
        expect(artifact.artifact_digest).toBe(ledgerRowDigest(artifact, "artifact_digest"));
      const descriptor = db.prepare("SELECT * FROM authoring_operation_descriptors").get();
      expect(descriptor?.descriptor_digest).toBe(
        ledgerRowDigest(descriptor ?? {}, "descriptor_digest"),
      );
      for (const binding of db.prepare("SELECT * FROM authoring_command_revision_bindings").all())
        expect(binding.binding_digest).toBe(ledgerRowDigest(binding, "binding_digest"));
      expect(inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toBe("complete");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual([]);

      writeFileSync(join(root, canonicalFixtureArtifact.temporaryPath), "post");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
      rmSync(join(root, canonicalFixtureArtifact.temporaryPath));
      writeFileSync(join(root, canonicalFixtureArtifact.pinPath), "post");
      expect(() => assertNoUnresolvedAuthoringRecovery(db, root)).toThrow(
        /authoring-recovery-unresolved/,
      );
    } finally {
      db.close();
    }
  });

  it.each([
    "plan_id",
    "source_path",
    "content_digest",
    "route_tuple_digest",
  ] as const)("admission eventの%sだけを改変し行digestを再計算してもreceiptとの不一致を拒否する", (field) => {
    const { db } = fixture();
    try {
      seedCommittedEvidence(db);
      const event = db
        .prepare("SELECT * FROM plan_admission_events WHERE admission_event_id = ?")
        .get("admission:origin") as Record<string, unknown>;
      const forged = { ...event, [field]: `forged-${field}` };
      // offline DB tamperはappend-only triggerごと回避し得る。行digestが自己整合しても
      // receiptとのcross-row bindingが壊れた証拠をrecovery gateは信用しない。
      db.exec("DROP TRIGGER trg_plan_admission_events_no_update");
      db.prepare(
        `UPDATE plan_admission_events SET ${field} = ?, event_digest = ?
           WHERE admission_event_id = ?`,
      ).run(forged[field], ledgerRowDigest(forged, "event_digest"), forged.admission_event_id);

      expect(() => inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toThrow(
        "plan-recovery-db-evidence-mismatch",
      );
    } finally {
      db.close();
    }
  });

  it("eventとreceiptを共同改ざんし行digestを再計算してもrevision由来digestと不一致なら拒否する", () => {
    const { db } = fixture();
    try {
      seedCommittedEvidence(db);
      const event = db
        .prepare("SELECT * FROM plan_admission_events WHERE admission_event_id = ?")
        .get("admission:origin") as Record<string, unknown>;
      const forged: Record<string, unknown> = { ...event, content_digest: "forged-content" };
      db.exec("DROP TRIGGER trg_plan_admission_events_no_update");
      db.exec("DROP TRIGGER trg_plan_admission_receipts_no_update");
      db.prepare(
        "UPDATE plan_admission_events SET content_digest = ?, event_digest = ? WHERE admission_event_id = ?",
      ).run(
        forged.content_digest,
        ledgerRowDigest(forged, "event_digest"),
        forged.admission_event_id,
      );
      db.prepare(
        "UPDATE plan_admission_receipts SET content_digest = ? WHERE admission_event_id = ?",
      ).run(forged.content_digest, forged.admission_event_id);

      expect(() => inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toThrow(
        "plan-recovery-db-evidence-mismatch",
      );
    } finally {
      db.close();
    }
  });

  it("revision canonical payload digestだけを改ざんしても正本不一致として拒否する", () => {
    const { db } = fixture();
    try {
      seedCommittedEvidence(db);
      db.exec("DROP TRIGGER trg_plan_revisions_no_update");
      db.prepare(
        "UPDATE plan_revisions SET canonical_payload_digest = ? WHERE asset_id = ? AND revision = ?",
      ).run(rawSha("forged-payload"), "asset:origin", 2);

      expect(() => inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toThrow(
        "plan-recovery-db-evidence-mismatch",
      );
    } finally {
      db.close();
    }
  });

  it("eventとadmissionのsource pathを共同改ざんし行digestを再計算してもrevision正本との差を拒否する", () => {
    const { db } = fixture();
    try {
      seedCommittedEvidence(db);
      const event = db
        .prepare("SELECT * FROM plan_admission_events WHERE admission_event_id = ?")
        .get("admission:origin") as Record<string, unknown>;
      const forged: Record<string, unknown> = { ...event, source_path: "docs/forged.md" };
      db.exec("DROP TRIGGER trg_plan_admission_events_no_update");
      db.exec("DROP TRIGGER trg_plan_admission_receipts_no_update");
      db.prepare(
        "UPDATE plan_admission_events SET source_path = ?, event_digest = ? WHERE admission_event_id = ?",
      ).run(forged.source_path, ledgerRowDigest(forged, "event_digest"), forged.admission_event_id);
      db.prepare(
        "UPDATE plan_admission_receipts SET source_path = ? WHERE admission_event_id = ?",
      ).run(forged.source_path, forged.admission_event_id);

      expect(() => inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toThrow(
        "plan-recovery-db-evidence-mismatch",
      );
    } finally {
      db.close();
    }
  });

  it("event、admission、append receiptの時刻を共同改ざんしdigestを再計算してもrevision正本との差を拒否する", () => {
    const { db } = fixture();
    try {
      seedCommittedEvidence(db);
      const event = db
        .prepare("SELECT * FROM plan_admission_events WHERE admission_event_id = ?")
        .get("admission:origin") as Record<string, unknown>;
      const receipt = db
        .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
        .get("redesign:1:origin") as Record<string, unknown>;
      const forgedAt = "2099-01-01T00:00:00Z";
      const forgedEvent: Record<string, unknown> = { ...event, occurred_at: forgedAt };
      const forgedReceipt: Record<string, unknown> = { ...receipt, recorded_at: forgedAt };
      db.exec("DROP TRIGGER trg_plan_admission_events_no_update");
      db.exec("DROP TRIGGER trg_plan_admission_receipts_no_update");
      db.exec("DROP TRIGGER trg_append_command_receipts_no_update");
      db.prepare(
        "UPDATE plan_admission_events SET occurred_at = ?, event_digest = ? WHERE admission_event_id = ?",
      ).run(forgedAt, ledgerRowDigest(forgedEvent, "event_digest"), forgedEvent.admission_event_id);
      db.prepare(
        "UPDATE plan_admission_receipts SET recorded_at = ? WHERE admission_event_id = ?",
      ).run(forgedAt, forgedEvent.admission_event_id);
      db.prepare(
        "UPDATE append_command_receipts SET recorded_at = ?, receipt_digest = ? WHERE command_id = ?",
      ).run(forgedAt, ledgerRowDigest(forgedReceipt, "receipt_digest"), forgedReceipt.command_id);

      expect(() => inspectAuthoringRecoveryDbEvidence(db, "redesign:1")).toThrow(
        "plan-recovery-db-evidence-mismatch",
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
      writeFileSync(join(root, canonicalFixtureArtifact.rollbackPath), "pre");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
      rmSync(join(root, canonicalFixtureArtifact.rollbackPath));
      db.prepare(
        "INSERT INTO authoring_command_revision_bindings VALUES ('redesign:1', 'asset:origin', 1, 'origin', 'now', 'digest')",
      ).run();
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
    } finally {
      db.close();
    }
  });

  it("terminal phaseのdigest chainが壊れていればfilesystemがcleanでもblockする", () => {
    const { db, root } = fixture();
    try {
      seedGroup(db, "rolled_back", sha("post"), { kind: "absent" });
      db.exec("DROP TRIGGER trg_authoring_command_group_phase_events_no_update");
      db.prepare(
        "UPDATE authoring_command_group_phase_events SET event_digest = 'forged' WHERE group_id = ? AND event_kind = 'rolled_back'",
      ).run("redesign:1");
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
    } finally {
      db.close();
    }
  });

  it("descriptorとartifactを共同改ざんしrow digestを再計算してもcanonical member provenance不一致を拒否する", () => {
    const { db, root } = fixture();
    try {
      seedGroup(db, "rolled_back", sha("post"), { kind: "absent" });
      db.exec("DROP TRIGGER trg_authoring_operation_descriptors_no_update");
      db.exec("DROP TRIGGER trg_authoring_operation_artifacts_no_update");
      const descriptor = db
        .prepare("SELECT * FROM authoring_operation_descriptors")
        .get() as Record<string, unknown>;
      const forgedDescriptor: Record<string, unknown> = {
        ...descriptor,
        command_payload_digest: "forged-payload",
      };
      db.prepare(
        "UPDATE authoring_operation_descriptors SET command_payload_digest = ?, descriptor_digest = ? WHERE operation_id = ?",
      ).run(
        forgedDescriptor.command_payload_digest,
        ledgerRowDigest(forgedDescriptor, "descriptor_digest"),
        forgedDescriptor.operation_id,
      );
      const artifact = db.prepare("SELECT * FROM authoring_operation_artifacts").get() as Record<
        string,
        unknown
      >;
      const forgedArtifact: Record<string, unknown> = {
        ...artifact,
        target_path: "forged-target.txt",
      };
      db.prepare(
        "UPDATE authoring_operation_artifacts SET target_path = ?, artifact_digest = ? WHERE operation_id = ? AND member_id = ?",
      ).run(
        forgedArtifact.target_path,
        ledgerRowDigest(forgedArtifact, "artifact_digest"),
        forgedArtifact.operation_id,
        forgedArtifact.member_id,
      );

      expect(authoringCommandGroupValid(db, "redesign:1")).toBe(true);
      expect(authoringOperationGroupValid(db, "redesign:1")).toBe(false);
      expect(
        groupIsSemanticallyTerminal({
          db,
          repoRoot: root,
          groupId: "redesign:1",
          phase: "rolled_back",
        }),
      ).toBe(false);
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
      seedCommittedEvidence(db, root);
      expect(findUnresolvedAuthoringRecovery(db, root).groups).toEqual(["redesign:1"]);
    } finally {
      db.close();
    }
  });

  it("親directoryを判定中にjunctionへ差し替えるTOCTOUをfail-closeする", () => {
    const { db, root } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "authoring-gate-race-outside-"));
    roots.push(outside);
    try {
      mkdirSync(join(root, "nested"));
      writeFileSync(join(root, "nested", "target.txt"), "post");
      writeFileSync(join(outside, "target.txt"), "post");
      seedGroup(db, "committed", sha("post"), { kind: "absent" }, "nested/target.txt");
      seedCommittedEvidence(db, root);
      let swapped = false;
      expect(
        groupIsSemanticallyTerminal({
          db,
          repoRoot: root,
          groupId: "redesign:1",
          phase: "committed",
          afterParentCapture: (path) => {
            if (swapped || path !== "nested/target.txt") return;
            swapped = true;
            renameSync(join(root, "nested"), join(root, "nested-original"));
            symlinkSync(outside, join(root, "nested"), "junction");
          },
        }),
      ).toBe(false);
    } finally {
      db.close();
    }
  });

  it.each([
    "target.txt",
    canonicalFixtureArtifact.temporaryPath,
  ])("同一directory内で%sを判定後に生成するleaf TOCTOUをfail-closeする", (attackedPath) => {
    const { db, root } = fixture();
    try {
      seedGroup(db, "rolled_back", sha("post"), { kind: "absent" });
      let attacked = false;
      expect(
        groupIsSemanticallyTerminal({
          db,
          repoRoot: root,
          groupId: "redesign:1",
          phase: "rolled_back",
          beforeStableReturn: (path) => {
            if (attacked || path !== attackedPath) return;
            attacked = true;
            writeFileSync(join(root, attackedPath), "raced");
          },
        }),
      ).toBe(false);
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
  const members = [
    {
      group_id: "redesign:1",
      member_id: "origin",
      ordinal: 1,
      artifact_path: targetPath,
      content_digest: postimage.replace("sha256:", ""),
      expected_preimage_json: JSON.stringify(preimage),
    },
    {
      group_id: "redesign:1",
      member_id: "replacement",
      ordinal: 2,
      artifact_path: "replacement.md",
      content_digest: rawSha(replacementPlanSource),
      expected_preimage_json: JSON.stringify({ kind: "absent" }),
    },
  ];
  const memberSet = members.map((member) => ({
    memberId: member.member_id,
    artifactPath: member.artifact_path,
    contentDigest: member.content_digest,
    expectedPreimage: JSON.parse(member.expected_preimage_json),
  }));
  const header = {
    group_id: "redesign:1",
    command_payload_digest: "payload",
    member_set_digest: rawSha(JSON.stringify(memberSet)),
    member_count: members.length,
    created_at: "2026-07-21",
  };
  db.prepare("INSERT INTO authoring_command_group_headers VALUES (?, ?, ?, ?, ?, ?)").run(
    ...Object.values(header),
    ledgerRowDigest(header, "header_digest"),
  );
  for (const member of members)
    db.prepare("INSERT INTO authoring_command_group_members VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      ...Object.values(member),
      ledgerRowDigest(member, "member_digest"),
    );
  let previous: string | null = null;
  const phases =
    phase === "committed"
      ? ([
          ["prepared", null],
          ["member_started", "origin"],
          ["member_published", "origin"],
          ["member_started", "replacement"],
          ["member_published", "replacement"],
          ["committed", null],
        ] as const)
      : ([
          ["prepared", null],
          ["rolled_back", null],
        ] as const);
  for (const [index, [kind, memberId]] of phases.entries()) {
    const event = {
      phase_event_id: `phase:${index + 1}`,
      group_id: "redesign:1",
      sequence: index + 1,
      command_payload_digest: "payload",
      event_kind: kind,
      member_id: memberId,
      publish_receipt_digest: kind === "member_published" ? rawSha(`published:${memberId}`) : null,
      failure_reason: null,
      occurred_at: "2026-07-21",
      previous_event_digest: previous,
    };
    previous = ledgerRowDigest(event, "event_digest");
    db.prepare(
      "INSERT INTO authoring_command_group_phase_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(event), previous);
  }
  const operationId = deriveAuthoringOperationArtifact({
    groupId: "redesign:1",
    memberId: "origin",
    artifactPath: targetPath,
  }).operationId;
  const descriptor = {
    operation_id: operationId,
    group_id: "redesign:1",
    command_payload_digest: "payload",
    repository_identity: "repo",
    base_commit: "commit",
    artifact_count: members.length,
    prepared_at: "2026-07-21",
  };
  db.prepare("INSERT INTO authoring_operation_descriptors VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(descriptor),
    ledgerRowDigest(descriptor, "descriptor_digest"),
  );
  for (const member of members) {
    const canonical = deriveAuthoringOperationArtifact({
      groupId: "redesign:1",
      memberId: member.member_id,
      artifactPath: member.artifact_path,
    });
    const artifact = {
      operation_id: operationId,
      group_id: "redesign:1",
      member_id: member.member_id,
      ordinal: member.ordinal,
      artifact_role: member.member_id,
      target_path: member.artifact_path,
      temporary_path: canonical.temporaryPath,
      rollback_path: canonical.rollbackPath,
      pin_path: canonical.pinPath,
      expected_preimage_json: member.expected_preimage_json,
      postimage_digest: `sha256:${member.content_digest}`,
    };
    db.prepare(
      "INSERT INTO authoring_operation_artifacts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(...Object.values(artifact), ledgerRowDigest(artifact, "artifact_digest"));
  }
}

function seedCommittedEvidence(db: HarnessDb, root?: string): void {
  if (root) writeFileSync(join(root, "replacement.md"), replacementPlanSource);
  for (const role of ["origin", "replacement"] as const) {
    const asset = `asset:${role}`;
    const commandId = `redesign:1:${role}`;
    const certificateId = `certificate:${role}`;
    const admissionEventId = `admission:${role}`;
    const sourcePath = String(
      db
        .prepare("SELECT target_path FROM authoring_operation_artifacts WHERE artifact_role = ?")
        .get(role)?.target_path,
    );
    const canonicalPayloadJson = JSON.stringify({ plan_id: `PLAN-${role}` });
    db.prepare("INSERT INTO plan_assets VALUES (?, 'now', 'commit', 'sha256-v1')").run(asset);
    db.prepare(
      "INSERT INTO plan_revisions VALUES (?, 1, '{}', ?, 'base-body', ?, 'commit', 'actor', 'base', 'before')",
    ).run(asset, rawSha("{}"), sourcePath);
    const contentDigest = canonicalDigest(
      role === "origin" ? originPlanSource : replacementPlanSource,
    );
    const revisionInput = {
      commandId,
      assetId: asset,
      planId: `PLAN-${role}`,
      baseRevision: 1,
      basePayloadDigest: rawSha("{}"),
      canonicalPayloadJson,
      contentDigest,
      bodyDigest: "body",
      sourcePath,
      sourceCommit: "commit",
      actor: "actor",
      reason: "reason",
      routeTupleDigest: "route",
      certificateId,
      occurredAt: "now",
    };
    const derived = derivePlanRevisionDigests(revisionInput);
    db.prepare(
      "INSERT INTO plan_revisions VALUES (?, 2, ?, ?, 'body', ?, 'commit', 'actor', 'reason', 'now')",
    ).run(asset, canonicalPayloadJson, derived.canonicalPayloadDigest, sourcePath);
    const binding = {
      group_id: "redesign:1",
      asset_id: asset,
      revision: 2,
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
      command_payload_digest: derived.commandPayloadDigest,
      event_kind: "admitted",
      plan_asset_id: asset,
      plan_revision: 2,
      plan_id: `PLAN-${role}`,
      source_path: sourcePath,
      content_digest: contentDigest,
      route_tuple_digest: "route",
      certificate_id: certificateId,
      certificate_digest: derived.certificateDigest,
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
      derived.commandPayloadDigest,
      asset,
      2,
      `PLAN-${role}`,
      sourcePath,
      contentDigest,
      "route",
      derived.certificateDigest,
      "now",
    );
    const receipt = {
      command_id: commandId,
      command_type: "plan.revise",
      subject_kind: "plan_revision",
      subject_key: `${asset}:2`,
      plan_asset_id: asset,
      plan_revision: 2,
      command_payload_digest: derived.commandPayloadDigest,
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
  return `sha256:${rawSha(value)}`;
}

const originPlanSource = "---\nplan_id: PLAN-origin\n---\n# Origin\n";
const replacementPlanSource = "---\nplan_id: PLAN-replacement\n---\n# Replacement\n";

function canonicalDigest(source: string): string {
  const digest = canonicalPlanContentDigest(source);
  if (!digest) throw new Error("fixture must be a canonical PLAN");
  return digest.slice(7);
}

function rawSha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
