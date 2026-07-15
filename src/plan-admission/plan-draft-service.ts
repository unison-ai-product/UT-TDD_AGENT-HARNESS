export interface PlanDraftCommand<TPayload> {
  commandId: string;
  commandPayloadDigest: string;
  planId: string;
  recordedAt: string;
  payload: TPayload;
  source: DraftArtifact;
  projectionPath: string;
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

export interface DraftJournalPort<TReceipt extends DraftReceiptBinding> {
  find(commandId: string): DraftJournalEntry<TReceipt> | undefined;
  recordIntent(command: DraftJournalCommand): void;
  commit(commandId: string, payloadDigest: string, receipt: TReceipt): void;
  markRecoveryRequired(commandId: string, payloadDigest: string, reason: string): void;
}

export interface DraftJournalCommand {
  commandId: string;
  payloadDigest: string;
  planId: string;
  sourcePath: string;
  recordedAt: string;
}

export interface DraftReceiptBinding {
  assetId: string;
  revision: number;
  certificateId: string;
  commandPayloadDigest: string;
  certificateDigest?: string;
}

export interface DraftPublishToken {
  readonly id: string;
}

export interface DraftPublisherPort {
  stage(artifacts: readonly DraftArtifact[]): DraftPublishToken;
  publish(token: DraftPublishToken): void;
  restore(token: DraftPublishToken): void;
  finalize(token: DraftPublishToken): void;
}

export interface DraftArtifactRendererPort<TPayload, TReceipt extends DraftReceiptBinding> {
  render(
    command: PlanDraftCommand<TPayload>,
    receipt: TReceipt,
  ): readonly [DraftArtifact, DraftArtifact];
}

export interface DraftLedgerPort<TPayload, TReceipt extends DraftReceiptBinding> {
  transact(command: PlanDraftCommand<TPayload>, onPrepared: (receipt: TReceipt) => void): TReceipt;
}

export interface PlanDraftServicePorts<TPayload, TReceipt extends DraftReceiptBinding> {
  validator: DraftValidationPort<TPayload>;
  journal: DraftJournalPort<TReceipt>;
  publisher: DraftPublisherPort;
  renderer: DraftArtifactRendererPort<TPayload, TReceipt>;
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
export class PlanDraftService<TPayload, TReceipt extends DraftReceiptBinding> {
  constructor(private readonly ports: PlanDraftServicePorts<TPayload, TReceipt>) {}

  execute(command: PlanDraftCommand<TPayload>): PlanDraftResult<TReceipt> {
    this.ports.validator.validate(command);
    const replay = this.resolveReplay(command);
    if (replay) return replay;

    this.ports.journal.recordIntent({
      commandId: command.commandId,
      payloadDigest: command.commandPayloadDigest,
      planId: command.planId,
      sourcePath: command.source.path,
      recordedAt: command.recordedAt,
    });
    let token: DraftPublishToken | undefined;
    let receipt: TReceipt;
    try {
      receipt = this.ports.ledger.transact(command, (prepared) => {
        if (prepared.commandPayloadDigest !== command.commandPayloadDigest) {
          throw new PlanDraftConflictError("ledger receiptのcommand digestがintentと一致しません");
        }
        token = this.ports.publisher.stage(this.ports.renderer.render(command, prepared));
        this.ports.publisher.publish(token);
      });
    } catch (cause) {
      this.recover(command, token, cause);
    }
    try {
      this.ports.journal.commit(command.commandId, command.commandPayloadDigest, receipt);
    } catch (cause) {
      this.markCommittedRecovery(command, cause);
    }
    if (token) this.ports.publisher.finalize(token);
    return { status: "created", receipt };
  }

  private resolveReplay(
    command: PlanDraftCommand<TPayload>,
  ): PlanDraftResult<TReceipt> | undefined {
    const existing = this.ports.journal.find(command.commandId);
    if (!existing) return undefined;
    if (existing.payloadDigest !== command.commandPayloadDigest) {
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
      : token
        ? `draft失敗。artifactはrestore済み: ${errorText(cause)}`
        : `draft失敗。artifact変更なし: ${errorText(cause)}`;
    try {
      this.ports.journal.markRecoveryRequired(
        command.commandId,
        command.commandPayloadDigest,
        reason,
      );
    } catch (journalFailure) {
      const journalDetail = errorText(journalFailure);
      throw new PlanDraftRecoveryRequiredError(
        `${reason}; recovery_requiredの記録にも失敗: ${journalDetail}`,
        { cause },
      );
    }
    throw new PlanDraftRecoveryRequiredError(reason, { cause });
  }

  private markCommittedRecovery(command: PlanDraftCommand<TPayload>, cause: unknown): never {
    const reason = `ledger/file公開後にjournal commit失敗: ${errorText(cause)}`;
    try {
      this.ports.journal.markRecoveryRequired(
        command.commandId,
        command.commandPayloadDigest,
        reason,
      );
    } catch (journalFailure) {
      // convert: 二次journal障害を元cause付きrecovery errorへ変換する。
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
