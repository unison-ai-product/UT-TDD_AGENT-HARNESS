/**
 * 統合検証 doctor (requirements_v1.2 §7 / §7.8.5)。
 * 多数の検出器 (back-fill / review-evidence / asset-drift / cycle-p4-verification / roadmap 等) を集約し、
 * gate 判定群を runDoctor.ok に連動させて fail-close する。handover / agent-slots は warning surface。
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkHandoverBypass,
  checkHandoverCompletionWording,
  checkHandoverDiscipline,
  type HandoverDeps,
  type HandoverPointer,
  handoverStale,
} from "../handover/index";
import { analyzeAssetDrift, assetDriftMessages, loadAssetDriftInput } from "../lint/asset-drift";
import { analyzeBackfill, backfillMessages, loadBackfillDocs } from "../lint/backfill-pairing";
import {
  analyzeChangeImpact,
  analyzeChangeSetIntegrity,
  changeImpactMessages,
  changeSetIntegrityMessages,
  loadChangedFiles,
} from "../lint/change-impact";
import {
  analyzeCodingRules,
  codingRulesMessages,
  loadCodingRuleDocs,
  loadCodingRulePolicy,
  loadCodingWorkflowDocs,
} from "../lint/coding-rules";
import {
  analyzeCycleP4Verification,
  cycleP4VerificationMessages,
  loadCycleP4VerificationDocs,
} from "../lint/cycle-p4-verification";
import {
  analyzeDbProjectionCoverage,
  dbProjectionCoverageMessages,
  loadDbProjectionRequirements,
} from "../lint/db-projection-coverage";
import {
  analyzeDbProjectionIngestion,
  dbProjectionIngestionMessages,
} from "../lint/db-projection-ingestion";
import { analyzeDddTddRules, dddTddRulesMessages, loadDddTddInputs } from "../lint/ddd-tdd-rules";
import {
  analyzeDependencyDrift,
  type DependencyDriftResult,
  dependencyDriftMessages,
  expandRegressionScope,
  loadDependencyDriftInput,
  regressionExpansionMessages,
} from "../lint/dependency-drift";
import {
  analyzeDescentObligations,
  descentObligationMessages,
  filterSubstanceVerifiedAdvisories,
  loadDeferLedger,
  loadDescentAdjacency,
  loadFrUnitCoverageOracles,
  loadTraceKeyedArtifacts,
} from "../lint/descent-obligation";
import {
  analyzeDriveDbRegistration,
  driveDbRegistrationMessages,
} from "../lint/drive-db-registration";
import {
  analyzeDriveModelPassage,
  driveModelPassageMessages,
  loadDriveModelPassageDocs,
} from "../lint/drive-model-passage";
import {
  analyzeFrRoadmapCoverageWithRoot,
  frRoadmapCoverageMessages,
  loadFrRoadmapCoverageDocs,
} from "../lint/fr-roadmap-coverage";
import { analyzeGateConfirm, gateConfirmMessages, loadGateConfirmDocs } from "../lint/gate-confirm";
import {
  analyzeImplPlanTrace,
  implPlanTraceMessages,
  loadImplPlanTraceInput,
} from "../lint/impl-plan-trace";
import {
  analyzeL6Completion,
  canLoadL6CompletionInputs,
  l6CompletionMessages,
  loadL6CompletionInputs,
} from "../lint/l6-completion";
import {
  analyzeL6FrCoverage,
  l6FrCoverageMessages,
  loadL6FrCoverageDocs,
} from "../lint/l6-fr-coverage";
import {
  analyzeL7Completion,
  l7CompletionMessages,
  loadL7CompletionDocs,
} from "../lint/l7-completion";
import {
  analyzeMergedPlanStatus,
  loadMergedPlanStatusInput,
  mergedPlanStatusMessages,
} from "../lint/merged-plan-status";
import { analyzeModuleDrift, loadModuleDocs, moduleDriftMessages } from "../lint/module-drift";
import {
  analyzeOracleTestTrace,
  loadOracleTestTraceInput,
  oracleTestTraceMessages,
} from "../lint/oracle-test-trace";
import {
  analyzePlaceholderDeps,
  loadPlaceholderDepsDocs,
  placeholderDepsMessages,
} from "../lint/placeholder-deps";
import {
  analyzePlanArtifactExistence,
  loadPlanArtifactExistenceInput,
  planArtifactExistenceMessages,
} from "../lint/plan-artifact-existence";
import { analyzePlanDod, loadPlanDodDocs, planDodMessages } from "../lint/plan-dod";
import {
  analyzeProjectHooks,
  loadProjectHookDocs,
  projectHookMessages,
} from "../lint/project-hook";
import { analyzePropagation, loadPropagationDocs, propagationMessages } from "../lint/propagation";
import {
  analyzeReadability,
  loadSystemReadabilityDocs,
  readabilityMessages,
} from "../lint/readability";
import {
  analyzeReviewEvidence,
  loadReviewPlans,
  reviewEvidenceMessages,
} from "../lint/review-evidence";
import {
  analyzeProgramCoverage,
  checkSpanExistence,
  computeGateProgress,
  computeProgramRollup,
  loadRoadmaps,
  PARKED_BANDS,
  programCoverageMessages,
} from "../lint/roadmap-registry";
import {
  analyzeRuleAutomationClosure,
  loadRuleAutomationClosureDocs,
  ruleAutomationClosureMessages,
} from "../lint/rule-automation-closure";
import { analyzeRuleDrift, loadRuleAdapterDocs, ruleDriftMessages } from "../lint/rule-drift";
import {
  analyzeRuntimePortability,
  loadRuntimePortabilityDocs,
  runtimePortabilityMessages,
} from "../lint/runtime-portability";
import { analyzeScrumReverse, loadSrPlans, scrumReverseMessages } from "../lint/scrum-reverse";
import { fmValue } from "../lint/shared";
import {
  analyzeSkillAssignments,
  loadSkillAssignmentDocs,
  skillAssignmentMessages,
} from "../lint/skill-assignment";
import {
  analyzeTelemetryClosure,
  loadTelemetryClosureDocs,
  telemetryClosureMessages,
} from "../lint/telemetry-closure";
import {
  analyzeTrackedCanonical,
  loadTrackedCanonicalInput,
  trackedCanonicalMessages,
} from "../lint/tracked-canonical";
import {
  analyzeVerificationProfileGate,
  loadVerificationRecommendation,
  verificationProfileGateMessages,
} from "../lint/verification-profile";
import type { LintResult } from "../plan/lint";
import { lintPlan, lintPlanWithGate } from "../plan/lint";
import { SUBAGENT_ALLOWLIST } from "../runtime/agent-guard";
import {
  type AgentSlotsDeps,
  DEFAULT_STALE_MINUTES,
  listActiveSlots,
  listStaleSlots,
  loadSlots,
  peakParallel,
} from "../runtime/agent-slots";
import { detectMode } from "../runtime/detect";
import { loadOrBuildDriveDbRegistrationStats } from "../state-db/drive-registration";
import {
  type GuardrailDecisionInput,
  inspectGuardrailInvariants,
} from "../state-db/guardrail-invariants";
import { openHarnessDb } from "../state-db/index";
import { rebuildHarnessDb } from "../state-db/projection-writer";
import {
  analyzePairFreeze,
  analyzeVerificationGroups,
  loadPairDocs,
  loadVerificationPlanEvidence,
  pairFreezeMessages,
  verificationGroupMessages,
  verificationGroupsOk,
} from "../vmodel/lint";

/** I/O・clock 注入 (test 可能、handover staleness 検査用)。 */
export interface DoctorDeps {
  repoRoot: string;
  now: string;
  readText: (path: string) => string | null;
  listDir: (dir: string) => string[];
}

