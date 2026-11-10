import { expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import type { GithubWorkflowDoc } from "../../src/lint/github-ci-policy.ts";
import { admitReviewCustody, computeReceiptDigest, decodeReviewCustodyReceipt } from "../../src/feedback/review-custody.ts";
import { canonicalize } from "../../src/feedback/review-custody-canonical.ts";
import { issueCustodyReceipt, type RunnerEnvironment } from "../../src/feedback/review-custody-runner.ts";
export function registerPlanret016Oracle(sourceDocs: GithubWorkflowDoc[], attestation: GithubWorkflowDoc): void {
  it.fails("CANDIDATE-U-PLANRET-016: review-attestation dispatch binds custody to a required PR", () => {
    const workflow = parseYaml(attestation.content) as {
      on?: { workflow_dispatch?: { inputs?: Record<string, { required?: boolean }> } };
    };
    const dispatch = workflow.on?.workflow_dispatch;
    expect(dispatch?.inputs?.pr?.required).toBe(true);
    expect(Object.keys(dispatch?.inputs ?? {})).toEqual(["pr"]);
    for (const doc of sourceDocs) {
      const parsed = parseYaml(doc.content) as {
        env?: Record<string, unknown>;
        jobs?: Record<string, { env?: Record<string, unknown>; steps?: { env?: Record<string, unknown> }[] }>;
      };
      const environments = [
        parsed.env ?? {},
        ...Object.values(parsed.jobs ?? {}).flatMap((job) => [
          job.env ?? {},
          ...(job.steps ?? []).map((step) => step.env ?? {}),
        ]),
      ];
      for (const env of environments) {
        expect(env).not.toHaveProperty("UT_TDD_CUSTODY_PLAN_ID");
        expect(env).not.toHaveProperty("UT_TDD_CUSTODY_PLAN_REVISION");
      }
    }
  });
}

function v2TextFromV1(text: string): string {
  const receipt = JSON.parse(text) as Record<string, unknown>;
  delete receipt.planId;
  delete receipt.planRevision;
  receipt.schemaVersion = "review-custody/v2";
  const digest = computeReceiptDigest(receipt);
  if (!digest) throw new Error("could not digest custody v2 fixture");
  receipt.receiptDigest = digest;
  const canonical = canonicalize(receipt);
  if (!canonical.ok) throw new Error("could not canonicalize custody v2 fixture");
  return canonical.value;
}

type Admission = Parameters<typeof admitReviewCustody>[0];
type Expectation = Admission["expected"];
type AdmissionFactory = (overrides?: Partial<Admission>) => Admission;
type ExpectationFactory = (overrides?: Partial<Expectation>) => Expectation;

export function registerPlanret007DecoderOracle(input: {
  buildText: () => string;
  admissionInput: AdmissionFactory;
  expectation: ExpectationFactory;
}): void {
  it.fails("CANDIDATE-U-PLANRET-007: custody v2 はPLAN fieldなしで受理し、PR番号を束縛する", async () => {
    const text = v2TextFromV1(input.buildText());
    const receipt = JSON.parse(text) as Record<string, unknown>;
    expect(receipt).not.toHaveProperty("planId");
    expect(receipt).not.toHaveProperty("planRevision");
    expect(decodeReviewCustodyReceipt(text).ok).toBe(true);
    const withPlan: Record<string, unknown> = {
      ...receipt,
      planId: "PLAN-L7-451-retired",
      planRevision: "5".repeat(64),
    };
    const withPlanDigest = computeReceiptDigest(withPlan);
    if (!withPlanDigest) throw new Error("could not digest unknown-field receipt fixture");
    withPlan.receiptDigest = withPlanDigest;
    expect(computeReceiptDigest(withPlan)).toBe(withPlanDigest);
    const canonicalWithPlan = canonicalize(withPlan);
    if (!canonicalWithPlan.ok) throw new Error("could not canonicalize unknown-field receipt fixture");
    expect(decodeReviewCustodyReceipt(canonicalWithPlan.value)).toMatchObject({
      ok: false,
      reason: "receipt_corrupt",
      detail: "receipt_field_set_mismatch",
    });
    const mismatch = await admitReviewCustody(
      input.admissionInput({
        receiptText: text,
        expected: input.expectation({ prNumber: 284 }),
      }),
    );
    expect(mismatch).toMatchObject({ state: "custody_rejected", reasons: ["identity_mismatch"] });
  });
}

export function registerPlanret007RunnerOracle(
  createFixture: () => { env: RunnerEnvironment; written: () => string | null },
): void {
  it.fails("CANDIDATE-U-PLANRET-007: runnerはPLAN環境変数なしでPR custody receiptを発行する", () => {
    const fixture = createFixture();
    expect(issueCustodyReceipt(fixture.env)).toMatchObject({ exitCode: 0 });
    const receipt = JSON.parse(fixture.written() ?? "{}") as Record<string, unknown>;
    expect(receipt.schemaVersion).toBe("review-custody/v2");
    expect(receipt).not.toHaveProperty("planId");
    expect(receipt).not.toHaveProperty("planRevision");
  });
}


export function registerPlanret007Oracles(input: {
  buildText: () => string;
  admissionInput: AdmissionFactory;
  expectation: ExpectationFactory;
  createRunnerFixture: () => { env: RunnerEnvironment; written: () => string | null };
}): void {
  registerPlanret007DecoderOracle(input);
  registerPlanret007RunnerOracle(input.createRunnerFixture);
}
