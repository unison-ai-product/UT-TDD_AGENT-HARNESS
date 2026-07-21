import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { analyzePlanSupersession, parseSupersedePlan } from "../../src/lint/plan-supersession.js";
import { canonicalPlanContentDigest } from "../../src/plan-admission/diff-fence.js";
import { NodeAuthoringArtifactPublisher } from "../../src/plan-admission/node-authoring-artifact-publisher.js";
import { evaluatePlanAdmission } from "../../src/plan-admission/policy.js";
import { TRACKED_RECEIPT_SCHEMA } from "../../src/plan-admission/tracked-receipt-projection.js";
import { TrackedReceiptRenderer } from "../../src/plan-admission/tracked-receipt-renderer.js";
import { parseLegacyPlanSource } from "../../src/plan-asset/adapters/legacy-plan-inventory.js";
import {
  PlanRedesignBundleCoordinator,
  type RedesignBundleInput,
  redesignBundlePayloadDigest,
  redesignPublicationPayloadDigest,
} from "../../src/plan-asset/ledger/plan-redesign-bundle.js";
import type { AppendPlanRevisionInput } from "../../src/plan-asset/ledger/plan-revision-ledger.js";
import { ledgerRowDigest, migratePlanLedger } from "../../src/plan-asset/ledger/schema.js";
import { type HarnessDb, openHarnessDb } from "../../src/state-db/index.js";

