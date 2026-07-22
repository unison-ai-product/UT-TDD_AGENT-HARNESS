import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ForwardEscapeIssueAdoptionPort } from "../../src/execution/forward-escape";
import { SqliteForwardEscapeJournal } from "../../src/execution/sqlite-forward-escape-journal";
import { SqliteGenesisAdoptionProjectionAdapter } from "../../src/plan-asset/adapters/sqlite-genesis-adoption-projection-adapter";
import { openHarnessDb } from "../../src/state-db";
import { migrate } from "../../src/state-db/migration";
import { removeTestTree } from "../support/temp-tree";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

describe("SQLite genesis adoption projection adapter", () => {
  it("U-GEN-015: close/reopen後にrecovery_requiredを再送してprojectedへ一度だけ収束する", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-genesis-outbox-"));
    const dbPath = join(root, ".ut-tdd", "harness.db");
    mkdirSync(join(root, ".ut-tdd"), { recursive: true });
    const issueBody = "# Genesis adoption\n";
    let failures = 1;
    let commentPosts = 0;
    const comments = new Map<string, ReturnType<typeof comment>>();
    const port = adoptionPort(issueBody, (request) => {
      expect(request.body).toContain(
        `<!-- ut-tdd:forward-escape-adoption/v1 ${request.idempotency_key} -->`,
      );
      if (failures-- > 0) return { ok: false as const, reason: "offline" };
      const prior = comments.get(request.idempotency_key);
      if (prior) return { ok: true as const, comment: prior };
      commentPosts += 1;
      const value = comment(request.body_digest);
      comments.set(request.idempotency_key, value);
      return { ok: true as const, comment: value };
    });
    const input = dispatchInput(issueBody);

    let db = openHarnessDb(dbPath, { repoRoot: root });
    migrate(db);
    let adapter = new SqliteGenesisAdoptionProjectionAdapter(db, {
      repository: "owner/repository",
      port,
    });
    expect(adapter.dispatch(input)).toEqual({ durable: true, state: "recovery_required" });
    db.close();

    db = openHarnessDb(dbPath, { repoRoot: root });
    migrate(db);
    adapter = new SqliteGenesisAdoptionProjectionAdapter(db, {
      repository: "owner/repository",
      port,
    });
    expect(adapter.dispatch(input)).toEqual({ durable: true, state: "projected" });
    expect(adapter.dispatch(input)).toEqual({ durable: true, state: "projected" });
    expect(commentPosts).toBe(1);
    db.close();
    removeTestTree(root);
  });

  it("U-GEN-016: 同じcommandのpayload conflictをremote write前にfail-closeする", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-genesis-conflict-"));
    const dbPath = join(root, ".ut-tdd", "harness.db");
    mkdirSync(join(root, ".ut-tdd"), { recursive: true });
    const body = "# Original\n";
    let remoteCalls = 0;
    const db = openHarnessDb(dbPath, { repoRoot: root });
    migrate(db);
    const adapter = new SqliteGenesisAdoptionProjectionAdapter(db, {
      repository: "owner/repository",
      port: adoptionPort(body, (request) => {
        remoteCalls += 1;
        return { ok: true, comment: comment(request.body_digest) };
      }),
    });
    expect(adapter.dispatch(dispatchInput(body))).toEqual({ durable: true, state: "projected" });
    expect(() => adapter.dispatch(dispatchInput("# Substituted\n"))).toThrow(
      "genesis-adoption-command-payload-mismatch",
    );
    expect(remoteCalls).toBe(1);
    db.close();
    removeTestTree(root);
  });

  it("U-GEN-030: queuedとadoptedの間のremote callbackはHARNESS writer lockを保持しない", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-genesis-remote-boundary-"));
    const dbPath = join(root, ".ut-tdd", "harness.db");
    mkdirSync(join(root, ".ut-tdd"), { recursive: true });
    const body = "# Remote boundary\n";
    const primary = openHarnessDb(dbPath, { repoRoot: root });
    migrate(primary);
    try {
      const adapter = new SqliteGenesisAdoptionProjectionAdapter(primary, {
        repository: "owner/repository",
        port: adoptionPort(body, (request) => {
          const concurrent = openHarnessDb(dbPath, { repoRoot: root });
          try {
            // 旧実装ではadapterのrunExclusiveがwriter lockを保持するため、ここがSQLITE_BUSYになる。
            new SqliteForwardEscapeJournal(concurrent).issue({
              command_id: "genesis:concurrent",
              payload_digest: "a".repeat(64),
            });
          } finally {
            concurrent.close();
          }
          return { ok: true, comment: comment(request.body_digest) };
        }),
      });

      expect(adapter.dispatch(dispatchInput(body))).toEqual({ durable: true, state: "projected" });
    } finally {
      primary.close();
      removeTestTree(root);
    }
  });

  it("U-GEN-031: queued後にIssue revisionが変わった場合はremote write前にfail-closeする", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-genesis-stale-queue-"));
    const dbPath = join(root, ".ut-tdd", "harness.db");
    mkdirSync(join(root, ".ut-tdd"), { recursive: true });
    const body = "# Stable preimage\n";
    let revision = "etag-129";
    let failOnce = true;
    let remoteWrites = 0;
    const db = openHarnessDb(dbPath, { repoRoot: root });
    migrate(db);
    try {
      const port = adoptionPort(body, (request) => {
        if (failOnce) {
          failOnce = false;
          return { ok: false, reason: "offline" };
        }
        remoteWrites += 1;
        return { ok: true, comment: comment(request.body_digest) };
      });
      const versionedPort: ForwardEscapeIssueAdoptionPort = {
        ...port,
        observeIssue: () => ({
          ...port.observeIssue({ repository: "owner/repository", issue_number: 129 }),
          observed_revision: revision,
        }),
      };
      const adapter = new SqliteGenesisAdoptionProjectionAdapter(db, {
        repository: "owner/repository",
        port: versionedPort,
      });
      expect(adapter.dispatch(dispatchInput(body))).toEqual({
        durable: true,
        state: "recovery_required",
      });
      revision = "etag-130";
      expect(() => adapter.dispatch(dispatchInput(body))).toThrow(
        "genesis-adoption-projection-request-conflict",
      );
      expect(remoteWrites).toBe(0);
    } finally {
      db.close();
      removeTestTree(root);
    }
  });
});

function dispatchInput(body: string) {
  return {
    commandId: "genesis:129",
    issueNumber: 129,
    issuePreimageDigest: sha(body),
    localReceipt: {
      ok: true as const,
      replayed: false,
      assetId: "asset-129",
      revision: 1 as const,
      issueNumber: 129,
    },
  };
}

function adoptionPort(
  body: string,
  create: ForwardEscapeIssueAdoptionPort["createOrGetMetadataComment"],
): ForwardEscapeIssueAdoptionPort {
  return {
    observeIssue: () => ({
      repository: "owner/repository",
      issue_number: 129,
      node_id: "I_129",
      url: "https://github.com/owner/repository/issues/129",
      body,
      body_digest: sha(body),
      observed_revision: "etag-129",
    }),
    createOrGetMetadataComment: create,
  };
}

function comment(bodyDigest: string) {
  return {
    node_id: "IC_129",
    url: "https://github.com/owner/repository/issues/129#issuecomment-129",
    body_digest: bodyDigest,
    observed_revision: "etag-comment-129",
  };
}
