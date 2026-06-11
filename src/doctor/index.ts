/** 統合検証 doctor (requirements_v1.2 §7 / §7.8.5). scaffold stub — 検出器は後続 PLAN。 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkHandoverBypass,
  checkHandoverDiscipline,
  type HandoverDeps,
  type HandoverPointer,
  handoverStale,
} from "../handover/index";
import { analyzeAssetDrift, assetDriftMessages, loadAssetDriftInput } from "../lint/asset-drift";
import { analyzeBackfill, backfillMessages, loadBackfillDocs } from "../lint/backfill-pairing";
import { analyzeChangeImpact, changeImpactMessages, loadChangedFiles } from "../lint/change-impact";
import {
  analyzeCodingRules,
  codingRulesMessages,
  loadCodingRuleDocs,
  loadCodingRulePolicy,
  loadCodingWorkflowDocs,
} from "../lint/coding-rules";
import { analyzeDddTddRules, dddTddRulesMessages, loadDddTddInputs } from "../lint/ddd-tdd-rules";
import {
  analyzeDependencyDrift,
  dependencyDriftMessages,
  expandRegressionScope,
  loadDependencyDriftInput,
  regressionExpansionMessages,
} from "../lint/dependency-drift";
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
import { analyzeModuleDrift, loadModuleDocs, moduleDriftMessages } from "../lint/module-drift";
import {
  analyzeOracleTestTrace,
  loadOracleTestTraceInput,
  oracleTestTraceMessages,
} from "../lint/oracle-test-trace";
import { analyzePropagation, loadPropagationDocs, propagationMessages } from "../lint/propagation";
import {
  analyzeReadability,
  loadFreezeReadabilityDocs,
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
  loadRoadmaps,
  PARKED_BANDS,
  programCoverageMessages,
} from "../lint/roadmap-registry";
import { analyzeRuleDrift, loadRuleAdapterDocs, ruleDriftMessages } from "../lint/rule-drift";
import { analyzeScrumReverse, loadSrPlans, scrumReverseMessages } from "../lint/scrum-reverse";
import { fmValue } from "../lint/shared";
import {
  analyzeTrackedCanonical,
  loadTrackedCanonicalInput,
  trackedCanonicalMessages,
} from "../lint/tracked-canonical";
import {
  loadVerificationRecommendation,
  verificationRecommendationMessages,
} from "../lint/verification-profile";
import type { LintResult } from "../plan/lint";
import { lintPlan } from "../plan/lint";
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
  return [...checkHandoverDiscipline(hd), ...checkHandoverBypass(hd)];
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
 * 駆動モデルの back-fill 完全性 (impl⇔Reverse / impl⇔glossary) を surface (IMP-051、warning-first)。
 * Reverse 無き impl / §6 用語の glossary 未 merge を warn する。doctor.ok は落とさない (fail-close 化は段階)。
 * I/O 失敗は飲んで note を返す (doctor の堅牢性維持)。
 */
export function checkBackfillResult(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const docs = loadBackfillDocs(repoRoot);
    const r = analyzeBackfill(docs.plans, docs.glossaryText);
    return { messages: backfillMessages(r), ok: r.ok };
  } catch {
    // 読めない (docs 不在等) → 検査 skip。doctor.ok は落とさない (note のみ)。
    return { messages: ["backfill — note: PLAN/glossary を読めず検査 skip"], ok: true };
  }
}

/** 後方互換: messages のみ返す薄いラッパ。 */
export function checkBackfill(repoRoot: string): string[] {
  return checkBackfillResult(repoRoot).messages;
}

/**
 * PoC confirmed ⇔ Reverse 合流の整合を surface (IMP-064、hard fail)。
 * confirmed poc (redesign 除く) の Reverse 孤児 / reverse が confirmed でない poc を参照 → ok=false。
 * I/O 失敗は skip (doctor.ok を落とさない)。
 */
export function checkScrumReverse(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeScrumReverse(loadSrPlans(repoRoot));
    return { messages: scrumReverseMessages(r), ok: r.ok };
  } catch {
    return { messages: ["scrum-reverse — note: PLAN を読めず検査 skip"], ok: true };
  }
}

