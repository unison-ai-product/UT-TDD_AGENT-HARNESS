import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calculateExecutionEventDigest,
  EXECUTION_EPISODE_TRANSITIONS,
  type ExecutionEpisodeEvent,
  reduceExecutionEpisode,
} from "../../src/execution-ledger/domain/execution-episode.js";

const EPISODE_ID = "episode:recovery-70";
const ACTOR = "codex";

const EXPECTED_TRANSITIONS = [
  ["E0", "escape_observed"],
  ["E1", "escape_classified"],
  ["E2", "drive_selected"],
  ["E3", "issue_projection_requested"],
  ["E4", "issue_projection_confirmed"],
  ["E5", "drive_plan_frozen"],
  ["E6", "drive_verification_green"],
  ["E7", "reentry_proposed"],
  ["E8", "forward_intermediate_test_green"],
  ["E9", "reentry_certificate_issued"],
  ["E10", "forward_reentered"],
  ["E11", "post_reentry_test_green"],
  ["E12", "draft_pr_projected"],
  ["E13", "cross_review_accepted"],
  ["E14", "merge_confirmed"],
  ["E15", "episode_closed"],
] as const;

describe("ExecutionEpisode reducer (PLAN-L7-436)", () => {
  it("U-EXEP-003: E0-E15の唯一のtransition tableから全合法prefixを受理する", () => {
    expect(EXECUTION_EPISODE_TRANSITIONS.map(({ state, kind }) => [state, kind])).toEqual(
      EXPECTED_TRANSITIONS,
    );

    const events = chain(EXPECTED_TRANSITIONS);
    for (let length = 1; length <= events.length; length += 1) {
      const reduction = reduceExecutionEpisode(events.slice(0, length));
      expect(reduction, `legal prefix E0..E${length - 1}`).toMatchObject({
        ok: true,
        snapshot: {
          state: `E${length - 1}`,
          eventSequence: length - 1,
          lastEventDigest: events[length - 1].eventDigest,
        },
      });
    }
  });

  it.each([
    ["flyover", [EXPECTED_TRANSITIONS[0], EXPECTED_TRANSITIONS[2]]],
    ["reverse", [EXPECTED_TRANSITIONS[0], EXPECTED_TRANSITIONS[2], EXPECTED_TRANSITIONS[1]]],
    ["terminal append", [...EXPECTED_TRANSITIONS, EXPECTED_TRANSITIONS[15]]],
  ] as const)("U-EXEP-004: %s mutationを遷移昇格なしで拒否する", (_label, states) => {
    expect(reduceExecutionEpisode(chain(states))).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-transition-invalid" }],
    });
  });

  it("U-EXEP-006: 同一event列のreplayはstate/next action/digestを完全再現する", () => {
    const events = chain(EXPECTED_TRANSITIONS.slice(0, 10));
    const first = reduceExecutionEpisode(events);
    const replay = reduceExecutionEpisode(structuredClone(events));

    expect(first).toEqual(replay);
    expect(first).toMatchObject({
      ok: true,
      snapshot: {
        state: "E9",
        eventSequence: 9,
        lastEventDigest: events[9].eventDigest,
        nextLegalCommands: ["reenter_forward"],
      },
    });
  });

  it.each([
    ["empty", () => []],
    ["sequence gap", () => withSequence(chain(EXPECTED_TRANSITIONS.slice(0, 3)), 2, 3)],
    ["duplicate sequence", () => withSequence(chain(EXPECTED_TRANSITIONS.slice(0, 3)), 2, 1)],
    ["payload digest", () => withPayloadDigest(chain(EXPECTED_TRANSITIONS.slice(0, 3)), 2)],
    ["previous digest", () => withPreviousDigest(chain(EXPECTED_TRANSITIONS.slice(0, 3)), 2)],
    ["event digest", () => withEventDigest(chain(EXPECTED_TRANSITIONS.slice(0, 3)), 2)],
    ["unknown event", () => unknownEvent(chain(EXPECTED_TRANSITIONS.slice(0, 3)), 2)],
  ] as const)("U-EXEP-007: %s mutationをfail-closeする", (_label, mutate) => {
    expect(reduceExecutionEpisode(mutate())).toMatchObject({
      ok: false,
      violations: [expect.objectContaining({ ruleId: expect.stringMatching(/^episode-/) })],
    });
  });

  it("P-EXEP-001: 全合法prefixのduplicate/delete/swap/unknown mutationで不正昇格しない", () => {
    for (let length = 1; length <= EXPECTED_TRANSITIONS.length; length += 1) {
      const prefix = EXPECTED_TRANSITIONS.slice(0, length);
      const mutations: Array<readonly (readonly [string, string])[]> = [];
      for (let index = 0; index < prefix.length; index += 1) {
        mutations.push([...prefix.slice(0, index), prefix[index], ...prefix.slice(index)]);
        if (index < prefix.length - 1 || prefix.length === 1) {
          mutations.push([...prefix.slice(0, index), ...prefix.slice(index + 1)]);
        }
        mutations.push([
          ...prefix.slice(0, index),
          [`E${index}`, "unknown_event"] as const,
          ...prefix.slice(index + 1),
        ]);
      }
      for (let index = 0; index + 1 < prefix.length; index += 1) {
        const swapped = [...prefix];
        [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
        mutations.push(swapped);
      }

      for (const mutation of mutations) {
        const reduction = reduceExecutionEpisode(chain(mutation));
        expect(reduction.ok, JSON.stringify(mutation)).toBe(false);
      }
    }
  });
});

function chain(states: readonly (readonly [string, string])[]): readonly ExecutionEpisodeEvent[] {
  const events: ExecutionEpisodeEvent[] = [];
  for (const [sequence, [state, kind]] of states.entries()) {
    const unsigned = {
      episodeId: EPISODE_ID,
      sequence,
      state,
      kind,
      payloadDigest: sha(`payload:${state}:${kind}`),
      previousEventDigest: sequence === 0 ? null : events[sequence - 1].eventDigest,
      occurredAt: new Date(Date.UTC(2026, 6, 16, 9, sequence)).toISOString(),
      actor: ACTOR,
    };
    events.push({ ...unsigned, eventDigest: calculateExecutionEventDigest(unsigned) });
  }
  return events;
}

function withSequence(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
  sequence: number,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) => (current === index ? { ...event, sequence } : event));
}

function withPayloadDigest(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) =>
    current === index ? { ...event, payloadDigest: sha("tampered payload") } : event,
  );
}

function withPreviousDigest(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) =>
    current === index ? { ...event, previousEventDigest: sha("wrong predecessor") } : event,
  );
}

function withEventDigest(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) =>
    current === index ? { ...event, eventDigest: sha("tampered event") } : event,
  );
}

function unknownEvent(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) =>
    current === index ? { ...event, kind: "unknown_event" } : event,
  );
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
