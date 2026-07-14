import { describe, expect, it } from "vitest";
import {
  createRedactedCommandArgs,
  EvidenceRecord,
} from "../../src/plan-asset/domain/evidence-record.js";
import { EvidencePolicy } from "../../src/plan-asset/domain/evidence-policy.js";

const digest = "a".repeat(64);
const commit = "b".repeat(40);

describe("PLAN Asset evidence policy", () => {
  it("U-PA-045: counts only kind/producer/subject/revision/commit/expiry/exit eligible evidence", () => {
    const eligible = evidence("evidence:eligible", { evidenceKind: "green-test-run" });
    const wrongKind = evidence("evidence:wrong-kind", { evidenceKind: "red-test-run" });
    const expired = evidence("evidence:expired", {
      evidenceKind: "green-test-run",
      expiresAt: "2026-07-14T00:00:00Z",
    });
    const policy = EvidencePolicy.create({
      requirements: [
        {
          requiredKind: "green-test-run",
          minCount: 1,
          maxCount: 1,
          acceptedProducers: ["ci"],
          exitRule: { kind: "exact", expected: 0 },
        },
      ],
      subjectId: "plan:a",
      subjectRevision: 1,
      sourceCommit: commit,
      now: "2026-07-14T01:00:00Z",
    });
    if (!policy.ok) throw new Error("policy fixture must be valid");

    expect(policy.value.evaluate([wrongKind, expired, eligible])).toEqual({
      usable: true,
      eligibleEvidenceIds: ["evidence:eligible"],
      rejectedEvidenceIds: ["evidence:expired", "evidence:wrong-kind"],
      missingCount: 0,
      excessCount: 0,
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
    evidenceKind: "green-test-run" | "red-test-run";
    expiresAt: string;
  }> = {},
): EvidenceRecord {
  const created = EvidenceRecord.create({
    evidenceId,
    evidenceKind: overrides.evidenceKind ?? "green-test-run",
    subjectId: "plan:a",
    subjectRevision: 1,
    sourceCommit: commit,
    commandArgs: createRedactedCommandArgs(["bun", "test"]),
    outputDigest: digest,
    exitCode: 0,
    producer: "ci",
    producedAt: "2026-07-14T00:00:00Z",
    expiresAt: overrides.expiresAt,
  });
  if (!created.ok) throw new Error("evidence fixture must be valid");
  return created.value;
}
