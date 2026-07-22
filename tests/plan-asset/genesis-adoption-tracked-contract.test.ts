import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { deriveLegacyAssetId } from "../../src/plan-asset/adapters/legacy-plan-adapter.js";
import { parseLegacyPlanSource } from "../../src/plan-asset/adapters/legacy-plan-inventory.js";
import {
  type GenesisAdoptionInput,
  GenesisAdoptionTransaction,
} from "../../src/plan-asset/ledger/genesis-adoption-transaction.js";
import { deriveGenesisRouteTupleDigest } from "../../src/plan-asset/ledger/genesis-route-binding.js";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.js";

const repositoryIdentity = "unison-ai-product/UT-TDD_AGENT-HARNESS";
const branch = "work/redesign-planasset-genesis-adoption";
const opened: HarnessDb[] = [];

afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});

describe("Issue #129 tracked legacy route transaction contracts", () => {
  it("U-GEN-015: L4-31を採用してL6-88へのRedesign Forward reentryを同じroute digestへ束縛する", () => {
    const db = database();
    const command = trackedInput({
      commandId: "genesis:issue-129:l4-31",
      sourcePath: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
      planId: "PLAN-L4-31-nfr-verification-foundation-architecture",
      originRevision: 1,
      reentryPlanId: "PLAN-L6-88-snapshot-runner-performance-redesign",
      reentryRevision: 1,
    });

    const adopted = new GenesisAdoptionTransaction(db).adopt(command);

    expect(adopted).toMatchObject({ ok: true, replayed: false, revision: 1 });
    expect(adopted.ok && adopted.assetId).toBe(
      deriveLegacyAssetId(repositoryIdentity, command.planId),
    );
    expect(admission(db, command.commandId)).toMatchObject({
      plan_id: command.planId,
      route_tuple_digest: deriveGenesisRouteTupleDigest(command),
    });
    expect(command.reentry).toEqual({
      targetPlanId: "PLAN-L6-88-snapshot-runner-performance-redesign",
      targetRevision: 1,
      phase: "forward_merge",
    });
  });

  it("U-GEN-016: L6-83採用のpartial failureを全rollbackし、replayでL7-452 reentryへ一意に収束する", () => {
    expect(trackedPlanId("docs/plans/PLAN-L7-452-forward-escape-contract-red.md")).toBe(
      "PLAN-L7-452-forward-escape-contract-red",
    );
    const db = database();
    const command = trackedInput({
      commandId: "genesis:issue-129:l6-83",
      sourcePath: "docs/plans/PLAN-L6-83-forward-escape-issue-contract.md",
      planId: "PLAN-L6-83-forward-escape-issue-contract",
      originRevision: 1,
      reentryPlanId: "PLAN-L7-452-forward-escape-contract-red",
      reentryRevision: 1,
    });
    let failed = false;
    const interrupted = new GenesisAdoptionTransaction(db, {
      after(boundary) {
        if (!failed && boundary === "admission-receipt") {
          failed = true;
          throw new Error("simulated-crash-after-admission-receipt");
        }
      },
    });

    expect(() => interrupted.adopt(command)).toThrow("simulated-crash-after-admission-receipt");
    expect(count(db, "plan_assets")).toBe(0);
    expect(count(db, "plan_admission_receipts")).toBe(0);
    expect(count(db, "genesis_issue_custody")).toBe(0);

    const retry = new GenesisAdoptionTransaction(db);
    expect(retry.adopt(command)).toMatchObject({ ok: true, replayed: false });
    expect(retry.adopt(command)).toMatchObject({ ok: true, replayed: true });
    expect(count(db, "plan_assets")).toBe(1);
    expect(count(db, "plan_admission_receipts")).toBe(1);
    expect(count(db, "genesis_issue_custody")).toBe(1);
    expect(admission(db, command.commandId)).toMatchObject({
      plan_asset_id: deriveLegacyAssetId(repositoryIdentity, command.planId),
      plan_id: command.planId,
      route_tuple_digest: deriveGenesisRouteTupleDigest(command),
    });

    const substitutedReentry = {
      ...command,
      reentry: { ...command.reentry, targetPlanId: "PLAN-L7-999-substituted" },
    };
    expect(retry.adopt(substitutedReentry)).toEqual({
      ok: false,
      ruleId: "genesis-adoption-route-tuple-digest-mismatch",
    });
  });
});

function database(): HarnessDb {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  return db;
}

function trackedInput(route: {
  commandId: string;
  sourcePath: string;
  planId: string;
  originRevision: number;
  reentryPlanId: string;
  reentryRevision: number;
}): GenesisAdoptionInput {
  const commit = git("rev-parse", "HEAD");
  const sourceBytes = gitBytes("show", `${commit}:${route.sourcePath}`);
  const sourceText = sourceBytes.toString("utf8");
  const parsed = parseLegacyPlanSource(sourceText);
  if (!parsed || parsed.planId !== route.planId) throw new Error("real-plan-source-invalid");
  const canonicalPayloadJson = canonical(parsed.frontmatter);
  const origin = {
    planId: route.planId,
    revision: route.originRevision,
    digest: `sha256:${sha(sourceText)}`,
  };
  const reentry = {
    targetPlanId: route.reentryPlanId,
    targetRevision: route.reentryRevision,
    phase: "forward_merge" as const,
  };
  return {
    commandId: route.commandId,
    repositoryIdentity,
    planId: route.planId,
    sourcePath: route.sourcePath,
    sourceCommit: commit,
    sourceBlobOid: git("rev-parse", `${commit}:${route.sourcePath}`),
    sourceContentDigest: sha(sourceBytes),
    canonicalPayloadJson,
    canonicalPayloadDigest: sha(canonicalPayloadJson),
    bodyDigest: sha(parsed.body),
    actor: "genesis-real-chain:test",
    reason: "Issue #129 trusted-HEAD genesis adoption",
    routeTupleDigest: deriveGenesisRouteTupleDigest({ origin, reentry }),
    origin,
    reentry,
    occurredAt: "2026-07-22T00:00:00.000Z",
    issue: {
      number: 129,
      episodeId: "E4-129",
      driveModel: "redesign",
      branch,
      preimageDigest: sha("issue-129-real-chain-preimage"),
    },
  };
}

function trackedPlanId(sourcePath: string): string | undefined {
  const source = parseLegacyPlanSource(gitBytes("show", `HEAD:${sourcePath}`).toString("utf8"));
  return source?.planId;
}

function admission(db: HarnessDb, commandId: string): Record<string, unknown> {
  return (
    db.prepare("SELECT * FROM plan_admission_receipts WHERE command_id = ?").get(commandId) ?? {}
  );
}

function count(db: HarnessDb, table: string): number {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}

function git(...args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function gitBytes(...args: string[]): Buffer {
  return execFileSync("git", args, { cwd: process.cwd(), windowsHide: true });
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function sha(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
