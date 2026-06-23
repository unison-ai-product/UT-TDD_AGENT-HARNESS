import { describe, expect, it } from "vitest";
import { recommendedCommandV1Schema } from "../src/schema/index";
import { openHarnessDb } from "../src/state-db/index";
import { migrate } from "../src/state-db/migration";
import {
  assertRefactorInvariant,
  buildCommandCatalog,
  catalogExistingAssets,
  catalogSkills,
  classifyDrive,
  computeUtHistorySignals,
  decideDiscoveryS4,
  detectFrontendDrift,
  enforceForwardOrder,
  evaluateGreenDefinition,
  evaluateResearchDecision,
  evaluateRetrofitMatrix,
  evaluateRouteCommand,
  mergeTwoStageAgentDesign,
  prioritizeCapabilityGaps,
  recommendModelEffort,
  recommendSkills,
  recordCrossCuttingEvent,
  recordTestRunEvidence,
  renderFoundationReadiness,
  resolveDriveStatePartition,
  routeReverseR4,
  routeScrumFullback,
  routeSignalToMode,
  suggestSkillInjection,
  validateFolderRules,
  validateFrontendDesignWorkflow,
  validateScreenDesignWorkflow,
} from "../src/workflow/contracts";

// @ut-tdd-trace FR-L1-06
// @ut-tdd-trace FR-L1-08
// @ut-tdd-trace FR-L1-11
// @ut-tdd-trace FR-L1-12
// @ut-tdd-trace FR-L1-13
// @ut-tdd-trace FR-L1-14
// @ut-tdd-trace FR-L1-15
// @ut-tdd-trace FR-L1-22
// @ut-tdd-trace FR-L1-23
// @ut-tdd-trace FR-L1-25
// @ut-tdd-trace FR-L1-26
// @ut-tdd-trace FR-L1-27
// @ut-tdd-trace FR-L1-28
// @ut-tdd-trace FR-L1-29
// @ut-tdd-trace FR-L1-30
// @ut-tdd-trace FR-L1-32
// @ut-tdd-trace FR-L1-37
// @ut-tdd-trace FR-L1-39
// @ut-tdd-trace FR-L1-40
// @ut-tdd-trace FR-L1-41
// @ut-tdd-trace FR-L1-47
// @ut-tdd-trace FR-L1-48

