import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkAgentSlots,
  checkAssetDrift,
  checkBackfillResult,
  checkChangeImpact,
  checkCodingRules,
  checkCycleP4Verification,
  checkDddTddRules,
  checkDependencyDrift,
  checkDescentObligation,
  checkDriveDbRegistration,
  checkDriveModelPassage,
  checkFrRoadmapCoverage,
  checkGateConfirm,
  checkHandover,
  checkHandoverDisciplineMessages,
  checkImplPlanTrace,
  checkL6Completion,
  checkL6FrCoverage,
  checkL7Completion,
  checkModuleDrift,
  checkOracleTestTrace,
  checkPairFreeze,
  checkPlaceholderDeps,
  checkPlanDod,
  checkPlanGovernance,
  checkPlanTraceGate,
  checkProjectHooks,
  checkPropagation,
  checkReadability,
  checkRegressionExpansion,
  checkReviewEvidence,
  checkRoadmap,
  checkRuleAutomationClosure,
  checkRuleDrift,
  checkScrumReverse,
  checkSkillAssignment,
  checkTelemetryClosure,
  checkTrackedCanonical,
  checkVerificationGroupsResult,
  type DoctorDeps,
  runDoctor,
} from "../src/doctor/index";
import type { AgentSlotsDeps, Slot } from "../src/runtime/agent-slots";

const NOW = "2026-06-04T00:00:00.000Z";
const pointerPath = join("/repo", ".ut-tdd", "handover", "CURRENT.json");
const slotStatePath = join("/repo", ".ut-tdd", "state", "agent-slots.json");
const currentPlanPath = join("/repo", ".ut-tdd", "state", "current-plan");
const digestDir = join("/repo", ".ut-tdd", "logs", "plan");

function deps(over: Partial<DoctorDeps> & { files?: Map<string, string> } = {}): DoctorDeps {
  const files = over.files ?? new Map<string, string>();
  return {
    repoRoot: "/repo",
    now: NOW,
    readText: (p) => files.get(p) ?? null,
    listDir: (dir) =>
      [...files.keys()]
        .filter((k) => k.startsWith(`${dir}/`) || k.startsWith(`${dir}\\`))
        .map((k) => k.slice(dir.length + 1)),
    ...over,
  };
}

describe("checkHandover (doctor handover staleness surface)", () => {
  it("CURRENT.json なし → 生成を促す message (ok は落とさない)", () => {
    expect(checkHandover(deps())).toContain("CURRENT.json なし");
  });

  it("fresh pointer → OK + active 表示", () => {
    const files = new Map([
      [
        pointerPath,
        JSON.stringify({
          active_plan: "PLAN-X",
          status: "in_progress",
          latest_doc: null,
          digest_summary: null,
          updated_at: "2026-06-03T18:00:00.000Z",
        }),
      ],
    ]);
    const msg = checkHandover(deps({ files }));
    expect(msg).toContain("OK");
    expect(msg).toContain("PLAN-X");
  });

  it("24h 超 → stale 警告", () => {
    const files = new Map([
      [pointerPath, JSON.stringify({ updated_at: "2026-06-01T00:00:00.000Z" })],
    ]);
    expect(checkHandover(deps({ files }))).toContain("stale");
  });

  it("壊れ JSON → 再生成を促す (throw しない)", () => {
    const files = new Map([[pointerPath, "{not json"]]);
    expect(() => checkHandover(deps({ files }))).not.toThrow();
    expect(checkHandover(deps({ files }))).toContain("壊れて");
  });
});

