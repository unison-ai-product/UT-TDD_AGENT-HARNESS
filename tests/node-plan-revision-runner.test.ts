import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanRevisionManifest } from "../src/cli/plan-revise.js";
import { NodeAtomicDraftPublisher } from "../src/plan-admission/node-atomic-draft-publisher.js";
import { NodePlanRevisionRunner } from "../src/plan-admission/node-plan-revision-runner.js";
import { canonicalPlanPayload } from "../src/plan-admission/plan-revision-command-assembler.js";
import { evaluatePlanAdmission, type PlanAdmissionRequest } from "../src/plan-admission/policy.js";
import { migratePlanLedger } from "../src/plan-asset/ledger/schema.js";
import { openHarnessDb } from "../src/state-db/index.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("NodePlanRevisionRunner", () => {
  it("U-PA-REV-016: adopt済みNをN+1へ発行しpublisherへsource/projection CASを渡す", () => {
    const f = fixture("adopted");
    const stage = vi.spyOn(f.publisher, "stage");
    const result = f.runner.run(f.input);

    expect(result).toMatchObject({ status: "created", receipt: { revision: 2 } });
    expect(stage).toHaveBeenCalledWith([
      expect.objectContaining({
        path: f.manifest.source.path,
        expectedPreimage: { kind: "sha256", digest: f.manifest.base.source_content_digest },
      }),
      expect.objectContaining({
        path: f.manifest.projection.path,
        expectedPreimage: { kind: "sha256", digest: sha(f.oldProjection) },
      }),
    ]);
    expect(readFileSync(join(f.root, f.manifest.source.path), "utf8")).toContain("Revised");
    expect(f.close).toHaveBeenCalledOnce();
  });

  it("U-PA-REV-017: ledger未採用legacy PLANをrev1 bootstrapとrev2で同時発行する", () => {
    const f = fixture("legacy");
    expect(f.runner.run(f.input)).toMatchObject({ status: "created", receipt: { revision: 2 } });
    expect(rows(f.db, "plan_assets")).toBe(1);
    expect(rows(f.db, "plan_revisions")).toBe(2);
    expect(rows(f.db, "plan_aliases")).toBe(1);
    expect(rows(f.db, "append_command_receipts")).toBe(1);
  });

  it.each([
    ["source commit", { sourceCommit: "e".repeat(40) }, "plan-revision-source-commit-drift"],
    ["source blob", { sourceBlobOid: "e".repeat(40) }, "plan-revision-source-blob-drift"],
    ["source content", { sourceText: "concurrent source" }, "plan-revision-source-content-drift"],
    ["HEAD source", { headSource: "different HEAD source" }, "plan-revision-head-content-drift"],
    [
      "projection tail",
      { projectionText: '{"schema_version":"v2","records":[]}\n' },
      "plan-revision-projection-tail-drift",
    ],
  ])("U-PA-REV-018: %s driftはwrite 0でfail-closeする", (_name, drift, ruleId) => {
    const f = fixture("adopted", drift);
    const before = writeSet(f.db);
    expect(() => f.runner.run(f.input)).toThrow(ruleId);
    expect(writeSet(f.db)).toEqual(before);
    expect(f.close).toHaveBeenCalledOnce();
  });

  it("U-PA-REV-021: invalid projectionはtail fallbackせずwrite 0で拒否する", () => {
    const f = fixture("adopted", { projectionText: "not-json" });
    const before = writeSet(f.db);
    expect(() => f.runner.run(f.input)).toThrow("plan-revision-projection-invalid");
    expect(writeSet(f.db)).toEqual(before);
  });

  it("U-PA-REV-022: caller decisionと再評価結果の不一致はwrite 0で拒否する", () => {
    const f = fixture("adopted");
    const forged = { ...f.input, decision: { ...f.input.decision, issueRequired: false } };
    expect(() => f.runner.run(forged)).toThrow("plan-revision-admission-decision-mismatch");
    expect(writeSet(f.db)).toEqual(f.before);
  });

  it("U-PA-REV-023: manifestとcaller admissionの不一致はwrite 0で拒否する", () => {
    const f = fixture("adopted");
    const admission = { ...f.input.admission, escapeReason: "forged" };
    expect(() => f.runner.run({ ...f.input, admission })).toThrow(
      "plan-revision-manifest-admission-mismatch",
    );
    expect(writeSet(f.db)).toEqual(f.before);
  });

  it("U-PA-REV-024: repository identity未注入はpath由来へfallbackしない", () => {
    const f = fixture("legacy", { omitRepositoryIdentity: true });
    expect(() => f.runner.run(f.input)).toThrow("plan-revision-repository-identity-required");
    expect(writeSet(f.db)).toEqual(f.before);
  });

  it("U-PA-REV-019: active aliasの別asset束縛はwrite 0で拒否する", () => {
    const f = fixture("alias-mismatch");
    const before = writeSet(f.db);
    expect(() => f.runner.run(f.input)).toThrow("plan-revision-alias-binding-invalid");
    expect(writeSet(f.db)).toEqual(before);
    expect(f.close).toHaveBeenCalledOnce();
  });

  it("U-PA-REV-020: publish失敗でもrollbackしてDBをcloseする", () => {
    const f = fixture("adopted");
    vi.spyOn(f.publisher, "publish").mockImplementation(() => {
      throw new Error("publish-failed");
    });
    const before = writeSet(f.db);
    expect(() => f.runner.run(f.input)).toThrow("publish-failed");
    expect(writeSet(f.db)).toEqual(before);
    expect(f.close).toHaveBeenCalledOnce();
  });
});

