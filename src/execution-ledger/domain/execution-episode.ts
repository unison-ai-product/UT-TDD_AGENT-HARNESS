import { createHash } from "node:crypto";
import { ROUTE_MODE_DISPLAY } from "../../schema/mode-catalog.js";
import { routeSignalCandidates } from "../../schema/route-map.js";
import { isSecretLike } from "../../secret.js";

export type DriveModel =
  | "discovery"
  | "scrum"
  | "reverse"
  | "redesign"
  | "recovery"
  | "incident"
  | "refactor"
  | "retrofit"
  | "add-feature"
  | "research"
  | "design-bottomup"
  | "version-up";

export type ForwardLayer = `L${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14}`;

export interface RequestForwardEscape {
  readonly type: "request_forward_escape";
  readonly commandId: string;
  readonly episodeId: string;
  readonly recurrenceId: string;
  readonly routeMode: string;
  readonly escapeType: string;
  readonly escapeReason: string;
  readonly routeSignal: string;
  readonly requestedDriveModel: DriveModel;
  readonly origin: {
    readonly assetId: string;
    readonly revision: number;
    readonly observedRevision: number;
    readonly layer: ForwardLayer;
    readonly state: string;
  };
  readonly reentry?: {
    readonly assetId: string;
    readonly revision: number;
    readonly layer: ForwardLayer;
    readonly state: string;
    readonly policyRevision: string;
  };
  readonly issue: {
    readonly repository: string;
    readonly title: string;
    readonly bodyDigest: string;
  };
  readonly override?: {
    readonly actor: string;
    readonly reason: string;
    readonly evidenceDigest: string;
  };
  readonly sourceCommit: string;
  readonly observedHead: string;
  readonly policyRevision: string;
  readonly actor: string;
  readonly occurredAt: string;
}

export interface EpisodeViolation {
  readonly ruleId: string;
  readonly path: string;
}

export type ExecutionEpisodeState = `E${
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15}`;

export interface ExecutionEpisodeEvent {
  readonly episodeId: string;
  readonly sequence: number;
  readonly state: string;
  readonly kind: string;
  readonly payloadDigest: string;
  readonly previousEventDigest: string | null;
  readonly occurredAt: string;
  readonly actor: string;
  readonly eventDigest: string;
  readonly payload?: unknown;
}

export interface ExecutionEpisodeTransition {
  readonly state: ExecutionEpisodeState;
  readonly kind: string;
  readonly nextLegalCommands: readonly string[];
}

export const EXECUTION_EPISODE_TRANSITIONS: readonly ExecutionEpisodeTransition[] = Object.freeze([
  transition("E0", "escape_observed", "classify_escape"),
  transition("E1", "escape_classified", "select_drive_model"),
  transition("E2", "drive_selected", "request_issue_projection"),
  transition("E3", "issue_projection_requested", "confirm_issue_projection"),
  transition("E4", "issue_projection_confirmed", "freeze_drive_plan"),
  transition("E5", "drive_plan_frozen", "record_drive_verification"),
  transition("E6", "drive_verification_green", "propose_reentry"),
  transition("E7", "reentry_proposed", "record_forward_intermediate_test"),
  transition("E8", "forward_intermediate_test_green", "issue_reentry_certificate"),
  transition("E9", "reentry_certificate_issued", "reenter_forward"),
  transition("E10", "forward_reentered", "record_post_reentry_test"),
  transition("E11", "post_reentry_test_green", "confirm_draft_pr_projection"),
  transition("E12", "draft_pr_projected", "accept_cross_review"),
  transition("E13", "cross_review_accepted", "confirm_merge"),
  transition("E14", "merge_confirmed", "close_episode"),
  transition("E15", "episode_closed"),
]);

export type ExecutionEpisodeReduction =
  | {
      readonly ok: true;
      readonly snapshot: {
        readonly state: ExecutionEpisodeState;
        readonly eventSequence: number;
        readonly lastEventDigest: string;
        readonly nextLegalCommands: readonly string[];
      };
    }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] };

export interface EscapeObservedEvent {
  readonly eventId: string;
  readonly episodeId: string;
  readonly sequence: 0;
  readonly state: "E0";
  readonly kind: "escape_observed";
  readonly commandId: string;
  readonly commandPayloadDigest: string;
  readonly payloadDigest: string;
  readonly previousEventDigest: null;
  readonly eventDigest: string;
  readonly occurredAt: string;
  readonly actor: string;
  readonly payload: EscapeObservedPayload;
}

export type EscapeObservedPayload = Readonly<
  Omit<RequestForwardEscape, "type" | "commandId" | "occurredAt">