function handoverDeps(deps: DoctorDeps): HandoverDeps {
  return {
    repoRoot: deps.repoRoot,
    now: () => deps.now,
    readText: deps.readText,
    listDir: deps.listDir,
    writeText: () => {
      throw new Error("doctor is read-only and must not write handover state");
    },
  };
}

export function checkHandoverDisciplineMessages(deps: DoctorDeps): string[] {
  const hd = handoverDeps(deps);
  return [
    ...checkHandoverDiscipline(hd),
    ...checkHandoverBypass(hd),
    ...checkHandoverCompletionWording(hd),
  ];
}

/**
 * handover 機械ポインタ (CURRENT.json) の鮮度を surface (§5.3 / §6.8.5、warning レベル)。
 * 不在・stale・壊れは message で示すのみ (doctor.ok は落とさない = §5.3 exit 0 warning)。
 */
export function checkHandover(deps: DoctorDeps): string {
  const raw = deps.readText(join(deps.repoRoot, ".ut-tdd", "handover", "CURRENT.json"));
  if (!raw) return "doctor: handover — CURRENT.json なし (ut-tdd handover で生成、§6.8.5)";
  let p: HandoverPointer;
  try {
    p = JSON.parse(raw) as HandoverPointer;
  } catch {
    return "doctor: handover — ⚠ CURRENT.json が壊れています (ut-tdd handover で再生成)";
  }
  return handoverStale(p.updated_at, deps.now)
    ? `doctor: handover — ⚠ stale (updated_at=${p.updated_at}、24h 超。ut-tdd handover で更新)`
    : `doctor: handover — OK (active=${p.active_plan ?? "-"}, updated_at=${p.updated_at})`;
}

/**
 * agent-slots (Layer-2 オーケストレーション) の stale slot / peak 並列を surface (IMP-050、warning レベル)。
 * stale (5 分超 released なし) があれば warn、無ければ active/peak を表示 (doctor.ok は落とさない)。
 */
export function checkAgentSlots(deps: AgentSlotsDeps): string {
  const all = loadSlots(deps);
  if (all.length === 0) return "doctor: agent-slots — 記録なし";
  const stale = listStaleSlots(deps, DEFAULT_STALE_MINUTES);
  const active = listActiveSlots(deps).length;
  const peak = peakParallel(all);
  if (stale.length > 0) {
    const ids = stale.map((s) => s.slot_id).join(", ");
    return `doctor: agent-slots — ⚠ stale ${stale.length} 件 (${DEFAULT_STALE_MINUTES}分超 release なし: ${ids}。release 漏れを確認)`;
  }
  return `doctor: agent-slots — OK (active=${active}, peak_parallel=${peak})`;
}

/**
 * 駆動モデルの back-fill 完全性 (impl⇔Reverse / impl⇔glossary) を検査 (IMP-051、hard)。
 * Reverse 無き impl / §6 用語の glossary 未 merge を violation にして doctor.ok に連動する。
 */
export function checkBackfillResult(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const docs = loadBackfillDocs(repoRoot);
    const r = analyzeBackfill(docs.plans, docs.glossaryText);
    return { messages: backfillMessages(r), ok: r.ok };
  } catch {
    return { messages: ["backfill - violation: PLAN/glossary could not be read"], ok: false };
  }
}

/** 後方互換: messages のみ返す薄いラッパ。 */
export function checkBackfill(repoRoot: string): string[] {
  return checkBackfillResult(repoRoot).messages;
}

/**
 * PoC confirmed ⇔ Reverse 合流の整合を surface (IMP-064、hard fail)。
 * confirmed poc (redesign 除く) の Reverse 孤児 / reverse が confirmed でない poc を参照 → ok=false。
 * I/O 失敗も violation にして fail-close する。
 */
export function checkScrumReverse(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["scrum-reverse - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeScrumReverse(loadSrPlans(repoRoot));
    return { messages: scrumReverseMessages(r), ok: r.ok };
  } catch {
    return { messages: ["scrum-reverse - violation: PLAN could not be read"], ok: false };
  }
}

