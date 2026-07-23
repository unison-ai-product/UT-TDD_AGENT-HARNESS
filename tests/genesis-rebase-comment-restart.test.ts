import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NodeGhGenesisRebaseCommentAdapter } from "../src/plan-asset/adapters/node-gh-genesis-rebase-comment-adapter.js";
import { SqliteGenesisRebaseCommentOutbox } from "../src/plan-asset/adapters/sqlite-genesis-rebase-comment-outbox.js";
import {
  createGenesisRebaseCommentGroup,
  GenesisRebaseCommentProjectionRunner,
} from "../src/plan-asset/application/genesis-rebase-comment-projection.js";
import {
  deriveMigrationCertificate,
  deriveRebaseAssetId,
} from "../src/plan-asset/domain/plan-asset-migration-certificate.js";
import {
  ledgerRowDigest,
  migratePlanLedger,
  openPlanLedger,
} from "../src/plan-asset/ledger/schema.js";

const roots: string[] = [];
afterEach(() =>
  roots.splice(0).forEach((root) => {
    rmSync(root, { recursive: true, force: true });
  }),
);

describe("durable genesis rebase comment outbox", () => {
  it("U-PA-REBASE-040: close/reopen後もsame groupをresumeしduplicate createしない", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-rebase-comments-"));
    roots.push(root);
    const group = fixture();
    const comments = new Map<number, { nodeId: string; url: string; body: string }[]>();
    const github = fakeGithub(group, comments);

    const firstDb = openPlanLedger({ repoRoot: root });
    const firstStore = new SqliteGenesisRebaseCommentOutbox(firstDb);
    seedMigration(firstDb, group);
    firstStore.prepare(group);
    firstDb.close();
    comments.set(102, [
      {
        nodeId: "IC-102",
        url: `${group.members[0].issueUrl}#c`,
        body: group.members[0].commentBody,
      },
    ]);

    const secondDb = openPlanLedger({ repoRoot: root });
    const secondStore = new SqliteGenesisRebaseCommentOutbox(secondDb);
    expect(secondStore.loadGroup(group.groupId)).toEqual(group);
    const result = new GenesisRebaseCommentProjectionRunner(
      secondStore,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(result.state).toBe("projected");
    expect(secondStore.read(group.groupId)).toEqual({
      state: "projected",
      memberStates: ["projected", "projected"],
    });
    expect(github.createComment).toHaveBeenCalledTimes(1);
    secondDb.close();

    const thirdDb = openPlanLedger({ repoRoot: root });
    const thirdStore = new SqliteGenesisRebaseCommentOutbox(thirdDb);
    const before = {
      members: thirdDb
        .prepare(
          "SELECT state, claim_generation FROM genesis_rebase_comment_members ORDER BY ordinal",
        )
        .all(),
      groups: thirdDb.prepare("SELECT state, generation FROM genesis_rebase_comment_groups").all(),
      events: countRows(thirdDb, "genesis_rebase_comment_events"),
    };
    new GenesisRebaseCommentProjectionRunner(
      thirdStore,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    expect(github.createComment).toHaveBeenCalledTimes(1);
    expect({
      members: thirdDb
        .prepare(
          "SELECT state, claim_generation FROM genesis_rebase_comment_members ORDER BY ordinal",
        )
        .all(),
      groups: thirdDb.prepare("SELECT state, generation FROM genesis_rebase_comment_groups").all(),
      events: countRows(thirdDb, "genesis_rebase_comment_events"),
    }).toEqual(before);
    thirdDb.close();
  });

  it.each([
    ["event", "UPDATE genesis_rebase_comment_events SET event_digest = ?"],
    ["group", "UPDATE genesis_rebase_comment_groups SET group_digest = ?"],
    ["member", "UPDATE genesis_rebase_comment_members SET target_digest = ?"],
  ])("U-PA-REBASE-041: v12 comment %s digest tamperはledgerをfail-closeする", (_kind, sql) => {
    const { db } = preparedStore();
    const triggers =
      _kind === "event"
        ? db
            .prepare(
              "SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'genesis_rebase_comment_events'",
            )
            .all()
        : [];
    for (const trigger of triggers) db.exec(`DROP TRIGGER ${String(trigger.name)}`);
    db.prepare(sql).run("0".repeat(64));
    for (const trigger of triggers) db.exec(String(trigger.sql));
    expect(migratePlanLedger(db)).toEqual({
      ok: false,
      ruleId: "plan-ledger-unavailable",
    });
    db.close();
  });

  it.each([
    ["custody", "genesis_issue_custody", "custody_digest"],
    ["migration", "genesis_rebase_migrations", "migration_digest"],
    ["certificate", "genesis_rebase_migration_certificates", "certificate_digest"],
  ])("U-PA-REBASE-045: current v12 %s tamperはclose/reopen検証とoutbox起動をfail-closeする", (_kind, table, column) => {
    const { db, group } = preparedStore();
    disableUpdateGuards(db, table);
    db.prepare(`UPDATE ${table} SET ${column} = ?`).run(
      column === "certificate_digest" ? `sha256:${"0".repeat(64)}` : "0".repeat(64),
    );
    expect(migratePlanLedger(db)).toEqual({
      ok: false,
      ruleId: "plan-ledger-unavailable",
    });
    expect(() => new SqliteGenesisRebaseCommentOutbox(db)).toThrow("plan-ledger-unavailable");
    expect(
      db
        .prepare("SELECT group_id FROM genesis_rebase_comment_groups WHERE group_id = ?")
        .get(group.groupId),
    ).toBeDefined();
    db.close();
  });

  it("U-PA-REBASE-042: stale member generationは更新0件でstable conflictし全変更をrollbackする", () => {
    const { db, group, store } = preparedStore();
    expect(() =>
      store.markMember(group.groupId, "issue102_seal", "projected", undefined, 1),
    ).toThrow("genesis-rebase-comment-member-cas-rejected");
    expect(
      db
        .prepare(
          "SELECT state, claim_generation FROM genesis_rebase_comment_members WHERE group_id = ? AND member_kind = ?",
        )
        .get(group.groupId, "issue102_seal"),
    ).toMatchObject({ state: "pending", claim_generation: 0 });
    expect(countRows(db, "genesis_rebase_comment_events")).toBe(1);
    db.close();
  });

  it("U-PA-REBASE-043: stale group generationは更新0件でstable conflictしterminal eventを残さない", () => {
    const { db, group, store } = preparedStore();
    store.markMember(group.groupId, "issue102_seal", "projected");
    store.markMember(group.groupId, "issue143_metadata", "projected");
    expect(() => store.markGroup(group.groupId, "projected", 1)).toThrow(
      "genesis-rebase-comment-group-cas-rejected",
    );
    expect(
      db
        .prepare("SELECT state, generation FROM genesis_rebase_comment_groups WHERE group_id = ?")
        .get(group.groupId),
    ).toMatchObject({ state: "pending", generation: 0 });
    expect(countRows(db, "genesis_rebase_comment_events")).toBe(3);
    db.close();
  });

  it("U-PA-REBASE-035: active durable claimを持つ別ownerはremoteへ到達しない", () => {
    const { db, group, store } = preparedStore();
    expect(
      store.claimMember(group.groupId, "issue102_seal", {
        ownerToken: "owner-a",
        claimedAt: "2026-07-23T07:00:00.000Z",
        expiresAt: "2026-07-23T07:01:15.000Z",
      }),
    ).toMatchObject({ ownerToken: "owner-a", generation: 1 });
    const project = vi.fn();
    expect(() =>
      new GenesisRebaseCommentProjectionRunner(
        store,
        { project },
        {
          ownerToken: () => "owner-b",
          now: () => "2026-07-23T07:00:30.000Z",
          leaseMs: 75_000,
        },
      ).run(group),
    ).toThrow("genesis-rebase-comment-member-claim-active");
    expect(project).not.toHaveBeenCalled();
    db.close();
  });

  it("U-PA-REBASE-036: expired claimだけをgeneration CASでtakeoverできる", () => {
    const { db, group, store } = preparedStore();
    store.claimMember(group.groupId, "issue102_seal", {
      ownerToken: "owner-a",
      claimedAt: "2026-07-23T07:00:00.000Z",
      expiresAt: "2026-07-23T07:01:15.000Z",
    });
    expect(
      store.claimMember(group.groupId, "issue102_seal", {
        ownerToken: "owner-b",
        claimedAt: "2026-07-23T07:01:15.001Z",
        expiresAt: "2026-07-23T07:02:30.001Z",
      }),
    ).toMatchObject({ ownerToken: "owner-b", generation: 2 });
    db.close();
  });

  it("U-PA-REBASE-037: projected後のremote driftをdurable recovery_requiredへ遷移する", () => {
    const { db, group, store } = preparedStore();
    const comments = new Map<number, { nodeId: string; url: string; body: string }[]>();
    const github = fakeGithub(group, comments);
    new GenesisRebaseCommentProjectionRunner(
      store,
      new NodeGhGenesisRebaseCommentAdapter(github),
    ).run(group);
    const postsBeforeDrift = github.createComment.mock.calls.length;
    github.getIssue.mockImplementation(({ issueNumber }: { issueNumber: number }) => {
      const member = group.members.find((candidate) => candidate.issueNumber === issueNumber);
      if (!member) throw new Error("missing member");
      return {
        nodeId: member.issueNodeId,
        url: member.issueUrl,
        bodyDigest: issueNumber === 143 ? "0".repeat(64) : member.issueBodyDigest,
        version: member.issueVersion,
      };
    });
    expect(
      new GenesisRebaseCommentProjectionRunner(
        store,
        new NodeGhGenesisRebaseCommentAdapter(github),
      ).run(group),
    ).toMatchObject({ state: "recovery_required", recoveryRequired: 1 });
    expect(store.read(group.groupId)).toEqual({
      state: "recovery_required",
      memberStates: ["projected", "recovery_required"],
    });
    expect(github.createComment).toHaveBeenCalledTimes(postsBeforeDrift);
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM genesis_rebase_comment_events
           WHERE event_kind = 'member_recovery_required'`,
        )
        .get()?.count,
    ).toBe(1);
    db.close();
  });

  it("U-PA-REBASE-050: populated v12 member rowをv13へ値不変で移行する", () => {
    const { db, group } = preparedStore();
    const before = db
      .prepare(
        `SELECT group_id, member_kind, ordinal, target_json, target_digest, state,
                claim_generation, claim_owner_token, claim_expires_at,
                remote_comment_node_id, remote_comment_url, updated_at
         FROM genesis_rebase_comment_members ORDER BY ordinal`,
      )
      .all();
    db.exec("DROP INDEX idx_genesis_rebase_comment_members_state");
    db.exec("ALTER TABLE genesis_rebase_comment_members RENAME TO members_v13");
    db.exec(`CREATE TABLE genesis_rebase_comment_members (
      group_id TEXT NOT NULL, member_kind TEXT NOT NULL, ordinal INTEGER NOT NULL,
      target_json TEXT NOT NULL, target_digest TEXT NOT NULL, state TEXT NOT NULL,
      claim_generation INTEGER NOT NULL, claim_owner_token TEXT, claim_expires_at TEXT,
      remote_comment_node_id TEXT, remote_comment_url TEXT, updated_at TEXT NOT NULL,
      PRIMARY KEY (group_id, member_kind), UNIQUE (group_id, ordinal),
      CHECK (member_kind IN ('issue102_seal','issue143_metadata')),
      CHECK (state IN ('pending','projected','recovery_required')),
      FOREIGN KEY (group_id) REFERENCES genesis_rebase_comment_groups(group_id) ON DELETE RESTRICT
    )`);
    db.exec(
      `INSERT INTO genesis_rebase_comment_members
       SELECT group_id, member_kind, ordinal, target_json, target_digest, state,
              claim_generation, claim_owner_token, claim_expires_at,
              remote_comment_node_id, remote_comment_url, updated_at FROM members_v13`,
    );
    db.exec("DROP TABLE members_v13");
    db.exec(
      "CREATE INDEX idx_genesis_rebase_comment_members_state ON genesis_rebase_comment_members(state)",
    );
    db.setUserVersion(12);
    expect(migratePlanLedger(db)).toEqual({ ok: true, version: 13 });
    expect(
      db
        .prepare(
          `SELECT group_id, member_kind, ordinal, target_json, target_digest, state,
                  claim_generation, claim_owner_token, claim_expires_at,
                  remote_comment_node_id, remote_comment_url, updated_at
           FROM genesis_rebase_comment_members ORDER BY ordinal`,
        )
        .all(),
    ).toEqual(before);
    expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM genesis_rebase_comment_members
           WHERE create_intent_owner_token IS NOT NULL
              OR create_intent_generation IS NOT NULL OR create_intent_at IS NOT NULL`,
        )
        .get()?.count,
    ).toBe(0);
    expect(storeGroupExists(db, group.groupId)).toBe(true);
    db.close();
  });

  it("U-PA-REBASE-047: owner A pause→B takeover→A resumeでもPOSTは最大1回", () => {
    const { db, group, store } = preparedStore();
    const comments = new Map<number, { nodeId: string; url: string; body: string }[]>();
    const github = fakeGithub(group, comments);
    const ownerA = store.claimMember(group.groupId, "issue102_seal", {
      ownerToken: "owner-a",
      claimedAt: "2026-07-23T07:00:00.000Z",
      expiresAt: "2026-07-23T07:01:15.000Z",
    });
    const ownerB = store.claimMember(group.groupId, "issue102_seal", {
      ownerToken: "owner-b",
      claimedAt: "2026-07-23T07:01:15.001Z",
      expiresAt: "2026-07-23T07:03:45.001Z",
    });
    if (!ownerA || !ownerB) throw new Error("test claim missing");
    const adapter = new NodeGhGenesisRebaseCommentAdapter(github);
    expect(
      adapter.project(
        group.members[0],
        () =>
          store.authorizeCreate(
            group.groupId,
            "issue102_seal",
            ownerA,
            "2026-07-23T07:01:15.002Z",
          ) === "create",
      ),
    ).toEqual({ state: "recovery_required" });
    expect(
      adapter.project(
        group.members[0],
        () =>
          store.authorizeCreate(
            group.groupId,
            "issue102_seal",
            ownerB,
            "2026-07-23T07:01:15.003Z",
          ) === "create",
      ),
    ).toMatchObject({ state: "projected" });
    expect(github.createComment).toHaveBeenCalledTimes(1);
    db.close();
  });

  it("U-PA-REBASE-048: POST途中crash後はGET再調停だけでduplicateを作らない", () => {
    const { db, group, store } = preparedStore();
    const comments = new Map<number, { nodeId: string; url: string; body: string }[]>();
    const github = fakeGithub(group, comments);
    github.createComment.mockImplementationOnce(
      ({ issueNumber, body }: { issueNumber: number; body: string }) => {
        const member = group.members[0];
        comments.set(issueNumber, [{ nodeId: "IC-ambiguous", url: `${member.issueUrl}#c`, body }]);
        throw new Error("connection-lost-after-post");
      },
    );
    new GenesisRebaseCommentProjectionRunner(store, new NodeGhGenesisRebaseCommentAdapter(github), {
      ownerToken: () => "owner-a",
      now: () => "2026-07-23T07:00:00.000Z",
      leaseMs: 150_000,
    }).run(group);
    new GenesisRebaseCommentProjectionRunner(store, new NodeGhGenesisRebaseCommentAdapter(github), {
      ownerToken: () => "owner-b",
      now: () => "2026-07-23T07:03:00.000Z",
      leaseMs: 150_000,
    }).run(group);
    expect(github.createComment).toHaveBeenCalledTimes(2);
    expect(comments.get(102)).toHaveLength(1);
    db.close();
  });

  it("U-PA-REBASE-046: migrationに対するcomment outbox欠落はreopenでfail-closeする", () => {
    const { db } = preparedStore();
    for (const table of [
      "genesis_rebase_comment_events",
      "genesis_rebase_comment_members",
      "genesis_rebase_comment_groups",
    ])
      disableUpdateGuards(db, table);
    db.exec("PRAGMA foreign_keys = OFF");
    db.prepare("DELETE FROM genesis_rebase_comment_events").run();
    db.prepare("DELETE FROM genesis_rebase_comment_members").run();
    db.prepare("DELETE FROM genesis_rebase_comment_groups").run();
    db.exec("PRAGMA foreign_keys = ON");
    expect(migratePlanLedger(db)).toEqual({
      ok: false,
      ruleId: "plan-ledger-unavailable",
    });
    db.close();
  });
});