type Mode = "adopted" | "legacy" | "alias-mismatch";
type Drift = Partial<{
  sourceCommit: string;
  sourceBlobOid: string;
  sourceText: string;
  projectionText: string;
  headSource: string;
  omitRepositoryIdentity: boolean;
}>;

function fixture(mode: Mode, drift: Drift = {}) {
  const root = join(tmpdir(), `ut-tdd-plan-revision-runner-${process.pid}-${roots.length}`);
  roots.push(root);
  mkdirSync(join(root, "docs", "plans"), { recursive: true });
  mkdirSync(join(root, "docs", "governance"), { recursive: true });
  const planId = "PLAN-L4-31";
  const sourcePath = `docs/plans/${planId}.md`;
  const projectionPath = "docs/governance/plan-admission-receipts.json" as const;
  const oldSource = `---\nplan_id: ${planId}\ntitle: Base\nkind: design\ndrive: agent\nstatus: confirmed\nlayer: L4\nroute_signal: forward\nroute_mode: forward\nagent_slots: []\ngenerates: []\ndependencies:\n  parent: null\n  requires: []\n  references: []\n  blocks: []\n---\n\n# Base\n`;
  const oldProjection = '{"schema_version":"ut-tdd.plan-admission-receipts/v1","records":[]}\n';
  writeFileSync(join(root, sourcePath), drift.sourceText ?? oldSource, "utf8");
  writeFileSync(join(root, projectionPath), drift.projectionText ?? oldProjection, "utf8");
  const sourceCommit = "a".repeat(40);
  const sourceBlobOid = "b".repeat(40);
  const assetId = "plan:adopted";
  const basePayload = canonicalPlanPayload(oldSource).payload;
  const admission: PlanAdmissionRequest = {
    routeSignal: "design_correction",
    routeMode: "redesign",
    kind: "design",
    layer: "L4",
    drive: "agent",
    branch: "work/redesign-plan-31",
    status: "draft",
    issue: {
      provider: "github",
      issueId: 102,
      episodeId: "E4-102",
      projectionDigest: sha("issue"),
    },
    origin: { planId, revision: 1, digest: sha(basePayload) },
    transitionDirection: "design_to_implementation",
    implementationDisposition: "discarded",
    reentry: { targetPlanId: planId, targetRevision: 2, phase: "forward_merge" },
    implementationTarget: { targetPlanId: "PLAN-L7-31", targetRevision: 1 },
    escapeReason: "design replacement",
    supersedes: [planId],
  };
  const decision = evaluatePlanAdmission(admission);
  if (!decision.ok) throw new Error(`fixture admission invalid: ${decision.violations.join(",")}`);
  const manifest: PlanRevisionManifest = {
    version: 1,
    command_id: "command:revise-node-31",
    plan_id: planId,
    recorded_at: "2026-07-17T00:00:00.000Z",
    base: {
      asset_id: assetId,
      revision: 1,
      revision_digest: sha(basePayload),
      source_commit: sourceCommit,
      source_blob_oid: sourceBlobOid,
      source_content_digest: sha(oldSource),
      projection_tail_digest: sha("null"),
    },
    admission: {
      route_signal: admission.routeSignal,
      route_mode: admission.routeMode,
      kind: admission.kind,
      layer: admission.layer,
      drive: admission.drive,
      branch: admission.branch,
      status: admission.status,
      issue: {
        provider: "github",
        issue_id: 102,
        episode_id: "E4-102",
        projection_digest: sha("issue"),
      },
      origin: { plan_id: planId, revision: 1, digest: sha(basePayload) },
      transition_direction: "design_to_implementation",
      implementation_disposition: "discarded",
      reentry: { target_plan_id: planId, target_revision: 2, phase: "forward_merge" },
      implementation_target: { target_plan_id: "PLAN-L7-31", target_revision: 1 },
      escape_reason: "design replacement",
      supersedes: [planId],
    },
    source: { path: sourcePath, content: oldSource.replace("title: Base", "title: Revised") },
    projection: { path: projectionPath },
  };
  const db = openHarnessDb(":memory:");
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 4 });
  if (mode !== "legacy") seedAdopted(db, assetId, planId, basePayload, mode === "alias-mismatch");
  // close境界の呼出しを観測しつつ、write-set assertionまではin-memory DBを保持する。
  const close = vi.spyOn(db, "close").mockImplementation(() => undefined);
  const publisher = new NodeAtomicDraftPublisher({ rootDir: root });
  const runner = new NodePlanRevisionRunner({
    repoRoot: root,
    sourceCommit: () => drift.sourceCommit ?? sourceCommit,
    sourceBlobOid: () => drift.sourceBlobOid ?? sourceBlobOid,
    actor: () => "codex",
    readText: (path: string) => readFileSync(path, "utf8"),
    headText: () => drift.headSource ?? oldSource,
    ...(drift.omitRepositoryIdentity ? {} : { repositoryIdentity: () => "repo:test" }),
    openDb: () => db,
    publisher: () => publisher,
  });
  const before = writeSet(db);
  return {
    root,
    db,
    close,
    publisher,
    runner,
    manifest,
    oldProjection,
    before,
    input: { manifest, admission, decision },
  };
}