const opened: ReturnType<typeof openHarnessDb>[] = [];
const roots: string[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Redesign bundle coordinator", () => {
  it("U-PA-REDESIGN-001: replacementとorigin correctionを一つのtransactionで確定する", () => {
    const { db, coordinator } = fixture();
    const result = coordinator.transact(bundle());

    expect(result).toMatchObject({ ok: true, replayed: false });
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(4);
    expect(Number(db.prepare("SELECT COUNT(*) n FROM append_command_receipts").get()?.n)).toBe(2);
  });

  it("U-PA-REDESIGN-002: 片肺publish faultは両revisionをrollbackする", () => {
    const { db, coordinator } = fixture();

    expect(coordinator.transact(bundle({ origin: { baseRevision: 0 } }))).toEqual({
      ok: false,
      ruleId: "plan-revision-input-invalid",
    });
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(2);
    expect(Number(db.prepare("SELECT COUNT(*) n FROM append_command_receipts").get()?.n)).toBe(0);
  });

  it("U-PA-REDESIGN-002B: group intent不整合はrevisionとpreparedを同じBEGINでrollbackする", () => {
    const { db, coordinator } = fixture();
    const input = bundle();
    const invalidGroup = {
      groupId: input.commandId,
      commandPayloadDigest: sha("wrong"),
      occurredAt: input.origin.occurredAt,
      members: [
        {
          memberId: "origin",
          artifactPath: input.origin.sourcePath,
          contentDigest: input.origin.contentDigest,
          expectedPreimage: { kind: "absent" as const },
        },
      ],
    };
    expect(
      coordinator.publishDurable(input, invalidGroup, {
        publish: () => ({ receiptDigest: sha("unused") }),
        acknowledge() {},
      }),
    ).toEqual({ ok: false, ruleId: "plan-redesign-publication-binding-invalid" });
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(2);
    expect(
      Number(db.prepare("SELECT COUNT(*) n FROM authoring_command_group_headers").get()?.n),
    ).toBe(0);
  });

  it("U-PA-REDESIGN-003: replayは両bindingが揃う場合だけ成功し、片肺改ざんを拒否する", () => {
    const { db, coordinator } = fixture();
    expect(coordinator.transact(bundle())).toMatchObject({ ok: true });
    expect(coordinator.transact(bundle())).toMatchObject({
      ok: true,
      replayed: true,
    });
    for (const row of db
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE ?")
      .all("%UPDATE ON append_command_receipts%")) {
      db.exec(`DROP TRIGGER ${String(row.name)}`);
    }
    db.prepare("UPDATE append_command_receipts SET result_ref = ? WHERE command_id = ?").run(
      "tampered",
      "redesign:98:origin",
    );
    expect(coordinator.transact(bundle())).toEqual({
      ok: false,
      ruleId: "plan-revision-receipt-binding-invalid",
    });
  });

  it.each([
    ["stale origin", { origin: { baseRevision: 0 } }, "plan-revision-input-invalid"],
    [
      "supersedes欠落",
      {
        replacementPayload: stable({
          plan_id: "PLAN-L6-88",
          title: "Snapshot runner performance redesign",
          kind: "redesign",
          layer: "L6",
          drive: "agent",
          route_signal: "regression_dev",
          route_mode: "redesign",
          status: "draft",
        }),
        replacementSource: source(
          {
            plan_id: "PLAN-L6-88",
            title: "Snapshot runner performance redesign",
            kind: "redesign",
            layer: "L6",
            drive: "agent",
            route_signal: "regression_dev",
            route_mode: "redesign",
            status: "draft",
          },
          "Replacement for PLAN-L4-31.\n",
        ),
      },
      "plan-redesign-bundle-supersedes-missing",
    ],
    [
      "back-reference欠落",
      {
        originSource: source(
          {
            plan_id: "PLAN-L4-31",
            title: "Test performance",
            kind: "design",
            layer: "L4",
            drive: "agent",
            route_signal: "forward",
            route_mode: "forward",
            status: "confirmed",
          },
          "origin correction only\n",
        ),
      },
      "plan-redesign-bundle-origin-back-reference-missing",
    ],
    [
      "bundle payload digest差替え",
      { commandDigest: sha("different") },
      "plan-redesign-bundle-binding-invalid",
    ],
  ])("U-PA-REDESIGN-004: %sをwrite前にfail-closeする", (_name, change, ruleId) => {
    const { db, coordinator } = fixture();
    expect(coordinator.transact(bundle(change))).toEqual({ ok: false, ruleId });
    expect(Number(db.prepare("SELECT COUNT(*) n FROM plan_revisions").get()?.n)).toBe(2);
  });

  it("U-PA-REDESIGN-005: #98のL4-31 rev2・L6-88・projectionを実filesystemへ一群publishし再起動replayする", () => {
    const root = join(process.cwd(), ".ut-tdd", `redesign-e2e-${randomUUID()}`);
    roots.push(root);
    mkdirSync(join(root, "docs", "plans"), { recursive: true });
    mkdirSync(join(root, "docs", "projections"), { recursive: true });
    const dbPath = join(root, ".ut-tdd", "ledger", "harness.db");
    mkdirSync(join(root, ".ut-tdd", "ledger"), { recursive: true });
    let db = openE2eDb(dbPath);
    const real = realTrackedBundle();
    seed(db, "plan:origin", real.input.origin.planId);
    seed(db, "plan:replacement", real.input.replacement.planId);
    const input = real.input;
    const projection = real.projection;
    const artifacts = [
      {
        memberId: "origin",
        path: input.origin.sourcePath,
        content: input.origin.sourceContent,
        expectedPreimage: { kind: "absent" as const },
      },
      {
        memberId: "replacement",
        path: input.replacement.sourcePath,
        content: input.replacement.sourceContent,
        expectedPreimage: { kind: "absent" as const },
      },
      {
        memberId: "projection",
        path: input.projection.path,
        content: projection,
        expectedPreimage: { kind: "absent" as const },
      },
    ];
    const group = {
      groupId: input.commandId,
      commandPayloadDigest: "",
      occurredAt: input.origin.occurredAt,
      members: artifacts.map((artifact) => ({
        memberId: artifact.memberId,
        artifactPath: artifact.path,
        contentDigest: sha(artifact.content),
        expectedPreimage: artifact.expectedPreimage,
      })),
    };
    group.commandPayloadDigest = redesignPublicationPayloadDigest(input, group.members);
    const result = new PlanRedesignBundleCoordinator(db).publishDurable(
      input,
      group,
      new NodeAuthoringArtifactPublisher({ rootDir: root, artifacts }),
    );
    expect(result).toMatchObject({ ok: true, replayed: false, publicationReplayed: false });
    expect(readFileSync(join(root, input.origin.sourcePath), "utf8")).toBe(
      input.origin.sourceContent,
    );
    expect(readFileSync(join(root, input.replacement.sourcePath), "utf8")).toBe(
      input.replacement.sourceContent,
    );
    expect(readFileSync(join(root, input.projection.path), "utf8")).toBe(projection);
    expect(
      evaluatePlanAdmission({
        routeSignal: "design_correction",
        routeMode: "redesign",
        kind: "design",
        layer: "L6",
        drive: "agent",
        branch: "work/redesign-test-performance",
        issue: {
          provider: "github",
          issueId: 98,
          episodeId: "E4-98",
          projectionDigest: `sha256:${sha(projection)}`,
        },
        origin: { planId: input.origin.planId, revision: 1, digest: `sha256:${sha("origin")}` },
        transitionDirection: "design_to_implementation",
        implementationDisposition: "discarded",
        reentry: { targetPlanId: input.origin.planId, targetRevision: 2, phase: "forward_merge" },
        implementationTarget: { targetPlanId: input.replacement.planId, targetRevision: 2 },
        escapeReason: "snapshot runner architecture requires redesign",
        supersedes: [input.origin.planId],
      }),
    ).toMatchObject({ ok: true });
    expect(
      analyzePlanSupersession([
        parseSupersedePlan(
          "PLAN-L4-31-nfr-verification-foundation-architecture.md",
          input.origin.sourceContent,
        ),
        parseSupersedePlan(
          "PLAN-L6-88-snapshot-runner-performance-redesign.md",
          input.replacement.sourceContent,
        ),
      ]),
    ).toMatchObject({ ok: true });
    db.close();
    opened.splice(opened.indexOf(db), 1);

    db = openE2eDb(dbPath);
    expect(
      new PlanRedesignBundleCoordinator(db).publishDurable(
        input,
        group,
        new NodeAuthoringArtifactPublisher({ rootDir: root, artifacts }),
      ),
    ).toMatchObject({ ok: true, replayed: true, publicationReplayed: true });
  });
});

