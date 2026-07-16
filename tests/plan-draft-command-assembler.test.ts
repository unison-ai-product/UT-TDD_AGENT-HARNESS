import { describe, expect, it } from "vitest";
import { calculatePlanDraftCommandDigests } from "../src/kernel/plan-draft-command-digest.js";
import {
  assemblePlanDraftCommand,
  type DraftManifestV2,
  type PlanDraftEnvironmentSnapshot,
} from "../src/plan-admission/plan-draft-command-assembler.js";
import { evaluatePlanAdmission, type PlanAdmissionRequest } from "../src/plan-admission/policy.js";

const planId = "PLAN-L7-999-command-assembler";
const admission: PlanAdmissionRequest = {
  routeSignal: "forward",
  routeMode: "forward",
  kind: "impl",
  layer: "L7",
  drive: "agent",
  branch: "work/forward-command-assembler",
};
const decision = evaluatePlanAdmission(admission);
if (!decision.ok) throw new Error("test fixture must be admitted");

const manifest: DraftManifestV2 = {
  version: 2,
  command_id: "command:draft-999",
  plan_id: planId,
  recorded_at: "2026-07-15T00:00:00.000Z",
  admission: {
    route_signal: "forward",
    route_mode: "forward",
    kind: "impl",
    layer: "L7",
  },
  source: {
    path: `docs/plans/${planId}.md`,
    content: `---\nplan_id: ${planId}\ntitle: command assembler\n---\nbody\n`,
  },
  projection: { path: "docs/governance/plan-admission-receipts.json" },
};
const environment: PlanDraftEnvironmentSnapshot = {
  assetId: "asset:draft-999",
  reservationId: "reservation:draft-999",
  certificateId: "certificate:draft-999",
  namespace: "L7",
  ordinal: 999,
  sourceCommit: "a".repeat(40),
  actor: "codex",
  reason: "forward draft",
  identityAlgorithm: "uuid-v5",
  bodyDigest: "b".repeat(64),
  routeTupleDigest: "c".repeat(64),
  leaseTokenHash: "d".repeat(64),
  expiresAt: "2026-07-16T00:00:00.000Z",
};

describe("PLAN draft command assembler", () => {
  it("U-PADM-047: 同じ明示入力からcanonical/service commandを決定論的に組み立てる", () => {
    const first = assemblePlanDraftCommand({ manifest, admission, decision, environment });
    const second = assemblePlanDraftCommand({ manifest, admission, decision, environment });

    expect(second).toEqual(first);
    expect(first.command.commandPayloadDigest).toBe(
      calculatePlanDraftCommandDigests(first.canonical).commandPayloadDigest,
    );
    expect(first.command.payload).toEqual({ canonical: first.canonical, admission });
    expect(first.canonical).toMatchObject({
      planId,
      sourcePath: manifest.source.path,
      sourceCommit: environment.sourceCommit,
      namespace: "L7",
      ordinal: 999,
      assetId: environment.assetId,
      reservationId: environment.reservationId,
      certificateId: environment.certificateId,
      bodyDigest: environment.bodyDigest,
      routeTupleDigest: environment.routeTupleDigest,
      leaseTokenHash: environment.leaseTokenHash,
      expiresAt: environment.expiresAt,
    });
  });

  it.each([
    [
      "source plan ID",
      {
        source: {
          ...manifest.source,
          content: manifest.source.content.replace(planId, "PLAN-L7-998-wrong"),
        },
      },
      environment,
    ],
    [
      "source path",
      { source: { ...manifest.source, path: "docs/plans/PLAN-L7-998-wrong.md" } },
      environment,
    ],
    ["namespace", {}, { ...environment, namespace: "L6" }],
    ["ordinal", {}, { ...environment, ordinal: 998 }],
  ] as const)("U-PADM-048: %s不一致をfail-closeする", (_label, manifestPatch, snapshot) => {
    expect(() =>
      assemblePlanDraftCommand({
        manifest: { ...manifest, ...manifestPatch },
        admission,
        decision,
        environment: snapshot,
      }),
    ).toThrow();
  });

  it("U-PADM-049: manifestのdigest自己申告をcommandに混入させない", () => {
    const claimed = { ...manifest, command_payload_digest: "f".repeat(64) };
    const baseline = assemblePlanDraftCommand({ manifest, admission, decision, environment });
    const withClaim = assemblePlanDraftCommand({
      manifest: claimed,
      admission,
      decision,
      environment,
    });

    expect(withClaim).toEqual(baseline);
  });

  it("U-PADM-050: admission decisionとrequestのtuple不一致を拒否する", () => {
    const mismatched = { ...admission, layer: "L6" as const };

    expect(() =>
      assemblePlanDraftCommand({ manifest, admission: mismatched, decision, environment }),
    ).toThrow("plan-draft-admission-decision-mismatch");
  });
});