describe("L7 workflow contract implementations", () => {
  it("records UT run evidence into harness.db projection tables and reports weak links", () => {
    const db = openHarnessDb(":memory:");
    try {
      migrate(db);
      const result = recordTestRunEvidence(
        {
          plan_id: "PLAN-L7-X",
          command: "bun run test",
          runner: "vitest",
          scope: "tests/workflow-contracts.test.ts",
          started_at: "2026-06-12T00:00:00.000Z",
          completed_at: "2026-06-12T00:01:00.000Z",
          exit_code: 0,
          evidence_path: ".ut-tdd/evidence/test.json",
          output_digest: "sha256:0123456789abcdef",
          cases: [
            {
              oracle_id: "U-FR-L1-06",
              name: "records projection",
              status: "passed",
              artifact_path: "src/workflow/contracts.ts",
            },
          ],
        },
        { db },
      );

      expect(result.ok).toBe(true);
      expect(result.refs.map((ref) => ref.table)).toEqual([
        "test_runs",
        "test_cases",
        "test_results",
        "test_artifact_edges",
      ]);
      expect(db.prepare("SELECT COUNT(*) AS n FROM test_runs").get()?.n).toBe(1);
      expect(
        db.prepare("SELECT output_digest FROM test_runs WHERE plan_id = ?").get("PLAN-L7-X")
          ?.output_digest,
      ).toBe("sha256:0123456789abcdef");
      expect(db.prepare("SELECT COUNT(*) AS n FROM test_artifact_edges").get()?.n).toBe(1);
    } finally {
      db.close();
    }
  });

  it("evaluates green definition and UT history signals without silent pass", () => {
    const green = evaluateGreenDefinition({
      profile: "l7",
      required_commands: ["lint", "test"],
      reviewed_at: "2026-06-12T00:05:00.000Z",
      command_evidence: [
        {
          kind: "lint",
          completed_at: "2026-06-12T00:01:00.000Z",
          exit_code: 0,
          evidence_path: "lint.log",
        },
        {
          kind: "test",
          completed_at: "2026-06-12T00:02:00.000Z",
          exit_code: 0,
          evidence_path: "test.log",
        },
      ],
    });
    expect(green.ok).toBe(true);
    expect(green.computed_green_at).toBe("2026-06-12T00:02:00.000Z");

    const weak = evaluateGreenDefinition({
      profile: "l7",
      required_commands: ["lint", "test", "doctor"],
      command_evidence: [],
    });
    expect(weak.ok).toBe(false);
    expect(weak.missing).toEqual(["lint", "test", "doctor"]);

    const signals = computeUtHistorySignals({
      required_oracles: ["U-1", "U-2"],
      test_runs: [
        {
          command: "test",
          runner: "vitest",
          scope: "unit",
          started_at: "2026-06-12T00:00:00.000Z",
          completed_at: "2026-06-12T00:01:00.000Z",
          exit_code: 0,
          evidence_path: "test.log",
          cases: [{ oracle_id: "U-1", name: "one", status: "passed" }],
        },
      ],
    });
    expect(signals.signals.find((s) => s.signal_type === "oracle_coverage")?.score).toBe(0.5);
  });

  it("implements routing, workflow, FE/design, asset, model, drive, skill, and command contracts", () => {
    expect(routeSignalToMode({ signal: "reverse gap" }).candidates).toEqual(["reverse"]);
    const routeEval = evaluateRouteCommand({ signal: "reverse gap" });
    expect(routeEval.mode).toBe("reverse");
    expect(routeEval.exit_code).toBe(0);
    expect(routeEval.recommended_command?.command).toBe("ut-tdd task classify");
    expect(recommendedCommandV1Schema.safeParse(routeEval.recommended_command).success).toBe(true);
    expect(routeEval.suggest_command).toContain("reverse gap");
    const unknownRoute = evaluateRouteCommand({ signal: "unmapped-special-case" });
    expect(unknownRoute.exit_code).toBe(2);
    expect(unknownRoute.recommended_command).toBeNull();
    expect(
      recordCrossCuttingEvent({
        type: "drift",
        subject_id: "PLAN-X",
        severity: "warn",
        evidence_path: "evidence.md",
      }).ok,
    ).toBe(true);
    expect(
      suggestSkillInjection({
        task: "test doctor",
        layer: "L7",
        drive: "agent",
        catalog: [{ skill_id: "testing", triggers: ["test"], layers: ["L7"], drives: ["agent"] }],
      }).candidates[0]?.skill_id,
    ).toBe("testing");
    expect(
      enforceForwardOrder({
        layer: "L7",
        gate: "G7",
        prior_gates: [{ gate: "G6", status: "passed" }],
      }).allowed,
    ).toBe(true);
    expect(
      routeReverseR4({
        reverse_type: "gap",
        r4_evidence: { status: "confirmed", evidence_path: "r4.md" },
        forward_routing: "PLAN-L7-X",
      }).target_plan,
    ).toBe("PLAN-L7-X");
    expect(
      decideDiscoveryS4({
        hypothesis: "h",
        poc_evidence: { status: "verified", evidence_path: "poc.md" },
        outcome: "confirmed",
      }).decision,
    ).toBe("confirmed");
    expect(detectFrontendDrift({ token_root: "tokens" }).drift_signals).toContain(
      "absent:mock_root",
    );
    expect(
      routeScrumFullback({ increment: "INC-1", s4_decision: "confirmed" }).forward_targets,
    ).toEqual(["Forward:INC-1"]);
    expect(
      assertRefactorInvariant({
        before: "same",
        after: "same",
        regression: { exit_code: 0, evidence_path: "test.log" },
      }).unchanged,
    ).toBe(true);
    expect(evaluateRetrofitMatrix({ migration: "m", config: "c", rollback: "r" }).readiness).toBe(
      "ready",
    );
    expect(
      evaluateResearchDecision({ memo: "m", sources: ["s"], adr_candidate: "ADR" }).decision_ready,
    ).toBe(true);
    expect(mergeTwoStageAgentDesign({ phase1: "a", phase2: "b", handoff: "c" }).merged).toContain(
      "a",
    );
    expect(
      validateScreenDesignWorkflow({
        ia: "i",
        screens: "s",
        flow: "f",
        wireframe: "w",
        mock: "m",
        components: "c",
      }).complete,
    ).toBe(true);
    expect(
      validateFrontendDesignWorkflow({
        visual: "v",
        tokens: "t",
        a11y: "a",
        vrt: "r",
        ux: "u",
      }).complete,
    ).toBe(true);
    expect(
      validateFolderRules({
        path: "docs/plans/PLAN.md",
        artifact_kind: "plan",
        registry: { plan: ["docs/plans/"] },
      }).violations,
    ).toEqual([]);
    expect(
      catalogExistingAssets({ roots: [{ path: "docs/skills/x.md", type: "skill" }] }).assets,
    ).toHaveLength(1);
    expect(
      prioritizeCapabilityGaps({
        assets: [{ asset_id: "a" }],
        workflow_impact: { roster: 3 },
        missing_routes: ["roster"],
      }).priorities[0]?.gap,
    ).toBe("roster");
    expect(
      renderFoundationReadiness({
        categories: [{ name: "db", implemented: true }, { name: "ui" }],
      }).missing,
    ).toEqual(["ui"]);
    expect(
      recommendModelEffort({
        task: "large uncertain",
        drive: "agent",
        layer: "L7",
        size: "L",
        uncertainty: 0.8,
      }).reasoning_effort,
    ).toBe("high");
    expect(classifyDrive({ plan: "PLAN db" }).drive).toBe("db");
    expect(
      resolveDriveStatePartition({
        drive: "db",
        mode: "Forward",
        kind: "impl",
        layer: "L7",
        plan_id: "PLAN-X",
      }).partition_path,
    ).toContain(".ut-tdd/drive/db/Forward/PLAN-X");
    expect(
      catalogSkills({ skill_docs: [{ path: "s.md", triggers: ["test"] }] }).skills,
    ).toHaveLength(1);
    expect(
      recommendSkills({
        task: "test",
        layer: "L7",
        drive: "agent",
        catalog: [{ skill_id: "testing", triggers: ["test"] }],
      }).recommendations,
    ).toHaveLength(1);
    expect(
      buildCommandCatalog({
        command_docs: [{ path: "docs/commands/db.md", command: "db status" }],
        cli_surface: ["db status"],
      }).ok,
    ).toBe(true);
  });
});