function seedAdopted(
  db: ReturnType<typeof openHarnessDb>,
  assetId: string,
  planId: string,
  payload: string,
  mismatch: boolean,
) {
  const bound = mismatch ? "plan:other" : assetId;
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    assetId,
    "2026-07-15T00:00:00.000Z",
    "a".repeat(40),
    "legacy-adopt-v1",
  );
  if (mismatch)
    db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
      bound,
      "2026-07-15T00:00:00.000Z",
      "a".repeat(40),
      "legacy-adopt-v1",
    );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    assetId,
    1,
    payload,
    sha(payload).slice(7),
    sha("body").slice(7),
    `docs/plans/${planId}.md`,
    "a".repeat(40),
    "migration",
    "adopt",
    "2026-07-15T00:00:00.000Z",
  );
  if (mismatch)
    db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      bound,
      1,
      payload,
      sha(payload).slice(7),
      sha("other-body").slice(7),
      `docs/plans/${planId}.md`,
      "a".repeat(40),
      "migration",
      "adopt",
      "2026-07-15T00:00:00.000Z",
    );
  db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
    `alias:${bound}`,
    bound,
    planId,
    1,
    null,
    sha("alias").slice(7),
  );
}

function rows(db: ReturnType<typeof openHarnessDb>, table: string) {
  return Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n);
}
function writeSet(db: ReturnType<typeof openHarnessDb>) {
  return [
    "plan_assets",
    "plan_revisions",
    "plan_aliases",
    "plan_admission_events",
    "plan_admission_receipts",
    "append_command_receipts",
  ].map((table) => rows(db, table));
}
function sha(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
