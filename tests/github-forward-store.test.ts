import { describe, expect, it } from "vitest";
import {
  queueGithubProjection,
  rebuildExecutionReadiness,
  recordGithubBinding,
} from "../src/github/forward-store";
import { openHarnessDb } from "../src/state-db/index";
import { migrate } from "../src/state-db/migration";
import { clearRebuildableProjectionTables } from "../src/state-db/sqlite-projection-rebuild";

describe("GitHub Forward SQLite store", () => {
  it("U-GHPROJ-010: projects schedule readiness and keeps external bindings across rebuild clear", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare(
        `INSERT INTO schedule_entries (
          schedule_entry_id, plan_id, layer, status, current_location, rag,
          blocked_reason, predecessor_plan_ids, source_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run("s1", "PLAN-L7-1-a", "L7", "draft", "plan", "yellow", "", "", "rev1");
      recordGithubBinding(db, {
        repositoryId: "repo",
        planId: "PLAN-L7-1-a",
        planRevision: "rev1",
        objectKind: "branch",
        objectId: "feature/a",
        state: "active",
      });
      expect(rebuildExecutionReadiness(db)).toHaveLength(1);
      expect(db.prepare("SELECT readiness FROM execution_readiness_projection").get()).toEqual({
        readiness: "着手可能",
      });
      clearRebuildableProjectionTables(db);
      expect(db.prepare("SELECT COUNT(*) count FROM execution_readiness_projection").get()).toEqual(
        {
          count: 0,
        },
      );
      expect(db.prepare("SELECT object_id FROM github_object_bindings").get()).toEqual({
        object_id: "feature/a",
      });
    } finally {
      db.close();
    }
  });

  it("U-GHPROJ-011: converges out-of-order lifecycle observations by object identity", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const base = {
        repositoryId: "repo",
        planId: "PLAN-L7-1-a",
        planRevision: "rev1",
        objectKind: "check_run" as const,
        objectId: "check:abc",
      };
      recordGithubBinding(db, { ...base, state: "実行中", headSha: "abc" });
      recordGithubBinding(db, { ...base, state: "成功", headSha: "abc" });
      expect(db.prepare("SELECT state FROM github_object_bindings").all()).toEqual([
        { state: "成功" },
      ]);
    } finally {
      db.close();
    }
  });

  it("U-GHPROJ-012: rejects stale HEAD evidence and keeps queued projection intent", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      recordGithubBinding(db, {
        repositoryId: "repo",
        planId: "PLAN-L7-1-a",
        planRevision: "rev1",
        objectKind: "pull_request",
        objectId: "12",
        state: "open",
        headSha: "abc",
      });
      expect(() =>
        recordGithubBinding(db, {
          repositoryId: "repo",
          planId: "PLAN-L7-1-a",
          planRevision: "rev1",
          objectKind: "review",
          objectId: "review:1",
          state: "承認",
          headSha: "def",
        }),
      ).toThrow(/stale/);
      queueGithubProjection({
        db,
        repositoryId: "repo",
        planId: "PLAN-L7-1-a",
        planRevision: "rev1",
        operation: "project-item-upsert",
        payload: { state: "着手可能" },
      });
      clearRebuildableProjectionTables(db);
      expect(db.prepare("SELECT status FROM github_projection_outbox").get()).toEqual({
        status: "pending",
      });
    } finally {
      db.close();
    }
  });

  it("U-GHPROJ-013: rejects reassignment of one provider object to another PLAN revision", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      recordGithubBinding(db, {
        repositoryId: "repo",
        planId: "PLAN-L7-1-a",
        planRevision: "rev1",
        objectKind: "pull_request",
        objectId: "12",
        state: "open",
      });
      expect(() =>
        recordGithubBinding(db, {
          repositoryId: "repo",
          planId: "PLAN-L7-2-b",
          planRevision: "rev2",
          objectKind: "pull_request",
          objectId: "12",
          state: "open",
        }),
      ).toThrow(/identity conflict/);
      expect(db.prepare("SELECT plan_id, plan_revision FROM github_object_bindings").get()).toEqual(
        {
          plan_id: "PLAN-L7-1-a",
          plan_revision: "rev1",
        },
      );
    } finally {
      db.close();
    }
  });
});