>;

export type EpisodeDecision =
  | {
      readonly ok: true;
      readonly status: "accepted";
      readonly episode: ExecutionEpisode;
      readonly events: readonly [EscapeObservedEvent];
      readonly outbox: readonly [];
    }
  | {
      readonly ok: true;
      readonly status: "replayed";
      readonly eventIds: readonly string[];
      readonly outboxIds: readonly string[];
    }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] };

export interface ExecutionEpisodeSnapshot {
  readonly episodeId: string;
  readonly state: "E0";
  readonly eventSequence: 0;
  readonly lastEventDigest: string;
  readonly nextLegalCommands: readonly ["classify_escape"];
  readonly recurrenceId: string;
  readonly requestedDriveModel: DriveModel;
  readonly origin: RequestForwardEscape["origin"];
  readonly reentry: NonNullable<RequestForwardEscape["reentry"]>;
  readonly sourceCommit: string;
  readonly observedHead: string;
  readonly policyRevision: string;
}

const NON_EPISODE_ROUTE_MODES = new Set(["forward", "verify"]);
const DRIVE_MODELS = new Set(
  Object.keys(ROUTE_MODE_DISPLAY).filter((mode) => !NON_EPISODE_ROUTE_MODES.has(mode)),
);

export function classifyForwardBoundary(input: {
  readonly routeMode: string;
  readonly escapeType: string | null;
}): {
  readonly kind: "inside_forward" | "forward_escape" | "invalid";
  readonly requiresEpisode: boolean;
} {
  if (!(input.routeMode in ROUTE_MODE_DISPLAY)) return { kind: "invalid", requiresEpisode: false };
  return NON_EPISODE_ROUTE_MODES.has(input.routeMode)
    ? { kind: "inside_forward", requiresEpisode: false }
    : { kind: "forward_escape", requiresEpisode: true };
}

export class ExecutionEpisode {
  private constructor(
    private readonly event: EscapeObservedEvent,
    private readonly acceptedCommandId: string,
    private readonly acceptedPayloadDigest: string,
  ) {}

  static request(command: RequestForwardEscape): EpisodeDecision {
    const violations = validateRequest(command);
    if (violations.length > 0) return { ok: false, violations };

    const commandPayloadDigest = digest(canonicalCommand(command));
    const payload = freezePayload(command);
    const payloadDigest = digest(canonical(payload));
    const eventSeed = canonical({
      episodeId: command.episodeId,
      sequence: 0,
      commandId: command.commandId,
      commandPayloadDigest,
      kind: "escape_observed",
      payloadDigest,
    });
    const event: EscapeObservedEvent = Object.freeze({
      eventId: `event:${digest(eventSeed).slice(0, 32)}`,
      episodeId: command.episodeId,
      sequence: 0,
      state: "E0",
      kind: "escape_observed",
      commandId: command.commandId,
      commandPayloadDigest,
      payloadDigest,
      previousEventDigest: null,
      eventDigest: digest(eventSeed),
      occurredAt: command.occurredAt,
      actor: command.actor,
      payload,
    });
    const episode = new ExecutionEpisode(event, command.commandId, commandPayloadDigest);
    return { ok: true, status: "accepted", episode, events: [event], outbox: [] };
  }

  get snapshot(): ExecutionEpisodeSnapshot {
    return snapshotFromEvent(this.event);
  }

  decide(command: RequestForwardEscape): EpisodeDecision {
    const payloadDigest = digest(canonicalCommand(command));
    if (command.commandId !== this.acceptedCommandId)
      return violation("episode-transition-invalid", "commandId");
    if (payloadDigest !== this.acceptedPayloadDigest)
      return violation("episode-command-payload-conflict", "commandId");
    return {
      ok: true,
      status: "replayed",
      eventIds: [this.event.eventId],
      outboxIds: [],
    };
  }
}