/**
 * concept §2.6 ⇔ requirements §7.8.1 の signal 語彙伝播を surface (IMP-065、hard fail)。
 * 上位正本 (concept) と機械 routing SSoT (requirements) の signal 集合が乖離 → ok=false。
 * I/O 失敗も violation にして fail-close する。
 */
export function checkPropagation(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["propagation - violation: repo root could not be read"], ok: false };
  }
  try {
    const d = loadPropagationDocs(repoRoot);
    const r = analyzePropagation(d.conceptText, d.requirementsText);
    return { messages: propagationMessages(r), ok: r.ok };
  } catch {
    return { messages: ["propagation - violation: governance docs could not be read"], ok: false };
  }
}

/**
 * 設計層 pair freeze (design⇔test-design の pair_artifact 双方向・孤児0) を検査 (IMP-067、hard)。
 * 孤児 (pair-missing/ref-unresolved/trace-orphan) を violation にして doctor.ok に連動する。
 */
export function checkPairFreeze(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["pair-freeze - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzePairFreeze(loadPairDocs(repoRoot));
    return { messages: pairFreezeMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["pair-freeze - violation: design/test-design docs could not be read"],
      ok: false,
    };
  }
}

/**
 * review 前置証跡 (review_evidence) の完全性を検査 (IMP-071、hard 判定)。
 * confirmed/completed の design/impl/add-* PLAN が review_evidence を持たない (review 前置スキップ) を検知する。
 * **hard 判定** (ok=false → runDoctor.ok 連動で fail-close、IMP-071 hard 化 2026-06-05)。実 repo 履歴 15 件の
 * back-fill 完了 (missing 0 安定) を確認してから hard へ昇格した。review-skip の silent 化を機械で塞ぐ。
 * I/O 失敗も violation にして fail-close する。
 */
export function checkReviewEvidence(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["review-evidence - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeReviewEvidence(loadReviewPlans(repoRoot));
    return { messages: reviewEvidenceMessages(r), ok: r.ok };
  } catch {
    return { messages: ["review-evidence - violation: PLAN could not be read"], ok: false };
  }
}

/**
 * guardrail 不変条件の hard doctor gate (PLAN-L7-52 C-1 option A、warn-first Phase 0 →
 * hard Phase 2 昇格。PO /goal 承認 2026-06-15)。これまで projectGuardrailInvariantAdvisories
 * が severity=warn の非ブロック advisory として surface するだけだった同一ロジックを、ok=false の
 * fail-close gate に昇格する。
 * harness.db に依存せず、committed の PLAN frontmatter review_evidence から再計算する。
 * 各 entry に inspectGuardrailInvariants (state-db guardrail-invariants SSoT) を適用し、
 * violation (secret-evidence / same-model-self-review / human-required-without-evidence) が
 * あれば ok=false。空文字列の reviewer_model / worker_model は undefined に正規化して
 * same-model 誤検知を防ぐ (= 両 model が明示・同一のときだけ発火)。
 *
 * **review_kind scoping (concept §2.1.2.1)**: same-model-self-review は
 * `review_kind=cross_agent` (別 runtime/別モデルの独立性を僭称するレビュー) のみ hard-block する。
 * intra_runtime_subagent は単体 runtime (claude-only/codex-only) の正規 review tier で同一モデルが
 * 設計上許容される (cross-provider 要件に数えないだけ) ため block しない。secret-evidence /
 * human-required-without-evidence は review_kind 非依存で常に適用。
 *
 * checkReviewEvidence との関係: checkReviewEvidence も cross_agent entry の same-model/欠落を
 * crossReviewViolations で hard 判定する。本 gate は同じ cross_agent same-model を
 * guardrail-invariants SSoT 経由で defense-in-depth に再担保しつつ、SSoT が持つ secret-evidence /
 * human-required-without-evidence 不変条件 (recordGuardrailDecision 書込経路と共有) も review_evidence
 * 面で hard 化する。runtime guardrail decision (recordGuardrailDecision) 経路の本番配線は C-1 carry。
 */
export function checkGuardrailInvariants(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["guardrail-invariants - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const plans = loadReviewPlans(repoRoot);
    const violations: {
      rule: string;
      planId: string;
      reviewerModel?: string;
      workerModel?: string;
    }[] = [];
    for (const plan of plans) {
      if (plan.status === "archived") continue;
      // plan.crossEntries は parseReviewPlan → extractReviewEntries で既に populate 済み。
      // re-read せず直接使う (loader 再利用方針、重複 I/O 回避)。
      for (const entry of plan.crossEntries) {
        const reviewerModel = entry.reviewer_model?.trim() || undefined;
        const workerModel = entry.worker_model?.trim() || undefined;
        const input: GuardrailDecisionInput = {
          plan_id: plan.plan_id,
          session_id: "",
          guardrail: "review-evidence",
          decision: "allow",
          mode: "review",
          evidence_path: plan.file,
          reviewer_model: reviewerModel,
          worker_model: workerModel,
        };
        const inspection = inspectGuardrailInvariants(input);
        for (const v of inspection.violations) {
          // same_model_approval: forbidden は concept §2.1.2.1 (line 181/1224) より
          // **review_kind=cross_agent (独立性を僭称するレビュー) のみ**に適用する。
          // intra_runtime_subagent は単体 runtime (claude-only / codex-only) の正規 fallback で
          // 「同一モデルである事実を記録し cross-provider 要件に数えない」設計 (line 188 = codex-only は
          // intra_runtime_subagent を hard 必須)。ここを全 review_kind に hard-block すると codex-only
          // mode が永久に doctor を通れなくなる。cross_agent 限定は checkReviewEvidence の
          // crossReviewViolations scoping とも一致 (核心ルール 1 の静的担保)。
          // secret-evidence / human-required-without-evidence は review_kind 非依存で評価される
          // (この review_evidence 経路では evidence_path=plan.file(非 secret) / decision=allow 固定の
          //  ため発火条件を満たさないが、SSoT のロジック自体は適用されている)。
          if (v.rule === "same-model-self-review" && entry.review_kind !== "cross_agent") {
            continue;
          }
          violations.push({
            rule: v.rule,
            planId: plan.plan_id,
            reviewerModel,
            workerModel,
          });
        }
      }
    }
    if (violations.length === 0) {
      return {
        messages: ["guardrail-invariants — OK (review_evidence 全 entry でインバリアント違反なし)"],
        ok: true,
      };
    }
    return {
      messages: violations.map(
        (v) =>
          `guardrail-invariants - violation: rule=${v.rule} plan_id=${v.planId} reviewer=${v.reviewerModel ?? "(none)"} worker=${v.workerModel ?? "(none)"}`,
      ),
      ok: false,
    };
  } catch {
    return {
      messages: ["guardrail-invariants - violation: PLAN review_evidence could not be read"],
      ok: false,
    };
  }
}