function fixture() {
  const db = openHarnessDb(":memory:");
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
  seed(db, "plan:origin", "PLAN-L4-31");
  seed(db, "plan:replacement", "PLAN-L6-88");
  return { db, coordinator: new PlanRedesignBundleCoordinator(db) };
}

function seed(db: ReturnType<typeof openHarnessDb>, assetId: string, planId: string): void {
  db.prepare("INSERT INTO plan_assets VALUES (?, ?, ?, ?)").run(
    assetId,
    "2026-07-20T00:00:00.000Z",
    "a".repeat(40),
    "legacy-adopt-v1",
  );
  db.prepare("INSERT INTO plan_revisions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    assetId,
    1,
    '{"status":"draft"}',
    sha('{"status":"draft"}'),
    sha("body-v1"),
    `docs/plans/${planId}.md`,
    "a".repeat(40),
    "migration",
    "adopt",
    "2026-07-20T00:00:00.000Z",
  );
  const event = {
    alias_event_id: `alias:${assetId}:1`,
    asset_id: assetId,
    sequence: 1,
    command_id: `adopt:${assetId}`,
    command_payload_digest: sha(`adopt:${assetId}`),
    event_kind: "assigned",
    alias: planId,
    revision: 1,
    reason: "adopt",
    occurred_at: "2026-07-20T00:00:00.000Z",
  };
  const digest = ledgerRowDigest(event, "event_digest");
  db.prepare("INSERT INTO plan_alias_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    ...Object.values(event),
    digest,
  );
  db.prepare("INSERT INTO plan_aliases VALUES (?, ?, ?, ?, ?, ?)").run(
    `alias-current:${assetId}`,
    assetId,
    planId,
    1,
    null,
    digest,
  );
}

function bundle(change: Record<string, unknown> = {}): RedesignBundleInput {
  const replacementFrontmatter = {
    plan_id: "PLAN-L6-88",
    title: "Snapshot runner performance redesign",
    kind: "redesign",
    layer: "L6",
    drive: "agent",
    route_signal: "regression_dev",
    route_mode: "redesign",
    status: "draft",
    supersedes: ["PLAN-L4-31"],
  };
  const replacementPayload = String(change.replacementPayload ?? stable(replacementFrontmatter));
  const replacementSource = String(
    change.replacementSource ?? source(replacementFrontmatter, "Replacement for PLAN-L4-31.\n"),
  );
  const originFrontmatter = {
    plan_id: "PLAN-L4-31",
    title: "Test performance",
    kind: "design",
    layer: "L4",
    drive: "agent",
    route_signal: "forward",
    route_mode: "forward",
    status: "confirmed",
  };
  const originSource = String(
    change.originSource ?? source(originFrontmatter, "訂正: PLAN-L6-88 が後継として置換する。\n"),
  );
  const common = {
    baseRevision: 1,
    basePayloadDigest: sha('{"status":"draft"}'),
    bodyDigest: sha("body-v2"),
    sourceCommit: "b".repeat(40),
    actor: "codex",
    reason: "redesign",
    routeTupleDigest: sha("redesign|forward_merge"),
    occurredAt: "2026-07-21T00:00:00.000Z",
  };
  const input = {
    commandId: "redesign:98",
    replacement: {
      ...common,
      commandId: "redesign:98:replacement",
      assetId: "plan:replacement",
      planId: "PLAN-L6-88",
      canonicalPayloadJson: replacementPayload,
      contentDigest: unprefix(canonicalPlanContentDigest(replacementSource)),
      sourceContent: replacementSource,
      sourcePath: "docs/plans/PLAN-L6-88-snapshot-runner-performance-redesign.md",
      certificateId: "certificate:replacement",
    },
    origin: {
      ...common,
      ...(change.origin as object),
      commandId: "redesign:98:origin",
      assetId: "plan:origin",
      planId: "PLAN-L4-31",
      canonicalPayloadJson: stable(originFrontmatter),
      contentDigest: unprefix(canonicalPlanContentDigest(originSource)),
      sourceContent: originSource,
      sourcePath: "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md",
      certificateId: "certificate:origin",
    },
    reentry: {
      targetPlanId: "PLAN-L4-31",
      targetRevision: 2,
      phase: "forward_merge" as const,
    },
    projection: {
      path: "docs/projections/issue-98.json",
      contentDigest: sha(
        JSON.stringify({
          origin: "PLAN-L4-31@2",
          replacement: "PLAN-L6-88@2",
          drive_model: "redesign",
        }),
      ),
    },
  };
  return {
    ...input,
    commandPayloadDigest: String(change.commandDigest ?? redesignBundlePayloadDigest(input)),
  };
}

