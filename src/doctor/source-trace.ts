import { existsSync } from "node:fs";
import {
  analyzeImplPlanTrace,
  implPlanTraceMessages,
  loadImplPlanTraceInput,
} from "../lint/impl-plan-trace.ts";
import { analyzeMemorySync, loadMemorySyncInput, memorySyncMessages } from "../lint/memory-sync.ts";
import {
  analyzeMergedPlanStatus,
  loadMergedPlanStatusInput,
  mergedPlanStatusMessages,
} from "../lint/merged-plan-status.ts";
import {
  analyzeOracleTestTrace,
  loadOracleTestTraceInput,
  oracleTestTraceMessages,
} from "../lint/oracle-test-trace.ts";
import {
  analyzeTrackedCanonical,
  loadTrackedCanonicalInput,
  trackedCanonicalMessages,
} from "../lint/tracked-canonical.ts";

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

/**
 * memory-sync hard gate (PLAN-L7-468 PR-B、issue #175): 共有 memory が commit / push されず
 * 「共有したつもり」で沈黙する欠落を fail-close 検出する。実測 (2026-07-28) では引き継ぎ目的で
 * 書かれた 15 件が未コミットのまま残り、同時に origin 追跡分 32 件がローカルに欠落していた。
 */
export function checkMemorySync(repoRoot: string): { messages: string[]; ok: boolean } {
  if (!existsSync(repoRoot)) {
    return { messages: ["memory-sync - violation: repo root could not be read"], ok: false };
  }
  try {
    const r = analyzeMemorySync(loadMemorySyncInput(repoRoot));
    return { messages: memorySyncMessages(r), ok: r.ok && r.originResolved };
  } catch {
    return {
      messages: ["memory-sync - violation: 共有 memory の同期状態を読めなかった"],
      ok: false,
    };
  }
}