/**
 * architecture §3.1 設計 module 集合 ⊇ src/ 実在 module を検査 (IMP-075、hard)。
 * 実在するが設計 doc 未列挙 (= impl→design back-fill 漏れ) を violation にして doctor.ok に連動する。
 */
/**
 * merged-plan-status hard gate (PO 指摘 2026-06-15): generated src が merge 済みなのに owning PLAN が
 * draft / 未 confirm のまま放置される V-model state 不整合を fail-close 検出する。review-evidence gate が
 * confirmed PLAN にのみ証跡を要求し draft を素通りさせる absence-blindness を補完する (柱3 = state DB が
 * フィードバック機構)。
 */
export function checkMergedPlanStatus(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["merged-plan-status - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeMergedPlanStatus(loadMergedPlanStatusInput(repoRoot));
    return { messages: mergedPlanStatusMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["merged-plan-status - violation: PLAN generates could not be read"],
      ok: false,
    };
  }
}

/**
 * plan-artifact-existence hard gate (PO /goal 2026-06-15): PLAN が confirmed/completed/accepted (完了宣言)
 * なのに generates artifact が不在 (phantom / false-completion) を fail-close 検出する。merged-plan-status
 * の鏡像で、PLAN↕artifact 実在マトリクスを 2 gate で完結させる。impl-plan-trace (src→PLAN) も
 * review-evidence (証跡有無) も artifact 実在を見ない absence-blindness を塞ぐ (柱3 / 柱6)。
 */
export function checkPlanArtifactExistence(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["plan-artifact-existence - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzePlanArtifactExistence(loadPlanArtifactExistenceInput(repoRoot));
    return { messages: planArtifactExistenceMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["plan-artifact-existence - violation: PLAN generates could not be read"],
      ok: false,
    };
  }
}

export function checkModuleDrift(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["module-drift - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeModuleDrift(loadModuleDocs(repoRoot));
    return { messages: moduleDriftMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["module-drift - violation: architecture/src modules could not be read"],
      ok: false,
    };
  }
}

export function checkAssetDrift(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["asset-drift - violation: repo root could not be read"], ok: false };
  }
  try {
    const input = loadAssetDriftInput(repoRoot);
    input.allowlist = [...SUBAGENT_ALLOWLIST].sort();
    const r = analyzeAssetDrift(input);
    return { messages: assetDriftMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["asset-drift — violation: internal asset drift lint could not run"],
      ok: false,
    };
  }
}

export function checkSkillAssignment(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["skill-assignment - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeSkillAssignments(loadSkillAssignmentDocs(repoRoot));
    return { messages: skillAssignmentMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["skill-assignment - violation: skill assignment metadata could not be read"],
      ok: false,
    };
  }
}

export function checkDescentObligation(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["descent-obligation - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = filterSubstanceVerifiedAdvisories(
      analyzeDescentObligations(
        loadTraceKeyedArtifacts(repoRoot),
        loadDescentAdjacency(repoRoot),
        loadDeferLedger(repoRoot),
      ),
      loadFrUnitCoverageOracles(repoRoot),
    );
    return { messages: descentObligationMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["descent-obligation - violation: descent obligation ledger could not be read"],
      ok: false,
    };
  }
}

export function checkChangeImpact(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["change-impact - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeChangeImpact({ changedFiles: loadChangedFiles(repoRoot) });
    return { messages: changeImpactMessages(r), ok: r.ok };
  } catch {
    return { messages: ["change-impact - violation: git status could not be read"], ok: false };
  }
}

export function checkChangeSetIntegrity(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["change-set-integrity - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const dependencyDrift = analyzeDependencyDrift(loadDependencyDriftInput(repoRoot));
    const result = analyzeChangeSetIntegrity({
      changedFiles: loadChangedFiles(repoRoot),
      dependencyDrift,
    });
    return { messages: changeSetIntegrityMessages(result), ok: result.ok };
  } catch {
    return {
      messages: ["change-set-integrity - violation: change/dependency graph could not be read"],
      ok: false,
    };
  }
}

function loadChangedFilesForDoctor(repoRoot: string): string[] {
  try {
    return loadChangedFiles(repoRoot);
  } catch {
    return [];
  }
}

export function checkVerificationProfile(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["verification-profile - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeVerificationProfileGate(loadVerificationRecommendation(repoRoot));
    return {
      messages: verificationProfileGateMessages(r),
      ok: r.ok,
    };
  } catch {
    return {
      messages: ["verification-profile - violation: changed file graph could not be read"],
      ok: false,
    };
  }
}

export function checkCodingRules(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["coding-rules - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeCodingRules(
      loadCodingRuleDocs(repoRoot),
      loadCodingRulePolicy(repoRoot),
      loadCodingWorkflowDocs(repoRoot),
    );
    return { messages: codingRulesMessages(r), ok: r.ok };
  } catch {
    return { messages: ["coding-rules — violation: TS coding rule lint could not run"], ok: false };
  }
}