describe("checkHandoverDisciplineMessages", () => {
  it("fresh CURRENT 縺ｧ繧・current-plan/digest 縺ｨ active_plan 縺後★繧後※縺・ｌ縺ｰ drift 繧・surface", () => {
    const files = new Map([
      [currentPlanPath, "PLAN-L5-08-harness-db-feedback\n2026-06-03T23:50:00.000Z"],
      [
        join(digestDir, "PLAN-L5-08-harness-db-feedback.digest.json"),
        JSON.stringify({
          plan_id: "PLAN-L5-08-harness-db-feedback",
          sessions: ["s1"],
          commits: [],
          files_touched: ["docs/plans/PLAN-L5-08-harness-db-feedback.md"],
          failures: [],
          updated_at: "2026-06-03T23:55:00.000Z",
        }),
      ],
      [
        pointerPath,
        JSON.stringify({
          active_plan: "PLAN-L5-00-master",
          status: "completed",
          latest_doc: null,
          digest_summary: { commits: 0, files: 0, failures: 0 },
          updated_at: "2026-06-03T23:59:00.000Z",
          generated_by: "ut-tdd-handover",
          doc_entry_count: 0,
        }),
      ],
    ]);
    const messages = checkHandoverDisciplineMessages(deps({ files }));
    expect(messages.some((m) => m.includes("drift"))).toBe(true);
  });

  it("runDoctor 縺・handover discipline 繧・warning-only 縺ｧ蜷梧凾 surface 縺吶ｋ", () => {
    const files = new Map([
      [currentPlanPath, "PLAN-L5-08-harness-db-feedback\n2026-06-03T23:50:00.000Z"],
      [
        join(digestDir, "PLAN-L5-08-harness-db-feedback.digest.json"),
        JSON.stringify({
          plan_id: "PLAN-L5-08-harness-db-feedback",
          sessions: ["s1"],
          commits: [],
          files_touched: ["docs/plans/PLAN-L5-08-harness-db-feedback.md"],
          failures: [],
          updated_at: "2026-06-03T23:55:00.000Z",
        }),
      ],
    ]);
    const r = runDoctor(deps({ files }));
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("handover-discipline"))).toBe(true);
    expect(r.messages.some((m) => m.includes("verification group lint could not run"))).toBe(true);
  });
});

describe("checkAgentSlots (doctor agent-slots surface, IMP-050)", () => {
  function slotDeps(slots: Slot[] | null, now = "2026-06-04T00:10:00.000Z"): AgentSlotsDeps {
    const files = new Map<string, string>();
    if (slots !== null) files.set(slotStatePath, JSON.stringify(slots));
    return {
      repoRoot: "/repo",
      now: () => now,
      readText: (p) => files.get(p) ?? null,
      writeText: () => {
        throw new Error("doctor は read-only であるべき (writeText 呼び出し禁止)");
      },
      newId: () => "x",
    };
  }
  function slot(over: Partial<Slot>): Slot {
    return {
      slot_id: "s",
      agent_kind: "pmo-sonnet",
      role: null,
      slot_source: "agent_guard",
      fired_at: "2026-06-04T00:00:00.000Z",
      released_at: null,
      status: "running",
      exit_code: null,
      ...over,
    };
  }

  it("記録なし → 記録なし message", () => {
    expect(checkAgentSlots(slotDeps(null))).toContain("記録なし");
  });

  it("stale slot (5分超 release なし) → stale 警告", () => {
    const msg = checkAgentSlots(slotDeps([slot({ slot_id: "old" })])); // fired 00:00, now 00:10
    expect(msg).toContain("stale");
    expect(msg).toContain("old");
  });

  it("released 済のみ → OK + peak 表示 (read-only、writeText を呼ばない)", () => {
    const msg = checkAgentSlots(
      slotDeps([slot({ status: "completed", released_at: "2026-06-04T00:02:00.000Z" })]),
    );
    expect(msg).toContain("OK");
    expect(msg).toContain("peak_parallel");
  });
});

