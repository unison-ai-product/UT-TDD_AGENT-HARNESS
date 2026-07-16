import { describe, expect, it } from "vitest";
import {
  type DraftArtifact,
  type DraftJournalEntry,
  type DraftJournalPort,
  type DraftLedgerPort,
  type DraftPublisherPort,
  type DraftPublishToken,
  type PlanDraftCommand,
  PlanDraftConflictError,
  PlanDraftRecoveryRequiredError,
  PlanDraftService,
} from "../src/plan-admission/plan-draft-service";

type Payload = { planId: string };
type Receipt = {
  assetId: string;
  revision: number;
  certificateId: string;
  commandPayloadDigest: string;
};

const command: PlanDraftCommand<Payload> = {
  commandId: "cmd-1",
  commandPayloadDigest: "sha256:payload",
  planId: "PLAN-L7-999",
  recordedAt: "2026-07-15T00:00:00.000Z",
  payload: { planId: "PLAN-L7-999" },
  source: { path: "docs/plans/PLAN-L7-999.md", content: "source" },
  projectionPath: "docs/governance/plan-admission-receipts.json",
};

const receipt = (digest = command.commandPayloadDigest): Receipt => ({
  assetId: "asset-1",
  revision: 1,
  certificateId: "certificate-1",
  commandPayloadDigest: digest,
});

class Journal implements DraftJournalPort<Receipt> {
  entry?: DraftJournalEntry<Receipt>;
  failCommit = false;

  constructor(private readonly events: string[]) {}

  find(): DraftJournalEntry<Receipt> | undefined {
    this.events.push("journal.find");
    return this.entry;
  }

  recordIntent(intent: { payloadDigest: string }): void {
    this.events.push("journal.intent");
    this.entry = { status: "intent", payloadDigest: intent.payloadDigest };
  }

  commit(_id: string, digest: string, committedReceipt: Receipt): void {
    this.events.push("journal.commit");
    if (this.failCommit) throw new Error("journal commit failed");
    this.entry = { status: "committed", payloadDigest: digest, receipt: committedReceipt };
  }

  markRecoveryRequired(_id: string, digest: string, reason: string): void {
    this.events.push(`journal.recovery:${reason}`);
    this.entry = { status: "recovery_required", payloadDigest: digest };
  }
}

class Publisher implements DraftPublisherPort {
  failRestore = false;

  constructor(private readonly events: string[]) {}

  stage(artifacts: readonly DraftArtifact[]): DraftPublishToken {
    this.events.push(`publisher.stage:${artifacts.map((item) => item.path).join(",")}`);
    return { id: "staged" };
  }

  publish(): void {
    this.events.push("publisher.publish");
  }

  restore(): void {
    this.events.push("publisher.restore");
    if (this.failRestore) throw new Error("restore failed");
  }

  finalize(): void {
    this.events.push("publisher.finalize");
  }
}

function fixture(options: { ledgerFailure?: boolean; preparedDigest?: string } = {}) {
  const events: string[] = [];
  const journal = new Journal(events);
  const publisher = new Publisher(events);
  const ledger: DraftLedgerPort<Payload, Receipt> = {
    transact: (_command, onPrepared) => {
      events.push("ledger.begin");
      const prepared = receipt(options.preparedDigest);
      onPrepared(prepared);
      if (options.ledgerFailure) {
        events.push("ledger.rollback");
        throw new Error("ledger failed");
      }
      events.push("ledger.commit");
      return prepared;
    },
  };
  const service = new PlanDraftService({
    validator: { validate: () => events.push("validator.validate") },
    journal,
    publisher,
    renderer: {
      render: (draftCommand, prepared) => {
        events.push("renderer.render");
        return [
          draftCommand.source,
          { path: draftCommand.projectionPath, content: prepared.certificateId },
        ];
      },
    },
    ledger,
  });
  return { events, journal, publisher, service };
}

