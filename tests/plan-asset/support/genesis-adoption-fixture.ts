import { createHash } from "node:crypto";
import type { GenesisAdoptionInput } from "../../../src/plan-asset/ledger/genesis-adoption-transaction.js";

export function input(): GenesisAdoptionInput {
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

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
