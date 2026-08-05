/**
 * doctor: worktree-topology (issue #232) — worktree 配置の健全性・寿命の advisory 検出。
 *
 * `analyzeWorktreeTopology` (純粋 analyzer) と `collectWorktreeFacts` (I/O) を結線する。
 * findings があっても doctor 全体を fail-close させない advisory 扱い (配置移設 #141 /
 * PLAN-L4-34 の acceptance oracle として counts / retirable を可視化するのが目的であり、
 * まだ強制ゲート化する判断は出ていないため)。
 */

import { analyzeWorktreeTopology } from "../runtime/worktree-topology";
import { collectWorktreeFacts } from "../runtime/worktree-topology-collect";

export function checkWorktreeTopology(repoRoot: string): { ok: boolean; messages: string[] } {
  try {
    const { facts, adminEntries } = collectWorktreeFacts(repoRoot);
    const report = analyzeWorktreeTopology({ facts, adminEntries });
    const summary =
      `worktree-topology — advisory: total=${report.counts.total} main=${report.counts.main} ` +
      `dirty=${report.counts.dirty} detached=${report.counts.detached} merged=${report.counts.merged} ` +
      `active=${report.counts.active} healthy=${report.healthy} retirable=${report.retirable.length}`;
    if (report.findings.length === 0) {
      return { ok: true, messages: [summary] };
    }
    const findingMessages = report.findings.map(
      (finding) => `worktree-topology — advisory: ${finding.kind} path=${finding.path}`,
    );
    return { ok: true, messages: [summary, ...findingMessages] };
  } catch {
    return {
      ok: true,
      messages: ["worktree-topology — advisory: skipped (worktree facts could not be collected)"],
    };
  }
}