function preparedStore() {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-rebase-comment-attack-"));
  roots.push(root);
  const group = fixture();
  const db = openPlanLedger({ repoRoot: root });
  const store = new SqliteGenesisRebaseCommentOutbox(db);
  seedMigration(db, group);
  store.prepare(group);
  return { db, group, store };
}

function countRows(db: ReturnType<typeof openPlanLedger>, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count);
}

function storeGroupExists(db: ReturnType<typeof openPlanLedger>, groupId: string): boolean {
  return Boolean(
    db
      .prepare("SELECT 1 AS present FROM genesis_rebase_comment_groups WHERE group_id = ?")
      .get(groupId),
  );
}

function disableUpdateGuards(db: ReturnType<typeof openPlanLedger>, table: string): void {
  const triggers = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ?")
    .all(table);
  for (const trigger of triggers) db.exec(`DROP TRIGGER ${String(trigger.name)}`);
}

function fixture() {
  const authoritativeCertificate = certificate();
  return createGenesisRebaseCommentGroup({
    commandId: "genesis-rebase:recovery-16",
    commandPayloadDigest: "6".repeat(64),
    groupId: "projection-group:recovery-16",
    issue102: {
      issueNodeId: "I-102",
      issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/102",
      issueBodyDigest: "1".repeat(64),
      issueVersion: "v102",
    },
    issue143: {
      issueNodeId: "I-143",
      issueUrl: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/143",
      issueBodyDigest: "2".repeat(64),
      issueVersion: "v143",
    },
    metadata: {
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      source_commit: "a".repeat(40),
      predecessor_asset: "plan:historical",
      predecessor_revision_first: 1,
      predecessor_revision_last: 5,
      predecessor_terminal_record_digest: "1".repeat(64),
      successor_asset: successorAssetId(),
      successor_revision: 1,
      projection_preimage_digest: "2".repeat(64),
      issue102_body_digest: "3".repeat(64),
      issue143_body_digest: "4".repeat(64),
      migration_certificate_id: authoritativeCertificate.certificateId,
      migration_certificate_digest: authoritativeCertificate.certificateDigest,
      inference_forbidden: true,
      drive: "recovery",
    },
  });
}

