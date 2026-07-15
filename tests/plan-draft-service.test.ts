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

type Receipt = { receiptId: string };
const command: PlanDraftCommand<{ planId: string }> = {
  commandId: "cmd-1",
  payloadDigest: "sha256:payload",
  payload: { planId: "PLAN-L7-999" },
  source: { path: "docs/plans/PLAN-L7-999.md", content: "source" },
  projection: { path: "docs/governance/plan-admission-receipts.json", content: "projection" },
};

class Journal implements DraftJournalPort<Receipt> {
  entry?: DraftJournalEntry<Receipt>;
  events: string[] = [];
  find(): DraftJournalEntry<Receipt> | undefined {
    return this.entry;
  }
  recordIntent(_id: string, digest: string): void {
    this.events.push("intent");
    this.entry = { status: "intent", payloadDigest: digest };
  }
  commit(_id: string, digest: string, receipt: Receipt): void {
    this.events.push("commit");
    this.entry = { status: "committed", payloadDigest: digest, receipt };
  }
  markRecoveryRequired(_id: string, digest: string, reason: string): void {
    this.events.push(`recovery:${reason}`);
    this.entry = { status: "recovery_required", payloadDigest: digest };
  }
}

class Publisher implements DraftPublisherPort {
  events: string[] = [];
  failAt?: "stage" | "publish" | "restore";
  stage(artifacts: readonly DraftArtifact[]): DraftPublishToken {
    this.events.push(`stage:${artifacts.map((item) => item.path).join(",")}`);
    if (this.failAt === "stage") throw new Error("stage failed");
    return { id: "staged" };
  }
  publish(): void {
    this.events.push("publish");
    if (this.failAt === "publish") throw new Error("publish failed");
  }
  restore(): void {
    this.events.push("restore");
    if (this.failAt === "restore") throw new Error("restore failed");
  }
}

function fixture() {
  const events: string[] = [];
  const journal = new Journal();
  const publisher = new Publisher();
  const ledger: DraftLedgerPort<{ planId: string }, Receipt> = {
    append: () => {
      events.push("ledger");
      return { receiptId: "receipt-1" };
    },
  };
  const service = new PlanDraftService({
    validator: { validate: () => events.push("validate") },
    journal,
    publisher,
    ledger,
  });
  return { service, journal, publisher, events, ledger };
}

describe("PlanDraftService", () => {
  it("U-PADM-010: validates, journals, publishes both artifacts, appends once, then commits", () => {
    const f = fixture();
    const result = f.service.execute(command);
    expect(result).toEqual({ status: "created", receipt: { receiptId: "receipt-1" } });
    expect(f.events).toEqual(["validate", "ledger"]);
    expect(f.journal.events).toEqual(["intent", "commit"]);
    expect(f.publisher.events).toEqual([
      "stage:docs/plans/PLAN-L7-999.md,docs/governance/plan-admission-receipts.json",
      "publish",
    ]);
  });

  it("U-PADM-011: replays a committed command without publishing or appending", () => {
    const f = fixture();
    f.journal.entry = {
      status: "committed",
      payloadDigest: command.payloadDigest,
      receipt: { receiptId: "old" },
    };
    expect(f.service.execute(command)).toEqual({
      status: "replayed",
      receipt: { receiptId: "old" },
    });
    expect(f.publisher.events).toEqual([]);
    expect(f.events).toEqual(["validate"]);
  });

  it("U-PADM-012: rejects command reuse with a different payload", () => {
    const f = fixture();
    f.journal.entry = {
      status: "committed",
      payloadDigest: "sha256:other",
      receipt: { receiptId: "old" },
    };
    expect(() => f.service.execute(command)).toThrow(PlanDraftConflictError);
    expect(f.publisher.events).toEqual([]);
  });

  it("U-PADM-013: restores published artifacts and marks recovery_required on ledger failure", () => {
    const f = fixture();
    const failing = new PlanDraftService({
      validator: { validate: () => undefined },
      journal: f.journal,
      publisher: f.publisher,
      ledger: {
        append: () => {
          throw new Error("ledger failed");
        },
      },
    });
    expect(() => failing.execute(command)).toThrow(PlanDraftRecoveryRequiredError);
    expect(f.publisher.events.at(-1)).toBe("restore");
    expect(f.journal.entry?.status).toBe("recovery_required");
  });

  it("U-PADM-014: records restore failure and blocks automatic retry", () => {
    const f = fixture();
    f.publisher.failAt = "restore";
    const failing = new PlanDraftService({
      validator: { validate: () => undefined },
      journal: f.journal,
      publisher: f.publisher,
      ledger: {
        append: () => {
          throw new Error("ledger failed");
        },
      },
    });
    expect(() => failing.execute(command)).toThrow(/restoreにも失敗/);
    expect(() => failing.execute(command)).toThrow(/自動再実行できません/);
  });
});
