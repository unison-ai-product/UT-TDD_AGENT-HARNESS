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

interface ExecutionTransitionEnvelope {
  readonly commandId: string;
  readonly episodeId: string;
  readonly expectedSequence: ExecutionEpisodeSequence;
  readonly sourceCommit: string;
  readonly observedHead: string;
  readonly policyRevision: string;
  readonly actor: string;
  readonly occurredAt: string;
}

export interface ClassifyEscapeCommand extends ExecutionTransitionEnvelope {
  readonly type: "classify_escape";
  readonly expectedSequence: 1;
  readonly escapeType: string;
  readonly classificationRuleRevision: string;
  readonly verificationTarget: {
    readonly kind: "assumption" | "decision";
    readonly assetId: string;
    readonly revision: number;
    readonly statementDigest: string;
  };
}

export interface SelectDriveModelCommand extends ExecutionTransitionEnvelope {
  readonly type: "select_drive_model";
  readonly expectedSequence: 2;
  readonly model: DriveModel;
  readonly compatibilityResult: "compatible" | "override_required";
  readonly rationaleDigest: string;
  readonly selectionRevision: number;
  readonly override?: {
    readonly actor: string;
    readonly reason: string;
    readonly evidenceDigest: string;
  };
}

export interface RequestIssueProjectionCommand extends ExecutionTransitionEnvelope {
  readonly type: "request_issue_projection";
  readonly expectedSequence: 3;
  readonly repository: string;
  readonly intentRevision: number;
  readonly labels: readonly string[];
}

export type ExecutionEpisodeSequence = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface IssueProjectionEvidence {
  readonly externalIssueId: string;
  readonly externalIssueUrl: string;
  readonly remoteVersion: string;
  readonly projectionDigest: string;
}

export interface DrivePlanFreezeEvidence {
  readonly planAssetId: string;
  readonly planRevision: number;
  readonly vPairObligationsDigest: string;
  readonly branch: string;
  readonly baseSha: string;
}

export interface DriveVerificationEvidence {
  readonly profile: string;
  readonly testedCommit: string;
  readonly evidenceDigest: string;
  readonly verdict: "green";
}

export interface ReentryProposalEvidence {
  readonly targetAssetId: string;
  readonly targetRevision: number;
  readonly targetLayer: ForwardLayer;
  readonly targetState: string;
  readonly rationaleDigest: string;
}

export interface IntermediateTestEvidence {
  readonly profile: string;
  readonly command: string;
  readonly runner: string;
  readonly exitCode: 0;
  readonly evidenceDigest: string;
  readonly testedCommit: string;
}

export interface ReentryCertificateEvidence {
  readonly certificateId: string;
  readonly certificateDigest: string;
  readonly driveVerificationDigest: string;
  readonly intermediateEvidenceDigest: string;
  readonly originRevision: number;
  readonly targetRevision: number;
  readonly sourceCommit: string;
  readonly observedHead: string;
  readonly policyRevision: string;
}

export interface ForwardReentryEvidence {
  readonly certificateId: string;
  readonly certificateDigest: string;
  readonly acceptedPlanAssetId: string;
  readonly acceptedPlanRevision: number;
  readonly resumeLayer: ForwardLayer;
  readonly resumeState: string;
}

export interface PostReentryTestEvidence extends IntermediateTestEvidence {}

export interface DraftPrProjectionEvidence {
  readonly prNumber: number;
  readonly prNodeId: string;
  readonly baseSha: string;
  readonly headSha: string;
  readonly issueNumber: number;
  readonly planAssetId: string;
  readonly planRevision: number;
  readonly projectionDigest: string;
}

export interface CrossReviewEvidence {
  readonly reviewerRuntime: string;
  readonly reviewerModel: string;
  readonly authorRuntime: string;
  readonly authorModel: string;
  readonly verdict: "pass";
  readonly reviewDigest: string;
  readonly reviewedHead: string;
}

export interface MergeEvidence {
  readonly mergeSha: string;
  readonly baseSha: string;
  readonly requiredChecksDigest: string;
  readonly reconciledHead: string;
  readonly remoteObservationId: string;
}