function seedMigration(
  db: ReturnType<typeof openPlanLedger>,
  group: ReturnType<typeof fixture>,
): void {
  const now = "2026-07-23T06:04:27.000Z";
  const authoritativeCertificate = certificate();
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    successorAssetId(),
    now,
    "a".repeat(40),
    "test",
  );

  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    successorAssetId(),
    1,
    "{}",
    createHash("sha256").update("{}").digest("hex"),
    "b".repeat(64),
    "docs/plans/test.md",
    "a".repeat(40),
    "test",
    "test",
    now,
  );
  const custody = {
    command_id: group.commandId,
    issue_number: 143,
    episode_id: "E4-143",
    drive_model: "recovery",
    issue_preimage_digest: "4".repeat(64),
    plan_asset_id: successorAssetId(),
    plan_revision: 1,
    custody_state: "committed",
    recorded_at: now,
  };
  db.prepare("INSERT INTO genesis_issue_custody VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(custody),
    ledgerRowDigest(custody, "custody_digest"),
  );
  const migration = {
    command_id: group.commandId,
    command_payload_digest: group.commandPayloadDigest,
    historical_asset_id: "plan:historical",
    historical_authority_kind: "tracked_projection",
    historical_projection_path: "docs/governance/plan-admission-receipts.json",
    historical_projection_blob_oid: "b".repeat(40),
    historical_projection_content_digest: "c".repeat(64),
    historical_projection_tail_record_digest: "d".repeat(64),
    historical_first_revision: 1,
    historical_last_revision: 5,
    historical_seal_json: "[]",
    historical_seal_digest: createHash("sha256").update("[]").digest("hex"),
    authoritative_certificate_digest: group.migrationCertificateDigest,
    new_asset_id: successorAssetId(),
    new_revision: 1,
    migration_certificate_id: group.migrationCertificateId,
    migration_certificate_digest: group.migrationCertificateDigest,
    occurred_at: now,
  };
  db.prepare(
    `INSERT INTO genesis_rebase_migrations VALUES (${Object.keys(migration)
      .map(() => "?")
      .join(", ")}, ?)`,
  ).run(...Object.values(migration), ledgerRowDigest(migration, "migration_digest"));
  db.prepare("INSERT INTO genesis_rebase_migration_certificates VALUES (?, ?, ?, ?, ?, ?)").run(
    group.migrationCertificateId,
    group.commandId,
    group.commandPayloadDigest,
    stable(authoritativeCertificate),
    group.migrationCertificateDigest,
    now,
  );
}

