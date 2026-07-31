import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  combinedReviewReceiptDigest,
  decodeMergeClosureReceipt,
  reviewReceiptDigest,
} from "../src/github/closure-receipt";
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

function writeReviewPlan(
  repoRoot: string,
  sources: Array<{
    planId: string;
    planRevision: string;
    headSha: string;
    reviewKind: string;
    verdict: string;
    reviewedAt: string;
    testsGreenAt: string;
    workerModel: string;
    reviewerModel: string;
    lane: string;
    attackTrials: number;
    citations: string[];
  }>,
): void {
  const [first] = sources;
  if (!first) return;
  const plansDir = join(repoRoot, "docs", "plans");
  mkdirSync(plansDir, { recursive: true });
  const entries = sources
    .map(
      (source) => `  - reviewer: blind-reviewer
    review_kind: ${source.reviewKind}
    reviewed_at: ${source.reviewedAt}
    tests_green_at: ${source.testsGreenAt}
    verdict: ${source.verdict}
    worker_model: ${source.workerModel}
    reviewer_model: ${source.reviewerModel}
    lane: ${source.lane}
    plan_revision: ${source.planRevision}
    subject_head: ${source.headSha}
    attack_trials: ${source.attackTrials}
    citations:
${source.citations.map((citation) => `      - "${citation}"`).join("\n")}`,
    )
    .join("\n");
  writeFileSync(
    join(plansDir, `${first.planId}.md`),
    `---
plan_id: ${first.planId}
review_evidence:
${entries}
---
`,
    "utf8",
  );
}