export function checkDddTddRules(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["ddd-tdd-rules - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeDddTddRules(loadDddTddInputs(repoRoot));
    return { messages: dddTddRulesMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["ddd-tdd-rules - violation: DDD/TDD strictness lint could not run"],
      ok: false,
    };
  }
}

export function checkDbProjectionCoverage(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["db-projection-coverage - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const result = analyzeDbProjectionCoverage(loadDbProjectionRequirements(repoRoot));
    return { messages: dbProjectionCoverageMessages(result), ok: result.ok };
  } catch {
    return {
      messages: ["db-projection-coverage - violation: physical-data/schema coverage could not run"],
      ok: false,
    };
  }
}

export function checkDbProjectionIngestion(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["db-projection-ingestion - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const db = openHarnessDb(":memory:", { repoRoot });
    try {
      const rebuilt = rebuildHarnessDb({ repoRoot, db });
      const result = analyzeDbProjectionIngestion(rebuilt.rowCounts);
      return { messages: dbProjectionIngestionMessages(result), ok: result.ok };
    } finally {
      db.close();
    }
  } catch {
    return {
      messages: [
        "db-projection-ingestion - violation: automatic projection ingestion could not run",
      ],
      ok: false,
    };
  }
}

export function checkRuleDrift(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["rule-drift - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeRuleDrift(loadRuleAdapterDocs(repoRoot));
    return { messages: ruleDriftMessages(r), ok: r.ok };
  } catch {
    return { messages: ["rule-drift - violation: adapter rule docs could not be read"], ok: false };
  }
}

export function checkRuntimePortability(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["runtime-portability - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeRuntimePortability(loadRuntimePortabilityDocs(repoRoot));
    return { messages: runtimePortabilityMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["runtime-portability - violation: TS/Bun/Node portability lint could not run"],
      ok: false,
    };
  }
}

export function checkGateConfirm(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["gate-confirm - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeGateConfirm(loadGateConfirmDocs(repoRoot));
    return { messages: gateConfirmMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["gate-confirm - violation: gate-design/doc frontmatter could not be read"],
      ok: false,
    };
  }
}

export function checkPlanSchedule(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["plan-schedule - violation: repo root could not be read"], ok: false };
  }
  try {
    return lintPlan(undefined, repoRoot);
  } catch {
    return { messages: ["plan-schedule - violation: PLAN schedule lint could not run"], ok: false };
  }
}

export function checkPlanGovernance(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["plan-governance - violation: repo root could not be read"], ok: false };
  }
  try {
    return lintPlanWithGate(undefined, repoRoot, "governance");
  } catch {
    return {
      messages: ["plan-governance - violation: PLAN governance lint could not run"],
      ok: false,
    };
  }
}

export function checkPlanDod(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["plan-dod - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzePlanDod(loadPlanDodDocs(repoRoot));
    return { messages: planDodMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return { messages: ["plan-dod - violation: L7 PLAN DoD could not be read"], ok: false };
  }
}

export function checkPlaceholderDeps(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["placeholder-deps - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzePlaceholderDeps(loadPlaceholderDepsDocs(repoRoot));
    return { messages: placeholderDepsMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["placeholder-deps - violation: design/test-design docs could not be read"],
      ok: false,
    };
  }
}

export function checkPlanTraceGate(
  repoRoot: string,
  gate: "G1-trace" | "G3-trace",
): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: [`${gate.toLowerCase()} - violation: repo root could not be read`],
      ok: false,
    };
  }
  try {
    return lintPlanWithGate(undefined, repoRoot, gate);
  } catch {
    return { messages: [`${gate.toLowerCase()} - violation: trace gate could not run`], ok: false };
  }
}