function certificate() {
  const identity = certificateIdentity();
  return deriveMigrationCertificate({
    commandId: "genesis-rebase:recovery-16",
    identity,
    predecessorRevisionRange: [1, 5],
    successorAssetId: deriveRebaseAssetId(identity),
    successorRevision: 1,
    issue102BodyDigest: `sha256:${"3".repeat(64)}`,
    custodyIssueNumber: 143,
    custodyIssueBodyDigest: `sha256:${"4".repeat(64)}`,
    custodyProjectionDigest: `sha256:${"5".repeat(64)}`,
    projectionPreimageDigest: `sha256:${"d".repeat(64)}`,
    decision: "PO_A_seal_history_and_rebase",
  });
}

function certificateIdentity() {
  return {
    algorithm: "ut-tdd-plan-rebase-v1" as const,
    repositoryIdentity: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    planId: "PLAN-RECOVERY-16-plan-revision-authoring",
    historicalAssetId: "plan:historical",
    historicalTerminalRevision: 5,
    historicalTerminalRecordDigest: `sha256:${"1".repeat(64)}` as const,
    sourceCommit: "a".repeat(40),
    sourceBlobOid: "b".repeat(40),
  };
}

function successorAssetId(): string {
  return deriveRebaseAssetId(certificateIdentity());
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function fakeGithub(
  group: ReturnType<typeof fixture>,
  comments: Map<number, { nodeId: string; url: string; body: string }[]>,
) {
  return {
    getIssue: vi.fn(({ issueNumber }: { issueNumber: number }) => {
      const member = group.members.find((candidate) => candidate.issueNumber === issueNumber);
      if (!member) throw new Error("missing member");
      return {
        nodeId: member.issueNodeId,
        url: member.issueUrl,
        bodyDigest: member.issueBodyDigest,
        version: member.issueVersion,
      };
    }),
    listComments: vi.fn(
      ({ issueNumber }: { issueNumber: number }) => comments.get(issueNumber) ?? [],
    ),
    createComment: vi.fn(({ issueNumber, body }: { issueNumber: number; body: string }) => {
      const member = group.members.find((candidate) => candidate.issueNumber === issueNumber);
      if (!member) throw new Error("missing member");
      const comment = { nodeId: `IC-${issueNumber}`, url: `${member.issueUrl}#c`, body };
      comments.set(issueNumber, [comment]);
      return comment;
    }),
  };
}
