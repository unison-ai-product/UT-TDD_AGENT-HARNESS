import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, it } from "vitest";
import {
  buildReviewCustodyReceipt,
  type CustodyReceiptDraft,
  computeReceiptDigest,
} from "../../src/feedback/review-custody.ts";
import {
  canonicalize,
  type ReviewRequestIdentity,
} from "../../src/feedback/review-custody-canonical.ts";
import {
  appendReviewCustodyAudit,
  isAttemptCompletedEvent,
  readReviewCustodyAudit,
  reviewVerdictPath,
} from "../../src/feedback/review-verdict-custody.ts";
import { HARNESS_DB_TABLES, schemaDdl } from "../../src/schema/harness-db.ts";
import * as githubReviewLaneProvenance from "../../src/state-db/github-review-lane-provenance.ts";
import { openHarnessDb } from "../../src/state-db/index.ts";
import { migrate, SCHEMA_VERSION } from "../../src/state-db/migration.ts";
import { rebuildHarnessDb } from "../../src/state-db/projection-writer.ts";
import { ensureTrackedProjectIdentity } from "./project-identity-fixture.ts";

// Fixed from S4 base HEAD 91ae6af99518f48e21f256d979697c45c5786051.
const S4_BASE_PROJECTION_DDL = [
  `CREATE TABLE IF NOT EXISTS plan_registry (
  plan_id TEXT PRIMARY KEY,
  kind TEXT,
  layer TEXT,
  sub_doc TEXT,
  drive TEXT,
  status TEXT,
  parent TEXT,
  route_mode TEXT,
  updated_at TEXT,
  decision_outcome TEXT,
  source_hash TEXT
)`,
  `CREATE TABLE IF NOT EXISTS github_review_lane_receipts (
  review_lane_receipt_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  plan_revision TEXT NOT NULL,
  lane TEXT NOT NULL,
  subject_head TEXT NOT NULL,
  verdict TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  tests_green_at TEXT NOT NULL,
  worker_model TEXT NOT NULL,
  reviewer_model TEXT NOT NULL,
  attack_trials INTEGER NOT NULL,
  citations_json TEXT NOT NULL,
  source TEXT NOT NULL,
  UNIQUE (plan_id, plan_revision, lane, subject_head)
)`,
  "CREATE INDEX IF NOT EXISTS idx_plan_layer_drive_status ON plan_registry (plan_id, layer, drive, status)",
  "CREATE INDEX IF NOT EXISTS idx_github_review_lane_subject ON github_review_lane_receipts (plan_id, plan_revision, subject_head, lane)",
];