export function checkRuleAutomationClosure(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["rule-automation-closure - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeRuleAutomationClosure(loadRuleAutomationClosureDocs(repoRoot));
    return { messages: ruleAutomationClosureMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return {
      messages: ["rule-automation-closure - violation: closure table could not be read"],
      ok: false,
    };
  }
}

export function checkDriveModelPassage(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["drive-model-passage - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeDriveModelPassage(loadDriveModelPassageDocs(repoRoot));
    return { messages: driveModelPassageMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return {
      messages: ["drive-model-passage - violation: passage certificate table could not be read"],
      ok: false,
    };
  }
}

export function checkDriveDbRegistration(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["drive-db-registration - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeDriveDbRegistration(loadOrBuildDriveDbRegistrationStats(repoRoot));
    return { messages: driveDbRegistrationMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["drive-db-registration - violation: harness.db registration could not be read"],
      ok: false,
    };
  }
}

export function checkFrRoadmapCoverage(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["fr-roadmap-coverage - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeFrRoadmapCoverageWithRoot(loadFrRoadmapCoverageDocs(repoRoot), repoRoot);
    return { messages: frRoadmapCoverageMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return {
      messages: ["fr-roadmap-coverage - violation: residual bucket table could not be read"],
      ok: false,
    };
  }
}

export function checkTelemetryClosure(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["telemetry-closure - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeTelemetryClosure(loadTelemetryClosureDocs(repoRoot));
    return { messages: telemetryClosureMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return {
      messages: ["telemetry-closure - violation: telemetry closure matrix could not be read"],
      ok: false,
    };
  }
}

export function checkCycleP4Verification(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["cycle-p4-verification - violation: repo root could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeCycleP4Verification(loadCycleP4VerificationDocs(repoRoot), repoRoot);
    return { messages: cycleP4VerificationMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return {
      messages: ["cycle-p4-verification - violation: Cycle P4 closure audit could not be read"],
      ok: false,
    };
  }
}

export function checkProjectHooks(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["project-hook - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeProjectHooks(loadProjectHookDocs(repoRoot));
    return { messages: projectHookMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["project-hook - violation: project hook settings could not be read"],
      ok: false,
    };
  }
}

export function checkL6FrCoverage(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["l6-fr-coverage - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeL6FrCoverage(loadL6FrCoverageDocs(repoRoot));
    return { messages: l6FrCoverageMessages(r), ok: r.ok };
  } catch {
    return { messages: ["l6-fr-coverage — ⚠ L6 FR coverage matrix を読めない"], ok: false };
  }
}

export function checkReadability(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["readability - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeReadability(loadSystemReadabilityDocs(repoRoot));
    return { messages: readabilityMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return { messages: ["readability — ⚠ prose docs を読めない"], ok: false };
  }
}

/** V-model 層群の Forward freeze 完了 (検証サイクル発火タイミング) を hard gate として検査する。 */
export function checkL6Completion(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!canLoadL6CompletionInputs(repoRoot)) {
    return {
      messages: ["l6-completion - violation: L6 completion inputs could not be read"],
      ok: false,
    };
  }
  try {
    const r = analyzeL6Completion(loadL6CompletionInputs(repoRoot));
    return { messages: l6CompletionMessages(r), ok: r.ready };
  } catch {
    return {
      messages: ["l6-completion - violation: L6 completion readiness could not be read"],
      ok: false,
    };
  }
}

export function checkL7Completion(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["l7-completion - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeL7Completion(loadL7CompletionDocs(repoRoot));
    return { messages: l7CompletionMessages(r), ok: r.checked > 0 && r.ok };
  } catch {
    return {
      messages: ["l7-completion - violation: active L4-L6 design docs could not be read"],
      ok: false,
    };
  }
}

/** impl→PLAN トレーサビリティ (src ⊆ PLAN generates ∪ baseline) を hard gate として検査する。 */
export function checkImplPlanTrace(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["impl-plan-trace - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeImplPlanTrace(loadImplPlanTraceInput(repoRoot));
    return { messages: implPlanTraceMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["impl-plan-trace - violation: src/PLAN trace could not be read"],
      ok: false,
    };
  }
}

/** git tracked top-level ⊆ repository-structure.md canonical の突合を hard gate として検査する。 */
export function checkTrackedCanonical(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["tracked-canonical - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeTrackedCanonical(loadTrackedCanonicalInput(repoRoot));
    return { messages: trackedCanonicalMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["tracked-canonical - violation: git/repository-structure could not be read"],
      ok: false,
    };
  }
}

/** oracle 宣言 ⇔ 実テスト citation の突合を hard gate として検査する。 */
export function checkOracleTestTrace(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["oracle-test-trace - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeOracleTestTrace(loadOracleTestTraceInput(repoRoot));
    return { messages: oracleTestTraceMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["oracle-test-trace - violation: test-design/tests could not be read"],
      ok: false,
    };
  }
}

/** 工程表 (登録 roadmap) の span 実在 + 層内ゲート進捗を hard gate として検査する。 */
export function checkRoadmap(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["roadmap - violation: repo root could not be read"], ok: false };
  }
  try {
    const records = loadRoadmaps(repoRoot);
    // 全プログラム被覆 (program coverage): 登録工程表が forward 全バンドを被覆するか。
    // PLAN-RECOVERY-04 工程表定義 = 人間向け全プログラム台帳。登録 0 は hard violation。
    const coverageMessages = programCoverageMessages(
      analyzeProgramCoverage(records, new Set(PARKED_BANDS.keys())),
    );
    if (records.length === 0) {
      return {
        messages: [
          "roadmap - violation: 登録工程表なし (master-hub roadmap block 未使用)",
          ...coverageMessages,
        ],
        ok: false,
      };
    }
    // I-1: 各 PLAN を 1 回だけ読み id→status を構築 (二重 readFile 解消)。
    const dir = join(repoRoot, "docs", "plans");
    const known = new Set<string>();
    const statusMap = new Map<string, string>();
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const content = readFileSync(join(dir, f), "utf8");
      const id = fmValue(content, "plan_id");
      if (id) {
        known.add(id);
        statusMap.set(id, fmValue(content, "status") ?? "draft");
      }
    }
    const messages: string[] = [];
    let issueCount = 0;
    for (const rec of records) {
      const spanIssues = checkSpanExistence(rec.roadmap, known);
      issueCount += spanIssues.length + rec.errors.length;
      const progress = computeGateProgress(rec.roadmap, (id) => statusMap.get(id) ?? null);
      const reached = progress.filter((g) => g.reached).length;
      messages.push(
        `roadmap — ${rec.planId} [${rec.roadmap.layer}]: gates ${reached}/${progress.length} 到達, spans ${rec.roadmap.spans.length}, 孤児 span ${spanIssues.length}, 構造 issue ${rec.errors.length}`,
      );
      for (const gi of progress) {
        messages.push(
          `  ${gi.gateId}: ${gi.reached ? "✅ reached" : "pending"} (${gi.confirmedSpans}/${gi.totalSpans} span reached: confirmed/completed)`,
        );
      }
      for (const si of spanIssues) messages.push(`  ⚠ ${si}`);
      for (const e of rec.errors) messages.push(`  ⚠ 構造: ${e}`);
    }
    const rollup = computeProgramRollup(
      records,
      (id) => statusMap.get(id) ?? null,
      new Set(PARKED_BANDS.keys()),
    );
    messages.push(
      `roadmap-rollup — bands ${rollup.coveredBands}/${rollup.totalBands} covered (park ${rollup.parkedBands}, uncovered ${rollup.uncoveredBands}) / gates ${rollup.reachedGates}/${rollup.totalGates} reached / spans ${rollup.confirmedSpans}/${rollup.totalSpans} / frontier: ${rollup.frontier.length ? rollup.frontier.join(", ") : "なし"}`,
    );
    messages.push(...coverageMessages);
    const coverageOk =
      analyzeProgramCoverage(records, new Set(PARKED_BANDS.keys())).uncovered.length === 0;
    return { messages, ok: issueCount === 0 && coverageOk };
  } catch {
    return { messages: ["roadmap - violation: 工程表を読めず検査できない"], ok: false };
  }
}

export function checkDependencyDrift(repoRoot: string): {
  messages: string[];
  ok: boolean;
  result: DependencyDriftResult | null;
} {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["dependency-drift - violation: repo root could not be read"],
      ok: false,
      result: null,
    };
  }
  try {
    const result = analyzeDependencyDrift(loadDependencyDriftInput(repoRoot));
    return { messages: dependencyDriftMessages(result), ok: result.ok, result };
  } catch {
    return {
      messages: ["dependency-drift - violation: dependency graph could not be read"],
      ok: false,
      result: null,
    };
  }
}

