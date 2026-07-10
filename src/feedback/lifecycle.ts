export type FeedbackLifecycleState = "open" | "ack" | "closed" | "superseded";

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
      return value.feedback_event_id && value.source_generation && value.state ? [value] : [];
    } catch {
      return [];
    }
  });
}

export function renderFeedbackLifecycle(record: FeedbackLifecycleRecord): string {
  return `${JSON.stringify(record)}\n`;
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