function realTrackedBundle(): { input: RedesignBundleInput; projection: string } {
  const originPath = "docs/plans/PLAN-L4-31-nfr-verification-foundation-architecture.md";
  const replacementPath = "docs/plans/PLAN-L6-88-snapshot-runner-performance-redesign.md";
  const projectionPath = "docs/governance/plan-admission-receipts.json";
  const originBase = readFileSync(originPath, "utf8");
  const parsedOrigin = parseLegacyPlanSource(originBase);
  if (!parsedOrigin) throw new Error("tracked L4-31 fixture invalid");
  const originPlanId = parsedOrigin.planId;
  const replacementPlanId = "PLAN-L6-88-snapshot-runner-performance-redesign";
  const originAdmission = {
    routeSignal: "feature_addition",
    routeMode: "add-feature" as const,
    kind: "add-design" as const,
    layer: "L4" as const,
    subDoc: "architecture" as const,
    drive: "agent" as const,
    branch: "work/add-feature-issue102-origin-correction",
    status: "draft" as const,
    issue: {
      provider: "github" as const,
      issueId: 102,
      episodeId: "E4-102",
      projectionDigest: `sha256:${sha("issue102")}`,
    },
    origin: { planId: originPlanId, revision: 1, digest: `sha256:${sha("origin-r1")}` },
    reentry: { targetPlanId: originPlanId, targetRevision: 2, phase: "forward_merge" as const },
    escapeReason: "redesign origin correction back-reference",
  };
  const replacementAdmission = {
    routeSignal: "design_correction",
    routeMode: "redesign" as const,
    kind: "design" as const,
    layer: "L6" as const,
    subDoc: "function-spec" as const,
    drive: "agent" as const,
    branch: "work/redesign-test-performance",
    status: "draft" as const,
    issue: {
      provider: "github" as const,
      issueId: 98,
      episodeId: "E4-98",
      projectionDigest: `sha256:${sha("issue98")}`,
    },
    origin: { planId: originPlanId, revision: 1, digest: `sha256:${sha("origin-r1")}` },
    transitionDirection: "design_to_implementation" as const,
    implementationDisposition: "discarded" as const,
    reentry: { targetPlanId: originPlanId, targetRevision: 2, phase: "forward_merge" as const },
    implementationTarget: { targetPlanId: replacementPlanId, targetRevision: 2 },
    escapeReason: "snapshot runner performance architecture requires redesign",
    supersedes: [originPlanId],
  };
  const originPreReceipt = `---\n${stringify(parsedOrigin.frontmatter)}---\n${parsedOrigin.body}\n\n訂正: ${replacementPlanId} が本設計を差し替える。\n`;
  const replacementFrontmatter = {
    ...parsedOrigin.frontmatter,
    plan_id: replacementPlanId,
    title: "PLAN-L6-88 snapshot runner performance redesign",
    kind: "design",
    layer: "L6",
    sub_doc: "function-spec",
    drive: "agent",
    status: "draft",
    route_signal: "design_correction",
    route_mode: "redesign",
    github_issue_id: 98,
    supersedes: [originPlanId],
  };
  const replacementPreReceipt = `---\n${stringify(replacementFrontmatter)}---\n# PLAN-L6-88\n\n${replacementPlanId} supersedes ${originPlanId}.\n`;
  const emptyProjection = `${JSON.stringify({ schema_version: TRACKED_RECEIPT_SCHEMA, records: [] }, null, 2)}\n`;
  const originCommand = receiptCommand({
    commandId: "redesign:98:origin",
    planId: originPlanId,
    sourcePath: originPath,
    sourceContent: originPreReceipt,
    projectionPath,
    admission: originAdmission,
  });
  const originReceipt = receipt(
    "plan:origin",
    "certificate:origin",
    originCommand.commandPayloadDigest,
  );
  const originRendered = new TrackedReceiptRenderer({ read: () => emptyProjection }).render(
    originCommand,
    originReceipt,
  );
  const replacementCommand = receiptCommand({
    commandId: "redesign:98:replacement",
    planId: replacementPlanId,
    sourcePath: replacementPath,
    sourceContent: replacementPreReceipt,
    projectionPath,
    admission: replacementAdmission,
  });
  const replacementReceipt = receipt(
    "plan:replacement",
    "certificate:replacement",
    replacementCommand.commandPayloadDigest,
  );
  const replacementRendered = new TrackedReceiptRenderer({
    read: () => originRendered[1].content,
  }).render(replacementCommand, replacementReceipt);
  const originSource = originRendered[0].content;
  const replacementSource = replacementRendered[0].content;
  const projection = replacementRendered[1].content;
  const common = {
    baseRevision: 1,
    basePayloadDigest: sha('{"status":"draft"}'),
    sourceCommit: "b".repeat(40),
    actor: "codex",
    reason: "redesign",
    routeTupleDigest: sha("redesign|forward_merge"),
    occurredAt: "2026-07-21T00:00:00.000Z",
  };
  const withoutDigest = {
    commandId: "redesign:98",
    replacement: revisionInput(
      common,
      replacementPlanId,
      replacementPath,
      replacementSource,
      "plan:replacement",
      "certificate:replacement",
    ),
    origin: revisionInput(
      common,
      originPlanId,
      originPath,
      originSource,
      "plan:origin",
      "certificate:origin",
    ),
    reentry: { targetPlanId: originPlanId, targetRevision: 2, phase: "forward_merge" as const },
    projection: { path: projectionPath, contentDigest: sha(projection) },
  };
  return {
    input: { ...withoutDigest, commandPayloadDigest: redesignBundlePayloadDigest(withoutDigest) },
    projection,
  };
}

