import {
  EXECUTION_EPISODE_TRANSITIONS,
  reduceExecutionEpisode,
  type DriveModel,
  type EpisodeViolation,
  type ExecutionEpisodeEvent,
  type ExecutionEpisodeState,
  type ForwardLayer,
  type EscapeObservedPayload,
} from "../domain/execution-episode.js";

export type EpisodeMergeReadiness = "blocked" | "eligible" | "merged" | "closed";

export interface ExecutionEpisodeProjection {
  readonly episodeId: string;
  readonly state: ExecutionEpisodeState;
  readonly eventSequence: number;
  readonly lastEventDigest: string;
  readonly nextLegalActions: readonly string[];
  readonly blockReason: string;
  readonly latestHead: string;
  readonly mergeReadiness: EpisodeMergeReadiness;
  readonly driveModel: DriveModel;
  readonly reentryLayer: ForwardLayer;
  readonly rebuiltAt: string;
}

export type EpisodeProjectionResult =
  | { readonly ok: true; readonly projection: ExecutionEpisodeProjection }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] };

export function projectExecutionEpisode(
  events: readonly ExecutionEpisodeEvent[],
): EpisodeProjectionResult {
  const reduction = reduceExecutionEpisode(events);
  if (!reduction.ok) return reduction;
  const root = events[0]?.payload;
  const last = events.at(-1);
  if (!isEscapeObservedPayload(root) || !last)
    return { ok: false, violations: [{ ruleId: "episode-event-integrity-invalid", path: "events" }] };
  const reentry = root.reentry;
  if (!reentry)
    return { ok: false, violations: [{ ruleId: "episode-event-integrity-invalid", path: "events[0].reentry" }] };
  const latestPayload = asRecord(last.payload);
  if (typeof latestPayload?.observedHead !== "string")
    return {
      ok: false,
      violations: [{ ruleId: "episode-event-integrity-invalid", path: "events.latest.observedHead" }],
    };
  const transition = EXECUTION_EPISODE_TRANSITIONS[reduction.snapshot.eventSequence];
  return {
    ok: true,
    projection: Object.freeze({
      episodeId: root.episodeId,
      state: reduction.snapshot.state,
      eventSequence: reduction.snapshot.eventSequence,
      lastEventDigest: reduction.snapshot.lastEventDigest,
      nextLegalActions: Object.freeze([...reduction.snapshot.nextLegalCommands]),
      blockReason: blockReasonFor(reduction.snapshot.state),
      latestHead: latestPayload.observedHead,
      mergeReadiness: "blocked",
      driveModel: root.requestedDriveModel,
      reentryLayer: reentry.layer,
      rebuiltAt: last.occurredAt,
    }),
  };
}

function blockReasonFor(state: ExecutionEpisodeState): string {
  if (state === "E0") return "issue_not_requested";
  if (state === "E1") return "drive_not_selected";
  if (state === "E2") return "issue_not_requested";
  return "issue_projection_pending";
}

function isEscapeObservedPayload(value: unknown): value is EscapeObservedPayload {
  const payload = asRecord(value);
  return Boolean(
    payload &&
      typeof payload.episodeId === "string" &&
      typeof payload.requestedDriveModel === "string" &&
      typeof payload.sourceCommit === "string" &&
      validCommit(payload.sourceCommit) &&
      typeof payload.observedHead === "string" &&
      validCommit(payload.observedHead) &&
      typeof payload.origin === "object" &&
      typeof payload.reentry === "object" &&
      payload.reentry !== null &&
      typeof (payload.reentry as Record<string, unknown>).layer === "string",
  );
}

function validCommit(value: string): boolean {
  return /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