function normalizeDdl(sql: string): string {
  return sql
    .replace("CREATE TABLE IF NOT EXISTS ", "CREATE TABLE ")
    .replace("CREATE INDEX IF NOT EXISTS ", "CREATE INDEX ")
    .replace(/\s+/gu, " ")
    .trim();
}
function sqliteDdl(db: ReturnType<typeof openHarnessDb>): Array<Record<string, unknown>> {
  return db
    .prepare(
      "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    )
    .all();
}

function tableRowCounts(db: ReturnType<typeof openHarnessDb>): Record<string, number> {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all();
  return Object.fromEntries(
    tables.map(({ name }) => {
      const table = String(name);
      const quoted = '"' + table.replaceAll('"', '""') + '"';
      const count = db.prepare("SELECT COUNT(*) AS n FROM " + quoted).get()?.n ?? 0;
      return [table, Number(count)];
    }),
  );
}

function v2TextFromV1(text: string): string {
  const receipt = JSON.parse(text) as Record<string, unknown>;
  delete receipt.planId;
  delete receipt.planRevision;
  receipt.schemaVersion = "review-custody/v2";
  const digest = computeReceiptDigest(receipt);
  if (!digest) throw new Error("could not digest custody v2 fixture");
  receipt.receiptDigest = digest;
  const canonical = canonicalize(receipt);
  if (!canonical.ok) throw new Error("could not canonicalize custody v2 fixture");
  return canonical.value;
}

export function registerPlanret020Oracle(): void {
  it("U-PLANRET-020: S4 rebuild はcustody v2を受けても既存receipt tableのDDLと投影契約を保つ", () => {
    const s4BaseVersion = 30;
    expect(SCHEMA_VERSION).toBe(s4BaseVersion);
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-planret-s4-db-"));
    const db = openHarnessDb(":memory:", { repoRoot: root });
    try {
      ensureTrackedProjectIdentity(root, "fixture/planret-s4-db");
      const baseDdl = schemaDdl();
      const relevantBaseDdl = baseDdl.filter((sql) =>
        /(?:plan_registry|github_review_lane_receipts|idx_plan_layer_drive_status|idx_github_review_lane_subject)/u.test(
          sql,
        ),
      );
      expect(relevantBaseDdl).toEqual(S4_BASE_PROJECTION_DDL);
      for (const ddl of baseDdl) db.exec(ddl);
      db.setUserVersion(s4BaseVersion);
      db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run("PLAN-S4-LEGACY-1");
      db.prepare("INSERT INTO plan_registry (plan_id) VALUES (?)").run("PLAN-S4-LEGACY-2");
      db.prepare(
        "INSERT INTO github_review_lane_receipts (review_lane_receipt_id, plan_id, plan_revision, lane, subject_head, verdict, reviewed_at, tests_green_at, worker_model, reviewer_model, attack_trials, citations_json, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        "receipt-legacy",
        "PLAN-S4-LEGACY-1",
        "1".repeat(64),
        "blind-review",
        "a".repeat(40),
        "PASS",
        "2026-11-10T00:00:00.000Z",
        "2026-11-10T00:00:00.000Z",
        "gpt-6-luna",
        "claude-opus-5-5",
        3,
        "[]",
        "test-fixture",
      );
      const receiptDdl = db
        .prepare("SELECT sql FROM sqlite_master WHERE type = ? AND name = ?")
        .get("table", "github_review_lane_receipts")?.sql;
      expect(receiptDdl).toContain("plan_id TEXT NOT NULL");
      expect(receiptDdl).toContain("plan_revision TEXT NOT NULL");
      const beforeDdl = sqliteDdl(db);
      const relevantMasterDdl = beforeDdl
        .filter(({ name }) => S4_BASE_PROJECTION_DDL.some((sql) => sql.includes(String(name))))
        .map(({ sql }) => normalizeDdl(String(sql)))
        .sort();
      expect(relevantMasterDdl).toEqual(S4_BASE_PROJECTION_DDL.map(normalizeDdl).sort());
      const beforeRows = tableRowCounts(db);
      expect(db.userVersion()).toBe(s4BaseVersion);
      expect(beforeRows.github_review_lane_receipts).toBe(1);
      expect(beforeRows.plan_registry).toBe(2);

      const migrated = migrate(db);
      expect(migrated.applied).toBe(false);
      expect(db.userVersion()).toBe(s4BaseVersion);
      expect(sqliteDdl(db)).toEqual(beforeDdl);
      expect(tableRowCounts(db)).toEqual(beforeRows);
      expect(HARNESS_DB_TABLES.some((table) => table.name === "github_review_lane_receipts")).toBe(
        true,
      );
      expect(typeof githubReviewLaneProvenance.verifiedReviewLaneDigests).toBe("function");

      const identity: ReviewRequestIdentity = {
        schemaVersion: "review-request/v1",
        memoryId: "planret-s4-custody-v2-fixture",
        pr: 283,
        exactHead: "b".repeat(40),
        authorFamily: "claude",
      };
      const draft: CustodyReceiptDraft = {
        receiptKind: "pre_merge_review",
        repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
        prNumber: 283,
        baseRef: "main",
        headSha: identity.exactHead,
        requestIdentity: identity,
        judgmentDigest: "3".repeat(64),
        workflowRef:
          "unison-ai-product/UT-TDD_AGENT-HARNESS/.github/workflows/review-attestation.yml@refs/heads/main",
        workflowSha: "c".repeat(40),
        runId: "17123456789",
        runAttempt: 1,
        issuer: "https://token.actions.githubusercontent.com",
        providerEvidenceRef: "d3b:" + "4".repeat(64),
        reviewerFamily: "codex",
        authorFamily: "claude",
        verdict: "PASS",
        blockingFindingCount: 0,
      };
      const built = buildReviewCustodyReceipt({ draft, attempts: 3 });
      if (!built.ok) throw new Error("could not build custody receipt fixture: " + built.detail);
      const receiptText = v2TextFromV1(built.text);
      const receipt = JSON.parse(receiptText) as Record<string, unknown>;
      expect(receipt).not.toHaveProperty("planId");
      expect(receipt).not.toHaveProperty("planRevision");
      const requestDigest = "e".repeat(64);
      const receiptPath = join(root, ".ut-tdd", "review", "receipts", requestDigest + ".json");
      mkdirSync(join(root, ".ut-tdd", "review", "receipts"), { recursive: true });
      writeFileSync(receiptPath, receiptText, "utf8");
      const receiptFileDigest = createHash("sha256").update(receiptText, "utf8").digest("hex");
      const verdictPath = reviewVerdictPath(root, requestDigest);
      const verdictText = "verdict: PASS\n";
      mkdirSync(dirname(verdictPath), { recursive: true });
      writeFileSync(verdictPath, verdictText, "utf8");
      appendReviewCustodyAudit(root, {
        kind: "attempt_completed",
        requestDigest,
        attempt: 1,
        exactHead: identity.exactHead,
        verdictPath,
        recordedAt: "2026-11-10T00:00:00.000Z",
        reason: "review_completed",
        provider: "codex",
        model: "gpt-6.1-sol",
        receiptFileDigest,
        verdictDigest: createHash("sha256").update(verdictText, "utf8").digest("hex"),
        exitCode: 0,
      });
      const audit = readReviewCustodyAudit(root);
      expect(audit).toHaveLength(1);
      expect(isAttemptCompletedEvent(audit[0])).toBe(true);
      expect(audit[0].receiptFileDigest).toBe(receiptFileDigest);

      const rebuilt = rebuildHarnessDb({
        repoRoot: root,
        db,
        relationGraph: { nodes: [], edges: [], verificationProfiles: [], findings: [] },
        documentExports: {
          document_export_runs: [],
          document_export_datasets: [],
          document_export_artifacts: [],
          findings: [],
          actionsTaken: [],
          ok: true,
        },
        skipTokenTelemetry: true,
      });
      expect(rebuilt.ok).toBe(true);
      expect(db.prepare("SELECT COUNT(*) AS n FROM github_review_lane_receipts").get()?.n).toBe(0);
      expect(db.prepare("SELECT COUNT(*) AS n FROM plan_registry").get()?.n).toBe(0);
      expect(db.userVersion()).toBe(s4BaseVersion);
      const rebuiltDdl = sqliteDdl(db);
      const rebuiltRows = tableRowCounts(db);
      expect(rebuiltDdl).toEqual(beforeDdl);
      const migratedAgain = migrate(db);
      expect(migratedAgain.applied).toBe(false);
      expect(sqliteDdl(db)).toEqual(rebuiltDdl);
      expect(tableRowCounts(db)).toEqual(rebuiltRows);
      expect(db.userVersion()).toBe(s4BaseVersion);
    } finally {
      db.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
}
