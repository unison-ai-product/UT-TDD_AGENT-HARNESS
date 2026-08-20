import { digestOf, eventDigest, reduceForward } from "./reducer.ts";
import {
  edgeFor,
  type ForwardEventName,
  type ForwardState,
  transitionFor,
} from "./transition-policy.ts";
import type {
  ForwardCommand,
  ForwardEvent,
  ForwardEvidenceContext,
  ForwardGuardVerdict,
  ForwardResult,
  ForwardSubject,
  ForwardTransition,
} from "./types.ts";

export class ForwardWorkflow {
  readonly subject: ForwardSubject;
  readonly events: readonly ForwardEvent[];
  readonly state: ForwardState;
  readonly digest: string;
  private readonly evidencePolicy?: ForwardEvidenceContext["evidencePolicy"];
  private constructor(
    subject: ForwardSubject,
    events: readonly ForwardEvent[],
    state: ForwardState,
    digest: string,
    evidencePolicy?: ForwardEvidenceContext["evidencePolicy"],
  ) {
    this.subject = subject;
    this.events = events;
    this.state = state;
    this.digest = digest;
    this.evidencePolicy = evidencePolicy;
  }

  static reconstruct(
    subject: ForwardSubject,
    events: readonly ForwardEvent[],
    evidencePolicy?: ForwardEvidenceContext["evidencePolicy"],
  ): ForwardResult<ForwardWorkflow> {
    const reduced = reduceForward(events);
    if (!reduced.ok) return reduced;
    if (
      !validSubject(subject) ||
      events.some(
        (event) =>
          event.subjectId !== subject.subjectId ||
          event.subjectRevision !== subject.subjectRevision ||
          event.sourceCommit !== subject.sourceCommit,
      )
    ) {
      return { ok: false, ruleId: "forward-ledger-unavailable", exitCode: 3 };
    }
    return {
      ok: true,
      value: new ForwardWorkflow(
        subject,
        Object.freeze([...events]),
        reduced.state,
        reduced.digest,
        evidencePolicy,
      ),
    };
  }

  explain(command: ForwardCommand, context: ForwardEvidenceContext = {}): ForwardGuardVerdict {
    const spec = transitionFor(command.event);
    if (!spec) return deny("forward-transition-illegal", 1, this.state, command.event, null);
    const evaluator = context.evidencePolicy ?? this.evidencePolicy;
    const evidence = evaluator?.evaluate(spec, this.subject, context.evidence ?? [], context) ?? {
      usable: spec.evidence.length === 0,
      required: spec.evidence.map((item) => item.requirementId),
      accepted: [],
      rejected: [],
    };
    if (!evidence.usable)
      return deny(spec.missingRule, 2, this.state, command.event, null, evidence);
    const edge = edgeFor(this.state, command.event);
    if (!edge || (command.expectedFrom !== undefined && command.expectedFrom !== this.state)) {
      return deny("forward-transition-illegal", 1, this.state, command.event, null, evidence);
    }
    if (
      command.event === "block" ||
      command.event === "supersede" ||
      command.event === "reject" ||
      command.event === "reopen" ||
      command.event === "resume"
    ) {
      if (!validException(command, this.subject))
        return deny(
          "forward-exception-context-missing",
          2,
          this.state,
          command.event,
          null,
          evidence,
        );
    }
    return {
      verdict: "allow",
      ruleId: "forward-transition-allowed",
      exitCode: 0,
      state: this.state,
      event: command.event,
      nextState: edge.to,
      ...evidence,
    };
  }

  transition(
    command: ForwardCommand,
    context: ForwardEvidenceContext = {},
  ): ForwardResult<ForwardTransition> {
    const verdict = this.explain(command, context);
    if (verdict.verdict === "deny")
      return { ok: false, ruleId: verdict.ruleId, exitCode: verdict.exitCode as 1 | 2 | 3 };
    const sequence = this.events.length + 1;
    const commandId =
      command.commandId?.trim() || `forward:${this.subject.subjectId}:${sequence}:${command.event}`;
    const evidenceIds = Object.freeze([...new Set(verdict.accepted)].sort(bytewise));
    const payload = {
      commandId,
      event: command.event,
      expectedFrom: command.expectedFrom ?? this.state,
      subject: this.subject,
      evidenceIds,
      exceptionContext: command.exceptionContext ?? null,
    };
    const eventWithoutDigest: Omit<ForwardEvent, "digest"> = {
      ...this.subject,
      eventId: `forward-event:${this.subject.subjectId}:${this.subject.subjectRevision}:${sequence}`,
      commandId,
      sequence,
      event: command.event,
      fromState: this.state,
      toState: verdict.nextState as ForwardState,
      evidenceIds,
      payloadDigest: digestOf(payload),
      ...(command.exceptionContext ? { exceptionContext: command.exceptionContext } : {}),
    };
    const event = Object.freeze({ ...eventWithoutDigest, digest: eventDigest(eventWithoutDigest) });
    const nextDigest = digestOf({
      state: event.toState,
      eventDigests: this.events.map((item) => item.digest).concat(event.digest),
    });
    return { ok: true, value: { event, nextState: event.toState, digest: nextDigest } };
  }
}

function validSubject(subject: ForwardSubject): boolean {
  return Boolean(
    subject.subjectId.trim() &&
      /^[a-f0-9]{40,64}$/i.test(subject.sourceCommit) &&
      Number.isSafeInteger(subject.subjectRevision) &&
      subject.subjectRevision > 0,
  );
}

function validException(command: ForwardCommand, subject: ForwardSubject): boolean {
  const context = command.exceptionContext;
  return Boolean(
    context &&
      context.action === command.event &&
      context.actor.trim() &&
      context.reason.trim() &&
      context.subjectRevision === subject.subjectRevision &&
      context.sourceCommit === subject.sourceCommit &&
      (command.event !== "supersede" || context.replacementSubjectId?.trim()),
  );
}

function deny(
  ruleId: string,
  exitCode: 1 | 2 | 3,
  state: ForwardState,
  event: ForwardEventName,
  nextState: ForwardState | null,
  evidence: Partial<ForwardGuardVerdict> = {},
): ForwardGuardVerdict {
  return {
    verdict: "deny",
    ruleId,
    exitCode,
    state,
    event,
    nextState,
    required: [],
    accepted: [],
    rejected: [],
    usable: false,
    ...evidence,
  };
}

function bytewise(left: string, right: string): number {
  return Buffer.from(left).compare(Buffer.from(right));
}
