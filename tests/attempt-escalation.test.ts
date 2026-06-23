import { describe, expect, it } from "vitest";
import {
  type AttemptRecord,
  attemptsFromSessionEvents,
  DEFAULT_ATTEMPT_THRESHOLD,
  evaluateAttemptEscalation,
} from "../src/runtime/attempt-escalation";
import type { SessionEvent } from "../src/runtime/session-log";

describe("attempt escalation (PLAN-RECOVERY-05) — Iron Law 3-attempt stop", () => {
  it("escalates after 3 consecutive failures on the same subject", () => {
    const attempts: AttemptRecord[] = [
      { subject: "tests/x.test.ts", outcome: "error" },
      { subject: "tests/x.test.ts", outcome: "error" },
      { subject: "tests/x.test.ts", outcome: "error" },
    ];
    const signals = evaluateAttemptEscalation(attempts);
    expect(signals).toHaveLength(1);
    expect(signals[0]?.subject).toBe("tests/x.test.ts");
    expect(signals[0]?.failureCount).toBe(3);
    expect(signals[0]?.message).toContain("STOP");
    expect(signals[0]?.message).toContain("root cause");
  });

  it("does not escalate below the threshold", () => {
    const signals = evaluateAttemptEscalation([
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "error" },
    ]);
    expect(signals).toEqual([]);
  });

  it("resets the streak when an attempt succeeds (ok breaks the spiral)", () => {
    const signals = evaluateAttemptEscalation([
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "ok" },
      { subject: "a", outcome: "error" },
    ]);
    expect(signals).toEqual([]);
  });

  it("tracks consecutive failures per subject independently", () => {
    const signals = evaluateAttemptEscalation([
      { subject: "a", outcome: "error" },
      { subject: "b", outcome: "error" },
      { subject: "a", outcome: "error" },
      { subject: "b", outcome: "error" },
      { subject: "a", outcome: "error" },
    ]);
    expect(signals).toHaveLength(1);
    expect(signals[0]?.subject).toBe("a");
    expect(signals[0]?.failureCount).toBe(3);
  });

  it("honors a custom threshold", () => {
    const attempts: AttemptRecord[] = [
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "error" },
    ];
    expect(evaluateAttemptEscalation(attempts, { threshold: 2 })).toHaveLength(1);
    expect(DEFAULT_ATTEMPT_THRESHOLD).toBe(3);
  });

  it("orders multiple escalations by failure count desc then subject", () => {
    const attempts: AttemptRecord[] = [
      { subject: "b", outcome: "error" },
      { subject: "b", outcome: "error" },
      { subject: "b", outcome: "error" },
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "error" },
      { subject: "a", outcome: "error" },
    ];
    const signals = evaluateAttemptEscalation(attempts);
    expect(signals.map((s) => s.subject)).toEqual(["a", "b"]);
  });

  it("extracts attempts from session tool_use events (ignores non-tool/no-target/no-outcome)", () => {
    const events: SessionEvent[] = [
      { ts: "1", session_id: "s", plan_id: null, event_type: "session_start" },
      {
        ts: "2",
        session_id: "s",
        plan_id: null,
        event_type: "tool_use",
        tool: "Bash",
        target: "tests/x.test.ts",
        outcome: "error",
      },
      {
        ts: "3",
        session_id: "s",
        plan_id: null,
        event_type: "tool_use",
        tool: "Bash",
        target: "tests/x.test.ts",
        // no outcome → ignored
      },
      {
        ts: "4",
        session_id: "s",
        plan_id: null,
        event_type: "tool_use",
        tool: "Read",
        // no target → ignored
        outcome: "ok",
      },
    ];
    const attempts = attemptsFromSessionEvents(events);
    expect(attempts).toEqual([{ subject: "tests/x.test.ts", outcome: "error" }]);
  });
});
