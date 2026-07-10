import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type FeedbackLifecycleState = "open" | "ack" | "closed" | "superseded";

const TELEMETRY_SIGNAL_TYPES = new Set([
  "artifact_progress_yellow",
  "drive_firing_rate",
  "large-document-split",
  "memory_promotion_missed",
  "missing-test-oracle-id",
  "skill_acceptance_rate",
  "skill_firing_rate",
  "trouble_event_rate",
  "workflow_human_required_rate",
]);

export function isTelemetryFeedback(input: { severity: string; signal_type: string }): boolean {
  return input.severity.toLowerCase() === "info" || TELEMETRY_SIGNAL_TYPES.has(input.signal_type);
}

export interface FeedbackLifecycleRecord {
  feedback_event_id: string;
  source_generation: string;
  state: FeedbackLifecycleState;
  occurred_at: string;
  reason: string;
}

export function parseFeedbackLifecycle(raw: string): FeedbackLifecycleRecord[] {
  return raw.split(/\r?\n/).flatMap((line) => {
    if (!line.trim()) return [];
    try {
      const value = JSON.parse(line) as FeedbackLifecycleRecord;
      const validState = ["open", "ack", "closed", "superseded"].includes(value.state);
      const validTime = Number.isFinite(Date.parse(value.occurred_at));
      return value.feedback_event_id &&
        value.source_generation &&
        validState &&
        validTime &&
        typeof value.reason === "string"
        ? [value]
        : [];
    } catch {
      return [];
    }
  });
}

export function renderFeedbackLifecycle(record: FeedbackLifecycleRecord): string {
  return `${JSON.stringify(record)}\n`;
}

export function feedbackLifecyclePath(repoRoot: string): string {
  return join(repoRoot, ".ut-tdd", "logs", "feedback-lifecycle.jsonl");
}

export function loadFeedbackLifecycle(repoRoot: string): FeedbackLifecycleRecord[] {
  const path = feedbackLifecyclePath(repoRoot);
  try {
    return existsSync(path) ? parseFeedbackLifecycle(readFileSync(path, "utf8")) : [];
  } catch {
    return [];
  }
}

export function appendFeedbackLifecycle(repoRoot: string, record: FeedbackLifecycleRecord): void {
  try {
    const path = feedbackLifecyclePath(repoRoot);
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, renderFeedbackLifecycle(record), "utf8");
  } catch {
    // Lifecycle telemetry is fail-open.
  }
}

export function resolveFeedbackLifecycle(input: {
  previous?: FeedbackLifecycleRecord;
  source_present: boolean;
  is_telemetry: boolean;
  now: string;
  telemetry_ttl_ms: number;
}): FeedbackLifecycleRecord | undefined {
  const { previous, source_present, is_telemetry, now, telemetry_ttl_ms } = input;
  if (!source_present) {
    if (!previous || previous.state === "closed") return previous;
    return { ...previous, state: "closed", occurred_at: now, reason: "source_resolved" };
  }
  if (!previous) return undefined;
  if (!is_telemetry || previous.state !== "open") return previous;
  const elapsed = Date.parse(now) - Date.parse(previous.occurred_at);
  if (!Number.isFinite(elapsed) || elapsed < telemetry_ttl_ms) return previous;
  return { ...previous, state: "ack", occurred_at: now, reason: "telemetry_ttl" };
}
