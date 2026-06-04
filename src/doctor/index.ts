/** 統合検証 doctor (requirements_v1.2 §7 / §7.8.5). scaffold stub — 検出器は後続 PLAN。 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type HandoverPointer, handoverStale } from "../handover/index";
import { analyzeBackfill, backfillMessages, loadBackfillDocs } from "../lint/backfill-pairing";
import { analyzePropagation, loadPropagationDocs, propagationMessages } from "../lint/propagation";
import { analyzeScrumReverse, loadSrPlans, scrumReverseMessages } from "../lint/scrum-reverse";
import type { LintResult } from "../plan/lint";
import {
  type AgentSlotsDeps,
  DEFAULT_STALE_MINUTES,
  listActiveSlots,
  listStaleSlots,
  loadSlots,
  peakParallel,
} from "../runtime/agent-slots";
import { detectMode } from "../runtime/detect";

/** I/O・clock 注入 (test 可能、handover staleness 検査用)。 */
export interface DoctorDeps {
  repoRoot: string;
  now: string;
  readText: (path: string) => string | null;
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
  };
}

// CLI entrypoint は process.cwd() = repoRoot を想定 (deps 未指定時)。test は deps 注入で固定。
export function runDoctor(deps: DoctorDeps = nodeDoctorDeps(process.cwd())): LintResult {
  const d = detectMode();
  // back-fill / scrum-reverse は hard 判定 (orphan/gap → ok=false で fail-close)。
  // handover / agent-slots は warn-only (鮮度/運用 surface であり ok を落とさない)。
  const backfill = checkBackfillResult(deps.repoRoot);
  const scrumRev = checkScrumReverse(deps.repoRoot);
  const propagation = checkPropagation(deps.repoRoot);
  return {
    ok: backfill.ok && scrumRev.ok && propagation.ok,
    messages: [
      `doctor: mode=${d.mode} (claude=${d.claude}, codex=${d.codex})`,
      checkHandover(deps),
      checkAgentSlots(doctorSlotsDeps(deps)),
      ...backfill.messages.map((m) => `doctor: ${m}`),
      ...scrumRev.messages.map((m) => `doctor: ${m}`),
      ...propagation.messages.map((m) => `doctor: ${m}`),
      "doctor: scaffold stub (横断検出 relation-graph / drift / regression は後続 PLAN)",
    ],
  };
}
