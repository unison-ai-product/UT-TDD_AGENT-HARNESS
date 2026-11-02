import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFullDoctorCheckDefinitions } from "../src/doctor/check-definitions.ts";
import { FULL_DOCTOR_OUTPUT_IDS } from "../src/doctor/profiles.ts";
import { nodeDoctorDeps } from "../src/doctor/runtime-state.ts";
import { analyzeL14CloseAudit, loadL14CloseAuditDocs } from "../src/lint/l14-close-audit.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

const retiredChecks = [
  "merged-plan-status",
  "plan-body-substance",
  "plan-completion-drift",
  "green-command-digest",
  "review-evidence",
  "guardrail-invariants",
];
const retiredModules = [
  "merged-plan-status",
  "plan-body-substance",
  "plan-completion-drift",
  "green-command-digest",
  "merged-plan-target-evidence",
];

function typescriptPaths(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptPaths(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("PLAN 機構の S1 退役", () => {
  it("CANDIDATE-U-PLANRET-015: 専用検査・flag・監査の必須参照を同期退役する", () => {
    const root = headSnapshotRoot();
    const checkIds = buildFullDoctorCheckDefinitions(nodeDoctorDeps(root)).map(({ id }) => id);
    for (const id of retiredChecks) {
      expect(checkIds).not.toContain(id);
      expect(FULL_DOCTOR_OUTPUT_IDS).not.toContain(id);
    }
    for (const name of retiredModules) {
      expect(existsSync(join(root, "src", "lint", `${name}.ts`)), name).toBe(false);
      expect(existsSync(join(root, "tests", `${name}.test.ts`)), name).toBe(false);
    }
    const retiredFlag = "--strict-green-command-digest";
    expect(readFileSync(join(root, ".github/workflows/harness-check.yml"), "utf8")).not.toContain(
      retiredFlag,
    );
    for (const path of typescriptPaths(join(root, "src"))) {
      expect(readFileSync(path, "utf8"), path).not.toContain(retiredFlag);
    }
    const audit = analyzeL14CloseAudit(loadL14CloseAuditDocs(root), root);
    expect(audit.ok, JSON.stringify(audit.violations)).toBe(true);
    const row = audit.rows.find(({ item }) => item === "green-evidence-integrity");
    if (!row) throw new Error("green-evidence-integrity audit row is missing");
    expect(row.status).toBe("closed");
    expect(row.evidencePaths).not.toContain("src/lint/green-command-digest.ts");
    expect(row.evidencePaths).not.toContain("tests/green-command-digest.test.ts");
    expect(row.evidencePaths).toContain(
      ".ut-tdd/audit/A-155-green-command-digest-rebind-2026-07-01.md",
    );
    expect(row.evidencePaths).toContain(
      ".ut-tdd/audit/A-156-pack-repo-default-and-digest-rebind-2026-07-01.md",
    );
  });
});
