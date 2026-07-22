import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  assemblePlanRedesignBundleManifest,
  type PlanRedesignAssemblyInput,
  validatePlanRedesignBundleManifest,
} from "../src/plan-admission/plan-redesign-command-assembler.js";
import type { PlanAdmissionRequest } from "../src/plan-admission/policy.js";

const digest = "a".repeat(64);
const originAdmission: PlanAdmissionRequest = {
  routeSignal: "forward",
  routeMode: "forward",
  kind: "design",
  layer: "L6",
  drive: "agent",
  branch: "work/forward-redesign-origin",
};
const replacementAdmission: PlanAdmissionRequest = {
  routeSignal: "redesign",
  routeMode: "redesign",
  kind: "design",
  layer: "L6",
  drive: "agent",
  branch: "work/redesign-replacement",
  transitionDirection: "design_to_implementation",
  implementationDisposition: "discarded",
  implementationTarget: { targetPlanId: "PLAN-L7-2", targetRevision: 1 },
  supersedes: ["PLAN-L6-1"],
  issue: { provider: "github", issueId: 102, episodeId: "E4-102", projectionDigest: digest },
  origin: { planId: "PLAN-L6-1", revision: 1, digest },
  reentry: { targetPlanId: "PLAN-L6-1", targetRevision: 2, phase: "forward_merge" },
  escapeReason: "redesign replacement",
};

function source(planId: string): string {
  return `---\nplan_id: ${planId}\nkind: design\nlayer: L6\ndrive: agent\nroute_signal: recovery\nroute_mode: recovery\n---\nbody\n`;
}

function fixture(): PlanRedesignAssemblyInput {
  return {
    commandId: "redesign:1",
    repositoryIdentity: "owner/repository",
    sourceCommit: "b".repeat(40),
    actor: "codex",
    occurredAt: "2026-07-17T10:00:00.000Z",
    origin: {
      assetId: "asset:origin",
      planId: "PLAN-L6-1",
      baseRevision: 1,
      basePayloadDigest: digest,
      sourcePath: "docs/plans/PLAN-L6-1.md",
      sourceContent: source("PLAN-L6-1"),
      admission: originAdmission,
      expectedPreimage: { kind: "sha256", digest: `sha256:${digest}` },
    },
    replacement: {
      assetId: "asset:replacement",
      planId: "PLAN-L6-2",
      baseRevision: 1,
      basePayloadDigest: digest,
      sourcePath: "docs/plans/PLAN-L6-2.md",
      sourceContent: source("PLAN-L6-2"),
      admission: replacementAdmission,
      expectedPreimage: { kind: "absent" },
    },
    reentry: { targetPlanId: "PLAN-L6-1", targetRevision: 2, phase: "forward_merge" },
    projection: {
      path: "docs/governance/plan-admission-receipts.json",
      content: "{}",
      expected_preimage: { kind: "sha256", digest: `sha256:${digest}` },
    },
    pairs: [
      { path: "docs/test-design/pair.md", content: "pair", expected_preimage: { kind: "absent" } },
    ],
    upstream: [],
  };
}