export function checkRegressionExpansion(
  repoRoot: string,
  drift: DependencyDriftResult | null,
): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return {
      messages: ["regression-expansion - violation: repo root could not be read"],
      ok: false,
    };
  }
  if (drift == null) {
    return {
      messages: ["regression-expansion - violation: dependency drift result is unavailable"],
      ok: false,
    };
  }
  try {
    const result = expandRegressionScope(drift, loadChangedFilesForDoctor(repoRoot));
    return { messages: regressionExpansionMessages(result), ok: result.ok };
  } catch {
    return {
      messages: ["regression-expansion - violation: regression scope could not be expanded"],
      ok: false,
    };
  }
}

export function checkVerificationGroupsResult(repoRoot: string): {
  messages: string[];
  ok: boolean;
} {
  try {
    const docs = loadPairDocs(repoRoot);
    const { orphans } = analyzePairFreeze(docs);
    const groups = analyzeVerificationGroups(docs, orphans, loadVerificationPlanEvidence(repoRoot));
    return { messages: verificationGroupMessages(groups), ok: verificationGroupsOk(groups) };
  } catch {
    return {
      messages: ["verification — violation: verification group lint could not run"],
      ok: false,
    };
  }
}

export function checkVerificationGroups(repoRoot: string): string[] {
  return checkVerificationGroupsResult(repoRoot).messages;
}

/** doctor 用に agent-slots deps を node I/O で構築 (now 固定は test 注入)。 */
function doctorSlotsDeps(deps: DoctorDeps): AgentSlotsDeps {
  return {
    repoRoot: deps.repoRoot,
    now: () => deps.now,
    readText: deps.readText,
    writeText: () => {}, // doctor は read-only
    newId: () => "doctor-readonly",
  };
}

export function nodeDoctorDeps(repoRoot: string): DoctorDeps {
  return {
    repoRoot,
    now: new Date().toISOString(),
    readText: (path) => (existsSync(path) ? readFileSync(path, "utf8") : null),
    listDir: (dir) => (existsSync(dir) ? readdirSync(dir) : []),
  };
}

