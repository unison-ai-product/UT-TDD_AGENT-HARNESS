import { createHash } from "node:crypto";

export type DriveModel =
  | "discovery"
  | "scrum"
  | "reverse"
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
}

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
}

const DRIVE_MODELS = new Set<string>([
  "discovery",
  "scrum",
  "reverse",
  "recovery",
  "incident",
  "refactor",
  "retrofit",
  "add-feature",
  "research",
  "design-bottomup",
  "version-up",
]);

export function classifyForwardBoundary(input: {
  readonly routeMode: string;
  readonly escapeType: string | null;
}): { readonly kind: "inside_forward" | "forward_escape"; readonly requiresEpisode: boolean } {
  return input.routeMode === "forward"
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
    const eventSeed = canonical({
      episodeId: command.episodeId,
      sequence: 0,
      commandId: command.commandId,
      commandPayloadDigest,
      kind: "escape_observed",
    });
    const event: EscapeObservedEvent = Object.freeze({
      eventId: `event:${digest(eventSeed).slice(0, 32)}`,
      episodeId: command.episodeId,
      sequence: 0,
      state: "E0",
      kind: "escape_observed",
      commandId: command.commandId,
      commandPayloadDigest,
      payloadDigest: digest(canonicalCommand(command)),
      previousEventDigest: null,
      eventDigest: digest(eventSeed),
      occurredAt: command.occurredAt,
    });
    const episode = new ExecutionEpisode(event, command.commandId, commandPayloadDigest);
    return { ok: true, status: "accepted", episode, events: [event], outbox: [] };
  }

  get snapshot(): ExecutionEpisodeSnapshot {
    return Object.freeze({
      episodeId: this.event.episodeId,
      state: "E0",
      eventSequence: 0,
      lastEventDigest: this.event.eventDigest,
      nextLegalCommands: ["classify_escape"] as const,
    });
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
  if (command.origin.revision !== command.origin.observedRevision)
    return [rule("episode-origin-stale", "origin.observedRevision")];
  if (!command.reentry) return [rule("episode-reentry-required", "reentry")];
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
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
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