export interface ClosureEvidence {
  readonly mainCiRunId: string;
  readonly mainCiCommit: string;
  readonly issueCloseObservationId: string;
  readonly outcome: string;
  readonly learningDigest: string;
  readonly upstreamAction: string;
}

export interface ConfirmIssueProjectionCommand extends ExecutionTransitionEnvelope {
  readonly type: "confirm_issue_projection";
  readonly expectedSequence: 4;
  readonly evidence: IssueProjectionEvidence;
}

export interface FreezeDrivePlanCommand extends ExecutionTransitionEnvelope {
  readonly type: "freeze_drive_plan";
  readonly expectedSequence: 5;
  readonly evidence: DrivePlanFreezeEvidence;
}

export interface RecordDriveVerificationCommand extends ExecutionTransitionEnvelope {
  readonly type: "record_drive_verification";
  readonly expectedSequence: 6;
  readonly evidence: DriveVerificationEvidence;
}

export interface ProposeReentryCommand extends ExecutionTransitionEnvelope {
  readonly type: "propose_reentry";
  readonly expectedSequence: 7;
  readonly evidence: ReentryProposalEvidence;
}

export interface RecordForwardIntermediateTestCommand extends ExecutionTransitionEnvelope {
  readonly type: "record_forward_intermediate_test";
  readonly expectedSequence: 8;
  readonly evidence: IntermediateTestEvidence;
}

export interface IssueReentryCertificateCommand extends ExecutionTransitionEnvelope {
  readonly type: "issue_reentry_certificate";
  readonly expectedSequence: 9;
  readonly evidence: ReentryCertificateEvidence;
}

export interface ReenterForwardCommand extends ExecutionTransitionEnvelope {
  readonly type: "reenter_forward";
  readonly expectedSequence: 10;
  readonly evidence: ForwardReentryEvidence;
}

export interface RecordPostReentryTestCommand extends ExecutionTransitionEnvelope {
  readonly type: "record_post_reentry_test";
  readonly expectedSequence: 11;
  readonly evidence: PostReentryTestEvidence;
}

export interface ConfirmDraftPrProjectionCommand extends ExecutionTransitionEnvelope {
  readonly type: "confirm_draft_pr_projection";
  readonly expectedSequence: 12;
  readonly evidence: DraftPrProjectionEvidence;
}

export interface AcceptCrossReviewCommand extends ExecutionTransitionEnvelope {
  readonly type: "accept_cross_review";
  readonly expectedSequence: 13;
  readonly evidence: CrossReviewEvidence;
}

export interface ConfirmMergeCommand extends ExecutionTransitionEnvelope {
  readonly type: "confirm_merge";
  readonly expectedSequence: 14;
  readonly evidence: MergeEvidence;
}

export interface CloseEpisodeCommand extends ExecutionTransitionEnvelope {
  readonly type: "close_episode";
  readonly expectedSequence: 15;
  readonly evidence: ClosureEvidence;
}

export type ExecutionEvidenceCommand =
  | ConfirmIssueProjectionCommand
  | FreezeDrivePlanCommand
  | RecordDriveVerificationCommand
  | ProposeReentryCommand
  | RecordForwardIntermediateTestCommand
  | IssueReentryCertificateCommand
  | ReenterForwardCommand
  | RecordPostReentryTestCommand
  | ConfirmDraftPrProjectionCommand
  | AcceptCrossReviewCommand
  | ConfirmMergeCommand
  | CloseEpisodeCommand;

export type ExecutionTransitionCommand =
  | ClassifyEscapeCommand
  | SelectDriveModelCommand
  | RequestIssueProjectionCommand
  | ExecutionEvidenceCommand;