// CLI entrypoint は process.cwd() = repoRoot を想定 (deps 未指定時)。test は deps 注入で固定。
export function runDoctor(deps: DoctorDeps = nodeDoctorDeps(process.cwd())): LintResult {
  const d = detectMode();
  // handover / agent-slots are warning surfaces. Verification profile is a hard gate.
  const backfill = checkBackfillResult(deps.repoRoot);
  const scrumRev = checkScrumReverse(deps.repoRoot);
  const propagation = checkPropagation(deps.repoRoot);
  const reviewEvidence = checkReviewEvidence(deps.repoRoot);
  const pairFreeze = checkPairFreeze(deps.repoRoot);
  const moduleDrift = checkModuleDrift(deps.repoRoot);
  const mergedPlanStatus = checkMergedPlanStatus(deps.repoRoot);
  const planArtifactExistence = checkPlanArtifactExistence(deps.repoRoot);
  const assetDrift = checkAssetDrift(deps.repoRoot);
  const skillAssignment = checkSkillAssignment(deps.repoRoot);
  const descentObligation = checkDescentObligation(deps.repoRoot);
  const changeImpact = checkChangeImpact(deps.repoRoot);
  const changeSetIntegrity = checkChangeSetIntegrity(deps.repoRoot);
  const verificationProfile = checkVerificationProfile(deps.repoRoot);
  const codingRules = checkCodingRules(deps.repoRoot);
  const dddTddRules = checkDddTddRules(deps.repoRoot);
  const runtimePortability = checkRuntimePortability(deps.repoRoot);
  const ruleDrift = checkRuleDrift(deps.repoRoot);
  const gateConfirm = checkGateConfirm(deps.repoRoot);
  const planSchedule = checkPlanSchedule(deps.repoRoot);
  const planGovernance = checkPlanGovernance(deps.repoRoot);
  const planDod = checkPlanDod(deps.repoRoot);
  const placeholderDeps = checkPlaceholderDeps(deps.repoRoot);
  const g1Trace = checkPlanTraceGate(deps.repoRoot, "G1-trace");
  const g3Trace = checkPlanTraceGate(deps.repoRoot, "G3-trace");
  const ruleAutomationClosure = checkRuleAutomationClosure(deps.repoRoot);
  const driveModelPassage = checkDriveModelPassage(deps.repoRoot);
  const driveDbRegistration = checkDriveDbRegistration(deps.repoRoot);
  const frRoadmapCoverage = checkFrRoadmapCoverage(deps.repoRoot);
  const telemetryClosure = checkTelemetryClosure(deps.repoRoot);
  const cycleP4Verification = checkCycleP4Verification(deps.repoRoot);
  const projectHooks = checkProjectHooks(deps.repoRoot);
  const l6FrCoverage = checkL6FrCoverage(deps.repoRoot);
  const readability = checkReadability(deps.repoRoot);
  const l6Completion = checkL6Completion(deps.repoRoot);
  const l7Completion = checkL7Completion(deps.repoRoot);
  const roadmap = checkRoadmap(deps.repoRoot);
  const implPlanTrace = checkImplPlanTrace(deps.repoRoot);
  const oracleTestTrace = checkOracleTestTrace(deps.repoRoot);
  const trackedCanonical = checkTrackedCanonical(deps.repoRoot);
  const verificationGroups = checkVerificationGroupsResult(deps.repoRoot);
  const dependencyDrift = checkDependencyDrift(deps.repoRoot);
  const regressionExpansion = checkRegressionExpansion(deps.repoRoot, dependencyDrift.result);
  const guardrailInvariants = checkGuardrailInvariants(deps.repoRoot);
  const dbProjectionCoverage = checkDbProjectionCoverage(deps.repoRoot);
  const dbProjectionIngestion = checkDbProjectionIngestion(deps.repoRoot);
  return {
    ok:
      backfill.ok &&
      scrumRev.ok &&
      propagation.ok &&
      reviewEvidence.ok &&
      guardrailInvariants.ok &&
      pairFreeze.ok &&
      moduleDrift.ok &&
      mergedPlanStatus.ok &&
      planArtifactExistence.ok &&
      assetDrift.ok &&
      skillAssignment.ok &&
      descentObligation.ok &&
      changeImpact.ok &&
      changeSetIntegrity.ok &&
      verificationProfile.ok &&
      codingRules.ok &&
      dddTddRules.ok &&
      runtimePortability.ok &&
      ruleDrift.ok &&
      gateConfirm.ok &&
      planSchedule.ok &&
      planGovernance.ok &&
      planDod.ok &&
      placeholderDeps.ok &&
      g1Trace.ok &&
      g3Trace.ok &&
      ruleAutomationClosure.ok &&
      driveModelPassage.ok &&
      driveDbRegistration.ok &&
      frRoadmapCoverage.ok &&
      telemetryClosure.ok &&
      cycleP4Verification.ok &&
      l6FrCoverage.ok &&
      readability.ok &&
      projectHooks.ok &&
      l6Completion.ok &&
      l7Completion.ok &&
      verificationGroups.ok &&
      roadmap.ok &&
      implPlanTrace.ok &&
      oracleTestTrace.ok &&
      trackedCanonical.ok &&
      dependencyDrift.ok &&
      regressionExpansion.ok &&
      dbProjectionCoverage.ok &&
      dbProjectionIngestion.ok,
    messages: [
      `doctor: mode=${d.mode} (claude=${d.claude}, codex=${d.codex})`,
      checkHandover(deps),
      ...checkHandoverDisciplineMessages(deps).map((m) => `doctor: handover-discipline — ${m}`),
      checkAgentSlots(doctorSlotsDeps(deps)),
      ...backfill.messages.map((m) => `doctor: ${m}`),
      ...scrumRev.messages.map((m) => `doctor: ${m}`),
      ...propagation.messages.map((m) => `doctor: ${m}`),
      ...pairFreeze.messages.map((m) => `doctor: ${m}`),
      ...moduleDrift.messages.map((m) => `doctor: ${m}`),
      ...mergedPlanStatus.messages.map((m) => `doctor: ${m}`),
      ...planArtifactExistence.messages.map((m) => `doctor: ${m}`),
      ...assetDrift.messages.map((m) => `doctor: ${m}`),
      ...skillAssignment.messages.map((m) => `doctor: ${m}`),
      ...descentObligation.messages.map((m) => `doctor: ${m}`),
      ...changeImpact.messages.map((m) => `doctor: ${m}`),
      ...changeSetIntegrity.messages.map((m) => `doctor: ${m}`),
      ...verificationProfile.messages.map((m) => `doctor: ${m}`),
      ...codingRules.messages.map((m) => `doctor: ${m}`),
      ...dddTddRules.messages.map((m) => `doctor: ${m}`),
      ...runtimePortability.messages.map((m) => `doctor: ${m}`),
      ...ruleDrift.messages.map((m) => `doctor: ${m}`),
      ...gateConfirm.messages.map((m) => `doctor: ${m}`),
      ...planSchedule.messages.map((m) => `doctor: ${m}`),
      ...planGovernance.messages.map((m) => `doctor: ${m}`),
      ...planDod.messages.map((m) => `doctor: ${m}`),
      ...placeholderDeps.messages.map((m) => `doctor: ${m}`),
      ...g1Trace.messages.map((m) => `doctor: ${m}`),
      ...g3Trace.messages.map((m) => `doctor: ${m}`),
      ...ruleAutomationClosure.messages.map((m) => `doctor: ${m}`),
      ...driveModelPassage.messages.map((m) => `doctor: ${m}`),
      ...driveDbRegistration.messages.map((m) => `doctor: ${m}`),
      ...frRoadmapCoverage.messages.map((m) => `doctor: ${m}`),
      ...telemetryClosure.messages.map((m) => `doctor: ${m}`),
      ...cycleP4Verification.messages.map((m) => `doctor: ${m}`),
      ...projectHooks.messages.map((m) => `doctor: ${m}`),
      ...l6FrCoverage.messages.map((m) => `doctor: ${m}`),
      ...readability.messages.map((m) => `doctor: ${m}`),
      ...l6Completion.messages.map((m) => `doctor: ${m}`),
      ...l7Completion.messages.map((m) => `doctor: ${m}`),
      ...reviewEvidence.messages.map((m) => `doctor: ${m}`),
      ...guardrailInvariants.messages.map((m) => `doctor: ${m}`),
      ...verificationGroups.messages.map((m) => `doctor: ${m}`),
      ...roadmap.messages.map((m) => `doctor: ${m}`),
      ...implPlanTrace.messages.map((m) => `doctor: ${m}`),
      ...oracleTestTrace.messages.map((m) => `doctor: ${m}`),
      ...trackedCanonical.messages.map((m) => `doctor: ${m}`),
      ...dependencyDrift.messages.map((m) => `doctor: ${m}`),
      ...regressionExpansion.messages.map((m) => `doctor: ${m}`),
      ...dbProjectionCoverage.messages.map((m) => `doctor: ${m}`),
      ...dbProjectionIngestion.messages.map((m) => `doctor: ${m}`),
    ],
  };
}
