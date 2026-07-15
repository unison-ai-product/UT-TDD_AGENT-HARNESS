export interface PlanDraftCommand<TPayload> {
  commandId: string;
  payloadDigest: string;
  payload: TPayload;
  source: DraftArtifact;
  projection: DraftArtifact;
}

export interface DraftArtifact {
  path: string;
  content: string;
}

export interface DraftValidationPort<TPayload> {
  validate(command: PlanDraftCommand<TPayload>): void;
}

export type DraftJournalEntry<TReceipt> =
  | { status: "intent" | "recovery_required"; payloadDigest: string }
  | { status: "committed"; payloadDigest: string; receipt: TReceipt };

export interface DraftJournalPort<TReceipt> {
  find(commandId: string): DraftJournalEntry<TReceipt> | undefined;
  recordIntent(commandId: string, payloadDigest: string): void;
  commit(commandId: string, payloadDigest: string, receipt: TReceipt): void;
  markRecoveryRequired(commandId: string, payloadDigest: string, reason: string): void;
}

export interface DraftPublishToken {
  readonly id: string;
}

export interface DraftPublisherPort {
  stage(artifacts: readonly DraftArtifact[]): DraftPublishToken;
  publish(token: DraftPublishToken): void;
  restore(token: DraftPublishToken): void;
}

export interface DraftLedgerPort<TPayload, TReceipt> {
  append(command: PlanDraftCommand<TPayload>): TReceipt;
}

export interface PlanDraftServicePorts<TPayload, TReceipt> {
  validator: DraftValidationPort<TPayload>;
  journal: DraftJournalPort<TReceipt>;
  publisher: DraftPublisherPort;
  ledger: DraftLedgerPort<TPayload, TReceipt>;
}

export type PlanDraftResult<TReceipt> =
  | { status: "created"; receipt: TReceipt }
  | { status: "replayed"; receipt: TReceipt };

export class PlanDraftConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanDraftConflictError";
  }
}

export class PlanDraftRecoveryRequiredError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PlanDraftRecoveryRequiredError";
  }
}

/**
 * Markdown/投影とSQLiteを跨ぐ起票をdurable journalで直列化する。
 * portの実装はstage時点で既存内容を退避し、restoreを冪等にしなければならない。
 */
export class PlanDraftService<TPayload, TReceipt> {
  constructor(private readonly ports: PlanDraftServicePorts<TPayload, TReceipt>) {}

  execute(command: PlanDraftCommand<TPayload>): PlanDraftResult<TReceipt> {
    this.ports.validator.validate(command);
    const replay = this.resolveReplay(command);
    if (replay) return replay;

    this.ports.journal.recordIntent(command.commandId, command.payloadDigest);
    let token: DraftPublishToken | undefined;
    try {
      token = this.ports.publisher.stage([command.source, command.projection]);
      this.ports.publisher.publish(token);
      const receipt = this.ports.ledger.append(command);
      this.ports.journal.commit(command.commandId, command.payloadDigest, receipt);
      return { status: "created", receipt };
    } catch (cause) {
      this.recover(command, token, cause);
    }
  }

  private resolveReplay(
    command: PlanDraftCommand<TPayload>,
  ): PlanDraftResult<TReceipt> | undefined {
    const existing = this.ports.journal.find(command.commandId);
    if (!existing) return undefined;
    if (existing.payloadDigest !== command.payloadDigest) {
      throw new PlanDraftConflictError("command_idは異なるpayload_digestで使用済みです");
    }
    if (existing.status === "committed") {
      return { status: "replayed", receipt: existing.receipt };
    }
    throw new PlanDraftRecoveryRequiredError(
      `command_id=${command.commandId} は ${existing.status} のため自動再実行できません`,
    );
  }

  private recover(
    command: PlanDraftCommand<TPayload>,
    token: DraftPublishToken | undefined,
    cause: unknown,
  ): never {
    let restoreFailure: unknown;
    if (token) {
      try {
        this.ports.publisher.restore(token);
      } catch (error) {
        restoreFailure = error;
      }
    }
    const reason = restoreFailure
      ? `draft失敗後のrestoreにも失敗: ${errorText(restoreFailure)}`
      : `draft失敗。artifactはrestore済み: ${errorText(cause)}`;
    try {
      this.ports.journal.markRecoveryRequired(command.commandId, command.payloadDigest, reason);
    } catch (journalFailure) {
      const journalDetail = errorText(journalFailure);
      throw new PlanDraftRecoveryRequiredError(
        `${reason}; recovery_requiredの記録にも失敗: ${journalDetail}`,
        { cause },
      );
    }
    throw new PlanDraftRecoveryRequiredError(reason, { cause });
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