function receiptCommand(input: {
  commandId: string;
  planId: string;
  sourcePath: string;
  sourceContent: string;
  projectionPath: string;
  admission: Parameters<typeof evaluatePlanAdmission>[0];
}) {
  return {
    commandId: input.commandId,
    commandPayloadDigest: `sha256:${sha(input.commandId)}` as `sha256:${string}`,
    planId: input.planId,
    recordedAt: "2026-07-21T00:00:00.000Z",
    payload: { admission: input.admission },
    source: { path: input.sourcePath, content: input.sourceContent },
    projectionPath: input.projectionPath,
  };
}

function receipt(assetId: string, certificateId: string, commandPayloadDigest: `sha256:${string}`) {
  return {
    assetId,
    revision: 2,
    certificateId,
    certificateDigest: sha(certificateId),
    commandPayloadDigest,
  };
}

function revisionInput(
  common: Pick<
    AppendPlanRevisionInput,
    | "baseRevision"
    | "basePayloadDigest"
    | "sourceCommit"
    | "actor"
    | "reason"
    | "routeTupleDigest"
    | "occurredAt"
  >,
  planId: string,
  sourcePath: string,
  sourceContent: string,
  assetId: string,
  certificateId: string,
) {
  const parsed = parseLegacyPlanSource(sourceContent);
  if (!parsed) throw new Error("rendered PLAN invalid");
  const { admission_receipt: _receipt, ...frontmatter } = parsed.frontmatter;
  return {
    ...common,
    commandId: `redesign:98:${assetId === "plan:origin" ? "origin" : "replacement"}`,
    assetId,
    planId,
    canonicalPayloadJson: stable(frontmatter),
    contentDigest: unprefix(canonicalPlanContentDigest(sourceContent)),
    bodyDigest: sha(parsed.body),
    sourcePath,
    sourceContent,
    certificateId,
  };
}

function source(frontmatter: Record<string, unknown>, body: string): string {
  const lines = Object.entries(frontmatter).flatMap(([key, value]) =>
    Array.isArray(value)
      ? [`${key}:`, ...value.map((item) => `  - ${item}`)]
      : [`${key}: ${value}`],
  );
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function openE2eDb(path: string): HarnessDb {
  const db = openHarnessDb(path);
  opened.push(db);
  expect(migratePlanLedger(db)).toEqual({ ok: true, version: 7 });
  return db;
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function unprefix(value: string | undefined): string {
  return value?.startsWith("sha256:") ? value.slice(7) : (value ?? "");
}
