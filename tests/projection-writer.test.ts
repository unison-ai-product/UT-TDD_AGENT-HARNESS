import { describe, expect, it } from "vitest";
import { isSecretLike, openHarnessDb } from "../src/state-db/index";
import { migrate, rowCounts } from "../src/state-db/migration";
import { rebuildHarnessDb, recordProjectionEvent } from "../src/state-db/projection-writer";

interface VerificationWorkflowRow {
  phase: string;
  ready_status: string;
  human_required: number;
}

interface VerificationGateRow {
  status: string;
  evidence_path: string;
}

interface DriveRunRow {
  plan_id: string;
  mode: string;
  status: string;
}

describe("SECRET_PATTERN word-boundary anchoring", () => {
  it("does not match 'sk' inside a word but matches a boundary-delimited token", () => {
    // Hyphenated slugs / paths must not false-positive (these crashed db rebuild).
    // The "sk" segments are interpolated so no literal token appears in source.
    expect(isSecretLike(`changed-path-src-${"task"}-has-no-relation-graph-node-impact`)).toBe(
      false,
    );
    expect(isSecretLike(`review the ${"risk"}-assessment-and-mitigation-plan-now-please`)).toBe(
      false,
    );
    expect(isSecretLike("planning-and-task-breakdown")).toBe(false);
    // Real boundary-delimited tokens (16+ chars) are still detected.
    expect(isSecretLike(`sk-${"a".repeat(20)}`)).toBe(true);
    expect(isSecretLike(`leaked ghp_${"b".repeat(20)} here`)).toBe(true);
  });
});

