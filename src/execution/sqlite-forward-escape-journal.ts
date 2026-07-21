import { createHash, randomUUID } from "node:crypto";
import type { HarnessDb } from "../state-db/index.js";
import type {
  DurableIssueProjectionEvent,
  ForwardEscapeCustodyPort,
  ForwardEscapeProjectionJournal,
  ForwardEscapeValidationCertificate,
  ValidatedForwardEscape,
} from "./forward-escape.js";
import { DURABLE_PROJECTION_FAILURE_REASONS } from "./forward-escape.js";

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export class ForwardEscapeJournalIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForwardEscapeJournalIntegrityError";
  }
}

const SHA256 = /^[a-f0-9]{64}$/;
const FAILURE_REASONS = new Set<string>(DURABLE_PROJECTION_FAILURE_REASONS);

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseProjectionEvent(raw: string, commandId: string): DurableIssueProjectionEvent {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new ForwardEscapeJournalIntegrityError("projection-journal-event-invalid");
  }
  const event = record(value);
  if (!event || event.command_id !== commandId || !nonEmpty(event.type)) {
    throw new ForwardEscapeJournalIntegrityError("projection-journal-event-invalid");
  }
  const commonValid = nonEmpty(event.payload_digest) && SHA256.test(event.payload_digest);
  if (event.type === "IssueProjectionQueued") {
    if (
      !commonValid ||
      !exactKeys(event, ["type", "command_id", "payload_digest", "repository", "body_digest"]) ||
      !nonEmpty(event.repository) ||
      !nonEmpty(event.body_digest) ||
      !SHA256.test(event.body_digest)
    ) {
      throw new ForwardEscapeJournalIntegrityError("projection-journal-event-invalid");
    }
  } else if (event.type === "IssueProjectionDeferred") {
    if (
      !commonValid ||
      !exactKeys(event, ["type", "command_id", "payload_digest", "reason"]) ||
      !nonEmpty(event.reason) ||
      !FAILURE_REASONS.has(event.reason)
    ) {
      throw new ForwardEscapeJournalIntegrityError("projection-journal-event-invalid");
    }
  } else if (event.type === "IssueProjected") {
    const binding = record(event.binding);
    if (
      !commonValid ||
      !exactKeys(event, ["type", "command_id", "payload_digest", "binding"]) ||
      !binding ||
      !exactKeys(binding, [
        "repository",
        "issue_number",
        "node_id",
        "url",
        "body_digest",
        "observed_revision",
      ]) ||
      !nonEmpty(binding.repository) ||
      !Number.isSafeInteger(binding.issue_number) ||
      Number(binding.issue_number) <= 0 ||
      !nonEmpty(binding.node_id) ||
      !nonEmpty(binding.url) ||
      !nonEmpty(binding.body_digest) ||
      !SHA256.test(binding.body_digest) ||
      !nonEmpty(binding.observed_revision)
    ) {
      throw new ForwardEscapeJournalIntegrityError("projection-journal-event-invalid");
    }
  } else {
    throw new ForwardEscapeJournalIntegrityError("projection-journal-event-invalid");
  }
  if (JSON.stringify(value) !== raw) {
    throw new ForwardEscapeJournalIntegrityError("projection-journal-event-noncanonical");
  }
  return Object.freeze(value as DurableIssueProjectionEvent);
}

function assertProjectionFsm(events: readonly DurableIssueProjectionEvent[]): void {
  if (events.length === 0) return;
  const queued = events[0];
  if (queued.type !== "IssueProjectionQueued") {
    throw new ForwardEscapeJournalIntegrityError("projection-journal-sequence-invalid");
  }
  let projected = false;
  for (const [index, event] of events.entries()) {
    if (
      event.command_id !== queued.command_id ||
      event.payload_digest !== queued.payload_digest ||
      (index > 0 && event.type === "IssueProjectionQueued") ||
      projected
    ) {
      throw new ForwardEscapeJournalIntegrityError("projection-journal-sequence-invalid");
    }
    if (event.type === "IssueProjected") {
      if (
        event.binding.repository !== queued.repository ||
        event.binding.body_digest !== queued.body_digest
      ) {
        throw new ForwardEscapeJournalIntegrityError("projection-journal-binding-invalid");
      }
      projected = true;
    }
  }
}

/**
 * E2 custodyとE3/E4 outboxを同じSQLite境界へ永続化するadapter。
 * event rowはcommand単位のdigest chainで、close/open後も改変をfail-closeする。
 */
