import { describe, expect, it } from "vitest";
import { EvidencePolicy } from "../../src/plan-asset/domain/evidence-policy.js";
import {
  createRedactedCommandArgs,
  EvidenceRecord,
  type StoredEvidenceRecord,
} from "../../src/plan-asset/domain/evidence-record.js";

const digest = "a".repeat(64);
const commit = "b".repeat(40);

describe("PLAN Asset evidence policy", () => {
  it("U-PA-045: evaluates multiple typed requirements without cross-kind double counting", () => {
    const eligible = evidence("evidence:eligible", { evidenceKind: "green-test-run" });
    const gate = evidence("evidence:gate", { evidenceKind: "gate-run" });
    const wrongKind = evidence("evidence:wrong-kind", { evidenceKind: "red-test-run" });
    const expired = evidence("evidence:expired", {
      evidenceKind: "green-test-run",
      expiresAt: "2026-07-14T00:30:00Z",
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
          claimsRule: { kind: "recorded" },
        },
        {
          requirementId: "accept-gate",
          requiredKind: "gate-run",
          minCount: 1,
          acceptedProducers: ["ci"],
          exitRule: { kind: "exact", expected: 0 },
          claimsRule: { kind: "gate-passed" },
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
    expect(EvidenceRecord.create({ ...base, supersedesEvidenceId: base.evidenceId }).ok).toBe(
      false,
    );

    const created = EvidenceRecord.create(base);
    if (!created.ok) throw new Error("evidence fixture must be valid");
    expect(created.value.commandArgs.values).toContain("--token=[REDACTED]");
    const compoundSecrets = createRedactedCommandArgs([
      "cmd",
      "--client-secret=TOPSECRET",
      "--access-token",
      "TOPSECRET2",
      "OPENAI_API_KEY=TOPSECRET3",
      "-H",
      "Authorization: Bearer TOPSECRET4",
      "https://user:TOPSECRET5@example.test/path",
    ]);
    expect(JSON.stringify(compoundSecrets)).not.toContain("TOPSECRET");
    expect(
      EvidenceRecord.create({
        ...base,
        commandArgs: createRedactedCommandArgs(["bun", "", "test"]),
      }).ok,
    ).toBe(false);
    expect(Object.isFrozen(created.value.claims)).toBe(true);
    expect(
      EvidenceRecord.reconstruct({
        ...created.value.toRecord(),
        outputDigest: "c".repeat(64),
      }).ok,
    ).toBe(false);

    const stored = created.value.toRecord();
    const mutations: Array<(record: StoredEvidenceRecord) => StoredEvidenceRecord> = [
      (record) => ({ ...record, evidenceId: "evidence:mutated" }),
      (record) => ({
        ...record,
        evidenceKind: "gate-run",
        claims: { gateIds: ["gate:a"], failedGateIds: [] },
      }),
      (record) => ({ ...record, subjectId: "plan:b" }),
      (record) => ({ ...record, subjectRevision: 2 }),
      (record) => ({ ...record, sourceCommit: "c".repeat(40) }),
      (record) => ({
        ...record,
        commandArgs: { schemaVersion: "redacted-argv/v1", values: ["bun", "test", "changed"] },
      }),
      (record) => ({ ...record, claims: { runnerId: "vitest", testIds: ["changed"] } }),
      (record) => ({ ...record, exitCode: 1 }),
      (record) => ({ ...record, producer: "codex" }),
      (record) => ({ ...record, producedAt: "2026-07-13T23:00:00Z" }),
      (record) => ({ ...record, expiresAt: "2026-07-15T00:00:00Z" }),
      (record) => ({ ...record, supersedesEvidenceId: "evidence:older" }),
      (record) => ({ ...record, recordDigest: "d".repeat(64) }),
    ];
    for (const mutate of mutations) {
      const reconstructed = EvidenceRecord.reconstruct(mutate(stored));
      expect(reconstructed.ok).toBe(false);
      if (!reconstructed.ok) {
        expect(reconstructed.error.ruleId).toBe("evidence-record-digest-mismatch");
      }
    }
  });

  it("U-PA-046: rejects negative claims and causally reversed supersession", () => {
    const rejected = reviewEvidence("evidence:rejected", "rejected", "2026-07-14T01:00:00Z");
    const olderApproval = reviewEvidence(
      "evidence:older-approval",
      "approved",
      "2026-07-14T00:00:00Z",
      rejected.evidenceId,
    );
    const policy = EvidencePolicy.create({
      policyId: "review/v1",
      revision: 1,
      requirements: [
        {
          requirementId: "independent-review-approved",
          requiredKind: "independent-review",
          minCount: 1,
          acceptedProducers: ["human"],
          exitRule: { kind: "exact", expected: 0 },
          claimsRule: { kind: "review-approved" },
        },
      ],
    });
    if (!policy.ok) throw new Error("policy fixture must be valid");
    const verdict = policy.value.evaluate([rejected, olderApproval], {
      subjectId: "plan:a",
      subjectRevision: 1,
      sourceCommit: commit,
      now: "2026-07-14T02:00:00Z",
    });
    expect(verdict.usable).toBe(false);
    expect(verdict.violations).toContain(
      "evidence-supersession-causal-order:evidence:older-approval",
    );
    expect(verdict.eligibleEvidenceIds).not.toContain("evidence:rejected");
  });

  it.each([
    { requiredKind: "unknown" as never },
    { acceptedProducers: ["unknown" as never] },
    { exitRule: { kind: "bogus" } as never },
    { claimsRule: { kind: "bogus" } as never },
  ])("U-PA-046: rejects an unknown policy discriminator", (override) => {
    expect(
      EvidencePolicy.create({
        policyId: "invalid/v1",
        revision: 1,
        requirements: [
          {
            requirementId: "invalid",
            requiredKind: "green-test-run",
            minCount: 1,
            acceptedProducers: ["ci"],
            exitRule: { kind: "exact", expected: 0 },
            claimsRule: { kind: "recorded" },
            ...override,
          },
        ],
      }).ok,
    ).toBe(false);
  });

  it("U-PA-046: reduces a valid supersession chain and rejects orphan/fork/cycle graphs", () => {
    const policy = approvedReviewPolicy();
    const first = reviewEvidence("evidence:first", "approved", "2026-07-14T00:00:00Z");
    const second = reviewEvidence(
      "evidence:second",
      "approved",
      "2026-07-14T01:00:00Z",
      first.evidenceId,
    );
    const third = reviewEvidence(
      "evidence:third",
      "approved",
      "2026-07-14T02:00:00Z",
      second.evidenceId,
    );
    const context = {
      subjectId: "plan:a",
      subjectRevision: 1,
      sourceCommit: commit,
      now: "2026-07-14T04:00:00Z",
    };
    expect(policy.evaluate([first, second, third], context)).toMatchObject({
      usable: true,
      eligibleEvidenceIds: ["evidence:third"],
      rejectedEvidenceIds: ["evidence:first", "evidence:second"],
      violations: [],
    });

    const orphan = reviewEvidence(
      "evidence:orphan",
      "approved",
      "2026-07-14T03:00:00Z",
      "evidence:missing",
    );
    expect(policy.evaluate([orphan], context).violations).toContain(
      "evidence-supersession-orphan:evidence:orphan",
    );

    const forkLeft = reviewEvidence(
      "evidence:fork-left",
      "approved",
      "2026-07-14T01:00:00Z",
      first.evidenceId,
    );
    const forkRight = reviewEvidence(
      "evidence:fork-right",
      "approved",
      "2026-07-14T02:00:00Z",
      first.evidenceId,
    );
    expect(policy.evaluate([first, forkLeft, forkRight], context).violations).toContain(
      "evidence-supersession-fork:evidence:first",
    );

    const cycleA = reviewEvidence(
      "evidence:cycle-a",
      "approved",
      "2026-07-14T01:00:00Z",
      "evidence:cycle-b",
    );
    const cycleB = reviewEvidence(
      "evidence:cycle-b",
      "approved",
      "2026-07-14T02:00:00Z",
      "evidence:cycle-a",
    );
    expect(policy.evaluate([cycleA, cycleB], context).violations).toEqual(
      expect.arrayContaining([
        "evidence-supersession-cycle:evidence:cycle-a",
        "evidence-supersession-cycle:evidence:cycle-b",
      ]),
    );
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

function reviewEvidence(
  evidenceId: string,
  verdict: "approved" | "rejected",
  producedAt: string,
  supersedesEvidenceId?: string,
): EvidenceRecord {
  const created = EvidenceRecord.create({
    evidenceId,
    evidenceKind: "independent-review",
    subjectId: "plan:a",
    subjectRevision: 1,
    sourceCommit: commit,
    commandArgs: createRedactedCommandArgs(["ut-tdd", "review"]),
    claims: { verdict, reviewerId: "reviewer:a", reviewedAt: producedAt },
    outputDigest: digest,
    exitCode: 0,
    producer: "human",
    producedAt,
    supersedesEvidenceId,
  });
  if (!created.ok) throw new Error("review evidence fixture must be valid");
  return created.value;
}

function approvedReviewPolicy(): EvidencePolicy {
  const created = EvidencePolicy.create({
    policyId: "review/v1",
    revision: 1,
    requirements: [
      {
        requirementId: "independent-review-approved",
        requiredKind: "independent-review",
        minCount: 1,
        acceptedProducers: ["human"],
        exitRule: { kind: "exact", expected: 0 },
        claimsRule: { kind: "review-approved" },
      },
    ],
  });
  if (!created.ok) throw new Error("policy fixture must be valid");
  return created.value;
}
