import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calculateExecutionEventDigest,
  canonicalizeExecutionPayload,
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
  ["E3", "issue_requested"],
  ["E4", "issue_projected"],
  ["E5", "drive_plan_frozen"],
  ["E6", "drive_verified"],
  ["E7", "reentry_proposed"],
  ["E8", "intermediate_verified"],
  ["E9", "reentry_certified"],
  ["E10", "forward_reentered"],
  ["E11", "post_reentry_verified"],
  ["E12", "draft_pr_projected"],
  ["E13", "cross_review_approved"],
  ["E14", "merged"],
  ["E15", "closed_learned"],
] as const;

const EXPECTED_NEXT_COMMANDS = [
  "classify_escape",
  "select_drive_model",
  "request_issue_projection",
  "confirm_issue_projection",
  "freeze_drive_plan",
  "record_drive_verification",
  "propose_reentry",
  "record_forward_intermediate_test",
  "issue_reentry_certificate",
  "reenter_forward",
  "record_post_reentry_test",
  "confirm_draft_pr_projection",
  "accept_cross_review",
  "confirm_merge",
  "close_episode",
  null,
] as const;

describe("ExecutionEpisode reducer (PLAN-L7-436)", () => {
  it("U-EXEP-003: E0-E15の唯一のtransition tableから全合法prefixを受理する", () => {
    expect(EXECUTION_EPISODE_TRANSITIONS.map(({ state, kind }) => [state, kind])).toEqual(
      EXPECTED_TRANSITIONS,
    );
    expect(
      EXECUTION_EPISODE_TRANSITIONS.map(({ nextLegalCommands }) => nextLegalCommands[0] ?? null),
    ).toEqual(EXPECTED_NEXT_COMMANDS);

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
    ["missing payload", 6, undefined],
    ["unbound certificate", 9, { ...payloadFor(9), evidence: { ...(payloadFor(9).evidence as object), driveVerificationDigest: "d".repeat(64) } }],
    ["unbound review head", 13, { ...payloadFor(13), evidence: { reviewedHead: "d".repeat(40) } }],
  ] as const)("U-EXEP-007: replay時に%sをfail-closeする", (_label, index, payload) => {
    const events = chain(EXPECTED_TRANSITIONS);
    const changed = events.map((event, current) => current === index ? {
      ...event,
      payload,
      payloadDigest: payload === undefined ? event.payloadDigest : sha(canonicalizeExecutionPayload(payload)),
    } : { ...event });
    expect(reduceExecutionEpisode(rechain(changed, index))).toMatchObject({ ok: false });
  });

  it.each([
    ["mixed episode", mixedEpisode],
    ["clock regression", clockRegression],
    ["valid-looking wrong predecessor", wrongPredecessor],
  ] as const)("U-EXEP-007: re-sign/rechain済み%s攻撃を意味guardで拒否する", (_label, attack) => {
    expect(reduceExecutionEpisode(attack(chain(EXPECTED_TRANSITIONS.slice(0, 4))))).toMatchObject({
      ok: false,
      violations: [{ ruleId: expect.stringMatching(/^episode-/) }],
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
    const payload = payloadFor(sequence);
    const unsigned = {
      episodeId: EPISODE_ID,
      sequence,
      state,
      kind,
      payloadDigest: sha(canonicalizeExecutionPayload(payload)),
      previousEventDigest: sequence === 0 ? null : events[sequence - 1].eventDigest,
      occurredAt: new Date(Date.UTC(2026, 6, 16, 9, sequence)).toISOString(),
      actor: ACTOR,
    };
    events.push({ ...unsigned, payload, eventDigest: calculateExecutionEventDigest(unsigned) });
  }
  return events;
}

const HEAD = "a".repeat(40);
const BASE = "b".repeat(40);
const DIGEST = "c".repeat(64);
function payloadFor(sequence: number): Record<string, unknown> {
  if (sequence === 0) return {
    episodeId: EPISODE_ID, recurrenceId: "recurrence:recovery-70", routeMode: "reverse",
    escapeType: "drift", escapeReason: "contract drift", routeSignal: "drift",
    requestedDriveModel: "reverse", origin: { assetId: "PLAN-L7-1", revision: 1, observedRevision: 1, layer: "L7", state: "confirmed" },
    reentry: { assetId: "PLAN-L6-1", revision: 1, layer: "L6", state: "confirmed", policyRevision: "policy-1" },
    issue: { repository: "org/repo", title: "escape", bodyDigest: DIGEST }, sourceCommit: HEAD,
    observedHead: HEAD, policyRevision: "policy-1", actor: ACTOR,
  };
  const evidence: Record<number, Record<string, unknown>> = {
    4: { externalIssueId: "42" },
    5: { planAssetId: "PLAN-L6-1", planRevision: 1, baseSha: BASE },
    6: { evidenceDigest: DIGEST },
    8: { evidenceDigest: DIGEST },
    9: { certificateId: "cert-1", certificateDigest: DIGEST, driveVerificationDigest: DIGEST, intermediateEvidenceDigest: DIGEST },
    10: { certificateId: "cert-1", certificateDigest: DIGEST, acceptedPlanAssetId: "PLAN-L6-1", acceptedPlanRevision: 1 },
    12: { issueNumber: 42, planAssetId: "PLAN-L6-1", planRevision: 1, baseSha: BASE, headSha: HEAD },
    13: { reviewedHead: HEAD },
    14: { reconciledHead: HEAD, baseSha: BASE, mergeSha: HEAD },
    15: { mainCiCommit: HEAD },
  };
  return { episodeId: EPISODE_ID, sourceCommit: HEAD, observedHead: HEAD, policyRevision: "policy-1", actor: ACTOR,
    ...(sequence >= 4 ? { evidence: evidence[sequence] ?? {} } : {}) };
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

function resign(event: ExecutionEpisodeEvent): ExecutionEpisodeEvent {
  return { ...event, eventDigest: calculateExecutionEventDigest(event) };
}

function rechain(events: readonly ExecutionEpisodeEvent[], start: number): readonly ExecutionEpisodeEvent[] {
  const result = events.map((event) => ({ ...event }));
  for (let index = start; index < result.length; index += 1) {
    result[index] = resign({
      ...result[index],
      previousEventDigest: index === 0 ? null : result[index - 1].eventDigest,
    });
  }
  return result;
}

function mixedEpisode(events: readonly ExecutionEpisodeEvent[]): readonly ExecutionEpisodeEvent[] {
  const result = events.map((event) => ({ ...event }));
  result[2] = { ...result[2], episodeId: "episode:other" };
  return rechain(result, 2);
}

function clockRegression(events: readonly ExecutionEpisodeEvent[]): readonly ExecutionEpisodeEvent[] {
  const result = events.map((event) => ({ ...event }));
  result[2] = { ...result[2], occurredAt: "2026-07-16T09:00:59.999Z" };
  return rechain(result, 2);
}

function wrongPredecessor(events: readonly ExecutionEpisodeEvent[]): readonly ExecutionEpisodeEvent[] {
  const result = events.map((event) => ({ ...event }));
  result[2] = resign({ ...result[2], previousEventDigest: sha("valid-looking-wrong-predecessor") });
  return result;
}