/**
 * concept §2.6 ⇔ requirements §7.8.1 の signal 語彙伝播を surface (IMP-065、hard fail)。
 * 上位正本 (concept) と機械 routing SSoT (requirements) の signal 集合が乖離 → ok=false。
 * I/O 失敗は skip (doctor.ok を落とさない)。
 */
export function checkPropagation(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const d = loadPropagationDocs(repoRoot);
    const r = analyzePropagation(d.conceptText, d.requirementsText);
    return { messages: propagationMessages(r), ok: r.ok };
  } catch {
    return { messages: ["propagation — note: governance doc を読めず検査 skip"], ok: true };
  }
}

/**
 * 設計層 pair freeze (design⇔test-design の pair_artifact 双方向・孤児0) を surface (IMP-067、warn-first)。
 * 孤児 (pair-missing/ref-unresolved/trace-orphan) を warn する。doctor.ok は落とさない (初期投入、hard 化は段階)。
 * I/O 失敗は skip (doctor の堅牢性維持)。
 */
export function checkPairFreeze(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzePairFreeze(loadPairDocs(repoRoot));
    return { messages: pairFreezeMessages(r), ok: r.ok };
  } catch {
    return { messages: ["pair-freeze — note: design/test-design doc を読めず検査 skip"], ok: true };
  }
}

/**
 * review 前置証跡 (review_evidence) の完全性を検査 (IMP-071、hard 判定)。
 * confirmed/completed の design/impl/add-* PLAN が review_evidence を持たない (review 前置スキップ) を検知する。
 * **hard 判定** (ok=false → runDoctor.ok 連動で fail-close、IMP-071 hard 化 2026-06-05)。実 repo 履歴 15 件の
 * back-fill 完了 (missing 0 安定) を確認してから warn-first → hard へ昇格した。review-skip の silent 化を機械で塞ぐ。
 * I/O 失敗は skip (doctor の堅牢性維持、ok=true で fail-open)。
 */
export function checkReviewEvidence(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeReviewEvidence(loadReviewPlans(repoRoot));
    return { messages: reviewEvidenceMessages(r), ok: r.ok };
  } catch {
    return { messages: ["review-evidence — note: PLAN を読めず検査 skip"], ok: true };
  }
}

/**
 * architecture §3.1 設計 module 集合 ⊇ src/ 実在 module を検査 (IMP-075、warn-first)。
 * 実在するが設計 doc 未列挙 (= impl→design back-fill 漏れ、A-103 で手動発見した meta-drift) を warn する。
 * doctor.ok は落とさない (初期投入、hard 化は実 repo green 安定後)。I/O 失敗は skip (堅牢性維持)。
 */
export function checkModuleDrift(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeModuleDrift(loadModuleDocs(repoRoot));
    return { messages: moduleDriftMessages(r), ok: r.ok };
  } catch {
    return { messages: ["module-drift — note: architecture.md / src を読めず検査 skip"], ok: true };
  }
}

export function checkAssetDrift(repoRoot: string): { messages: string[]; ok: boolean } {
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

export function checkChangeImpact(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeChangeImpact({ changedFiles: loadChangedFiles(repoRoot) });
    return { messages: changeImpactMessages(r), ok: r.ok };
  } catch {
    return { messages: ["change-impact — note: git status を読めず検査 skip"], ok: true };
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
  try {
    return {
      messages: verificationRecommendationMessages(loadVerificationRecommendation(repoRoot)),
      ok: true,
    };
  } catch {
    return {
      messages: ["verification-profile - note: changed file graph could not be read"],
      ok: true,
    };
  }
}

export function checkCodingRules(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["coding-rules — note: repo root を読めず検査 skip"], ok: true };
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
    return { messages: ["ddd-tdd-rules - note: repo root could not be read; skipped"], ok: true };
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

export function checkRuleDrift(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeRuleDrift(loadRuleAdapterDocs(repoRoot));
    return { messages: ruleDriftMessages(r), ok: r.ok };
  } catch {
    return { messages: ["rule-drift — note: adapter rule docs を読めず検査 skip"], ok: true };
  }
}

