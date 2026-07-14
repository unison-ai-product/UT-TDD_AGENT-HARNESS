import { describe, expect, it } from "vitest";
import {
  createRedactedCommandArgs,
  EvidenceRecord,
} from "../../src/plan-asset/domain/evidence-record.js";
import { EvidencePolicy } from "../../src/plan-asset/domain/evidence-policy.js";

const digest = "a".repeat(64);
const commit = "b".repeat(40);

describe("PLAN Asset evidence policy", () => {
  it("U-PA-045: evaluates multiple typed requirements without cross-kind double counting", () => {
    const eligible = evidence("evidence:eligible", { evidenceKind: "green-test-run" });
    const gate = evidence("evidence:gate", { evidenceKind: "gate-run" });
    const wrongKind = evidence("evidence:wrong-kind", { evidenceKind: "red-test-run" });
    const expired = evidence("evidence:expired", {
      evidenceKind: "green-test-run",
      expiresAt: "2026-07-14T00:00:00Z",
    });
    const policy = EvidencePolicy.create({
      policyId: "accept/v1",
      revision: 1,
      requirements: [
        {
          requirementId: "accept-green",
          requiredKind: "green-test-run",
          minCount: 1,
          maxCount: 1,
          acceptedProducers: ["ci"],
          exitRule: { kind: "exact", expected: 0 },
        },
        {
          requirementId: "accept-gate",
          requiredKind: "gate-run",
          minCount: 1,
          acceptedProducers: ["ci"],
          exitRule: { kind: "exact", expected: 0 },
        },
      ],
    });
    if (!policy.ok) throw new Error("policy fixture must be valid");

    expect(
      policy.value.evaluate([wrongKind, expired, gate, eligible], {
      subjectId: "plan:a",
      subjectRevision: 1,
      sourceCommit: commit,
      now: "2026-07-14T01:00:00Z",
      }),
    ).toEqual({
      usable: true,
      policyId: "accept/v1",
      policyRevision: 1,
      eligibleEvidenceIds: ["evidence:eligible", "evidence:gate"],
      rejectedEvidenceIds: ["evidence:expired", "evidence:wrong-kind"],
      missingCount: 0,
      excessCount: 0,
      violations: [],
      requirements: [
        {
          requirementId: "accept-gate",
          evidenceKind: "gate-run",
          eligibleEvidenceIds: ["evidence:gate"],
          rejectedEvidenceIds: [],
          missingCount: 0,
          excessCount: 0,
        },
        {
          requirementId: "accept-green",
          evidenceKind: "green-test-run",
          eligibleEvidenceIds: ["evidence:eligible"],
          rejectedEvidenceIds: ["evidence:expired"],
          missingCount: 0,
          excessCount: 0,
        },
      ],
    });
  });

  it("U-PA-046: rejects unbranded argv, unknown kind/producer, self-supersession, and digest drift", () => {
    const base = {
      evidenceId: "evidence:invalid",
      evidenceKind: "green-test-run" as const,
      subjectId: "plan:a",
      subjectRevision: 1,
      sourceCommit: commit,
      commandArgs: createRedactedCommandArgs(["bun", "test", "--token=secret-value"]),
      claims: { runnerId: "vitest", testIds: ["U-PA-046"] },
      outputDigest: digest,
      exitCode: 0,
      producer: "ci" as const,
      producedAt: "2026-07-14T00:00:00Z",
    };
    expect(EvidenceRecord.create({ ...base, commandArgs: ["bun", "test"] as never }).ok).toBe(
      false,
    );
    expect(EvidenceRecord.create({ ...base, evidenceKind: "unknown" as never }).ok).toBe(false);
    expect(EvidenceRecord.create({ ...base, producer: "unknown" as never }).ok).toBe(false);
    expect(
      EvidenceRecord.create({ ...base, supersedesEvidenceId: base.evidenceId }).ok,
    ).toBe(false);

    const created = EvidenceRecord.create(base);
    if (!created.ok) throw new Error("evidence fixture must be valid");
    expect(created.value.commandArgs.values).toContain("--token=[REDACTED]");
    expect(Object.isFrozen(created.value.claims)).toBe(true);
    expect(
      EvidenceRecord.reconstruct({
        ...created.value.toRecord(),
        outputDigest: "c".repeat(64),
      }).ok,
    ).toBe(false);
  });
});

function evidence(
  evidenceId: string,
  overrides: Partial<{
    evidenceKind: "green-test-run" | "red-test-run" | "gate-run";
    expiresAt: string;
  }> = {},
): EvidenceRecord {
  const evidenceKind = overrides.evidenceKind ?? "green-test-run";
  const created = EvidenceRecord.create({
    evidenceId,
    evidenceKind,
    subjectId: "plan:a",
    subjectRevision: 1,
    sourceCommit: commit,
    commandArgs: createRedactedCommandArgs(["bun", "test"]),
    claims:
      evidenceKind === "red-test-run"
        ? {
            expectedFindingIds: ["red:expected"],
            observedFindingIds: ["red:expected"],
            todoCount: 0,
            skipCount: 0,
          }
        : evidenceKind === "gate-run"
          ? { gateIds: ["gate:accept"], failedGateIds: [] }
          : { runnerId: "vitest", testIds: ["U-PA-045"] },
    outputDigest: digest,
    exitCode: 0,
    producer: "ci",
    producedAt: "2026-07-14T00:00:00Z",
    expiresAt: overrides.expiresAt,
  });
  if (!created.ok) throw new Error("evidence fixture must be valid");
  return created.value;
}