describe("redesign bundle manifest assembler", () => {
  it("HEAD/project/ledger/source/admission/renderer/preimage snapshotから全fieldを決定論生成する", () => {
    const first = assemblePlanRedesignBundleManifest(fixture());
    const second = assemblePlanRedesignBundleManifest(fixture());
    expect(first).toEqual(second);
    expect(first.origin.admission).toEqual(originAdmission);
    expect(first.replacement.admission).toEqual({
      ...replacementAdmission,
      issue: replacementAdmission.issue,
      origin: { planId: "PLAN-L6-1", revision: 1, digest: `sha256:${digest}` },
      reentry: fixture().reentry,
    });
    expect(first.origin.route_tuple_digest).not.toBe(digest);
    expect(first.origin.certificate_id).toMatch(/^certificate:/);
  });

  it("replacement admissionを実origin/reentry/projection snapshotへcross-bindする", () => {
    const input = fixture();
    const manifest = assemblePlanRedesignBundleManifest({
      ...input,
      replacement: {
        ...input.replacement,
        admission: {
          ...input.replacement.admission,
          origin: { planId: "PLAN-L6-forged", revision: 99, digest: `sha256:${"f".repeat(64)}` },
          reentry: { targetPlanId: "PLAN-L6-forged", targetRevision: 99, phase: "forward_merge" },
          issue: {
            provider: "github",
            issueId: 102,
            episodeId: "E4-102",
            projectionDigest: `sha256:${"e".repeat(64)}`,
          },
        },
      },
    });

    expect(manifest.replacement.admission.origin).toEqual({
      planId: input.origin.planId,
      revision: input.origin.baseRevision,
      digest: `sha256:${digest}`,
    });
    expect(manifest.replacement.admission.reentry).toEqual(input.reentry);
    expect(manifest.replacement.admission.issue?.projectionDigest).toBe(`sha256:${"e".repeat(64)}`);
  });

  it.each([
    ["別PLAN", { origin: { planId: "PLAN-L6-forged", revision: 1, digest: `sha256:${digest}` } }],
    ["別revision", { origin: { planId: "PLAN-L6-1", revision: 2, digest: `sha256:${digest}` } }],
    [
      "別origin digest",
      { origin: { planId: "PLAN-L6-1", revision: 1, digest: `sha256:${"f".repeat(64)}` } },
    ],
    [
      "別reentry",
      { reentry: { targetPlanId: "PLAN-L6-1", targetRevision: 3, phase: "forward_merge" } },
    ],
  ] as const)("policy-validな%s substitutionをrunner境界で拒否する", (_label, substitution) => {
    const manifest = assemblePlanRedesignBundleManifest(fixture());
    expect(() =>
      validatePlanRedesignBundleManifest({
        ...manifest,
        replacement: {
          ...manifest.replacement,
          admission: { ...manifest.replacement.admission, ...substitution },
        },
      }),
    ).toThrow("plan-redesign-admission-cross-binding-invalid");
  });

  it("IssueProjected証跡digestをtracked receipt projection全文digestへ上書きしない", () => {
    const input = fixture();
    const manifest = assemblePlanRedesignBundleManifest({
      ...input,
      projection: { ...input.projection, content: '{"changed":true}' },
    });
    expect(manifest.replacement.admission.issue?.projectionDigest).toBe(digest);
  });

  it("runner境界はpolicyを再評価しroute digest/certificateの自己申告偽装を拒否する", () => {
    const manifest = assemblePlanRedesignBundleManifest(fixture());
    expect(() =>
      validatePlanRedesignBundleManifest({
        ...manifest,
        origin: { ...manifest.origin, route_tuple_digest: digest },
      }),
    ).toThrow("plan-redesign-route-tuple-digest-mismatch");
    expect(() =>
      validatePlanRedesignBundleManifest({
        ...manifest,
        replacement: { ...manifest.replacement, certificate_id: "certificate:forged" },
      }),
    ).toThrow("plan-redesign-certificate-id-mismatch");
    expect(() =>
      validatePlanRedesignBundleManifest({
        ...manifest,
        origin: {
          ...manifest.origin,
          admission: { ...manifest.origin.admission, kind: "charter" },
        },
      }),
    ).toThrow("plan-redesign-admission-invalid");
  });

  it("legacy origin bootstrapのidentity/provenanceを決定論生成してrev2入力へ束縛する", () => {
    const input = fixture();
    const baseSource = source("PLAN-L6-1");
    const identityInput = JSON.stringify([input.repositoryIdentity, input.origin.planId]);
    const manifest = assemblePlanRedesignBundleManifest({
      ...input,
      origin: {
        ...input.origin,
        revisionMode: "legacy_bootstrap",
        bootstrap: {
          repositoryIdentity: input.repositoryIdentity,
          identityAlgorithm: "ut-tdd-plan-legacy-v1",
          identityDigest: hash(identityInput),
          sourceBlobOid: "c".repeat(40),
          sourceContent: baseSource,
          sourceContentDigest: hash(baseSource),
          sourceCommit: "a".repeat(40),
        },
      },
    });
    expect(manifest.origin).toMatchObject({
      revision_mode: "legacy_bootstrap",
      base_revision: 1,
      bootstrap: {
        repository_identity: "owner/repository",
        identity_algorithm: "ut-tdd-plan-legacy-v1",
        identity_input_json: identityInput,
        identity_digest: hash(identityInput),
        base_source_blob_oid: "c".repeat(40),
        base_source_content_digest: hash(baseSource),
      },
    });
    expect(validatePlanRedesignBundleManifest(manifest)).toBe(manifest);
  });
});

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