export function checkGateConfirm(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeGateConfirm(loadGateConfirmDocs(repoRoot));
    return { messages: gateConfirmMessages(r), ok: r.ok };
  } catch {
    return {
      messages: ["gate-confirm — note: gate-design/doc frontmatter を読めず検査 skip"],
      ok: true,
    };
  }
}

export function checkPlanSchedule(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    return lintPlan(undefined, repoRoot);
  } catch {
    return { messages: ["plan-schedule — note: PLAN を読めず検査 skip"], ok: true };
  }
}

export function checkL6FrCoverage(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["l6-fr-coverage — note: repo root を読めず検査 skip"], ok: true };
  }
  try {
    const r = analyzeL6FrCoverage(loadL6FrCoverageDocs(repoRoot));
    return { messages: l6FrCoverageMessages(r), ok: r.ok };
  } catch {
    return { messages: ["l6-fr-coverage — ⚠ L6 FR coverage matrix を読めない"], ok: false };
  }
}

export function checkReadability(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeReadability(loadFreezeReadabilityDocs(repoRoot));
    return { messages: readabilityMessages(r), ok: r.ok };
  } catch {
    return { messages: ["readability — ⚠ freeze review docs を読めない"], ok: false };
  }
}

/**
 * V-model 層群の Forward freeze 完了 (検証サイクル発火タイミング) を surface (IMP-068、note)。
 * 層群が freeze 完了 → 検証発火可 / Forward 進行中。検証ロードマップの「いつ検証するか」を
 * V-model 構造 (層群 freeze) で機械発火させる全体調整。doctor.ok は落とさない (タイミング surface)。
 */
export function checkL6Completion(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!canLoadL6CompletionInputs(repoRoot)) {
    return { messages: ["l6-completion — note: L6 completion inputs を読めず検査 skip"], ok: true };
  }
  try {
    const r = analyzeL6Completion(loadL6CompletionInputs(repoRoot));
    return { messages: l6CompletionMessages(r), ok: true };
  } catch {
    return {
      messages: ["l6-completion — note: L6 completion readiness を読めず検査 skip"],
      ok: true,
    };
  }
}

/**
 * impl→PLAN トレーサビリティ (src ⊆ PLAN generates ∪ baseline) を surface (IMP-088、warn-first)。
 * NEW orphan (PLAN 無き新規 src) を warn する。doctor.ok は落とさない (module-drift と同じ段階導入)
 * が、CI 回帰網 (U-IPT-004 = 実 repo orphan 0) が vitest で fail-close する。I/O 失敗は skip。
 */
export function checkImplPlanTrace(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeImplPlanTrace(loadImplPlanTraceInput(repoRoot));
    return { messages: implPlanTraceMessages(r), ok: true };
  } catch {
    return { messages: ["impl-plan-trace — note: src/PLAN を読めず検査 skip"], ok: true };
  }
}

/**
 * git tracked top-level ⊆ repository-structure.md canonical の突合を surface (IMP-127、warn-first)。
 * canonical 未記載の tracked top-level を warn。CI 回帰網 (U-TCAN-004 = drift 0) が fail-close。
 */
export function checkTrackedCanonical(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeTrackedCanonical(loadTrackedCanonicalInput(repoRoot));
    return { messages: trackedCanonicalMessages(r), ok: true };
  } catch {
    return {
      messages: ["tracked-canonical — note: git/repository-structure を読めず検査 skip"],
      ok: true,
    };
  }
}

/**
 * oracle 宣言 ⇔ 実テスト citation の突合を surface (IMP-128、warn-first)。
 * NEW oracle (baseline 外で未 citation) を warn。CI 回帰網 (U-OTT-004 = 実 repo orphan 0) が fail-close。
 */
export function checkOracleTestTrace(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const r = analyzeOracleTestTrace(loadOracleTestTraceInput(repoRoot));
    return { messages: oracleTestTraceMessages(r), ok: true };
  } catch {
    return {
      messages: ["oracle-test-trace — note: test-design/tests を読めず検査 skip"],
      ok: true,
    };
  }
}