describe("runDoctor", () => {
  it("ok=true で handover + agent-slots surface を含む (warning、ok を落とさない)", () => {
    const r = runDoctor(deps());
    expect(r.ok).toBe(false);
    expect(r.messages.some((m) => m.includes("handover"))).toBe(true);
    expect(r.messages.some((m) => m.includes("agent-slots"))).toBe(true);
    expect(r.messages.some((m) => m.includes("verification group lint could not run"))).toBe(true);
    // hard-fail lints も surface に出る (合成 repoRoot は docs 不在で skip note、wiring 存在を確認)
    expect(r.messages.some((m) => m.includes("scrum-reverse"))).toBe(true);
    expect(r.messages.some((m) => m.includes("propagation"))).toBe(true);
    expect(r.messages.some((m) => m.includes("coding-rules"))).toBe(true);
  });

  it("includes asset-drift hard gate in doctor output", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: asset-drift") && m.includes("OK"))).toBe(
      true,
    );
  });

  it("includes skill-assignment hard gate in doctor output", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: skill-assignment - OK"))).toBe(true);
  });

  it("includes G1/G3 trace gates in doctor output", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: g1-trace - OK"))).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: g3-trace - OK"))).toBe(true);
  });

  it("hard-gates PLAN governance once repo frontmatter debt is closed", () => {
    const governance = checkPlanGovernance(process.cwd());
    const r = runDoctor();

    expect(governance.ok).toBe(true);
    expect(governance.messages[0]).toContain("plan-governance - OK");
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: plan-schedule") && m.includes("OK"))).toBe(
      true,
    );
    expect(r.messages.some((m) => m.includes("doctor: plan-governance - OK"))).toBe(true);
  });

  it("surfaces dependency-drift and regression expansion instead of scaffold stub", () => {
    const r = runDoctor();
    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: dependency-drift —"))).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: regression-expansion —"))).toBe(true);
    expect(r.messages.some((m) => m.includes("scaffold stub"))).toBe(false);
  });

  it("surfaces roadmap-rollup as a hard gate summary line", () => {
    const r = runDoctor();
    // roadmap.messages は runDoctor 内で `doctor: ${m}` へ変換されるため "doctor: " prefix を期待する。
    const rollupLines = r.messages.filter((m) => m.startsWith("doctor: roadmap-rollup —"));

    expect(r.ok).toBe(true);
    expect(rollupLines).toHaveLength(1);
    expect(rollupLines[0]).toContain("bands ");
    expect(rollupLines[0]).toContain("gates ");
    expect(rollupLines[0]).toContain("spans ");
    expect(rollupLines[0]).toContain("frontier:");
  });

  it("surfaces Cycle P4 closure audit as a hard gate", () => {
    const r = runDoctor();

    expect(r.ok).toBe(true);
    expect(r.messages.some((m) => m.includes("doctor: cycle-p4-verification - OK"))).toBe(true);
  });

  it("fails descent-obligation when a trace chain has no required downstream landing", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-doctor-descent-"));
    try {
      const docDir = join(root, "docs", "design", "harness", "L6-function-design");
      mkdirSync(docDir, { recursive: true });
      writeFileSync(
        join(docDir, "bad.md"),
        "---\nlayer: L6\nstatus: confirmed\n---\nFR-L1-99\n",
        "utf8",
      );

      const result = checkDescentObligation(root);

      expect(result.ok).toBe(false);
      expect(result.messages.join("\n")).toContain("descent-obligation - unmet");
      expect(result.messages.join("\n")).toContain("FR-L1-99");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails confirmed L7 PLANs with unchecked DoD items", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-doctor-plan-dod-"));
    try {
      const planDir = join(root, "docs", "plans");
      mkdirSync(planDir, { recursive: true });
      writeFileSync(
        join(planDir, "PLAN-L7-99-unchecked.md"),
        [
          "---",
          "plan_id: PLAN-L7-99-unchecked",
          "status: confirmed",
          "kind: impl",
          "---",
          "",
          "## §4 DoD",
          "",
          "- [ ] verification evidence is not closed",
          "",
          "## §5 Notes",
          "",
        ].join("\n"),
        "utf8",
      );

      const result = checkPlanDod(root);

      expect(result.ok).toBe(false);
      expect(result.messages.join("\n")).toContain("plan-dod - violation");
      expect(result.messages.join("\n")).toContain("PLAN-L7-99-unchecked:9");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails active design/test-design docs with unresolved L7 placeholder_deps", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-doctor-placeholder-deps-"));
    try {
      const docDir = join(root, "docs", "design", "harness", "L5-detailed-design");
      mkdirSync(docDir, { recursive: true });
      writeFileSync(
        join(docDir, "physical-data.md"),
        [
          "---",
          "layer: L5",
          "status: confirmed",
          "---",
          "",
          "- placeholder_deps: {waiting_layer:L7, waiting_spec: stale implementation bridge}",
          "- Current status: dedicated `placeholder_deps` doctor rule is not implemented yet.",
        ].join("\n"),
        "utf8",
      );

      const result = checkPlaceholderDeps(root);

      expect(result.ok).toBe(false);
      expect(result.messages.join("\n")).toContain("placeholder-deps - violation");
      expect(result.messages.join("\n")).toContain("physical-data.md:6");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails active L4-L6 design docs with stale L7 completion blockers", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-doctor-l7-completion-"));
    try {
      const docDir = join(root, "docs", "design", "harness", "L4-basic-design");
      mkdirSync(docDir, { recursive: true });
      writeFileSync(
        join(docDir, "function.md"),
        [
          "---",
          "layer: L4",
          "status: confirmed",
          "---",
          "",
          "> 現状実装済は C2 のみ。残は L7 carry。",
          "| `ut-tdd review --uncommitted` | FR-45 | 未 | doc-reviewer 召喚 |",
        ].join("\n"),
        "utf8",
      );

      const result = checkL7Completion(root);

      expect(result.ok).toBe(false);
      expect(result.messages.join("\n")).toContain("l7-completion - violation");
      expect(result.messages.join("\n")).toContain("function.md:6");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed when hard-gate checker inputs cannot be read", () => {
    const missingRoot = join(tmpdir(), `ut-tdd-doctor-missing-${Date.now()}-nope`);
    const checks = [
      ["backfill", checkBackfillResult(missingRoot)],
      ["scrum-reverse", checkScrumReverse(missingRoot)],
      ["propagation", checkPropagation(missingRoot)],
      ["pair-freeze", checkPairFreeze(missingRoot)],
      ["module-drift", checkModuleDrift(missingRoot)],
      ["review-evidence", checkReviewEvidence(missingRoot)],
      ["asset-drift", checkAssetDrift(missingRoot)],
      ["skill-assignment", checkSkillAssignment(missingRoot)],
      ["descent-obligation", checkDescentObligation(missingRoot)],
      ["change-impact", checkChangeImpact(missingRoot)],
      ["coding-rules", checkCodingRules(missingRoot)],
      ["ddd-tdd-rules", checkDddTddRules(missingRoot)],
      ["rule-drift", checkRuleDrift(missingRoot)],
      ["gate-confirm", checkGateConfirm(missingRoot)],
      ["plan-dod", checkPlanDod(missingRoot)],
      ["placeholder-deps", checkPlaceholderDeps(missingRoot)],
      ["g1-trace", checkPlanTraceGate(missingRoot, "G1-trace")],
      ["g3-trace", checkPlanTraceGate(missingRoot, "G3-trace")],
      ["rule-automation-closure", checkRuleAutomationClosure(missingRoot)],
      ["drive-model-passage", checkDriveModelPassage(missingRoot)],
      ["drive-db-registration", checkDriveDbRegistration(missingRoot)],
      ["fr-roadmap-coverage", checkFrRoadmapCoverage(missingRoot)],
      ["telemetry-closure", checkTelemetryClosure(missingRoot)],
      ["cycle-p4-verification", checkCycleP4Verification(missingRoot)],
      ["l6-fr-coverage", checkL6FrCoverage(missingRoot)],
      ["readability", checkReadability(missingRoot)],
      ["project-hook", checkProjectHooks(missingRoot)],
      ["l6-completion", checkL6Completion(missingRoot)],
      ["l7-completion", checkL7Completion(missingRoot)],
      ["verification-groups", checkVerificationGroupsResult(missingRoot)],
      ["roadmap", checkRoadmap(missingRoot)],
      ["impl-plan-trace", checkImplPlanTrace(missingRoot)],
      ["oracle-test-trace", checkOracleTestTrace(missingRoot)],
      ["tracked-canonical", checkTrackedCanonical(missingRoot)],
      ["dependency-drift", checkDependencyDrift(missingRoot)],
      ["regression-expansion", checkRegressionExpansion(missingRoot, null)],
    ] as const;

    expect(checks.filter(([, result]) => result.ok).map(([name]) => name)).toEqual([]);
    for (const [, result] of checks) {
      expect(result.messages.join("\n")).toMatch(/violation/i);
    }
  });

  it("keeps all hard gates wired into runDoctor hard-gate aggregation", () => {
    const source = readFileSync(join(process.cwd(), "src", "doctor", "index.ts"), "utf8");
    const okExpression = source.match(/return\s+\{\s+ok:([\s\S]*?),\s+messages:\s+\[/)?.[1] ?? "";
    const expectedHardGates = [
      "backfill",
      "scrumRev",
      "propagation",
      "pairFreeze",
      "moduleDrift",
      "reviewEvidence",
      "assetDrift",
      "skillAssignment",
      "descentObligation",
      "changeImpact",
      "codingRules",
      "dddTddRules",
      "ruleDrift",
      "gateConfirm",
      "planSchedule",
      "planGovernance",
      "planDod",
      "placeholderDeps",
      "g1Trace",
      "g3Trace",
      "ruleAutomationClosure",
      "driveModelPassage",
      "driveDbRegistration",
      "frRoadmapCoverage",
      "telemetryClosure",
      "cycleP4Verification",
      "l6FrCoverage",
      "readability",
      "projectHooks",
      "l6Completion",
      "l7Completion",
      "verificationGroups",
      "roadmap",
      "implPlanTrace",
      "oracleTestTrace",
      "trackedCanonical",
      "dependencyDrift",
      "regressionExpansion",
    ];

    expect(expectedHardGates.filter((name) => !okExpression.includes(`${name}.ok`))).toEqual([]);
  });
});
