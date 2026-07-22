import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { deriveLegacyAssetId } from "../../src/plan-asset/adapters/legacy-plan-adapter.js";
import { LEDGER_SCHEMA_VERSION, migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.js";

const opened: HarnessDb[] = [];

afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("genesis adoption transaction", () => {
  it("U-GEN-003: legacy PlanAssetとIssue E4 custodyを一つのatomic commitで確定する", async () => {
    const { db, custody, transaction } = await fixture();

    expect(transaction.adopt(input())).toMatchObject({
      ok: true,
      replayed: false,
      assetId: derivedAssetId(),
      revision: 1,
      issueNumber: 129,
    });
    expect(counts(db)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(custody.committed()).toEqual([
      {
        commandId: "genesis:issue-129:l4-31",
        issueNumber: 129,
        episodeId: "E4-129",
        driveModel: "redesign",
        issuePreimageDigest: sha("issue-129-preimage"),
        assetId: derivedAssetId(),
        revision: 1,
      },
    ]);
  });

  it.each([
    "asset",
    "revision",
    "alias-event",
    "alias-current",
    "admission-event",
    "admission-receipt",
    "command-receipt",
    "issue-custody-prepare",
    "issue-custody-commit",
  ] as const)("U-GEN-004: %s faultでledgerとIssue custodyの全write setをrollbackする", async (boundary) => {
    const { db, custody, Transaction } = await baseFixture();
    const transaction = new Transaction(db, custody, {
      after(actual) {
        if (actual === boundary) throw new Error(`fault:${boundary}`);
      },
    });

    expect(() => transaction.adopt(input())).toThrow(`fault:${boundary}`);
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(custody.committed()).toEqual([]);
    expect(custody.prepared()).toEqual([]);
  });

  it("U-GEN-005: same-command replayは重複を作らず、異なるIssue preimageをconflictとして拒否する", async () => {
    const { db, custody, transaction } = await fixture();
    const command = input();

    expect(transaction.adopt(command)).toMatchObject({
      ok: true,
      replayed: false,
    });
    const baseline = counts(db);
    expect(transaction.adopt(command)).toMatchObject({
      ok: true,
      replayed: true,
      assetId: derivedAssetId(),
      revision: 1,
      issueNumber: 129,
    });
    expect(counts(db)).toEqual(baseline);
    expect(custody.committed()).toHaveLength(1);

    expect(
      transaction.adopt({
        ...command,
        issue: {
          ...command.issue,
          preimageDigest: sha("stale-or-substituted-preimage"),
        },
      }),
    ).toEqual({ ok: false, ruleId: "genesis-adoption-command-conflict" });
    expect(counts(db)).toEqual(baseline);
    expect(custody.committed()).toHaveLength(1);
  });

  it.each([
    ["digest", (value: GenesisAdoptionInput) => ({ ...value, routeTupleDigest: "f".repeat(64) })],
    [
      "origin",
      (value: GenesisAdoptionInput) => ({
        ...value,
        origin: { ...value.origin, planId: "PLAN-L4-forged" },
      }),
    ],
    [
      "reentry",
      (value: GenesisAdoptionInput) => ({
        ...value,
        reentry: { ...value.reentry, targetRevision: 99 },
      }),
    ],
  ] as const)("U-GEN-015: transaction境界でも%s route改ざんをfail-closeする", async (_name, mutate) => {
    const { transaction } = await fixture();
    expect(transaction.adopt(mutate(input()))).toEqual({
      ok: false,
      ruleId: "genesis-adoption-route-tuple-digest-mismatch",
    });
  });
});

type GenesisBoundary =
  | "asset"
  | "revision"
  | "alias-event"
  | "alias-current"
  | "admission-event"
  | "admission-receipt"
  | "command-receipt"
  | "issue-custody-prepare"
  | "issue-custody-commit";

interface GenesisAdoptionInput {
  readonly commandId: string;
  readonly repositoryIdentity: string;
  readonly planId: string;
  readonly sourcePath: string;
  readonly sourceCommit: string;
  readonly sourceBlobOid: string;
  readonly sourceContentDigest: string;
  readonly canonicalPayloadJson: string;
  readonly canonicalPayloadDigest: string;
  readonly bodyDigest: string;
  readonly actor: string;
  readonly reason: string;
  readonly routeTupleDigest: string;
  readonly origin: { readonly planId: string; readonly revision: number; readonly digest: string };
  readonly reentry: {
    readonly targetPlanId: string;
    readonly targetRevision: number;
    readonly phase: "forward_merge";
  };
  readonly occurredAt: string;
  readonly issue: {
    readonly number: number;
    readonly episodeId: string;
    readonly driveModel: "redesign";
    readonly branch: string;
    readonly preimageDigest: string;
  };
}

type GenesisResult =
  | {
      readonly ok: true;
      readonly replayed: boolean;
      readonly assetId: string;
      readonly revision: 1;
      readonly issueNumber: number;
    }
  | { readonly ok: false; readonly ruleId: string };

interface GenesisAdoptionTransactionContract {
  adopt(input: GenesisAdoptionInput): GenesisResult;
}

interface GenesisAdoptionTransactionConstructor {
  new (
    db: HarnessDb,
    custody: MemoryGenesisCustody,
    fault?: { after(boundary: GenesisBoundary): void },
  ): GenesisAdoptionTransactionContract;
}

interface CustodyRecord {
  readonly commandId: string;
  readonly issueNumber: number;
  readonly episodeId: string;
  readonly driveModel: "redesign";
  readonly issuePreimageDigest: string;
  readonly assetId: string;
  readonly revision: 1;
}

class MemoryGenesisCustody {
  private readonly staged = new Map<string, CustodyRecord>();
  private readonly durable = new Map<string, CustodyRecord>();

  prepare(record: CustodyRecord): void {
    this.staged.set(record.commandId, record);
  }

  commit(commandId: string): void {
    const record = this.staged.get(commandId);
    if (!record) throw new Error("genesis-custody-prepare-missing");
    this.durable.set(commandId, record);
    this.staged.delete(commandId);
  }

  rollback(commandId: string): void {
    this.staged.delete(commandId);
    this.durable.delete(commandId);
  }

  prepared(): CustodyRecord[] {
    return [...this.staged.values()];
  }

  committed(): CustodyRecord[] {
    return [...this.durable.values()];
  }
}

async function loadTransaction(): Promise<GenesisAdoptionTransactionConstructor> {
  const modulePath = "../../src/plan-asset/ledger/genesis-adoption-transaction.js";
  const implementation = (await import(/* @vite-ignore */ modulePath)) as Record<string, unknown>;
  const candidate = implementation.GenesisAdoptionTransaction;
  expect(candidate, "genesis adoption transaction must be implemented").toBeTypeOf("function");
  return candidate as GenesisAdoptionTransactionConstructor;
}

async function baseFixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({
    ok: true,
    version: LEDGER_SCHEMA_VERSION,
  });
  return {
    db,
    custody: new MemoryGenesisCustody(),
    Transaction: await loadTransaction(),
  };
}

async function fixture() {
  const base = await baseFixture();
  return { ...base, transaction: new base.Transaction(base.db, base.custody) };
}

function input(): GenesisAdoptionInput {
  const canonicalPayloadJson = '{"layer":"L4","plan_id":"PLAN-L4-31","status":"draft"}';
  const origin = { planId: "PLAN-L4-31", revision: 1, digest: `sha256:${sha("origin")}` };
  const reentry = {
    targetPlanId: "PLAN-L4-31",
    targetRevision: 2,
    phase: "forward_merge" as const,
  };
  return {
    commandId: "genesis:issue-129:l4-31",
    repositoryIdentity: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    planId: "PLAN-L4-31",
    sourcePath: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
    sourceCommit: "a".repeat(40),
    sourceBlobOid: "b".repeat(40),
    sourceContentDigest: sha("trusted HEAD source"),
    canonicalPayloadJson,
    canonicalPayloadDigest: sha(canonicalPayloadJson),
    bodyDigest: sha("legacy body"),
    actor: "genesis:test",
    reason: "lossless trusted-HEAD genesis adoption",
    routeTupleDigest: sha(
      stable({ routeSignal: "redesign", routeMode: "redesign", origin, reentry }),
    ),
    origin,
    reentry,
    occurredAt: "2026-07-22T00:00:00.000Z",
    issue: {
      number: 129,
      episodeId: "E4-129",
      driveModel: "redesign",
      branch: "work/redesign-planasset-genesis-adoption",
      preimageDigest: sha("issue-129-preimage"),
    },
  };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function counts(db: HarnessDb): number[] {
  return [
    "plan_assets",
    "plan_revisions",
    "plan_alias_events",
    "plan_aliases",
    "plan_admission_events",
    "plan_admission_receipts",
    "append_command_receipts",
  ].map((table) => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n));
}

function derivedAssetId(): string {
  return deriveLegacyAssetId("unison-ai-product/UT-TDD_AGENT-HARNESS", "PLAN-L4-31");
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
