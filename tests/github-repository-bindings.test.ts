import { describe, expect, it } from "vitest";
import { renderPrTraceBlock } from "../src/github/pr-trace";
import type { GhCommandPort } from "../src/github/project-v2";
import { syncRepositoryBindings } from "../src/github/repository-bindings";
import { openHarnessDb } from "../src/state-db/index";
import { migrate } from "../src/state-db/migration";

class FakeGh implements GhCommandPort {
  readonly #payloads: unknown[];
  constructor(...payloads: unknown[]) {
    this.#payloads = payloads;
  }
  json(): unknown {
    return this.#payloads.shift() ?? {};
  }
  run(): void {
    throw new Error("unexpected mutation");
  }
}

describe("GitHub repository facts binding", () => {
  it("U-GHBIND-001: converges traced PR lifecycle facts into one PLAN revision", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare(
        `INSERT INTO schedule_entries (
          schedule_entry_id, plan_id, status, source_hash
        ) VALUES (?, ?, ?, ?)`,
      ).run("schedule:436", "PLAN-L7-436-domain", "confirmed", "rev1");
      const body = renderPrTraceBlock({
        plan_id: "PLAN-L7-436-domain",
        plan_revision: "rev1",
        route_mode: "add-feature",
        subject_head: "abcdef1",
        base_sha: "1234567",
        issue_number: "70",
      });
      const result = syncRepositoryBindings({
        db,
        repositoryId: "owner/repo",
        gh: new FakeGh(
          [
            {
              number: 12,
              url: "https://github.com/owner/repo/pull/12",
              headRefName: "feature/domain",
              headRefOid: "abcdef1",
              state: "MERGED",
              mergedAt: "2026-07-29T00:00:00Z",
              mergeCommit: { oid: "fedcba1" },
              body,
              statusCheckRollup: [{ conclusion: "SUCCESS" }],
              reviews: [{ state: "APPROVED" }],
            },
          ],
          { check_runs: [{ conclusion: "SUCCESS" }] },
          { state: "CLOSED" },
        ),
      });
      expect(result).toMatchObject({
        inspectedPullRequests: 1,
        tracedPullRequests: 1,
        skipped: [],
      });
      expect(
        db
          .prepare("SELECT object_kind, state FROM github_object_bindings ORDER BY object_kind")
          .all(),
      ).toEqual([
        { object_kind: "branch", state: "merged" },
        { object_kind: "check_run", state: "成功" },
        { object_kind: "issue", state: "linked" },
        { object_kind: "merge", state: "merged:fedcba1" },
        { object_kind: "pull_request", state: "merged" },
        { object_kind: "review", state: "承認" },
      ]);
    } finally {
      db.close();
    }
  });

  it("U-GHBIND-002: skips untraced, revisionless, and stale-head PRs without writes", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const noRevision = renderPrTraceBlock({
        plan_id: "PLAN-L7-436-domain",
        route_mode: "add-feature",
        subject_head: "abcdef1",
        base_sha: "1234567",
      });
      const result = syncRepositoryBindings({
        db,
        repositoryId: "owner/repo",
        gh: new FakeGh([
          { number: 1, body: "" },
          { number: 2, body: noRevision, headRefOid: "abcdef1" },
          { number: 3, body: noRevision.replace("abcdef1", "bbbbbbb"), headRefOid: "abcdef1" },
        ]),
      });
      expect(result.skipped.map((row) => row.reason)).toEqual([
        "trace-block-missing",
        "plan-revision-missing",
        "plan-revision-missing",
      ]);
      expect(db.prepare("SELECT COUNT(*) count FROM github_object_bindings").get()).toEqual({
        count: 0,
      });
    } finally {
      db.close();
    }
  });
});
