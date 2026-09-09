import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { migratePlanLedger } from "../../src/plan-asset/ledger/schema.ts";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.ts";

const opened: HarnessDb[] = [];

afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("sealed lineage local migration", () => {
  it("U-PA-SEAL-001: tracked historyを推測で再構築せずsealし、同一aliasのsuccessor rev1を作る", async () => {
    const { db, transaction } = await fixture();

    expect(transaction.migrate(input())).toMatchObject({
      ok: true,
      replayed: false,
      successorAssetId: "plan:recovery-16-successor",
      successorRevision: 1,
    });
    expect(count(db, "plan_revisions")).toBe(1);
    expect(count(db, "sealed_plan_lineages")).toBe(1);
    expect(count(db, "plan_lineage_migration_certificates")).toBe(1);
    expect(count(db, "genesis_issue_custody")).toBe(1);
    expect(count(db, "plan_admission_receipts")).toBe(1);
    expect(db.prepare("SELECT asset_id FROM plan_aliases WHERE alias = ?").get(PLAN_ID)).toEqual({
      asset_id: "plan:recovery-16-successor",
    });
  });

  it("U-PA-SEAL-002: same payload replayは冪等、history改変はconflictとしてwrite 0", async () => {
    const { db, transaction } = await fixture();
    const command = input();
    expect(transaction.migrate(command)).toMatchObject({ ok: true, replayed: false });
    const baseline = counts(db);
    expect(transaction.migrate(command)).toMatchObject({ ok: true, replayed: true });
    expect(transaction.migrate({ ...command, historicalTailDigest: digest("tampered") })).toEqual({
      ok: false,
      ruleId: "sealed-lineage-command-conflict",
    });
    expect(counts(db)).toEqual(baseline);
  });

  it.each([
    "asset",
    "revision",
    "alias",
    "admission",
    "custody",
    "seal",
    "certificate",
    "receipt",
  ] as const)("U-PA-SEAL-003: %s faultで全writeをrollbackする", async (boundary) => {
    const { db, Transaction } = await baseFixture();
    const command = input();
    const transaction = new Transaction(db, {
      fault: {
        after(actual) {
          if (actual === boundary) throw new Error(`fault:${boundary}`);
        },
      },
      git: fakeGit(command),
      reviewAuthority: fakeReviewAuthority(),
    });
    expect(() => transaction.migrate(command)).toThrow(`fault:${boundary}`);
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it.each([
    ["certificateDigest", "seal-certificate-digest-mismatch"],
    ["sourceAuthorityDigest", "seal-source-authority-invalid"],
    ["reviewedImplementationAuthorityDigest", "seal-review-authority-invalid"],
  ] as const)("E.6: %s の1 bit改変はwrite 0", async (field, ruleId) => {
    const { db, Transaction } = await baseFixture();
    const command = input();
    const mutated = { ...command, [field]: flipDigest(command[field]) } as MigrationInput;
    const transaction = new Transaction(db, {
      git: fakeGit(command),
      reviewAuthority: fakeReviewAuthority(),
    });
    expect(transaction.migrate(mutated)).toEqual({ ok: false, ruleId });
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it.each([
    ["unreachable", "seal-source-commit-unreachable"],
    ["source path", "seal-source-path-noncanonical"],
    ["source absent", "seal-source-path-absent"],
    ["source oid", "seal-source-blob-mismatch"],
    ["source payload", "seal-source-payload-drift"],
    ["projection path", "seal-projection-path-noncanonical"],
    ["projection custody", "seal-projection-custody-mismatch"],
    ["projection terminal", "seal-projection-terminal-mismatch"],
    ["head race", "seal-source-head-toctou"],
  ] as const)("E.3: %s のGit preflight不成立はwrite 0", async (caseName, ruleId) => {
    const { db, Transaction } = await baseFixture();
    const command = input();
    const baseGit = fakeGit(command);
    let reads = 0;
    const git = {
      ...baseGit,
      readHeadCommit: () => {
        reads += 1;
        return caseName === "head race" && reads > 1 ? "e".repeat(40) : command.sourceCommit;
      },
      isReachableFromTrackedRemote: () => caseName !== "unreachable",
      readBlob: (commit: string, path: string) => {
        const blob = baseGit.readBlob(commit, path);
        if (caseName === "source absent" && path === command.sourcePath) return undefined;
        if (caseName === "source oid" && path === command.sourcePath && blob)
          return { ...blob, blobOid: flipOid(blob.blobOid) };
        if (caseName === "source payload" && path === command.sourcePath && blob)
          return { ...blob, bytes: Buffer.from("---\nplan_id: drift\n---\nbody", "utf8") };
        if (caseName === "projection custody" && path === command.historicalProjectionPath && blob)
          return { ...blob, bytes: Buffer.from("{}", "utf8") };
        if (caseName === "projection terminal" && path === command.historicalProjectionPath && blob)
          return { ...blob, bytes: Buffer.from(JSON.stringify({ records: [] }), "utf8") };
        return blob;
      },
    };
    const mutated =
      caseName === "source path"
        ? { ...command, sourcePath: "docs/plans/not-the-plan.md" }
        : caseName === "projection path"
          ? { ...command, historicalProjectionPath: "docs/other.json" }
          : command;
    const transaction = new Transaction(db, { git, reviewAuthority: fakeReviewAuthority() });
    expect(transaction.migrate(mutated)).toEqual({ ok: false, ruleId });
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("E.3: projection の最大 sequence が重複する場合は terminal を一意に束縛しない", async () => {
    const { db, Transaction } = await baseFixture();
    const command = input();
    const baseGit = fakeGit(command);
    const duplicate = JSON.stringify({
      records: [
        {
          sequence: 3,
          record_digest: `sha256:${command.historicalTailDigest}`,
          binding: {
            plan_id: command.planId,
            asset_id: command.historicalAssetId,
            revision: command.historicalTerminalRevision,
          },
        },
        {
          sequence: 3,
          record_digest: `sha256:${command.historicalTailDigest}`,
          binding: {
            plan_id: command.planId,
            asset_id: command.historicalAssetId,
            revision: command.historicalTerminalRevision,
          },
        },
      ],
    });
    const git = {
      ...baseGit,
      readBlob: (commit: string, path: string) => {
        const blob = baseGit.readBlob(commit, path);
        if (path !== command.historicalProjectionPath || !blob) return blob;
        return { ...blob, bytes: Buffer.from(duplicate, "utf8") };
      },
    };
    const mutated = { ...command, historicalProjectionContentDigest: digest(duplicate) };
    const transaction = new Transaction(db, { git, reviewAuthority: fakeReviewAuthority() });
    expect(transaction.migrate(mutated)).toEqual({
      ok: false,
      ruleId: "seal-projection-custody-mismatch",
    });
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("E.3: Git preflight port が無い場合はfail-closeする", async () => {
    const { db, Transaction } = await baseFixture();
    const command = input();
    const transaction = new Transaction(db, {
      reviewAuthority: fakeReviewAuthority(),
    });
    expect(transaction.migrate(command)).toEqual({
      ok: false,
      ruleId: "seal-git-preflight-unavailable",
    });
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("E.4: review authority port が無い場合はfail-closeする", async () => {
    const { db, Transaction } = await baseFixture();
    const command = input();
    const transaction = new Transaction(db, { git: fakeGit(command) });
    expect(transaction.migrate(command)).toEqual({
      ok: false,
      ruleId: "seal-review-authority-invalid",
    });
    expect(counts(db)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

const PLAN_ID = "PLAN-RECOVERY-16-plan-revision-authoring";

type Boundary =
  | "asset"
  | "revision"
  | "alias"
  | "admission"
  | "custody"
  | "seal"
  | "certificate"
  | "receipt";

interface MigrationInput {
  commandId: string;
  repositoryIdentity: string;
  planId: string;
  historicalAssetId: string;
  historicalTerminalRevision: number;
  historicalTailDigest: string;
  historicalProjectionPath: string;
  historicalProjectionBlobOid: string;
  historicalProjectionContentDigest: string;
  successorAssetId: string;
  canonicalPayloadJson: string;
  canonicalPayloadDigest: string;
  bodyDigest: string;
  sourcePath: string;
  sourceCommit: string;
  sourceBlobOid: string;
  actor: string;
  occurredAt: string;
  certificateDigest: string;
  sourceAuthorityDigest: string;
  reviewedImplementationAuthorityDigest: string;
  trustedStatus: "draft";
  issue: {
    number: number;
    episodeId: string;
    preimageDigest: string;
  };
}

interface MigrationResult {
  ok: boolean;
  replayed?: boolean;
  successorAssetId?: string;
  successorRevision?: number;
  ruleId?: string;
}

interface Transaction {
  migrate(input: MigrationInput): MigrationResult;
}

interface TransactionConstructor {
  new (
    db: HarnessDb,
    options?: {
      fault?: { after(boundary: Boundary): void };
      git?: {
        readHeadCommit(): string;
        isReachableFromTrackedRemote(commit: string): boolean;
        readBlob(commit: string, path: string): { blobOid: string; bytes: Uint8Array } | undefined;
      };
      reviewAuthority?: {
        observe(input: MigrationInput):
          | {
              pullRequestNumber: number;
              baseRef: string;
              headSha: string;
              custodyState: "custody_admitted" | "custody_rejected";
              custodyReasons: readonly string[];
            }
          | undefined;
      };
    },
  ): Transaction;
}

async function loadTransaction(): Promise<TransactionConstructor> {
  const modulePath = "../../src/plan-asset/ledger/sealed-lineage-local-migration.ts";
  const module = (await import(/* @vite-ignore */ modulePath)) as Record<string, unknown>;
  expect(module.SealedLineageLocalMigration).toBeTypeOf("function");
  return module.SealedLineageLocalMigration as TransactionConstructor;
}

async function baseFixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db).ok).toBe(true);
  return { db, Transaction: await loadTransaction() };
}

async function fixture() {
  const value = await baseFixture();
  const command = input();
  return {
    ...value,
    transaction: new value.Transaction(value.db, {
      git: fakeGit(command),
      reviewAuthority: fakeReviewAuthority(),
    }),
  };
}

function input(): MigrationInput {
  const payload = `{"plan_id":"${PLAN_ID}","status":"draft"}`;
  const historicalTailDigest = digest("record-3");
  const projection = JSON.stringify({
    schema_version: "ut-tdd.plan-admission-receipts/v1",
    records: [
      {
        sequence: 3,
        record_digest: `sha256:${historicalTailDigest}`,
        binding: {
          plan_id: PLAN_ID,
          asset_id: "plan:890b18d79d85d8d7cc2591c7146af5e2",
          revision: 3,
        },
      },
    ],
  });
  const base = {
    commandId: "seal-lineage:recovery-16:v1",
    repositoryIdentity: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    planId: PLAN_ID,
    historicalAssetId: "plan:890b18d79d85d8d7cc2591c7146af5e2",
    historicalTerminalRevision: 3,
    historicalTailDigest,
    historicalProjectionPath: "docs/governance/plan-admission-receipts.json",
    historicalProjectionBlobOid: "b".repeat(40),
    historicalProjectionContentDigest: digest(projection),
    successorAssetId: "plan:recovery-16-successor",
    canonicalPayloadJson: payload,
    canonicalPayloadDigest: digest(payload),
    bodyDigest: digest("body"),
    sourcePath: "docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md",
    sourceCommit: "a".repeat(40),
    sourceBlobOid: "c".repeat(40),
    actor: "codex",
    occurredAt: "2026-07-27T03:30:00.000Z",
    certificateDigest: "0".repeat(64),
    sourceAuthorityDigest: "0".repeat(64),
    reviewedImplementationAuthorityDigest: "0".repeat(64),
    trustedStatus: "draft" as const,
    issue: {
      number: 102,
      episodeId: "E4-102",
      preimageDigest: digest("issue 102"),
    },
  };
  const sourceAuthorityDigest = framedDigest("ut-tdd-seal-source-authority-v1", [
    base.repositoryIdentity,
    base.planId,
    base.sourcePath,
    base.sourceCommit,
    base.sourceBlobOid,
    base.canonicalPayloadDigest,
    base.bodyDigest,
    base.historicalProjectionPath,
    base.historicalProjectionBlobOid,
    base.historicalProjectionContentDigest,
    base.historicalAssetId,
    String(base.historicalTerminalRevision),
    base.historicalTailDigest,
  ]);
  const reviewedImplementationAuthorityDigest = framedDigest("ut-tdd-seal-review-authority-v1", [
    base.repositoryIdentity,
    base.planId,
    "543",
    "main",
    "d".repeat(40),
    "custody_rejected",
    "unverified_family",
  ]);
  const certificateDigest = digest(
    stableCanonical({
      historicalAssetId: base.historicalAssetId,
      historicalTerminalRevision: base.historicalTerminalRevision,
      historicalTailDigest: base.historicalTailDigest,
      planId: base.planId,
      reviewedImplementationAuthorityDigest,
      sourceAuthorityDigest,
      successorAssetId: base.successorAssetId,
      successorRevision: 1,
    }),
  );
  return {
    ...base,
    sourceAuthorityDigest,
    reviewedImplementationAuthorityDigest,
    certificateDigest,
  };
}

function fakeGit(command: MigrationInput) {
  const source = Buffer.from(`---\nplan_id: ${command.planId}\nstatus: draft\n---\nbody`, "utf8");
  const projection = Buffer.from(
    JSON.stringify({
      schema_version: "ut-tdd.plan-admission-receipts/v1",
      records: [
        {
          sequence: command.historicalTerminalRevision,
          record_digest: `sha256:${command.historicalTailDigest}`,
          binding: {
            plan_id: command.planId,
            asset_id: command.historicalAssetId,
            revision: command.historicalTerminalRevision,
          },
        },
      ],
    }),
    "utf8",
  );
  return {
    readHeadCommit: () => command.sourceCommit,
    isReachableFromTrackedRemote: () => true,
    readBlob: (_commit: string, path: string) =>
      path === command.sourcePath
        ? { blobOid: command.sourceBlobOid, bytes: source }
        : path === command.historicalProjectionPath
          ? { blobOid: command.historicalProjectionBlobOid, bytes: projection }
          : undefined,
  };
}

function fakeReviewAuthority() {
  return {
    observe: () => ({
      pullRequestNumber: 543,
      baseRef: "main",
      headSha: "d".repeat(40),
      custodyState: "custody_rejected" as const,
      custodyReasons: ["unverified_family"],
    }),
  };
}

function counts(db: HarnessDb): number[] {
  return [
    "plan_assets",
    "plan_revisions",
    "plan_aliases",
    "sealed_plan_lineages",
    "plan_lineage_migration_certificates",
    "genesis_issue_custody",
    "plan_admission_receipts",
    "append_command_receipts",
  ].map((table) => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n));
}

function count(db: HarnessDb, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function framedDigest(label: string, values: readonly string[]): string {
  const hash = createHash("sha256");
  for (const value of [label, ...values]) {
    const bytes = Buffer.from(value, "utf8");
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(bytes.length);
    hash.update(length).update(bytes);
  }
  return hash.digest("hex");
}

function stableCanonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableCanonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableCanonical(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function flipDigest(value: string): string {
  return `${value[0] === "0" ? "1" : "0"}${value.slice(1)}`;
}

function flipOid(value: string): string {
  return `${value[0] === "a" ? "b" : "a"}${value.slice(1)}`;
}
