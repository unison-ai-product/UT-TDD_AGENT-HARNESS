import { createHash } from "node:crypto";
import {
  buildLegacyPlanInventory,
  type LegacyPlanCollisionGroup,
  type LegacyPlanInventoryItem,
} from "../adapters/legacy-plan-inventory.js";
import { validateMigrationFields } from "../domain/legacy-migration.js";
import {
  MIGRATION_REVIEW_PLAN_ID,
  REVIEWED_REKEY_DECISIONS,
} from "./legacy-migration-decision-manifest.js";

export type MigrationPreviewDecision = "migrated" | "rekeyed" | "rejected" | "pending";

export interface MigrationDecisionProposal {
  readonly legacyPlanId: string;
  readonly decision: MigrationPreviewDecision;
  readonly resolvedAlias: string | null;
  readonly collisionGroup: string | null;
  readonly lossFields: readonly string[];
  readonly reason: string;
  readonly reviewPlanId: string | null;
}

export interface MigrationDryRunFinding {
  readonly ruleId: string;
  readonly legacyPlanId: string | null;
  readonly message: string;
}

export interface MigrationDryRunRecord extends MigrationDecisionProposal {
  readonly sourcePath: string;
  readonly assetId: string;
  readonly sourceCommit: string;
  readonly sourceBlobOid: string;
  readonly sourceContentDigest: string;
  readonly findings: readonly MigrationDryRunFinding[];
}

export interface MigrationDryRunReport {
  readonly schemaVersion: 1;
  readonly ok: boolean;
  readonly repositoryIdentity: string;
  readonly sourceCommit: string;
  readonly inventoryDigest: string;
  readonly reportDigest: string;
  readonly total: number;
  readonly emitted: number;
  readonly decisionCounts: Readonly<Record<MigrationPreviewDecision, number>>;
  readonly collisionGroups: number;
  readonly collisionItems: number;
  readonly records: readonly MigrationDryRunRecord[];
  readonly findings: readonly MigrationDryRunFinding[];
}

export interface MigrationDecisionPort {
  decide(
    item: LegacyPlanInventoryItem,
    collision: LegacyPlanCollisionGroup | null,
  ): MigrationDecisionProposal;
}

export class LegacyMigrationDryRun {
  constructor(private readonly decisions: MigrationDecisionPort = new ReviewedDecisionManifest()) {}

  run(repoRoot: string): MigrationDryRunReport | { readonly ok: false; readonly ruleId: string } {
    const inventory = buildLegacyPlanInventory(repoRoot);
    if (!inventory.ok) return { ok: false, ruleId: inventory.error.ruleId };
    const collisionByPlan = new Map(
      inventory.value.collisionGroups.flatMap((group) =>
        group.planIds.map((planId) => [planId, group] as const),
      ),
    );
    const records = inventory.value.items.map((item) =>
      record(item, this.decisions.decide(item, collisionByPlan.get(item.legacyPlanId) ?? null)),
    );
    const findings = [
      ...manifestFindings(inventory.value.collisionGroups),
      ...records.flatMap((item) => item.findings),
    ];
    if (new Set(records.map((item) => item.legacyPlanId)).size !== inventory.value.items.length) {
      findings.push(
        finding("plan-migration-preview-not-bijective", null, "inventory/preview bijection failed"),
      );
    }
    const decisionCounts = counts(records);
    const projection = {
      schemaVersion: 1 as const,
      repositoryIdentity: inventory.value.repositoryIdentity,
      sourceCommit: inventory.value.sourceCommit,
      inventoryDigest: inventory.value.inventoryDigest,
      records,
      findings,
    };
    return Object.freeze({
      ...projection,
      ok: findings.length === 0,
      reportDigest: sha256(canonical(projection)),
      total: inventory.value.items.length,
      emitted: records.length,
      decisionCounts,
      collisionGroups: inventory.value.collisionGroups.length,
      collisionItems: inventory.value.collisionGroups.flatMap((group) => group.planIds).length,
    });
  }
}

class ReviewedDecisionManifest implements MigrationDecisionPort {
  private readonly rekeys = new Map<string, string>(REVIEWED_REKEY_DECISIONS);
  decide(item: LegacyPlanInventoryItem, collision: LegacyPlanCollisionGroup | null) {
    if (collision) {
      if (this.rekeys.get(item.legacyPlanId) === collision.numericCore)
        return {
          legacyPlanId: item.legacyPlanId,
          decision: "rekeyed" as const,
          resolvedAlias: item.legacyPlanId,
          collisionGroup: collision.numericCore,
          lossFields: [],
          reason: "reviewed numeric-prefix collision keeps the unique full legacy alias",
          reviewPlanId: MIGRATION_REVIEW_PLAN_ID,
        };
      return {
        legacyPlanId: item.legacyPlanId,
        decision: "pending" as const,
        resolvedAlias: null,
        collisionGroup: collision.numericCore,
        lossFields: [],
        reason: "numeric prefix collision requires reviewed rekey decision",
        reviewPlanId: MIGRATION_REVIEW_PLAN_ID,
      };
    }
    return {
      legacyPlanId: item.legacyPlanId,
      decision: "migrated" as const,
      resolvedAlias: item.legacyPlanId,
      collisionGroup: null,
      lossFields: [],
      reason: "lossless HEAD migration preview",
      reviewPlanId: null,
    };
  }
}

function record(
  item: LegacyPlanInventoryItem,
  proposal: MigrationDecisionProposal,
): MigrationDryRunRecord {
  const findings: MigrationDryRunFinding[] = [];
  if (proposal.legacyPlanId !== item.legacyPlanId) {
    findings.push(
      finding(
        "plan-migration-preview-id-mismatch",
        item.legacyPlanId,
        "decision targets another PLAN",
      ),
    );
  }
  if (validateMigrationFields(proposal)) {
    findings.push(
      finding("plan-migration-decision-invalid", item.legacyPlanId, "decision field matrix failed"),
    );
  }
  if (proposal.decision === "pending") {
    findings.push(
      finding(
        "plan-migration-decision-pending",
        item.legacyPlanId,
        "reviewed decision is required",
      ),
    );
  }
  return Object.freeze({
    ...proposal,
    sourcePath: item.sourcePath,
    assetId: item.assetId,
    sourceCommit: item.sourceCommit,
    sourceBlobOid: item.sourceBlobOid,
    sourceContentDigest: item.sourceContentDigest,
    findings: Object.freeze(findings),
  });
}

function counts(records: readonly MigrationDryRunRecord[]) {
  const result: Record<MigrationPreviewDecision, number> = {
    migrated: 0,
    rekeyed: 0,
    rejected: 0,
    pending: 0,
  };
  for (const item of records) result[item.decision] += 1;
  return Object.freeze(result);
}

function manifestFindings(
  collisions: readonly LegacyPlanCollisionGroup[],
): MigrationDryRunFinding[] {
  const expected = new Map(
    collisions.flatMap((group) => group.planIds.map((id) => [id, group.numericCore] as const)),
  );
  const reviewed = new Map<string, string>(REVIEWED_REKEY_DECISIONS);
  return [...new Set([...expected.keys(), ...reviewed.keys()])]
    .filter((id) => expected.get(id) !== reviewed.get(id))
    .map((id) =>
      finding(
        "plan-migration-decision-manifest-mismatch",
        id,
        "reviewed collision decision is missing, extra, or bound to another numeric prefix",
      ),
    );
}

function finding(
  ruleId: string,
  legacyPlanId: string | null,
  message: string,
): MigrationDryRunFinding {
  return Object.freeze({ ruleId, legacyPlanId, message });
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
