import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { createGenesisRebaseCommentGroup } from "../../src/plan-asset/application/genesis-rebase-comment-projection.js";
import {
  type GenesisRebaseMigrationBoundary,
  type GenesisRebaseMigrationInput,
  GenesisRebaseMigrationTransaction,
} from "../../src/plan-asset/ledger/genesis-rebase-migration-transaction.js";
import { LEDGER_SCHEMA_VERSION, migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.js";

const opened: HarnessDb[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("genesis rebase migration transaction", () => {
  it("U-PA-REBASE-010: local migrationと2-member pending outboxを単一commitする", () => {
    const db = fixture();
    const before = historicalRows(db);
    const result = new GenesisRebaseMigrationTransaction(db).migrate(input());

    expect(result).toMatchObject({ ok: true, replayed: false });
    expect(historicalRows(db)).toEqual(before);
    expect(count(db, "plan_assets")).toBe(1);
    expect(count(db, "plan_revisions")).toBe(1);
    expect(count(db, "genesis_rebase_migrations")).toBe(1);
    expect(count(db, "genesis_rebase_migration_certificates")).toBe(1);
    expect(count(db, "genesis_issue_custody")).toBe(1);
    expect(count(db, "plan_admission_events")).toBe(1);
    expect(count(db, "plan_admission_receipts")).toBe(1);
    expect(count(db, "append_command_receipts")).toBe(1);
    expect(count(db, "genesis_rebase_comment_groups")).toBe(1);
    expect(count(db, "genesis_rebase_comment_members")).toBe(2);
    expect(count(db, "genesis_rebase_comment_events")).toBe(1);
    expect(
      db
        .prepare(
          "SELECT certificate_id, certificate_json, certificate_digest FROM genesis_rebase_migration_certificates",
        )
        .get(),
    ).toEqual({
      certificate_id: input().authoritativeCertificate.certificateId,
      certificate_json: input().authoritativeCertificate.certificateJson,
      certificate_digest: input().authoritativeCertificate.certificateDigest,
    });
    expect(
      db.prepare("SELECT issue_number, episode_id, drive_model FROM genesis_issue_custody").get(),
    ).toEqual({ issue_number: 143, episode_id: "E4-143", drive_model: "recovery" });
    expect(
      db
        .prepare(
          "SELECT asset_id, valid_from_revision FROM plan_aliases WHERE alias = ? AND valid_to_revision IS NULL",
        )
        .get("PLAN-RECOVERY-16"),
    ).toEqual({ asset_id: "plan:recovery-16-genesis-rebase", valid_from_revision: 1 });
    expect(
      db
        .prepare(
          `SELECT historical_authority_kind, historical_projection_path,
                  historical_projection_blob_oid, historical_projection_content_digest,
                  historical_projection_tail_record_digest, authoritative_certificate_digest,
                  source_authority_digest, reviewed_implementation_authority_digest,
                  trusted_status
           FROM genesis_rebase_migrations`,
        )
        .get(),
    ).toEqual({
      historical_authority_kind: "tracked_projection",
      historical_projection_path: input().historicalProjectionPath,
      historical_projection_blob_oid: input().historicalProjectionBlobOid,
      historical_projection_content_digest: input().historicalProjectionContentDigest,
      historical_projection_tail_record_digest: input().historicalProjectionTailDigest,
      authoritative_certificate_digest: input().authoritativeCertificate.certificateDigest,
      source_authority_digest: input().authoritativeCertificate.sourceAuthorityDigest,
      reviewed_implementation_authority_digest:
        input().authoritativeCertificate.reviewedImplementationAuthorityDigest,
      trusted_status: "draft",
    });
  });

  it.each([
    ["source_authority_digest", `sha256:${"0".repeat(64)}`],
    ["reviewed_implementation_authority_digest", `sha256:${"0".repeat(64)}`],
    ["trusted_status", "confirmed"],
  ] as const)("authority rowの%s driftをreplayでfail-closeする", (column, value) => {
    const db = fixture();
    const transaction = new GenesisRebaseMigrationTransaction(db);
    expect(transaction.migrate(input())).toMatchObject({ ok: true, replayed: false });
    const guards = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'genesis_rebase_migrations'",
      )
      .all();
    for (const guard of guards) db.exec(`DROP TRIGGER ${String(guard.name)}`);
    db.prepare(`UPDATE genesis_rebase_migrations SET ${column} = ?`).run(value);

    expect(transaction.migrate(input())).toEqual({
      ok: false,
      ruleId: "genesis-rebase-replay-binding-invalid",
    });
  });

  it("U-PA-REBASE-011: same command/same payloadはreplayし、changed payloadはconflictにする", () => {
    const db = fixture();
    const transaction = new GenesisRebaseMigrationTransaction(db);
    const first = transaction.migrate(input());
    expect(transaction.migrate(input())).toEqual({ ...first, replayed: true });
    expect(transaction.migrate({ ...input(), reason: "changed" })).toEqual({
      ok: false,
      ruleId: "genesis-rebase-command-conflict",
    });
    expect(count(db, "genesis_rebase_migrations")).toBe(1);
    db.prepare("UPDATE plan_aliases SET last_event_digest = ? WHERE alias = ?").run(
      sha("drift"),
      "PLAN-RECOVERY-16",
    );
    expect(transaction.migrate(input())).toEqual({
      ok: false,
      ruleId: "genesis-rebase-replay-binding-invalid",
    });
  });

  it("replay前にsuccessor asset rowが改変されていればfail-closeする", () => {
    const db = fixture();
    const transaction = new GenesisRebaseMigrationTransaction(db);
    expect(transaction.migrate(input())).toMatchObject({ ok: true, replayed: false });
    const guards = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'plan_assets'")
      .all();
    for (const guard of guards) db.exec(`DROP TRIGGER ${String(guard.name)}`);
    db.prepare("UPDATE plan_assets SET created_source_commit = ? WHERE asset_id = ?").run(
      "0".repeat(40),
      "plan:recovery-16-genesis-rebase",
    );
    expect(transaction.migrate(input())).toEqual({
      ok: false,
      ruleId: "genesis-rebase-replay-binding-invalid",
    });
  });

  it("self-consistentな任意comment本文をtransaction境界で拒否する", () => {
    const db = fixture();
    const valid = input();
    const forgedBody = [
      "<!-- ut-tdd:genesis-rebase/issue102-seal/v1 -->",
      "```json",
      '{"command_id":"forged","version":1}',
      "```",
    ].join("\n");
    const forged = {
      ...valid,
      commentGroup: {
        ...valid.commentGroup,
        members: [
          {
            ...valid.commentGroup.members[0],
            commentBody: forgedBody,
            commentBodyDigest: sha(forgedBody),
          },
          valid.commentGroup.members[1],
        ] as const,
      },
    };
    expect(new GenesisRebaseMigrationTransaction(db).migrate(forged)).toEqual({
      ok: false,
      ruleId: "genesis-rebase-input-invalid",
    });
    expect(count(db, "genesis_rebase_migrations")).toBe(0);
  });

  it("replay時にcomment member payloadが改変されていればfail-closeする", () => {
    const db = fixture();
    const transaction = new GenesisRebaseMigrationTransaction(db);
    expect(transaction.migrate(input())).toMatchObject({ ok: true, replayed: false });
    const guards = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'genesis_rebase_comment_members'",
      )
      .all();
    for (const guard of guards) db.exec(`DROP TRIGGER ${String(guard.name)}`);
    const forged = '{"forged":true}';
    db.prepare(
      "UPDATE genesis_rebase_comment_members SET target_json = ?, target_digest = ? WHERE ordinal = 1",
    ).run(forged, sha(forged));
    expect(transaction.migrate(input())).toEqual({
      ok: false,
      ruleId: "genesis-rebase-replay-binding-invalid",
    });
  });

  it.each<GenesisRebaseMigrationBoundary>([
    "asset",
    "revision",
    "alias-assign",
    "admission-event",
    "admission-receipt",
    "custody",
    "migration",
    "certificate",
    "comment-outbox",
    "command-receipt",
  ])("U-PA-REBASE-012: %s faultで全writeをrollbackし旧revisionを保持する", (boundary) => {
    const db = fixture();
    const before = historicalRows(db);
    const transaction = new GenesisRebaseMigrationTransaction(db, {
      after(candidate) {
        if (candidate === boundary) throw new Error(`fault:${candidate}`);
      },
    });
    expect(() => transaction.migrate(input())).toThrow(`fault:${boundary}`);
    expect(historicalRows(db)).toEqual(before);
    expect(count(db, "plan_assets")).toBe(0);
    expect(count(db, "genesis_rebase_migrations")).toBe(0);
    expect(count(db, "genesis_rebase_migration_certificates")).toBe(0);
    expect(count(db, "genesis_issue_custody")).toBe(0);
    expect(count(db, "plan_admission_events")).toBe(0);
    expect(count(db, "plan_admission_receipts")).toBe(0);
    expect(count(db, "append_command_receipts")).toBe(0);
    expect(count(db, "genesis_rebase_comment_groups")).toBe(0);
    expect(count(db, "plan_aliases")).toBe(0);
  });

  it("U-PA-REBASE-013: revision sealの欠落・順序差・digest欠落を推測で補完せず拒否する", () => {
    const db = fixture();
    const valid = input();
    for (const historicalRevisions of [
      valid.historicalRevisions.slice(0, 4),
      [...valid.historicalRevisions.slice(0, 2).reverse(), ...valid.historicalRevisions.slice(2)],
      valid.historicalRevisions.map((row, index) =>
        index === 2 ? { ...row, canonicalPayloadDigest: "" } : row,
      ),
    ]) {
      expect(
        new GenesisRebaseMigrationTransaction(db).migrate({
          ...valid,
          commandId: `migration:${historicalRevisions.length}:${historicalRevisions[0]?.revision}`,
          historicalRevisions,
        }),
      ).toMatchObject({ ok: false });
    }
    expect(count(db, "plan_assets")).toBe(0);
  });

  it.each([
    "asset",
    "revision",
    "alias",
    "alias-event",
  ] as const)("旧%sが1件でも存在すればpartial-state conflictで何も生成しない", (kind) => {
    const db = fixture();
    seedHistoricalPartial(db, kind);
    expect(new GenesisRebaseMigrationTransaction(db).migrate(input())).toEqual({
      ok: false,
      ruleId: "genesis-rebase-historical-partial-state",
    });
    expect(
      db
        .prepare("SELECT 1 FROM plan_assets WHERE asset_id = ?")
        .get("plan:recovery-16-genesis-rebase"),
    ).toBeUndefined();
    expect(count(db, "genesis_rebase_migrations")).toBe(0);
  });
});

