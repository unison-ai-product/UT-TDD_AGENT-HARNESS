/**
 * attempt-escalation (PLAN-RECOVERY-05) — systematic-debugging の Iron Law を機械化。
 *
 * source concept: obra/superpowers `systematic-debugging` (reference-only)。skill を複製せず
 * UT-TDD の Recovery/troubleshoot 駆動の要件から author する ([[feedback_migration_is_requirements_driven]])。
 *
 * 規律: **「同一 subject への修正試行が threshold (既定 3) 回連続で失敗したら STOP し、症状追いを
 * 止めて root cause / アーキテクチャを疑え」**。guess-and-check のスパイラル (本セッションで私が
 * 陥った moving tree の繰り返し計測 + 場当たり修正) を機械シグナルで止める。
 *
 * 判定は純関数 (`evaluateAttemptEscalation`)。session-log からの attempt 抽出
 * (`attemptsFromSessionEvents`) を分離し、emission/wiring は呼び出し側に委ねる
 * (forced-stop.ts と同方針、fail-open)。
 */
import type { SessionEvent } from "./session-log";

/** 1 回の修正試行。subject=対象 (file path / gate id / test name)、outcome=結果。 */
export interface AttemptRecord {
  subject: string;
  outcome: "ok" | "error";
}

export interface EscalationSignal {
  escalate: true;
  subject: string;
  /** 直近の連続失敗数 (ok を挟むとリセット)。 */
  failureCount: number;
  /** 人間/エージェント向けの STOP メッセージ (Iron Law を明示)。 */
  message: string;
}

export const DEFAULT_ATTEMPT_THRESHOLD = 3;

/**
 * 試行列から escalation signal を導く純関数。
 *
 * 各 subject の **直近連続失敗数** を数え (ok が挟まれば 0 にリセット)、threshold 以上の subject を
 * 失敗数降順 → subject 昇順で返す。空入力・閾値未満は空配列 (誤検知で作業を止めない)。
 */
export function evaluateAttemptEscalation(
  attempts: AttemptRecord[],
  opts: { threshold?: number } = {},
): EscalationSignal[] {
  const threshold = opts.threshold ?? DEFAULT_ATTEMPT_THRESHOLD;
  const consecutiveFailures = new Map<string, number>();
  for (const attempt of attempts) {
    if (!attempt.subject) continue;
    if (attempt.outcome === "error") {
      consecutiveFailures.set(attempt.subject, (consecutiveFailures.get(attempt.subject) ?? 0) + 1);
    } else {
      consecutiveFailures.set(attempt.subject, 0);
    }
  }

  const signals: EscalationSignal[] = [];
  for (const [subject, failureCount] of consecutiveFailures) {
    if (failureCount >= threshold) {
      signals.push({
        escalate: true,
        subject,
        failureCount,
        message:
          `${failureCount} consecutive failed attempts on ${subject} - STOP. ` +
          `Iron Law: investigate the root cause / question the architecture before another fix ` +
          `(systematic-debugging). Break the symptom-chasing spiral; route to Recovery/troubleshoot.`,
      });
    }
  }
  return signals.sort(
    (a, b) => b.failureCount - a.failureCount || a.subject.localeCompare(b.subject),
  );
}

/**
 * session 生ログ events から attempt 列を抽出する。
 *
 * tool_use イベントのうち target (対象 path 等) と outcome (ok/error) を持つものを試行とみなす。
 * 時系列順を保持するため events の順序をそのまま使う (連続失敗判定の前提)。
 */
export function attemptsFromSessionEvents(events: SessionEvent[]): AttemptRecord[] {
  const records: AttemptRecord[] = [];
  for (const event of events) {
    if (event.event_type !== "tool_use") continue;
    if (!event.target) continue;
    if (event.outcome !== "ok" && event.outcome !== "error") continue;
    records.push({ subject: event.target, outcome: event.outcome });
  }
  return records;
}