function validateRequest(command: RequestForwardEscape): EpisodeViolation[] {
  if (!classifyForwardBoundary(command).requiresEpisode)
    return [rule("episode-forward-boundary-inside", "routeMode")];
  if (!DRIVE_MODELS.has(command.requestedDriveModel))
    return [rule("episode-drive-model-invalid", "requestedDriveModel")];
  if (command.routeMode !== command.requestedDriveModel)
    return [rule("episode-route-drive-mismatch", "routeMode")];
  const signalModes = routeSignalCandidates(command.routeSignal.trim().toLowerCase());
  if (signalModes.length !== 1 || signalModes[0] !== command.routeMode)
    return [rule("episode-route-signal-mismatch", "routeSignal")];
  if (!/^command:[a-z0-9][a-z0-9:-]{2,127}$/.test(command.commandId))
    return [rule("episode-command-id-invalid", "commandId")];
  if (!/^episode:[a-z0-9][a-z0-9:-]{2,127}$/.test(command.episodeId))
    return [rule("episode-id-invalid", "episodeId")];
  if (!/^recurrence:[a-z0-9][a-z0-9:-]{2,127}$/.test(command.recurrenceId))
    return [rule("episode-recurrence-id-invalid", "recurrenceId")];
  if (
    !command.origin.assetId.trim() ||
    !Number.isSafeInteger(command.origin.revision) ||
    command.origin.revision < 1 ||
    !Number.isSafeInteger(command.origin.observedRevision) ||
    command.origin.observedRevision < 1 ||
    !command.origin.state.trim()
  )
    return [rule("episode-origin-invalid", "origin")];
  if (command.origin.revision !== command.origin.observedRevision)
    return [rule("episode-origin-stale", "origin.observedRevision")];
  if (!command.reentry) return [rule("episode-reentry-required", "reentry")];
  if (
    !command.reentry.assetId.trim() ||
    !Number.isSafeInteger(command.reentry.revision) ||
    command.reentry.revision < 1 ||
    !command.reentry.state.trim() ||
    !command.reentry.policyRevision.trim()
  )
    return [rule("episode-reentry-invalid", "reentry")];
  if (
    !command.issue.repository.trim() ||
    !command.issue.title.trim() ||
    !validDigest(command.issue.bodyDigest)
  )
    return [rule("episode-issue-invalid", "issue")];
  if (!/^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(command.sourceCommit))
    return [rule("episode-source-commit-invalid", "sourceCommit")];
  if (!/^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(command.observedHead))
    return [rule("episode-observed-head-invalid", "observedHead")];
  if (!Number.isFinite(Date.parse(command.occurredAt)))
    return [rule("episode-occurred-at-invalid", "occurredAt")];
  if (!command.policyRevision.trim() || !command.actor.trim())
    return [rule("episode-custody-invalid", "policyRevision")];
  if (
    [
      command.escapeReason,
      command.issue.title,
      command.actor,
      command.override?.reason ?? "",
      command.override?.actor ?? "",
    ].some(isSecretLike)
  )
    return [rule("episode-sensitive-input-forbidden", "payload")];
  if (
    command.override &&
    (!command.override.actor.trim() ||
      !command.override.reason.trim() ||
      !validDigest(command.override.evidenceDigest))
  )
    return [rule("episode-override-evidence-invalid", "override")];
  return [];
}

