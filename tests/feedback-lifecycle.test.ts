import { describe, expect, it } from "vitest";
import { resolveFeedbackLifecycle } from "../src/feedback/lifecycle";

describe("feedback lifecycle", () => {
  const open = {
    feedback_event_id: "feedback:test",
    source_generation: "source:1",
    state: "open" as const,
    occurred_at: "2026-07-10T00:00:00Z",
    reason: "observed",
  };

  it("U-MEMORY-006: acknowledges telemetry only after its TTL", () => {
    expect(
      resolveFeedbackLifecycle({
        previous: open,
        source_present: true,
        is_telemetry: true,
        now: "2026-07-10T00:00:10Z",
        telemetry_ttl_ms: 10_000,
      })?.state,
    ).toBe("ack");
    expect(
      resolveFeedbackLifecycle({
        previous: open,
        source_present: true,
        is_telemetry: false,
        now: "2026-07-11T00:00:00Z",
        telemetry_ttl_ms: 1,
      })?.state,
    ).toBe("open");
  });

  it("U-MEMORY-006: closes a lifecycle record only when its source resolves", () => {
    expect(
      resolveFeedbackLifecycle({
        previous: open,
        source_present: false,
        is_telemetry: false,
        now: "2026-07-10T01:00:00Z",
        telemetry_ttl_ms: 1,
      }),
    ).toMatchObject({ state: "closed", reason: "source_resolved" });
  });
});