function fixture(): HarnessDb {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: LEDGER_SCHEMA_VERSION });
  return db;
}

function seedHistoricalPartial(
  db: HarnessDb,
  kind: "asset" | "revision" | "alias" | "alias-event",
): void {
  db.exec("PRAGMA foreign_keys = OFF");
  if (kind === "asset" || kind === "revision")
    db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
      "plan:historical-recovery-16",
      NOW,
      "a".repeat(40),
      "historical-v1",
    );
  if (kind === "revision")
    db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "plan:historical-recovery-16",
      1,
      "{}",
      sha("{}"),
      sha("body"),
      PATH,
      "a".repeat(40),
      "historical",
      "partial",
      NOW,
    );
  if (kind === "alias")
    db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
      "alias:partial",
      "plan:historical-recovery-16",
      "PLAN-RECOVERY-16",
      1,
      null,
      sha("alias"),
    );
  if (kind === "alias-event")
    db.prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "alias-event:partial",
      "plan:historical-recovery-16",
      1,
      "command:partial",
      sha("command"),
      "assigned",
      "PLAN-RECOVERY-16",
      1,
      "partial",
      NOW,
      sha("event"),
    );
  db.exec("PRAGMA foreign_keys = ON");
}

function input(): GenesisRebaseMigrationInput {
  const canonicalPayloadJson = '{"plan_id":"PLAN-RECOVERY-16-GENESIS","status":"draft"}';
  return {
    commandId: "genesis-rebase:issue-143:recovery-16",
    historicalAssetId: "plan:historical-recovery-16",
    historicalRevisions: Array.from({ length: 5 }, (_, index) => ({
      revision: index + 1,
      canonicalPayloadDigest: sha(`payload-${index + 1}`),
      bodyDigest: sha("body"),
      sourcePath: PATH,
      sourceCommit: String(index + 1).repeat(40),
    })),
    historicalProjectionPath: "docs/governance/plan-admission-receipts.json",
    historicalProjectionBlobOid: "e".repeat(40),
    historicalProjectionContentDigest: sha("tracked-projection"),
    historicalProjectionTailDigest: sha("projection-tail-revision-5"),
    newAssetId: "plan:recovery-16-genesis-rebase",
    newPlanId: "PLAN-RECOVERY-16",
    canonicalPayloadJson,
    canonicalPayloadDigest: sha(canonicalPayloadJson),
    bodyDigest: sha("new-body"),
    sourcePath: "docs/plans/PLAN-RECOVERY-16-GENESIS.md",
    sourceCommit: "f".repeat(40),
    actor: "recovery:test",
    reason: "seal revisions 1..5 and rebase from an explicit preimage",
    occurredAt: NOW,
    authoritativeCertificate: {
      certificateId: "migration:authoritative-recovery-16",
      certificateJson: '{"certificate":"authoritative"}',
      certificateDigest: `sha256:${sha("authoritative-certificate")}`,
      sourceAuthorityDigest: `sha256:${sha("source-authority")}`,
      reviewedImplementationAuthorityDigest: `sha256:${sha("reviewed-authority")}`,
      trustedStatus: "draft",
    },
    commentGroup: createGenesisRebaseCommentGroup({
      commandId: "genesis-rebase:issue-143:recovery-16",
      commandPayloadDigest: "pending-local-derivation",
      groupId: "comments:genesis-rebase:issue-143:recovery-16",
      issue102: {
        issueNodeId: "I-102",
        issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/102",
        issueBodyDigest: "1".repeat(64),
        issueVersion: "v1",
      },
      issue143: {
        issueNodeId: "I_kwDOSkkE9M8AAAABJ2W8Aw",
        issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/143",
        issueBodyDigest: "88bc7746036283c0abfeaca70ecdde01cc499383d85c8e62636fd65989fbe3a9",
        issueVersion: "2026-07-23T06:04:27Z",
      },
      metadata: {
        repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
        source_commit: "f".repeat(40),
        reviewed_implementation_commit: "d".repeat(40),
        predecessor_asset: "plan:historical-recovery-16",
        predecessor_revision_first: 1,
        predecessor_revision_last: 5,
        predecessor_terminal_record_digest: `sha256:${"2".repeat(64)}`,
        successor_asset: "plan:recovery-16-genesis-rebase",
        successor_revision: 1,
        projection_preimage_digest: `sha256:${sha("projection-tail-revision-5")}`,
        issue102_body_digest: `sha256:${"1".repeat(64)}`,
        issue143_body_digest:
          "sha256:88bc7746036283c0abfeaca70ecdde01cc499383d85c8e62636fd65989fbe3a9",
        migration_certificate_id: "migration:authoritative-recovery-16",
        migration_certificate_digest: `sha256:${sha("authoritative-certificate")}`,
        inference_forbidden: true,
        drive: "recovery",
      },
    }),
    issue: {
      number: 143,
      nodeId: "I_kwDOSkkE9M8AAAABJ2W8Aw",
      bodyDigest: "88bc7746036283c0abfeaca70ecdde01cc499383d85c8e62636fd65989fbe3a9",
      observedRevision: "2026-07-23T06:04:27Z",
      episodeId: "E4-143",
      branch: "work/redesign-planasset-genesis-adoption",
    },
  };
}

function historicalRows(db: HarnessDb): unknown[] {
  return db
    .prepare("SELECT * FROM plan_revisions WHERE asset_id = ? ORDER BY revision")
    .all("plan:historical-recovery-16");
}

function count(db: HarnessDb, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const PATH = "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md";
const NOW = "2026-07-23T06:04:27.000Z";