function canonicalCommand(command: RequestForwardEscape): string {
  return canonical(command);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function transition(
  state: ExecutionEpisodeState,
  kind: string,
  nextLegalCommand?: string,
): ExecutionEpisodeTransition {
  return Object.freeze({
    state,
    kind,
    nextLegalCommands: Object.freeze(nextLegalCommand ? [nextLegalCommand] : []),
  });
}

export function calculateExecutionEventDigest(
  event: Omit<ExecutionEpisodeEvent, "eventDigest" | "payload">,
): string {
  return digest(
    canonical({
      actor: event.actor,
      episodeId: event.episodeId,
      kind: event.kind,
      occurredAt: event.occurredAt,
      payloadDigest: event.payloadDigest,
      previousEventDigest: event.previousEventDigest,
      sequence: event.sequence,
      state: event.state,
    }),
  );
}

export function reduceExecutionEpisode(
  events: readonly ExecutionEpisodeEvent[],
): ExecutionEpisodeReduction {
  if (events.length === 0) return reductionViolation("episode-event-stream-empty", "events");

  let previous: ExecutionEpisodeEvent | undefined;
  let previousTime = Number.NEGATIVE_INFINITY;
  const episodeId = events[0].episodeId;
  if (!/^episode:[a-z0-9][a-z0-9:-]{2,127}$/.test(episodeId))
    return reductionViolation("episode-id-invalid", "events[0].episodeId");

  for (const [index, event] of events.entries()) {
    const path = `events[${index}]`;
    if (event.episodeId !== episodeId)
      return reductionViolation("episode-identity-mismatch", `${path}.episodeId`);
    if (!Number.isSafeInteger(event.sequence) || event.sequence !== index)
      return reductionViolation("episode-sequence-invalid", `${path}.sequence`);

    const expected = EXECUTION_EPISODE_TRANSITIONS[index];
    if (!expected || event.state !== expected.state || event.kind !== expected.kind)
      return reductionViolation("episode-transition-invalid", path);

    if (!validDigest(event.payloadDigest))
      return reductionViolation("episode-payload-digest-invalid", `${path}.payloadDigest`);
    if (event.payload !== undefined && digest(canonical(event.payload)) !== event.payloadDigest)
      return reductionViolation("episode-payload-integrity-invalid", `${path}.payload`);
    if (!event.actor.trim()) return reductionViolation("episode-actor-invalid", `${path}.actor`);

    const occurredAt = Date.parse(event.occurredAt);
    if (!Number.isFinite(occurredAt) || new Date(occurredAt).toISOString() !== event.occurredAt)
      return reductionViolation("episode-time-invalid", `${path}.occurredAt`);
    if (occurredAt < previousTime)
      return reductionViolation("episode-time-regression", `${path}.occurredAt`);

    const expectedPreviousDigest = previous?.eventDigest ?? null;
    if (event.previousEventDigest !== expectedPreviousDigest)
      return reductionViolation("episode-chain-digest-invalid", `${path}.previousEventDigest`);
    if (!validDigest(event.eventDigest))
      return reductionViolation("episode-event-digest-invalid", `${path}.eventDigest`);
    if (calculateExecutionEventDigest(event) !== event.eventDigest)
      return reductionViolation("episode-event-digest-invalid", `${path}.eventDigest`);

    previous = event;
    previousTime = occurredAt;
  }

  const last = events[events.length - 1];
  const current = EXECUTION_EPISODE_TRANSITIONS[last.sequence];
  return Object.freeze({
    ok: true,
    snapshot: Object.freeze({
      state: current.state,
      eventSequence: last.sequence,
      lastEventDigest: last.eventDigest,
      nextLegalCommands: current.nextLegalCommands,
    }),
  });
}

function reductionViolation(ruleId: string, path: string): ExecutionEpisodeReduction {
  return { ok: false, violations: [rule(ruleId, path)] };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function validDigest(value: string): boolean {
  return /^(?:sha256:)?[a-f0-9]{64}$/.test(value);
}

function rule(ruleId: string, path: string): EpisodeViolation {
  return Object.freeze({ ruleId, path });
}

function violation(ruleId: string, path: string): EpisodeDecision {
  return { ok: false, violations: [rule(ruleId, path)] };
}

export function reconstructExecutionEpisode(
  events: readonly EscapeObservedEvent[],
):
  | { readonly ok: true; readonly value: ExecutionEpisodeSnapshot }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] } {
  if (events.length !== 1)
    return { ok: false, violations: [rule("episode-event-count-invalid", "events")] };
  const event = events[0];
  if (
    event.sequence !== 0 ||
    event.state !== "E0" ||
    event.kind !== "escape_observed" ||
    event.previousEventDigest !== null ||
    digest(canonical(event.payload)) !== event.payloadDigest
  )
    return { ok: false, violations: [rule("episode-event-integrity-invalid", "events[0]")] };
  return { ok: true, value: snapshotFromEvent(event) };
}

function freezePayload(command: RequestForwardEscape): EscapeObservedPayload {
  const payload: EscapeObservedPayload = {
    episodeId: command.episodeId,
    recurrenceId: command.recurrenceId,
    routeMode: command.routeMode,
    escapeType: command.escapeType,
    escapeReason: command.escapeReason,
    routeSignal: command.routeSignal,
    requestedDriveModel: command.requestedDriveModel,
    origin: Object.freeze({ ...command.origin }),
    reentry: command.reentry ? Object.freeze({ ...command.reentry }) : undefined,
    issue: Object.freeze({ ...command.issue }),
    ...(command.override ? { override: Object.freeze({ ...command.override }) } : {}),
    sourceCommit: command.sourceCommit,
    observedHead: command.observedHead,
    policyRevision: command.policyRevision,
    actor: command.actor,
  };
  return Object.freeze(payload);
}

function snapshotFromEvent(event: EscapeObservedEvent): ExecutionEpisodeSnapshot {
  return Object.freeze({
    episodeId: event.episodeId,
    state: "E0",
    eventSequence: 0,
    lastEventDigest: event.eventDigest,
    nextLegalCommands: ["classify_escape"] as const,
    recurrenceId: event.payload.recurrenceId,
    requestedDriveModel: event.payload.requestedDriveModel,
    origin: event.payload.origin,
    reentry: event.payload.reentry as NonNullable<RequestForwardEscape["reentry"]>,
    sourceCommit: event.payload.sourceCommit,
    observedHead: event.payload.observedHead,
    policyRevision: event.payload.policyRevision,
  });
}
