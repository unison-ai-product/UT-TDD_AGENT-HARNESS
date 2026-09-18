import { describe, expect, it, vi } from "vitest";
import type {
  PackPublicationPreparationReceipt,
  PublicationPortResult,
} from "../src/setup/pack-publication-adapter.ts";
import {
  admitPackPublication,
  derivePackPublicationAdmissionApprovalBinding,
  derivePackPublicationAdmissionIntentIdentity,
  derivePackPublicationPreparationReceiptDigest,
  PACK_PUBLICATION_ADMISSION_COVERAGE,
  type PackPublicationAdmissionConfiguration,
  type PackPublicationAdmissionInput,
  type PackPublicationAdmissionLedgerRecord,
} from "../src/setup/pack-publication-admission.ts";

const ok = <T>(value: T): PublicationPortResult<T> => ({ status: "attested", value });
const sha = (value: string) => `sha256:${value.repeat(64).slice(0, 64)}`;
const oid = (value: string) => value.repeat(40).slice(0, 40);

const configuration: PackPublicationAdmissionConfiguration = {
  repositoryId: 424200,
  repository: "example-org/example-pack",
  targetRef: "refs/heads/main",
  rulesetId: 77,
  requiredContexts: ["pack-check"],
  casAuthorityInstallationId: 9001,
};

const receipt: PackPublicationPreparationReceipt = {
  kind: "pack-publication-preparation-receipt-v1",
  identity: {
    pullRequest: "4242",
    headOid: oid("a"),
    baseOid: oid("b"),
    treeDigest: sha("c"),
  },
  binding: { operationId: "op-adm-fixture-0001" },
  read_back_observation: { journalEventDigest: sha("d"), pullRequest: "4242" },
};

function fixture(
  overrides: Partial<PackPublicationAdmissionInput> = {},
): PackPublicationAdmissionInput {
  const intentIdentity = derivePackPublicationAdmissionIntentIdentity({
    operationId: receipt.binding.operationId,
    repositoryId: configuration.repositoryId,
    targetRef: configuration.targetRef,
    expectedMainOid: receipt.identity.baseOid,
    reviewedHead: receipt.identity.headOid,
    preparationReceiptDigest: derivePackPublicationPreparationReceiptDigest(receipt),
  });
  const observer = {
    repository: vi.fn(() => ok({ ...configuration })),
    pullRequest: vi.fn(() =>
      ok({
        pullRequest: "4242",
        branch: "pack/publication/op-adm-fixture-0001",
        headOid: receipt.identity.headOid,
        baseOid: receipt.identity.baseOid,
        treeDigest: receipt.identity.treeDigest,
      }),
    ),
    review: vi.fn(() =>
      ok({
        pullRequest: "4242",
        reviewedHead: receipt.identity.headOid,
        conclusion: "approved" as const,
        reviewer: "reviewer-b",
        author: "author-a",
        closingReceiptDigest: sha("e"),
      }),
    ),
    checks: vi.fn(() =>
      ok({
        headOid: receipt.identity.headOid,
        checks: [{ context: "pack-check", conclusion: "success" }],
      }),
    ),
    mergeBase: vi.fn(() => ok({ mergeBase: receipt.identity.baseOid })),
    staging: vi.fn(() =>
      ok({
        operationId: receipt.binding.operationId,
        idempotencyKey: "idem-adm-fixture-0001",
        treeDigest: receipt.identity.treeDigest,
        manifestDigest: sha("f"),
        expectedMainOid: receipt.identity.baseOid,
        branch: "pack/publication/op-adm-fixture-0001",
      }),
    ),
  };
  const records: PackPublicationAdmissionLedgerRecord[] = [];
  return {
    receipt,
    configuration,
    expectedMainOid: receipt.identity.baseOid,
    approvals: [
      {
        nonce: "apv-adm-fixture-0001",
        operationId: receipt.binding.operationId,
        idempotencyKey: "idem-adm-fixture-0001",
        intentBindingDigest: derivePackPublicationAdmissionApprovalBinding({
          nonce: "apv-adm-fixture-0001",
          publicationIntentIdentity: intentIdentity,
        }),
        consumed: false,
        preparation: false,
      },
    ],
    observer,
    ledger: {
      read: () => records,
      appendObservation: vi.fn(),
      append: vi.fn((record: PackPublicationAdmissionLedgerRecord) => {
        records.push(record);
      }),
    },
    ...overrides,
  };
}

describe("Pack publication admission observation binding", () => {
  it("declares the bounded candidate coverage explicitly", () => {
    expect(PACK_PUBLICATION_ADMISSION_COVERAGE.implemented).toHaveLength(6);
    expect(PACK_PUBLICATION_ADMISSION_COVERAGE.deferred).toHaveLength(5);
  });

  it("admits a complete read-only observation and appends provenance only", async () => {
    const input = fixture();
    const result = await admitPackPublication(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.status).toBe("admitted");
    expect(result.record.sequence).toBe(1);
    expect(result.remoteWrites).toBe(0);
    expect(result.approvalConsumes).toBe(0);
    expect(input.ledger.appendObservation).toHaveBeenCalledTimes(1);
    expect(input.ledger.append).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed receipts before calling any observer", async () => {
    const input = fixture({ receipt: undefined });
    const result = await admitPackPublication(input);
    expect(result).toMatchObject({
      ok: false,
      status: "denied",
      reason: "admission_receipt_invalid",
      remoteWrites: 0,
    });
    expect(input.observer.repository).not.toHaveBeenCalled();
  });

  it("denies a review-head mutation without consuming approval or writing remotely", async () => {
    const input = fixture({
      observer: {
        ...fixture().observer,
        review: vi.fn(() =>
          ok({
            pullRequest: "4242",
            reviewedHead: oid("9"),
            conclusion: "approved" as const,
            reviewer: "reviewer-b",
            author: "author-a",
            closingReceiptDigest: sha("e"),
          }),
        ),
      },
    });
    const result = await admitPackPublication(input);
    expect(result).toMatchObject({
      ok: false,
      status: "denied",
      reason: "admission_review_head_mismatch",
      remoteWrites: 0,
      approvalConsumes: 0,
    });
    expect(input.ledger.append).not.toHaveBeenCalled();
  });

  it("keeps observer failure indeterminate", async () => {
    const base = fixture();
    const input = fixture({
      observer: {
        ...base.observer,
        checks: vi.fn(() => ({ status: "unavailable" as const, reason: "timeout" })),
      },
    });
    const result = await admitPackPublication(input);
    expect(result).toMatchObject({
      ok: false,
      status: "indeterminate",
      reason: "timeout",
      remoteWrites: 0,
      approvalConsumes: 0,
    });
  });

  it("treats malformed observer scalars as indeterminate", async () => {
    const base = fixture();
    const input = fixture({
      observer: {
        ...base.observer,
        repository: vi.fn(() =>
          ok({ ...configuration, requiredContexts: ["pack-check", 42] as unknown as string[] }),
        ),
      },
    });
    const result = await admitPackPublication(input);
    expect(result).toMatchObject({
      ok: false,
      status: "indeterminate",
      reason: "repository_observation_schema_invalid",
      remoteWrites: 0,
    });
  });

  it("rejects an approval whose observed intent binding was changed", async () => {
    const input = fixture({
      approvals: [{ ...fixture().approvals[0], intentBindingDigest: sha("9") }],
    });
    const result = await admitPackPublication(input);
    expect(result).toMatchObject({
      ok: false,
      status: "denied",
      reason: "admission_approval_binding_mismatch",
      remoteWrites: 0,
      approvalConsumes: 0,
    });
  });
});