describe("IT-DB-01/02: harness.db projection writer", () => {
  it("records normalized projection events idempotently and keeps rows joinable by plan_id", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      recordProjectionEvent(db, {
        table: "plan_registry",
        id: "PLAN-L7-46-projection-writer",
        row: {
          plan_id: "PLAN-L7-46-projection-writer",
          kind: "impl",
          layer: "L7",
          drive: "db",
          status: "draft",
          updated_at: "2026-06-11T00:00:00.000Z",
        },
      });
      recordProjectionEvent(db, {
        table: "gate_runs",
        id: "gate-1",
        row: {
          gate_run_id: "gate-1",
          gate_id: "G-L7DB.B",
          plan_id: "PLAN-L7-46-projection-writer",
          status: "passed",
          checked_at: "2026-06-11T00:01:00.000Z",
          evidence_path: "docs/handover/projection.md",
        },
      });
      recordProjectionEvent(db, {
        table: "gate_runs",
        id: "gate-1",
        row: {
          gate_run_id: "gate-1",
          gate_id: "G-L7DB.B",
          plan_id: "PLAN-L7-46-projection-writer",
          status: "passed",
          checked_at: "2026-06-11T00:01:00.000Z",
          evidence_path: "docs/handover/projection.md",
        },
      });

      expect(rowCounts(db).plan_registry).toBe(1);
      expect(rowCounts(db).gate_runs).toBe(1);
      const joined = db
        .prepare(
          `SELECT g.gate_id, p.plan_id
           FROM gate_runs g
           JOIN plan_registry p ON p.plan_id = g.plan_id
           WHERE g.gate_run_id = ?`,
        )
        .get("gate-1");
      expect(joined).toMatchObject({
        gate_id: "G-L7DB.B",
        plan_id: "PLAN-L7-46-projection-writer",
      });
    } finally {
      db.close();
    }
  });

  it("exempts structured-id columns from the secret check but still rejects free-form payload secrets", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      // Regression: a relation-graph finding_id slug that contains "sk-" inside a
      // "task-" run (built here so no literal token appears in source) matches the
      // canonical SECRET_PATTERN but is a structured identifier, not a secret. It
      // must NOT be rejected — this exact slug crashed `ut-tdd db rebuild`.
      const slugId = `finding:missing-projection:changed-path-src-${"task"}-has-no-relation-graph-node`;
      expect(() =>
        recordProjectionEvent(db, {
          table: "feedback_events",
          id: "feedback:idtest",
          row: {
            finding_id: slugId,
            plan_id: "",
            signal_type: "finding",
            severity: "warn",
            next_action: "review the missing relation-graph node",
          },
        }),
      ).not.toThrow();

      // A real high-entropy token in a free-form (non-id) column is still rejected.
      const realToken = `sk-${"a".repeat(20)}`;
      expect(() =>
        recordProjectionEvent(db, {
          table: "feedback_events",
          id: "feedback:leak",
          row: {
            finding_id: "",
            plan_id: "",
            signal_type: "finding",
            severity: "warn",
            next_action: `leaked ${realToken}`,
          },
        }),
      ).toThrow(/secret-like/);
    } finally {
      db.close();
    }
  });

  it("turns unresolved cross-drive/model joins into findings instead of silently skipping them", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);

      recordProjectionEvent(db, {
        table: "model_runs",
        id: "run-with-missing-plan",
        row: {
          run_id: "run-with-missing-plan",
          runtime: "codex",
          model: "gpt-5.4",
          role: "se",
          drive: "db",
          plan_id: "PLAN-L7-46-missing",
          started_at: "2026-06-11T00:02:00.000Z",
          completed_at: "2026-06-11T00:03:00.000Z",
          evidence_path: ".ut-tdd/evidence/run.json",
        },
      });

      const finding = db
        .prepare("SELECT kind, severity, subject_id, status FROM findings WHERE subject_id = ?")
        .get("model_runs:run-with-missing-plan");
      expect(finding).toMatchObject({
        kind: "unresolved-join",
        severity: "warn",
        status: "open",
      });
    } finally {
      db.close();
    }
  });

  it("auto-populates relation, profile, document export, and test catalog projections on rebuild", () => {
    const db = openHarnessDb(":memory:");
    try {
      const result = rebuildHarnessDb({ repoRoot: process.cwd(), db });

      expect(result.ok).toBe(true);
      expect(rowCounts(db).graph_nodes).toBeGreaterThan(0);
      expect(rowCounts(db).dependency_edges).toBeGreaterThan(0);
      expect(rowCounts(db).graph_snapshots).toBeGreaterThan(0);
      expect(rowCounts(db).impact_rules).toBeGreaterThan(0);
      expect(rowCounts(db).verification_profiles).toBeGreaterThan(0);
      expect(rowCounts(db).mcp_server_profiles).toBeGreaterThan(0);
      expect(rowCounts(db).mcp_profile_triggers).toBeGreaterThan(0);
      expect(rowCounts(db).document_export_profiles).toBeGreaterThan(0);
      expect(rowCounts(db).document_export_triggers).toBeGreaterThan(0);
      expect(rowCounts(db).document_export_runs).toBeGreaterThan(0);
      expect(rowCounts(db).document_export_datasets).toBeGreaterThan(0);
      expect(rowCounts(db).test_cases).toBeGreaterThan(0);
      expect(rowCounts(db).test_artifact_edges).toBeGreaterThan(0);
    } finally {
      db.close();
    }
  });

  it("rebuildHarnessDb deterministically projects plans and Phase3 outputs without source mutation", () => {
    const db = openHarnessDb(":memory:");
    try {
      const result = rebuildHarnessDb({
        repoRoot: process.cwd(),
        db,
        relationGraph: {
          nodes: [
            {
              id: "plan:PLAN-L7-46-projection-writer",
              kind: "plan",
              path: "docs/plans/PLAN-L7-46-projection-writer.md",
            },
          ],
          edges: [],
          verificationProfiles: [],
          findings: [],
        },
        documentExports: {
          document_export_runs: [
            {
              document_export_run_id: "export-1",
              source_snapshot_hash: "sha256:test",
              evidence_path: ".ut-tdd/evidence/export.json",
            },
          ],
          document_export_datasets: [
            {
              document_export_dataset_id: "dataset-1",
              document_export_run_id: "export-1",
              format: "markdown",
            },
          ],
          document_export_artifacts: [],
          findings: [],
          actionsTaken: [],
          ok: true,
        },
        verificationEvidence: {
          verification_profiles: [],
          verification_recommendations: [],
          mcp_server_runs: [],
          external_tool_findings: [],
          findings: [],
          ok: true,
        },
      });
      const second = rebuildHarnessDb({
        repoRoot: process.cwd(),
        db,
        relationGraph: result.inputs.relationGraph,
        documentExports: result.inputs.documentExports,
        verificationEvidence: result.inputs.verificationEvidence,
      });

      expect(result.ok).toBe(true);
      expect(second.rowCounts).toEqual(result.rowCounts);
      expect(rowCounts(db).plan_registry).toBeGreaterThan(0);
      const projectedPlan = db
        .prepare("SELECT source_hash FROM plan_registry WHERE source_hash <> '' LIMIT 1")
        .get() as { source_hash?: string } | undefined;
      expect(projectedPlan?.source_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(rowCounts(db).graph_nodes).toBe(1);
      expect(rowCounts(db).document_export_runs).toBe(1);
      expect(rowCounts(db).roadmap_rollups).toBe(1);
      expect(rowCounts(db).roadmap_band_coverage).toBeGreaterThan(0);
      expect(rowCounts(db).roadmap_gate_progress).toBeGreaterThan(0);
      expect(rowCounts(db).review_evidence_registry).toBeGreaterThan(0);
      expect(rowCounts(db).descent_obligations).toBeGreaterThan(0);
      expect(rowCounts(db).drive_runs).toBeGreaterThan(0);
      expect(rowCounts(db).hook_events).toBeGreaterThan(0);
      expect(rowCounts(db).model_runs).toBeGreaterThan(0);
      expect(rowCounts(db).automation_assets).toBeGreaterThan(0);
      expect(rowCounts(db).skill_recommendations).toBeGreaterThan(0);
      expect(rowCounts(db).skill_invocations).toBeGreaterThan(0);
      expect(rowCounts(db).quality_signals).toBeGreaterThan(0);
      expect(rowCounts(db).feedback_events).toBeGreaterThan(0);
      expect(rowCounts(db).issue_queue).toBeGreaterThan(0);
      expect(rowCounts(db).trouble_events).toBeGreaterThanOrEqual(0);
      expect(rowCounts(db).improvement_log).toBeGreaterThan(0);

      const program = db
        .prepare("SELECT * FROM roadmap_rollups WHERE rollup_id = ?")
        .get("program");
      expect(program).toMatchObject({
        total_bands: 5,
        covered_bands: 5,
        parked_bands: 0,
        uncovered_bands: 0,
        total_gates: 20,
        reached_gates: 20,
      });

      const verificationBand = db
        .prepare("SELECT status, roadmap_ids FROM roadmap_band_coverage WHERE band_id = ?")
        .get("verification");
      expect(verificationBand).toMatchObject({ status: "covered" });
      expect(String(verificationBand?.roadmap_ids)).toContain("PLAN-M-00-verify-cutover");

      const cutoverBand = db
        .prepare("SELECT status, roadmap_ids FROM roadmap_band_coverage WHERE band_id = ?")
        .get("cutover");
      expect(cutoverBand).toMatchObject({ status: "covered" });
      expect(String(cutoverBand?.roadmap_ids)).toContain("PLAN-M-01-cutover-backfill");

      const cutoverGate = db
        .prepare(
          "SELECT reached, confirmed_spans, total_spans FROM roadmap_gate_progress WHERE plan_id = ? AND gate_id = ?",
        )
        .get("PLAN-M-01-cutover-backfill", "G-CUTOVER.B");
      expect(cutoverGate).toMatchObject({
        reached: 1,
        confirmed_spans: 1,
        total_spans: 1,
      });

      const reviewEvidence = db
        .prepare(
          "SELECT has_evidence, review_kind, verdict FROM review_evidence_registry WHERE plan_id = ?",
        )
        .get("PLAN-M-01-cutover-backfill");
      expect(reviewEvidence).toMatchObject({
        has_evidence: 1,
        review_kind: "intra_runtime_subagent",
        verdict: "pass",
      });

      const verificationRuns = db
        .prepare(
          `SELECT phase, ready_status, human_required
           FROM workflow_runs
           WHERE plan_id = ? AND workflow = ?
           ORDER BY CASE phase
             WHEN 'L8' THEN 8
             WHEN 'L9' THEN 9
             WHEN 'L10' THEN 10
             WHEN 'L11' THEN 11
             WHEN 'L12' THEN 12
             WHEN 'L13' THEN 13
             WHEN 'L14' THEN 14
             ELSE 99
           END`,
        )
        .all(
          "PLAN-M-00-verify-cutover",
          "L8-L14-verification-band",
        ) as unknown as VerificationWorkflowRow[];
      expect(verificationRuns).toHaveLength(7);
      expect(verificationRuns.map((row) => row.phase)).toEqual([
        "L8",
        "L9",
        "L10",
        "L11",
        "L12",
        "L13",
        "L14",
      ]);
      expect(verificationRuns.every((row) => row.ready_status === "passed_local")).toBe(true);
      expect(
        verificationRuns
          .filter((row) => row.phase === "L12" || row.phase === "L13")
          .every((row) => row.human_required === 1),
      ).toBe(true);

      const verificationDriveJoin = db
        .prepare(
          `SELECT d.plan_id, d.mode, d.status
           FROM workflow_runs w
           JOIN drive_runs d ON d.drive_run_id = w.drive_run_id
           WHERE w.plan_id = ? AND w.phase = ?`,
        )
        .get("PLAN-M-00-verify-cutover", "L8") as DriveRunRow | undefined;
      expect(verificationDriveJoin).toMatchObject({
        plan_id: "PLAN-M-00-verify-cutover",
        mode: "Verification",
      });

      const hookJoin = db
        .prepare(
          `SELECT COUNT(*) AS value
           FROM hook_events h
           JOIN plan_registry p ON p.plan_id = h.plan_id`,
        )
        .get() as { value: number };
      expect(hookJoin.value).toBeGreaterThan(0);

      const modelJoin = db
        .prepare(
          `SELECT COUNT(*) AS value
           FROM model_runs m
           JOIN plan_registry p ON p.plan_id = m.plan_id`,
        )
        .get() as { value: number };
      expect(modelJoin.value).toBeGreaterThan(0);

      const verificationGates = db
        .prepare(
          "SELECT gate_id, status, evidence_path FROM gate_runs WHERE plan_id = ? AND gate_id LIKE ? ORDER BY gate_id",
        )
        .all("PLAN-M-00-verify-cutover", "G-VERIFY.L%") as unknown as VerificationGateRow[];
      expect(verificationGates).toHaveLength(7);
      expect(verificationGates.every((row) => row.status === "passed")).toBe(true);
      expect(
        verificationGates.every((row) =>
          String(row.evidence_path).includes("A-132-l8-l14-verification-band-execution.md"),
        ),
      ).toBe(true);

      const coverage = db
        .prepare(
          "SELECT value, threshold, status FROM coverage WHERE scope = ? AND subject_id = ? AND metric = ?",
        )
        .get("verification-band", "program", "covered_program_bands");
      expect(coverage).toMatchObject({
        value: 5,
        threshold: 5,
        status: "passed",
      });

      const skillRecommendation = db
        .prepare(
          "SELECT skill_id, reason FROM skill_recommendations WHERE plan_id = ? ORDER BY rank LIMIT 1",
        )
        .get("PLAN-M-01-cutover-backfill");
      expect(skillRecommendation).toMatchObject({ skill_id: "skill:review-checklist" });
      expect(String(skillRecommendation?.reason)).toContain("layer=");

      const skillInvocation = db
        .prepare(
          "SELECT skill_id, source, accepted FROM skill_invocations WHERE plan_id = ? AND skill_id = ?",
        )
        .get("PLAN-M-01-cutover-backfill", "skill:review-checklist");
      expect(skillInvocation).toMatchObject({
        skill_id: "skill:review-checklist",
        source: "auto-projection:review-evidence",
        accepted: 1,
      });

      const driveMetric = db
        .prepare("SELECT metric, status FROM quality_signals WHERE metric = ? LIMIT 1")
        .get("drive_firing_rate");
      expect(driveMetric).toMatchObject({ metric: "drive_firing_rate" });

      const feedbackEvent = db
        .prepare("SELECT signal_type, next_action FROM feedback_events ORDER BY created_at LIMIT 1")
        .get();
      expect(String(feedbackEvent?.signal_type ?? "")).not.toHaveLength(0);
      expect(String(feedbackEvent?.next_action ?? "")).toContain("review");

      const issueQueue = db
        .prepare(
          "SELECT target, status, human_approval_required, external_issue_url FROM issue_queue ORDER BY created_at LIMIT 1",
        )
        .get();
      expect(issueQueue).toMatchObject({
        target: "github",
        status: "queued_dry_run",
        human_approval_required: 1,
        external_issue_url: "",
      });

      const approvalGuardrail = db
        .prepare(
          "SELECT guardrail, decision, human_signoff_required FROM guardrail_decisions WHERE guardrail = ? LIMIT 1",
        )
        .get("external-github-issue-approval");
      expect(approvalGuardrail).toMatchObject({
        guardrail: "external-github-issue-approval",
        decision: "requires-human-approval",
        human_signoff_required: 1,
      });

      const troubleCount = db.prepare("SELECT COUNT(*) AS value FROM trouble_events").get();
      expect(Number(troubleCount?.value ?? 0)).toBeGreaterThanOrEqual(0);

      const improvementLog = db
        .prepare(
          "SELECT category, status, next_action FROM improvement_log ORDER BY created_at LIMIT 1",
        )
        .get();
      expect(String(improvementLog?.next_action ?? "")).toContain("review");
      expect(improvementLog).toMatchObject({ status: "open" });
    } finally {
      db.close();
    }
  });
});
