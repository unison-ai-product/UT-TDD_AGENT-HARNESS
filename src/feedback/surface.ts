import type { HarnessDb } from "../state-db/index";

/**
 * Takeover feedback surface (PLAN-L7-110).
 *
 * Session takeover must receive actionable feedback from harness.db, not from a
 * stale prose handover or a transient shared working tree. This reader is
 * intentionally read-only so SessionStart can run while another runtime is
 * rebuilding the projection database.
 */

export interface SurfacedFeedback {
  feedback_event_id: string;
  signal_type: string;
  severity: string;
  plan_id: string;
  next_action: string;
}

export interface TakeoverFeedbackResult {
  /** Total open feedback count before applying the display limit. */
  total: number;
  /** Count by normalized severity. */
  bySeverity: Record<string, number>;
  /** Stable severity/id ordered items after applying the display limit. */
  items: SurfacedFeedback[];
}

const SEVERITY_RANK: Record<string, number> = { fail: 0, warn: 1, info: 2 };

function severityRank(severity: string): number {
  return SEVERITY_RANK[severity] ?? SEVERITY_RANK.warn;
}

function feedbackId(prefix: string, subject: string): string {
  return `${prefix}:${subject}`.replace(/[^A-Za-z0-9._:-]+/g, "-");
}

function planIdOf(subject: string): string {
  return subject.startsWith("PLAN-") ? subject : "";
}

/**
 * Read takeover feedback directly from harness.db projection tables.
 *
 * This mirrors the feedback source used by emitFeedbackEvents without writing to
 * feedback_events. It keeps SessionStart fail-open and avoids write-lock
 * contention with parallel database rebuilds.
 */
export function selectTakeoverFeedback(
  db: HarnessDb,
  opts: { limit?: number } = {},
): TakeoverFeedbackResult {
  const limit = opts.limit ?? 10;
  const items: SurfacedFeedback[] = [];

  const openFindings = db
    .prepare("SELECT finding_id, kind, severity, subject_id FROM findings WHERE status = 'open'")
    .all() as Array<Record<string, unknown>>;
  for (const finding of openFindings) {
    const subject = String(finding.subject_id ?? finding.finding_id ?? "");
    items.push({
      feedback_event_id: feedbackId("feedback:finding", String(finding.finding_id ?? subject)),
      signal_type: String(finding.kind ?? "finding"),
      severity: String(finding.severity ?? "warn"),
      plan_id: planIdOf(subject),
      next_action: `review finding ${finding.finding_id ?? subject}`,
    });
  }

  const failedSignals = db
    .prepare(
      "SELECT signal_id, metric, status, subject_id FROM quality_signals WHERE status IN ('fail', 'warn')",
    )
    .all() as Array<Record<string, unknown>>;
  for (const signal of failedSignals) {
    const subject = String(signal.subject_id ?? signal.signal_id ?? "");
    items.push({
      feedback_event_id: feedbackId("feedback:signal", String(signal.signal_id ?? subject)),
      signal_type: String(signal.metric ?? "quality_signal"),
      severity: String(signal.status ?? "warn") === "fail" ? "warn" : "info",
      plan_id: planIdOf(subject),
      next_action: `review quality signal ${signal.signal_id ?? subject}`,
    });
  }

  items.sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      a.feedback_event_id.localeCompare(b.feedback_event_id),
  );

  const bySeverity: Record<string, number> = {};
  for (const item of items) {
    bySeverity[item.severity] = (bySeverity[item.severity] ?? 0) + 1;
  }

  return { total: items.length, bySeverity, items: items.slice(0, limit) };
}

export function renderTakeoverFeedback(result: TakeoverFeedbackResult): string {
  if (result.total === 0) return "";
  const counts = ["fail", "warn", "info"]
    .filter((sev) => (result.bySeverity[sev] ?? 0) > 0)
    .map((sev) => `${sev}=${result.bySeverity[sev]}`)
    .join(" ");
  const lines = [
    `harness.db feedback (open=${result.total}; ${counts}) - source=DB, not prose handover`,
  ];
  for (const item of result.items) {
    const plan = item.plan_id ? ` [${item.plan_id}]` : "";
    lines.push(`  - (${item.severity}) ${item.signal_type}${plan}: ${item.next_action}`);
  }
  if (result.total > result.items.length) {
    lines.push(`  - (+${result.total - result.items.length} more - ut-tdd feedback list --emit)`);
  }
  return `${lines.join("\n")}\n`;
}