describe("GitHub repository facts binding", () => {
  it("U-GHBIND-001: converges traced PR lifecycle facts into one PLAN revision", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-gh-review-"));
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare(
        `INSERT INTO schedule_entries (
          schedule_entry_id, plan_id, status, source_hash
        ) VALUES (?, ?, ?, ?)`,
      ).run("schedule:436", "PLAN-L7-436-domain", "confirmed", "rev1");
      db.prepare(
        `INSERT INTO github_project_item_projection (
          projection_id, repository_id, project_id, project_item_id, plan_id,
          plan_revision, content_node_id, head_sha, sync_status, last_reconciled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        "project:436",
        "owner/repo",
        "project:1",
        "item:436",
        "PLAN-L7-436-domain",
        "rev1",
        "",
        "abcdef1",
        "同期済",
        "2026-07-29T00:00:00Z",
      );
      const reviewSources = (["claim-blind", "spec-blind"] as const).map((lane) => ({
        planId: "PLAN-L7-436-domain",
        planRevision: "rev1",
        headSha: "abcdef1",
        reviewKind: "cross_agent",
        verdict: "PASS",
        reviewedAt: "2026-07-29T00:00:00Z",
        testsGreenAt: "2026-07-28T23:00:00Z",
        workerModel: "claude-sonnet-5",
        reviewerModel: "gpt-5.6-sol",
        source: "docs/plans/PLAN-L7-436-domain.md",
        lane,
        attackTrials: 3,
        citations: ["docs/plans/PLAN-L7-436-domain.md:1"],
      }));
      for (const source of reviewSources)
        db.prepare(
          `INSERT INTO github_review_lane_receipts (
            review_lane_receipt_id, plan_id, plan_revision, lane, subject_head,
            verdict, reviewed_at, tests_green_at, worker_model, reviewer_model,
            attack_trials, citations_json, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          `review:436:${source.lane}`,
          source.planId,
          source.planRevision,
          source.lane,
          source.headSha,
          source.verdict,
          source.reviewedAt,
          source.testsGreenAt,
          source.workerModel,
          source.reviewerModel,
          source.attackTrials,
          JSON.stringify(source.citations),
          source.source,
        );
      const reviewDigests = {
        claimBlind: reviewReceiptDigest(reviewSources[0]),
        specBlind: reviewReceiptDigest(reviewSources[1]),
      };
      writeReviewPlan(repoRoot, reviewSources);
      const body = renderPrTraceBlock({
        plan_id: "PLAN-L7-436-domain",
        plan_revision: "rev1",
        route_mode: "add-feature",
        subject_head: "abcdef1",
        base_sha: "1234567",
        issue_number: "70",
        review_receipt_digest: combinedReviewReceiptDigest(reviewDigests),
      });
      const result = syncRepositoryBindings({
        db,
        repositoryId: "owner/repo",
        repoRoot,
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
              statusCheckRollup: [
                { name: "harness-check", databaseId: "pr-check-1", conclusion: "SUCCESS" },
              ],
              reviews: [{ state: "APPROVED" }],
            },
          ],
          {
            check_runs: [{ name: "harness-check", id: "main-check-1", conclusion: "SUCCESS" }],
          },
          { state: "CLOSED" },
        ),
      });
      expect(result).toMatchObject({
        inspectedPullRequests: 1,
        tracedPullRequests: 1,
        skipped: [],
      });
      const bindings = db
        .prepare("SELECT object_kind, state FROM github_object_bindings ORDER BY object_kind")
        .all();
      expect(bindings.filter((row) => row.object_kind !== "merge")).toEqual([
        { object_kind: "branch", state: "merged" },
        { object_kind: "check_run", state: "成功" },
        { object_kind: "issue", state: "linked" },
        { object_kind: "pull_request", state: "merged" },
        { object_kind: "review", state: "承認" },
      ]);
      expect(
        decodeMergeClosureReceipt(
          String(bindings.find((row) => row.object_kind === "merge")?.state),
        ),
      ).toMatchObject({
        planId: "PLAN-L7-436-domain",
        headSha: "abcdef1",
        mergeSha: "fedcba1",
        requiredCheck: "harness-check",
        prCheckId: "pr-check-1",
        mainCheckId: "main-check-1",
      });
    } finally {
      db.close();
      rmSync(repoRoot, { recursive: true, force: true });
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

  it("U-GHBIND-003: rejects incomplete checks, provider, lane, and HEAD custody", () => {
    for (const scenario of [
      "unrelated-check",
      "same-provider",
      "missing-lane",
      "stale-head",
      "forged-source",
    ] as const) {
      const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-gh-review-"));
      const db = openHarnessDb(":memory:");
      try {
        migrate(db);
        db.prepare(
          `INSERT INTO schedule_entries (
            schedule_entry_id, plan_id, status, source_hash
          ) VALUES (?, ?, ?, ?)`,
        ).run("schedule:closure", "PLAN-L7-436-domain", "confirmed", "rev1");
        const evidenceHead = scenario === "stale-head" ? "bbbbbbb" : "abcdef1";
        const reviewSources = (["claim-blind", "spec-blind"] as const).map((lane) => ({
          planId: "PLAN-L7-436-domain",
          planRevision: "rev1",
          headSha: evidenceHead,
          reviewKind: "cross_agent",
          verdict: "PASS",
          reviewedAt: "2026-07-29T00:00:00Z",
          testsGreenAt: "2026-07-28T23:00:00Z",
          workerModel: "gpt-5.6-terra",
          reviewerModel: scenario === "same-provider" ? "gpt-5.6-sol" : "claude-opus-4-8",
          source: "docs/plans/PLAN-L7-436-domain.md",
          lane,
          attackTrials: 3,
          citations: ["docs/plans/PLAN-L7-436-domain.md:1"],
        }));
        for (const source of scenario === "missing-lane"
          ? reviewSources.slice(0, 1)
          : reviewSources)
          db.prepare(
            `INSERT INTO github_review_lane_receipts (
              review_lane_receipt_id, plan_id, plan_revision, lane, subject_head,
              verdict, reviewed_at, tests_green_at, worker_model, reviewer_model,
              attack_trials, citations_json, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            `review:closure:${source.lane}`,
            source.planId,
            source.planRevision,
            source.lane,
            source.headSha,
            source.verdict,
            source.reviewedAt,
            source.testsGreenAt,
            source.workerModel,
            source.reviewerModel,
            source.attackTrials,
            JSON.stringify(source.citations),
            source.source,
          );
        const reviewDigests = {
          claimBlind: reviewReceiptDigest(reviewSources[0]),
          specBlind: reviewReceiptDigest(reviewSources[1]),
        };
        if (scenario !== "forged-source")
          writeReviewPlan(
            repoRoot,
            scenario === "missing-lane" ? reviewSources.slice(0, 1) : reviewSources,
          );
        const body = renderPrTraceBlock({
          plan_id: reviewSources[0].planId,
          plan_revision: reviewSources[0].planRevision,
          route_mode: "add-feature",
          subject_head: "abcdef1",
          base_sha: "1234567",
          review_receipt_digest: combinedReviewReceiptDigest(reviewDigests),
        });
        const checkName = scenario === "unrelated-check" ? "docs-only" : "harness-check";
        const result = syncRepositoryBindings({
          db,
          repositoryId: "owner/repo",
          repoRoot,
          gh: new FakeGh(
            [
              {
                number: 16,
                url: "https://github.com/owner/repo/pull/16",
                headRefName: "feature/closure",
                headRefOid: "abcdef1",
                state: "MERGED",
                mergedAt: "2026-07-29T00:00:00Z",
                mergeCommit: { oid: "fedcba1" },
                body,
                statusCheckRollup: [
                  { name: checkName, databaseId: "pr-check", conclusion: "SUCCESS" },
                ],
                reviews: [{ state: "APPROVED" }],
              },
            ],
            {
              check_runs: [{ name: "harness-check", id: "main-check", conclusion: "SUCCESS" }],
            },
          ),
        });
        expect(result.skipped).toContainEqual({
          number: "16",
          reason: "merge-closure-incomplete",
        });
        expect(
          db
            .prepare("SELECT state FROM github_object_bindings WHERE object_kind = 'merge' LIMIT 1")
            .get(),
        ).toEqual({ state: "invalidated:closure-incomplete" });
      } finally {
        db.close();
        rmSync(repoRoot, { recursive: true, force: true });
      }
    }
  });

  it("U-GHBIND-004: rejects untyped PLAN ID text outside a typed PR trace", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare(
        `INSERT INTO schedule_entries (schedule_entry_id, plan_id, status, source_hash)
         VALUES (?, ?, ?, ?)`,
      ).run("schedule:fallback", "PLAN-L7-436-domain", "draft", "rev1");
      const result = syncRepositoryBindings({
        db,
        repositoryId: "owner/repo",
        gh: new FakeGh([
          {
            number: 17,
            title: "PLAN-L7-436-domain: informal tracking title",
            headRefName: "feature/PLAN-L7-436-domain",
            headRefOid: "abcdef1",
            state: "OPEN",
            body: "This mentions PLAN-L7-436-domain but carries no typed trace.",
          },
        ]),
      });
      expect(result.skipped).toContainEqual({ number: "17", reason: "trace-block-missing" });
      expect(db.prepare("SELECT COUNT(*) count FROM github_object_bindings").get()).toEqual({
        count: 0,
      });
    } finally {
      db.close();
    }
  });

  it("U-GHBIND-005: fails closed when a PR listing may be truncated at the provider limit", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      expect(() =>
        syncRepositoryBindings({
          db,
          repositoryId: "owner/repo",
          gh: new FakeGh(Array.from({ length: 1000 }, (_, index) => ({ number: index + 1 }))),
        }),
      ).toThrow(/truncat/i);
      expect(db.prepare("SELECT COUNT(*) count FROM github_object_bindings").get()).toEqual({
        count: 0,
      });
    } finally {
      db.close();
    }
  });

  it("U-GHBIND-006: rolls back every binding when a later lifecycle write conflicts", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-gh-review-"));
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare(
        `INSERT INTO schedule_entries (schedule_entry_id, plan_id, status, source_hash)
         VALUES (?, ?, ?, ?)`,
      ).run("schedule:rollback", "PLAN-L7-436-domain", "confirmed", "rev1");
      db.prepare(
        `INSERT INTO github_project_item_projection (
          projection_id, repository_id, project_id, project_item_id, plan_id,
          plan_revision, content_node_id, head_sha, sync_status, last_reconciled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        "project:rollback",
        "owner/repo",
        "project:1",
        "item:436",
        "PLAN-L7-436-domain",
        "rev1",
        "",
        "abcdef1",
        "同期済",
        "2026-07-29T00:00:00Z",
      );
      db.prepare(
        `INSERT INTO github_object_bindings (
          binding_id, repository_id, plan_id, plan_revision, project_item_id,
          object_kind, object_id, object_url, head_sha, state, observed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        "foreign-branch",
        "owner/repo",
        "PLAN-L7-999-foreign",
        "rev1",
        "",
        "branch",
        "feature/rollback",
        "",
        "oldhead",
        "open",
        "2026-07-28T00:00:00Z",
      );
      const sources = (["claim-blind", "spec-blind"] as const).map((lane) => ({
        planId: "PLAN-L7-436-domain",
        planRevision: "rev1",
        headSha: "abcdef1",
        reviewKind: "cross_agent",
        verdict: "PASS",
        reviewedAt: "2026-07-29T00:00:00Z",
        testsGreenAt: "2026-07-28T23:00:00Z",
        workerModel: "claude-sonnet-5",
        reviewerModel: "gpt-5.6-sol",
        source: "docs/plans/PLAN-L7-436-domain.md",
        lane,
        attackTrials: 3,
        citations: ["docs/plans/PLAN-L7-436-domain.md:1"],
      }));
      for (const source of sources)
        db.prepare(
          `INSERT INTO github_review_lane_receipts (
            review_lane_receipt_id, plan_id, plan_revision, lane, subject_head,
            verdict, reviewed_at, tests_green_at, worker_model, reviewer_model,
            attack_trials, citations_json, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          `review:rollback:${source.lane}`,
          source.planId,
          source.planRevision,
          source.lane,
          source.headSha,
          source.verdict,
          source.reviewedAt,
          source.testsGreenAt,
          source.workerModel,
          source.reviewerModel,
          source.attackTrials,
          JSON.stringify(source.citations),
          source.source,
        );
      writeReviewPlan(repoRoot, sources);
      const receiptDigests = {
        claimBlind: reviewReceiptDigest(sources[0]),
        specBlind: reviewReceiptDigest(sources[1]),
      };
      const body = renderPrTraceBlock({
        plan_id: "PLAN-L7-436-domain",
        plan_revision: "rev1",
        route_mode: "add-feature",
        subject_head: "abcdef1",
        base_sha: "1234567",
        review_receipt_digest: combinedReviewReceiptDigest(receiptDigests),
      });
      expect(() =>
        syncRepositoryBindings({
          db,
          repositoryId: "owner/repo",
          repoRoot,
          gh: new FakeGh(
            [
              {
                number: 18,
                url: "https://github.com/owner/repo/pull/18",
                headRefName: "feature/rollback",
                headRefOid: "abcdef1",
                state: "MERGED",
                mergedAt: "2026-07-29T00:00:00Z",
                mergeCommit: { oid: "fedcba1" },
                body,
                statusCheckRollup: [
                  { name: "harness-check", databaseId: "pr-check", conclusion: "SUCCESS" },
                ],
                reviews: [{ state: "APPROVED" }],
              },
            ],
            { check_runs: [{ name: "harness-check", id: "main-check", conclusion: "SUCCESS" }] },
          ),
        }),
      ).toThrow(/identity conflict/);
      expect(
        db.prepare("SELECT binding_id FROM github_object_bindings ORDER BY binding_id").all(),
      ).toEqual([{ binding_id: "foreign-branch" }]);
    } finally {
      db.close();
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("U-GHBIND-007: refuses merge closure before a non-empty Project item binding exists", () => {
    const repoRoot = mkdtempSync(join(tmpdir(), "ut-tdd-gh-review-"));
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      db.prepare(
        `INSERT INTO schedule_entries (schedule_entry_id, plan_id, status, source_hash)
         VALUES (?, ?, ?, ?)`,
      ).run("schedule:project-required", "PLAN-L7-436-domain", "confirmed", "rev1");
      const sources = (["claim-blind", "spec-blind"] as const).map((lane) => ({
        planId: "PLAN-L7-436-domain",
        planRevision: "rev1",
        headSha: "abcdef1",
        reviewKind: "cross_agent",
        verdict: "PASS",
        reviewedAt: "2026-07-29T00:00:00Z",
        testsGreenAt: "2026-07-28T23:00:00Z",
        workerModel: "claude-sonnet-5",
        reviewerModel: "gpt-5.6-sol",
        source: "docs/plans/PLAN-L7-436-domain.md",
        lane,
        attackTrials: 3,
        citations: ["docs/plans/PLAN-L7-436-domain.md:1"],
      }));
      for (const source of sources)
        db.prepare(
          `INSERT INTO github_review_lane_receipts (review_lane_receipt_id, plan_id, plan_revision, lane, subject_head, verdict, reviewed_at, tests_green_at, worker_model, reviewer_model, attack_trials, citations_json, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          `review:project-required:${source.lane}`,
          source.planId,
          source.planRevision,
          source.lane,
          source.headSha,
          source.verdict,
          source.reviewedAt,
          source.testsGreenAt,
          source.workerModel,
          source.reviewerModel,
          source.attackTrials,
          JSON.stringify(source.citations),
          source.source,
        );
      writeReviewPlan(repoRoot, sources);
      const body = renderPrTraceBlock({
        plan_id: "PLAN-L7-436-domain",
        plan_revision: "rev1",
        route_mode: "add-feature",
        subject_head: "abcdef1",
        base_sha: "1234567",
        review_receipt_digest: combinedReviewReceiptDigest({
          claimBlind: reviewReceiptDigest(sources[0]),
          specBlind: reviewReceiptDigest(sources[1]),
        }),
      });
      const result = syncRepositoryBindings({
        db,
        repositoryId: "owner/repo",
        repoRoot,
        gh: new FakeGh(
          [
            {
              number: 19,
              url: "https://github.com/owner/repo/pull/19",
              headRefName: "feature/project-required",
              headRefOid: "abcdef1",
              state: "MERGED",
              mergedAt: "2026-07-29T00:00:00Z",
              mergeCommit: { oid: "fedcba1" },
              body,
              statusCheckRollup: [
                { name: "harness-check", databaseId: "pr-check", conclusion: "SUCCESS" },
              ],
              reviews: [{ state: "APPROVED" }],
            },
          ],
          { check_runs: [{ name: "harness-check", id: "main-check", conclusion: "SUCCESS" }] },
        ),
      });
      expect(result.skipped).toContainEqual({ number: "19", reason: "project-item-required" });
      expect(
        db
          .prepare("SELECT COUNT(*) count FROM github_object_bindings WHERE object_kind = 'merge'")
          .get(),
      ).toEqual({ count: 0 });
    } finally {
      db.close();
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