export interface ExecutionTransitionEvent extends ExecutionEpisodeEvent {
  readonly eventId: string;
  readonly commandId: string;
  readonly commandPayloadDigest: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface DriveSelectionIntent {
  readonly episodeId: string;
  readonly selectionRevision: number;
  readonly selectedEventSequence: 2;
  readonly model: DriveModel;
  readonly compatibilityResult: "compatible" | "override_required";
  readonly rationaleDigest: string;
  readonly overrideUsed: boolean;
  readonly overrideActor: string | null;
  readonly overrideReason: string | null;
  readonly overrideEvidenceDigest: string | null;
  readonly selectedAt: string;
  readonly selectionDigest: string;
}

export interface IssueProjectionIntent {
  readonly outboxId: string;
  readonly episodeId: string;
  readonly sourceEventSequence: 3;
  readonly operationKind: "create";
  readonly objectKind: "issue";
  readonly repository: string;
  readonly targetLogicalKey: string;
  readonly intentRevision: number;
  readonly idempotencyKey: string;
  readonly payloadVersion: 1;
  readonly canonicalPayloadJson: string;
  readonly payloadDigest: string;
  readonly status: "pending";
  readonly attemptCount: 0;
  readonly nextAttemptAt: string;
  readonly createdAt: string;
}

export type ExecutionTransitionDecision =
  | {
      readonly ok: true;
      readonly events: readonly [ExecutionTransitionEvent];
      readonly selections: readonly DriveSelectionIntent[];
      readonly outbox: readonly IssueProjectionIntent[];
    }
  | { readonly ok: false; readonly violations: readonly EpisodeViolation[] };

export const EXECUTION_EPISODE_TRANSITIONS: readonly ExecutionEpisodeTransition[] = Object.freeze([
  transition("E0", "escape_observed", "classify_escape"),
  transition("E1", "escape_classified", "select_drive_model"),
  transition("E2", "drive_selected", "request_issue_projection"),
  transition("E3", "issue_requested", "confirm_issue_projection"),
  transition("E4", "issue_projected", "freeze_drive_plan"),
  transition("E5", "drive_plan_frozen", "record_drive_verification"),
  transition("E6", "drive_verified", "propose_reentry"),
  transition("E7", "reentry_proposed", "record_forward_intermediate_test"),
  transition("E8", "intermediate_verified", "issue_reentry_certificate"),
  transition("E9", "reentry_certified", "reenter_forward"),
  transition("E10", "forward_reentered", "record_post_reentry_test"),
  transition("E11", "post_reentry_verified", "confirm_draft_pr_projection"),
  transition("E12", "draft_pr_projected", "accept_cross_review"),
  transition("E13", "cross_review_approved", "confirm_merge"),
  transition("E14", "merged", "close_episode"),
  transition("E15", "closed_learned"),
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
      eventDigest: calculateExecutionEventDigest({
        episodeId: command.episodeId,
        sequence: 0,
        state: "E0",
        kind: "escape_observed",
        payloadDigest,
        previousEventDigest: null,
        occurredAt: command.occurredAt,
        actor: command.actor,
      }),
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
  const occurredAt = Date.parse(command.occurredAt);
  if (!Number.isFinite(occurredAt) || new Date(occurredAt).toISOString() !== command.occurredAt)
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

export function canonicalizeExecutionPayload(value: unknown): string {
  return canonical(value);
}

export function executionCommandPayloadDigest(value: unknown): string {
  return digest(canonical(value));
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

export function decideExecutionTransition(
  history: readonly ExecutionEpisodeEvent[],
  command: ExecutionTransitionCommand,
): ExecutionTransitionDecision {
  const reduction = reduceExecutionEpisode(history);
  if (!reduction.ok) return reduction;
  const root = history[0]?.payload;
  if (!isEscapePayload(root)) return transitionFailure("episode-event-integrity-invalid", "events[0]");
  if (command.episodeId !== root.episodeId)
    return transitionFailure("episode-identity-mismatch", "episodeId");
  if (command.expectedSequence !== history.length)
    return transitionFailure("episode-sequence-conflict", "expectedSequence");
  if (!reduction.snapshot.nextLegalCommands.includes(command.type))
    return transitionFailure("episode-transition-invalid", "type");
  const expected = EXECUTION_EPISODE_TRANSITIONS[command.expectedSequence];
  if (!expected) return transitionFailure("episode-transition-invalid", "type");
  const custody = validateTransitionCustody(root, command, history.at(-1));
  if (custody) return custody;

  const specific = validateSpecificTransition(root, command);
  if (specific) return specific;
  const payload = transitionPayload(root, command);
  const payloadDigest = digest(canonical(payload));
  const commandPayloadDigest = executionCommandPayloadDigest(command);
  const unsigned = {
    episodeId: command.episodeId,
    sequence: command.expectedSequence,
    state: expected.state,
    kind: expected.kind,
    payloadDigest,
    previousEventDigest: history.at(-1)?.eventDigest ?? null,
    occurredAt: command.occurredAt,
    actor: command.actor,
  };
  const eventDigest = calculateExecutionEventDigest(unsigned);
  const event: ExecutionTransitionEvent = Object.freeze({
    ...unsigned,
    eventId: `event:${digest(`execution-event-id:v1\0${eventDigest}`).slice(0, 32)}`,
    commandId: command.commandId,
    commandPayloadDigest,
    eventDigest,
    payload: deepFreeze(payload),
  });
  return Object.freeze({
    ok: true,
    events: Object.freeze([event]) as readonly [ExecutionTransitionEvent],
    selections: Object.freeze(
      command.type === "select_drive_model" ? [driveSelection(command)] : [],
    ),
    outbox:
      Object.freeze(
        command.type === "request_issue_projection" ? [issueProjection(root, command, event)] : [],
      ),
  });
}

function validateTransitionCustody(
  root: EscapeObservedPayload,
  command: ExecutionTransitionCommand,
  previous: ExecutionEpisodeEvent | undefined,
): ExecutionTransitionDecision | undefined {
  if (!/^command:[a-z0-9][a-z0-9:-]{2,127}$/.test(command.commandId))
    return transitionFailure("episode-command-id-invalid", "commandId");
  if (
    !/^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(command.sourceCommit) ||
    !/^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(command.observedHead) ||
    !command.policyRevision.trim() ||
    !command.actor.trim()
  )
    return transitionFailure("episode-custody-invalid", "command");
  const time = Date.parse(command.occurredAt);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== command.occurredAt)
    return transitionFailure("episode-time-invalid", "occurredAt");
  if (previous && time < Date.parse(previous.occurredAt))
    return transitionFailure("episode-time-regression", "occurredAt");
  if (
    command.sourceCommit !== root.sourceCommit ||
    command.policyRevision !== root.policyRevision ||
    (command.expectedSequence <= 3 && command.observedHead !== root.observedHead)
  )
    return transitionFailure("episode-custody-continuity-invalid", "command");
  return undefined;
}

function validateSpecificTransition(
  root: EscapeObservedPayload,
  command: ExecutionTransitionCommand,
): ExecutionTransitionDecision | undefined {
  if (command.type === "classify_escape") {
    if (command.escapeType !== root.escapeType)
      return transitionFailure("episode-escape-classification-mismatch", "escapeType");
    if (
      !command.classificationRuleRevision.trim() ||
      !command.verificationTarget.assetId.trim() ||
      !Number.isSafeInteger(command.verificationTarget.revision) ||
      command.verificationTarget.revision < 1 ||
      !validDigest(command.verificationTarget.statementDigest)
    )
      return transitionFailure("episode-verification-target-invalid", "verificationTarget");
    const target = command.verificationTarget;
    const matchesOrigin =
      target.assetId === root.origin.assetId && target.revision === root.origin.revision;
    const matchesReentry = Boolean(
      root.reentry &&
        target.assetId === root.reentry.assetId &&
        target.revision === root.reentry.revision,
    );
    if (!matchesOrigin && !matchesReentry)
      return transitionFailure("episode-verification-target-unbound", "verificationTarget");
  }
  if (command.type === "select_drive_model") {
    if (command.model !== root.requestedDriveModel)
      return transitionFailure("episode-drive-selection-mismatch", "model");
    if (!validDigest(command.rationaleDigest) || command.selectionRevision !== 1)
      return transitionFailure("episode-drive-selection-invalid", "selection");
    if (command.compatibilityResult === "override_required" && !command.override)
      return transitionFailure("episode-drive-override-required", "override");
    if (
      command.override &&
      (!command.override.actor.trim() ||
        !command.override.reason.trim() ||
        !validDigest(command.override.evidenceDigest))
    )
      return transitionFailure("episode-drive-override-invalid", "override");
    if (command.compatibilityResult === "compatible" && command.override)
      return transitionFailure("episode-drive-override-unexpected", "override");
  }
  if (command.type === "request_issue_projection") {
    if (command.repository !== root.issue.repository)
      return transitionFailure("episode-issue-repository-mismatch", "repository");
    if (
      command.intentRevision !== 1 ||
      command.labels.length === 0 ||
      new Set(command.labels).size !== command.labels.length ||
      command.labels.some(
        (label) =>
          !label.trim() || label !== label.trim() || label.length > 50 || isSecretLike(label),
      )
    )
      return transitionFailure("episode-issue-projection-invalid", "intent");
  }
  if ("evidence" in command) return validateEvidenceTransition(root, command);
  return undefined;
}

function validateEvidenceTransition(
  root: EscapeObservedPayload,
  command: ExecutionEvidenceCommand,
): ExecutionTransitionDecision | undefined {
  const evidence = command.evidence as unknown as Record<string, unknown>;
  const text = (key: string): string =>
    typeof evidence[key] === "string" ? (evidence[key] as string) : "";
  const positive = (key: string): boolean =>
    Number.isSafeInteger(evidence[key]) && Number(evidence[key]) > 0;
  const digestValue = (key: string): boolean => validDigest(text(key));
  const commitValue = (key: string): boolean => validCommit(text(key));
  const requiredText = (keys: readonly string[]): boolean =>
    keys.every((key) => text(key).trim().length > 0);

  if (command.type === "confirm_issue_projection") {
    if (
      !requiredText(["externalIssueId", "externalIssueUrl", "remoteVersion"]) ||
      !digestValue("projectionDigest")
    )
      return transitionFailure("episode-issue-projection-evidence-invalid", "evidence");
  }
  if (command.type === "freeze_drive_plan") {
    if (
      !requiredText(["planAssetId", "branch"]) ||
      !positive("planRevision") ||
      !digestValue("vPairObligationsDigest") ||
      !commitValue("baseSha")
    )
      return transitionFailure("episode-drive-plan-evidence-invalid", "evidence");
  }
  if (command.type === "record_drive_verification") {
    if (
      !requiredText(["profile", "testedCommit"]) ||
      !commitValue("testedCommit") ||
      !digestValue("evidenceDigest") ||
      evidence.verdict !== "green"
    )
      return transitionFailure("episode-drive-verification-evidence-invalid", "evidence");
  }
  if (command.type === "propose_reentry") {
    if (
      !requiredText(["targetAssetId", "targetLayer", "targetState"]) ||
      !positive("targetRevision") ||
      !validLayer(text("targetLayer")) ||
      !digestValue("rationaleDigest") ||
      !root.reentry ||
      text("targetAssetId") !== root.reentry.assetId ||
      Number(evidence.targetRevision) !== root.reentry.revision
    )
      return transitionFailure("episode-reentry-proposal-invalid", "evidence");
  }
  if (command.type === "record_forward_intermediate_test" || command.type === "record_post_reentry_test") {
    if (
      !requiredText(["profile", "command", "runner", "testedCommit"]) ||
      !commitValue("testedCommit") ||
      !digestValue("evidenceDigest") ||
      evidence.exitCode !== 0
    )
      return transitionFailure("episode-test-evidence-invalid", "evidence");
  }
  if (command.type === "issue_reentry_certificate") {
    if (
      !requiredText(["certificateId", "sourceCommit", "observedHead", "policyRevision"]) ||
      !digestValue("certificateDigest") ||
      !digestValue("driveVerificationDigest") ||
      !digestValue("intermediateEvidenceDigest") ||
      !positive("originRevision") ||
      !positive("targetRevision") ||
      !commitValue("sourceCommit") ||
      !commitValue("observedHead") ||
      text("sourceCommit") !== root.sourceCommit ||
      text("policyRevision") !== root.policyRevision ||
      Number(evidence.originRevision) !== root.origin.revision ||
      Number(evidence.targetRevision) !== root.reentry?.revision
    )
      return transitionFailure("episode-reentry-certificate-invalid", "evidence");
  }
  if (command.type === "reenter_forward") {
    if (
      !requiredText(["certificateId", "certificateDigest", "acceptedPlanAssetId", "resumeLayer", "resumeState"]) ||
      !positive("acceptedPlanRevision") ||
      !validLayer(text("resumeLayer")) ||
      !digestValue("certificateDigest") ||
      !root.reentry ||
      text("acceptedPlanAssetId") !== root.reentry.assetId ||
      Number(evidence.acceptedPlanRevision) !== root.reentry.revision
    )
      return transitionFailure("episode-forward-reentry-invalid", "evidence");
  }
  if (command.type === "confirm_draft_pr_projection") {
    if (
      !positive("prNumber") ||
      !requiredText(["prNodeId", "baseSha", "headSha", "planAssetId"]) ||
      !positive("issueNumber") ||
      !positive("planRevision") ||
      !commitValue("baseSha") ||
      !commitValue("headSha") ||
      !digestValue("projectionDigest")
    )
      return transitionFailure("episode-draft-pr-evidence-invalid", "evidence");
  }
  if (command.type === "accept_cross_review") {
    if (
      !requiredText(["reviewerRuntime", "reviewerModel", "authorRuntime", "authorModel", "reviewedHead"]) ||
      evidence.verdict !== "pass" ||
      !digestValue("reviewDigest") ||
      !commitValue("reviewedHead") ||
      (text("reviewerRuntime") === text("authorRuntime") &&
        text("reviewerModel") === text("authorModel")) ||
      text("reviewedHead") !== command.observedHead
    )
      return transitionFailure("episode-cross-review-evidence-invalid", "evidence");
  }
  if (command.type === "confirm_merge") {
    if (
      !requiredText(["mergeSha", "baseSha", "reconciledHead", "remoteObservationId"]) ||
      !commitValue("mergeSha") ||
      !commitValue("baseSha") ||
      !commitValue("reconciledHead") ||
      !digestValue("requiredChecksDigest") ||
      text("reconciledHead") !== command.observedHead
    )
      return transitionFailure("episode-merge-evidence-invalid", "evidence");
  }
  if (command.type === "close_episode") {
    if (
      !requiredText(["mainCiRunId", "mainCiCommit", "issueCloseObservationId", "outcome", "upstreamAction"]) ||
      !commitValue("mainCiCommit") ||
      !digestValue("learningDigest") ||
      text("mainCiCommit") !== command.observedHead
    )
      return transitionFailure("episode-closure-evidence-invalid", "evidence");
  }
  return undefined;
}

function transitionPayload(
  root: EscapeObservedPayload,
  command: ExecutionTransitionCommand,
): Readonly<Record<string, unknown>> {
  const common = {
    episodeId: command.episodeId,
    sourceCommit: command.sourceCommit,
    observedHead: command.observedHead,
    policyRevision: command.policyRevision,
    actor: command.actor,
  };
  if (command.type === "classify_escape")
    return {
      ...common,
      escapeType: command.escapeType,
      classificationRuleRevision: command.classificationRuleRevision,
      verificationTarget: { ...command.verificationTarget },
    };
  if (command.type === "select_drive_model")
    return {
      ...common,
      model: command.model,
      compatibilityResult: command.compatibilityResult,
      rationaleDigest: command.rationaleDigest,
      selectionRevision: command.selectionRevision,
      override: command.override ? { ...command.override } : undefined,
    };
  if (command.type !== "request_issue_projection")
    return {
      ...common,
      evidence: { ...command.evidence },
    };
  const projection = issueProjectionPayload(root, command);
  const projectionPayloadDigest = digest(canonical(projection));
  const identity = issueProjectionIdentity(command, projectionPayloadDigest);
  return {
    ...common,
    repository: command.repository,
    intentRevision: command.intentRevision,
    targetLogicalKey: `episode:${command.episodeId}:issue`,
    projectionPayloadDigest,
    idempotencyKey: identity.idempotencyKey,
  };
}

function driveSelection(command: SelectDriveModelCommand): DriveSelectionIntent {
  const value = {
    episodeId: command.episodeId,
    selectionRevision: command.selectionRevision,
    selectedEventSequence: 2 as const,
    model: command.model,
    compatibilityResult: command.compatibilityResult,
    rationaleDigest: command.rationaleDigest,
    overrideUsed: Boolean(command.override),
    overrideActor: command.override?.actor ?? null,
    overrideReason: command.override?.reason ?? null,
    overrideEvidenceDigest: command.override?.evidenceDigest ?? null,
    selectedAt: command.occurredAt,
  };
  return Object.freeze({ ...value, selectionDigest: digest(canonical(value)) });
}

function issueProjection(
  root: EscapeObservedPayload,
  command: RequestIssueProjectionCommand,
  event: ExecutionTransitionEvent,
): IssueProjectionIntent {
  const payload = issueProjectionPayload(root, command);
  const canonicalPayloadJson = canonical(payload);
  const payloadDigest = digest(canonicalPayloadJson);
  const { targetLogicalKey, idempotencyKey } = issueProjectionIdentity(command, payloadDigest);
  return Object.freeze({
    outboxId: `outbox:${digest(`github-outbox-id:v1\0${idempotencyKey}`).slice(0, 32)}`,
    episodeId: command.episodeId,
    sourceEventSequence: event.sequence as 3,
    operationKind: "create",
    objectKind: "issue",
    repository: command.repository,
    targetLogicalKey,
    intentRevision: command.intentRevision,
    idempotencyKey,
    payloadVersion: 1,
    canonicalPayloadJson,
    payloadDigest,
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: command.occurredAt,
    createdAt: command.occurredAt,
  });
}

function issueProjectionIdentity(
  command: RequestIssueProjectionCommand,
  payloadDigest: string,
): { readonly targetLogicalKey: string; readonly idempotencyKey: string } {
  const targetLogicalKey = `episode:${command.episodeId}:issue`;
  const identity = canonical({
    namespace: "github.issue.create.v1",
    repository: command.repository,
    episodeId: command.episodeId,
    targetLogicalKey,
    intentRevision: command.intentRevision,
    payloadDigest,
  });
  return Object.freeze({
    targetLogicalKey,
    idempotencyKey: digest(`github-outbox:v1\0${identity}`),
  });
}

function issueProjectionPayload(
  root: EscapeObservedPayload,
  command: RequestIssueProjectionCommand,
): Readonly<Record<string, unknown>> {
  return {
    schema: "github.issue.intent.v1",
    episodeId: command.episodeId,
    recurrenceId: root.recurrenceId,
    repository: command.repository,
    origin: root.origin,
    escape: { type: root.escapeType, reason: root.escapeReason },
    driveModel: root.requestedDriveModel,
    reentry: root.reentry,
    issue: { title: root.issue.title, bodyDigest: root.issue.bodyDigest },
    labels: [...new Set(command.labels)].sort((left, right) =>
      Buffer.compare(Buffer.from(left), Buffer.from(right)),
    ),
    sourceCommit: command.sourceCommit,
    observedHead: command.observedHead,
    policyRevision: command.policyRevision,
  };
}

function isEscapePayload(value: unknown): value is EscapeObservedPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<EscapeObservedPayload>;
  return Boolean(
    typeof payload.episodeId === "string" &&
      typeof payload.recurrenceId === "string" &&
      typeof payload.escapeType === "string" &&
      typeof payload.requestedDriveModel === "string" &&
      typeof payload.sourceCommit === "string" &&
      typeof payload.observedHead === "string" &&
      typeof payload.policyRevision === "string" &&
      payload.origin &&
      typeof payload.origin.assetId === "string" &&
      Number.isSafeInteger(payload.origin.revision) &&
      payload.reentry &&
      typeof payload.reentry.assetId === "string" &&
      Number.isSafeInteger(payload.reentry.revision) &&
      payload.issue &&
      typeof payload.issue.repository === "string" &&
      typeof payload.issue.title === "string" &&
      typeof payload.issue.bodyDigest === "string",
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function transitionFailure(ruleId: string, path: string): ExecutionTransitionDecision {
  return Object.freeze({
    ok: false,
    violations: Object.freeze([Object.freeze(rule(ruleId, path))]),
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

function validCommit(value: string): boolean {
  return /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
}

function validLayer(value: string): boolean {
  return /^L(?:[0-9]|1[0-4])$/.test(value);
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
  const reduction = reduceExecutionEpisode(events);
  if (!reduction.ok) return reduction;
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