/**
 * 工程表 (登録 roadmap) の span 実在 + 層内ゲート進捗を surface (PLAN-DISCOVERY-05 spike、warn-first)。
 * spike 段階のため ok 連動しない (S4 confirmed + 本実装後に孤児 span を hard 化する想定)。
 */
export function checkRoadmap(repoRoot: string): { messages: string[]; ok: boolean } {
  try {
    const records = loadRoadmaps(repoRoot);
    // 全プログラム被覆 (program coverage): 登録工程表が forward 全バンドを被覆するか (warn-first、
    // PLAN-RECOVERY-04 工程表定義 = 人間向け全プログラム台帳)。登録 0 でも全バンド未登録として surface。
    const coverageMessages = programCoverageMessages(
      analyzeProgramCoverage(records, new Set(PARKED_BANDS.keys())),
    );
    if (records.length === 0) {
      return {
        messages: [
          "roadmap — note: 登録工程表なし (master-hub roadmap block 未使用)",
          ...coverageMessages,
        ],
        ok: true,
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
    for (const rec of records) {
      const spanIssues = checkSpanExistence(rec.roadmap, known);
      const progress = computeGateProgress(rec.roadmap, (id) => statusMap.get(id) ?? null);
      const reached = progress.filter((g) => g.reached).length;
      messages.push(
        `roadmap — ${rec.planId} [${rec.roadmap.layer}]: gates ${reached}/${progress.length} 到達, spans ${rec.roadmap.spans.length}, 孤児 span ${spanIssues.length}, 構造 issue ${rec.errors.length}`,
      );
      for (const gi of progress) {
        messages.push(
          `  ${gi.gateId}: ${gi.reached ? "✅ reached" : "pending"} (${gi.confirmedSpans}/${gi.totalSpans} span confirmed)`,
        );
      }
      for (const si of spanIssues) messages.push(`  ⚠ ${si}`);
      for (const e of rec.errors) messages.push(`  ⚠ 構造: ${e}`);
    }
    messages.push(...coverageMessages);
    return { messages, ok: true };
  } catch {
    return { messages: ["roadmap — note: 工程表を読めず検査 skip"], ok: true };
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
  // back-fill / scrum-reverse / propagation / review-evidence は hard 判定 (orphan/gap/review-skip → ok=false で fail-close)。
  // handover / agent-slots / pair-freeze は warn-only (鮮度/運用 surface であり ok を落とさない)。
  const backfill = checkBackfillResult(deps.repoRoot);
  const scrumRev = checkScrumReverse(deps.repoRoot);
  const propagation = checkPropagation(deps.repoRoot);
  // review-evidence は hard 判定 (review 前置スキップ → ok=false で fail-close、IMP-071 hard 化 2026-06-05)。
  const reviewEvidence = checkReviewEvidence(deps.repoRoot);
  // pair-freeze は warn-first (初期投入、ok 連動しない。hard 化は実 repo green 安定後)。
  const pairFreeze = checkPairFreeze(deps.repoRoot);
  // module-drift は warn-first (impl→design back-fill 漏れ surface、IMP-075。hard 化は段階)。
  const moduleDrift = checkModuleDrift(deps.repoRoot);
  const assetDrift = checkAssetDrift(deps.repoRoot);
  const changeImpact = checkChangeImpact(deps.repoRoot);
  // verification-profile は warn-first (推奨 surface のみ。外部 profile 実行が PLAN-L7-33 で配線されるまで
  // ok 連動させない — 推奨の見落としは review で拾う段階、A-128 F-5 / IMP-130(e))。
  const verificationProfile = checkVerificationProfile(deps.repoRoot);
  const codingRules = checkCodingRules(deps.repoRoot);
  const dddTddRules = checkDddTddRules(deps.repoRoot);
  const ruleDrift = checkRuleDrift(deps.repoRoot);
  // gate-confirm and plan-schedule are intentionally warn-first during rollout.
  // Their messages surface policy drift, but runDoctor.ok hardening is a later gate switch.
  const gateConfirm = checkGateConfirm(deps.repoRoot);
  const planSchedule = checkPlanSchedule(deps.repoRoot);
  const l6FrCoverage = checkL6FrCoverage(deps.repoRoot);
  const readability = checkReadability(deps.repoRoot);
  // l6-completion は warn-first (G6 PASS 後の運用観察期間。誤 fail で post-G6 作業を止めないため
  // ok 連動は安定確認後に切替 — A-128 F-5 / IMP-130(e))。
  const l6Completion = checkL6Completion(deps.repoRoot);
  // roadmap は warn-first (PLAN-DISCOVERY-05 spike。登録工程表の gate 進捗/孤児 span surface のみ、
  // ok 連動は S4 confirmed + 本実装後に切替)。
  const roadmap = checkRoadmap(deps.repoRoot);
  // impl-plan-trace は warn-first (IMP-088、module-drift と同じ段階導入。NEW orphan surface、
  // hard 化は baseline 縮小安定後。CI 回帰網 U-IPT-004 が実 repo orphan 0 を fail-close)。
  const implPlanTrace = checkImplPlanTrace(deps.repoRoot);
  // oracle-test-trace は warn-first (IMP-128。NEW oracle 未 citation surface、
  // CI 回帰網 U-OTT-004 が実 repo orphan 0 を fail-close。既存 89 は baseline)。
  const oracleTestTrace = checkOracleTestTrace(deps.repoRoot);
  // tracked-canonical は warn-first (IMP-127。canonical 未記載 tracked top-level surface、
  // CI 回帰網 U-TCAN-004 が drift 0 を fail-close)。
  const trackedCanonical = checkTrackedCanonical(deps.repoRoot);
  const verificationGroups = checkVerificationGroupsResult(deps.repoRoot);
  const dependencyDrift = analyzeDependencyDrift(loadDependencyDriftInput(deps.repoRoot));
  const regressionExpansion = expandRegressionScope(
    dependencyDrift,
    loadChangedFilesForDoctor(deps.repoRoot),
  );
  return {
    ok:
      backfill.ok &&
      scrumRev.ok &&
      propagation.ok &&
      reviewEvidence.ok &&
      assetDrift.ok &&
      changeImpact.ok &&
      codingRules.ok &&
      dddTddRules.ok &&
      ruleDrift.ok &&
      l6FrCoverage.ok &&
      readability.ok &&
      verificationGroups.ok &&
      dependencyDrift.ok &&
      regressionExpansion.ok,
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
      ...assetDrift.messages.map((m) => `doctor: ${m}`),
      ...changeImpact.messages.map((m) => `doctor: ${m}`),
      ...verificationProfile.messages.map((m) => `doctor: ${m}`),
      ...codingRules.messages.map((m) => `doctor: ${m}`),
      ...dddTddRules.messages.map((m) => `doctor: ${m}`),
      ...ruleDrift.messages.map((m) => `doctor: ${m}`),
      ...gateConfirm.messages.map((m) => `doctor: ${m}`),
      ...planSchedule.messages.map((m) => `doctor: ${m}`),
      ...l6FrCoverage.messages.map((m) => `doctor: ${m}`),
      ...readability.messages.map((m) => `doctor: ${m}`),
      ...l6Completion.messages.map((m) => `doctor: ${m}`),
      ...reviewEvidence.messages.map((m) => `doctor: ${m}`),
      ...verificationGroups.messages.map((m) => `doctor: ${m}`),
      ...roadmap.messages.map((m) => `doctor: ${m}`),
      ...implPlanTrace.messages.map((m) => `doctor: ${m}`),
      ...oracleTestTrace.messages.map((m) => `doctor: ${m}`),
      ...trackedCanonical.messages.map((m) => `doctor: ${m}`),
      ...dependencyDriftMessages(dependencyDrift).map((m) => `doctor: ${m}`),
      ...regressionExpansionMessages(regressionExpansion).map((m) => `doctor: ${m}`),
    ],
  };
}