export class SqliteForwardEscapeJournal
  implements ForwardEscapeProjectionJournal, ForwardEscapeCustodyPort
{
  constructor(private readonly db: HarnessDb) {
    // DDLはHARNESS_DB_TABLES/SCHEMA_VERSION/migrateだけが所有する。
  }

  issue(input: {
    readonly command_id: string;
    readonly payload_digest: string;
  }): ForwardEscapeValidationCertificate {
    const existing = this.db
      .prepare(
        `SELECT certificate_id, payload_digest, event_digest
         FROM forward_escape_validation_certificates WHERE command_id = ?`,
      )
      .get(input.command_id);
    if (existing) {
      if (String(existing.payload_digest) !== input.payload_digest) {
        throw new ForwardEscapeJournalIntegrityError("e2-command-payload-mismatch");
      }
      return {
        certificate_id: String(existing.certificate_id),
        event_digest: String(existing.event_digest),
      };
    }
    const certificateId = randomUUID();
    const eventDigest = digest({
      type: "ForwardEscapeValidated",
      sequence: "E2",
      command_id: input.command_id,
      payload_digest: input.payload_digest,
      certificate_id: certificateId,
    });
    this.db
      .prepare(
        `INSERT INTO forward_escape_validation_certificates
         (certificate_id, command_id, payload_digest, event_digest) VALUES (?, ?, ?, ?)`,
      )
      .run(certificateId, input.command_id, input.payload_digest, eventDigest);
    return { certificate_id: certificateId, event_digest: eventDigest };
  }

  verify(event: ValidatedForwardEscape): boolean {
    const row = this.db
      .prepare(
        `SELECT certificate_id, command_id, payload_digest, event_digest
         FROM forward_escape_validation_certificates WHERE certificate_id = ?`,
      )
      .get(event.certificate.certificate_id);
    if (!row) return false;
    const expected = digest({
      type: "ForwardEscapeValidated",
      sequence: "E2",
      command_id: String(row.command_id),
      payload_digest: String(row.payload_digest),
      certificate_id: String(row.certificate_id),
    });
    return (
      String(row.command_id) === event.command.command_id &&
      String(row.payload_digest) === event.payload_digest &&
      String(row.event_digest) === expected &&
      String(row.event_digest) === event.certificate.event_digest
    );
  }

  append(event: DurableIssueProjectionEvent): {
    readonly durable: true;
    readonly event_digest: string;
  } {
    // eventsFor performs the chain audit before extending it.
    this.eventsFor(event.command_id);
    const prior = this.db
      .prepare(
        `SELECT sequence, event_digest FROM forward_escape_projection_events
         WHERE command_id = ? ORDER BY sequence DESC LIMIT 1`,
      )
      .get(event.command_id);
    const sequence = Number(prior?.sequence ?? 0) + 1;
    const previous = prior ? String(prior.event_digest) : null;
    const eventJson = JSON.stringify(event);
    const eventDigest = digest({
      command_id: event.command_id,
      sequence,
      event_json: eventJson,
      previous_event_digest: previous,
    });
    this.db
      .prepare(
        `INSERT INTO forward_escape_projection_events
         (command_id, sequence, event_json, previous_event_digest, event_digest)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(event.command_id, sequence, eventJson, previous, eventDigest);
    return { durable: true, event_digest: eventDigest };
  }

  eventsFor(commandId: string): readonly DurableIssueProjectionEvent[] {
    const rows = this.db
      .prepare(
        `SELECT command_id, sequence, event_json, previous_event_digest, event_digest
         FROM forward_escape_projection_events WHERE command_id = ? ORDER BY sequence`,
      )
      .all(commandId);
    let previous: string | null = null;
    const events = rows.map((row, index) => {
      if (Number(row.sequence) !== index + 1 || (row.previous_event_digest ?? null) !== previous) {
        throw new ForwardEscapeJournalIntegrityError("projection-journal-chain-invalid");
      }
      const expected = digest({
        command_id: String(row.command_id),
        sequence: Number(row.sequence),
        event_json: String(row.event_json),
        previous_event_digest: previous,
      });
      if (String(row.event_digest) !== expected) {
        throw new ForwardEscapeJournalIntegrityError("projection-journal-digest-invalid");
      }
      const event = parseProjectionEvent(String(row.event_json), commandId);
      previous = String(row.event_digest);
      return event;
    });
    assertProjectionFsm(events);
    return events;
  }
}