describe("PlanDraftService", () => {
  it("U-PADM-023: intentからledger/file公開、journal commit、finalizeまでを設計順に実行する", () => {
    const f = fixture();

    expect(f.service.execute(command)).toEqual({ status: "created", receipt: receipt() });
    expect(f.events).toEqual([
      "validator.validate",
      "journal.find",
      "journal.intent",
      "ledger.begin",
      "renderer.render",
      "publisher.stage:docs/plans/PLAN-L7-999.md,docs/governance/plan-admission-receipts.json",
      "publisher.publish",
      "ledger.commit",
      "journal.commit",
      "publisher.finalize",
    ]);
  });

  it("U-PADM-024: committed commandを副作用なしでreplayする", () => {
    const f = fixture();
    f.journal.entry = {
      status: "committed",
      payloadDigest: command.commandPayloadDigest,
      receipt: receipt(),
    };

    expect(f.service.execute(command)).toEqual({ status: "replayed", receipt: receipt() });
    expect(f.events).toEqual(["validator.validate", "journal.find"]);
  });

  it("U-PADM-025: 同じcommand idの異なるdigestを副作用前にfail-closeする", () => {
    const f = fixture();
    f.journal.entry = {
      status: "committed",
      payloadDigest: "sha256:other",
      receipt: receipt("sha256:other"),
    };

    expect(() => f.service.execute(command)).toThrow(PlanDraftConflictError);
    expect(f.events).toEqual(["validator.validate", "journal.find"]);
  });

  it("U-PADM-026: ledger failureでは公開ファイルをrestoreしてrecovery_requiredにする", () => {
    const f = fixture({ ledgerFailure: true });

    expect(() => f.service.execute(command)).toThrow(PlanDraftRecoveryRequiredError);
    expect(f.events).toEqual([
      "validator.validate",
      "journal.find",
      "journal.intent",
      "ledger.begin",
      "renderer.render",
      "publisher.stage:docs/plans/PLAN-L7-999.md,docs/governance/plan-admission-receipts.json",
      "publisher.publish",
      "ledger.rollback",
      "publisher.restore",
      "journal.recovery:draft失敗。artifactはrestore済み: ledger failed",
    ]);
    expect(f.journal.entry?.status).toBe("recovery_required");
  });

  it("U-PADM-027: journal commit failureでは確定済みDB/fileを戻さずrecovery_requiredにする", () => {
    const f = fixture();
    f.journal.failCommit = true;

    expect(() => f.service.execute(command)).toThrow(PlanDraftRecoveryRequiredError);
    expect(f.events).toEqual([
      "validator.validate",
      "journal.find",
      "journal.intent",
      "ledger.begin",
      "renderer.render",
      "publisher.stage:docs/plans/PLAN-L7-999.md,docs/governance/plan-admission-receipts.json",
      "publisher.publish",
      "ledger.commit",
      "journal.commit",
      "journal.recovery:ledger/file公開後にjournal commit失敗: journal commit failed",
    ]);
    expect(f.events).not.toContain("publisher.restore");
    expect(f.events).not.toContain("publisher.finalize");
  });

  it("U-PADM-059: ledger receiptのdigest不一致を公開前にfail-closeしてrecovery_requiredにする", () => {
    const f = fixture({ preparedDigest: "sha256:other" });

    expect(() => f.service.execute(command)).toThrow(PlanDraftRecoveryRequiredError);
    expect(f.events).toEqual([
      "validator.validate",
      "journal.find",
      "journal.intent",
      "ledger.begin",
      "journal.recovery:draft失敗。artifact変更なし: ledger receiptのcommand digestがintentと一致しません",
    ]);
  });

  it("U-PADM-060: restore失敗を記録し、次回の自動再実行を拒否する", () => {
    const f = fixture({ ledgerFailure: true });
    f.publisher.failRestore = true;

    expect(() => f.service.execute(command)).toThrow(/restoreにも失敗/);
    const firstRun = [...f.events];
    expect(() => f.service.execute(command)).toThrow(/自動再実行できません/);
    expect(f.events.slice(firstRun.length)).toEqual(["validator.validate", "journal.find"]);
  });
});
