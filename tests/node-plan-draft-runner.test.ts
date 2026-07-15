import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { NodePlanDraftRunner } from "../src/plan-admission/node-plan-draft-runner.js";
import type { DraftManifestV2 } from "../src/plan-admission/plan-draft-command-assembler.js";
import { evaluatePlanAdmission, type PlanAdmissionRequest } from "../src/plan-admission/policy.js";
import {
  parseTrackedReceiptProjection,
  TRACKED_RECEIPT_SCHEMA,
} from "../src/plan-admission/tracked-receipt-projection.js";
import { parseLegacyPlanSource } from "../src/plan-asset/adapters/legacy-plan-inventory.js";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("NodePlanDraftRunner", () => {
  it("U-PADM-054: 実DBと二成果物を同一Sagaでcreated/replayedへ収束させる", () => {
    const root = join(tmpdir(), `ut-tdd-plan-draft-runner-${process.pid}-${Date.now()}`);
    roots.push(root);
    mkdirSync(join(root, "docs", "plans"), { recursive: true });
    mkdirSync(join(root, "docs", "governance"), { recursive: true });
    const projectionPath = "docs/governance/plan-admission-receipts.json";
    writeFileSync(
      join(root, ...projectionPath.split("/")),
      `${JSON.stringify({ schema_version: TRACKED_RECEIPT_SCHEMA, records: [] })}\n`,
      "utf8",
    );
    const admission: PlanAdmissionRequest = {
      routeSignal: "forward",
      routeMode: "forward",
      kind: "impl",
      layer: "L7",
      drive: "agent",
      branch: "work/forward-runner",
      status: "draft",
    };
    const decision = evaluatePlanAdmission(admission);
    if (!decision.ok) throw new Error("fixture admission must pass");
    const planId = "PLAN-L7-999-node-runner";
    const sourcePath = `docs/plans/${planId}.md`;
    const manifest: DraftManifestV2 = {
      version: 2,
      command_id: "command:node-runner-1",
      plan_id: planId,
      recorded_at: "2026-07-15T00:00:00.000Z",
      admission: {},
      source: {
        path: sourcePath,
        content: `---\nplan_id: ${planId}\ntitle: Node runner\nkind: impl\ndrive: agent\nstatus: draft\nlayer: L7\nparent_design: docs/plans/PLAN-L6-999-node-runner.md\nroute_signal: forward\nroute_mode: forward\nagent_slots:\n  - role: se\n    slot_label: runner\ngenerates: []\ndependencies:\n  parent: docs/plans/PLAN-L6-999-node-runner.md\n  requires: []\n  references: []\n  blocks: []\n---\n\n# Node runner\n`,
      },
      projection: { path: projectionPath },
    };
    const runner = new NodePlanDraftRunner({
      repoRoot: root,
      sourceCommit: () => "a".repeat(40),
      actor: () => "codex",
      readText: (path) => readFileSync(path, "utf8"),
    });

    const created = runner.run({ manifest, admission, decision });
    const replayed = runner.run({ manifest, admission, decision });

    expect(created.status).toBe("created");
    expect(replayed).toEqual({ status: "replayed", receipt: created.receipt });
    expect(existsSync(join(root, ...sourcePath.split("/")))).toBe(true);
    const source = parseLegacyPlanSource(
      readFileSync(join(root, ...sourcePath.split("/")), "utf8"),
    );
    const embedded = source?.frontmatter.admission_receipt as { command_id?: string } | undefined;
    expect(embedded?.command_id).toBe(manifest.command_id);
    const projection = parseTrackedReceiptProjection(
      readFileSync(join(root, ...projectionPath.split("/")), "utf8"),
    );
    expect(projection.ok && projection.value.records).toHaveLength(1);
  });
});
