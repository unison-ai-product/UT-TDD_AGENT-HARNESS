import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeL14CloseAudit,
  l14CloseAuditMessages,
  loadL14CloseAuditDocs,
} from "../src/lint/l14-close-audit";

const compliant = `# A-TEST

## L14 Close System Foundation Audit Matrix

| Item | Audit question | Current evidence | Gap / boundary | Next action | Status |
|---|---|---|---|---|---|
| workflow-definition | Workflow docs are coherent to L14. | \`tests/l14-close-audit.test.ts\` | none | keep doctor wired | \`closed\` |
| system-foundation | Core gates prove system foundation. | \`tests/l14-close-audit.test.ts\` | none | keep doctor wired | \`closed\` |
| claude-codex-parity | Claude and Codex both work. | \`tests/l14-close-audit.test.ts\` | none | keep doctor wired | \`closed\` |
| clean-distribution-package | Clean package can install. | \`tests/l14-close-audit.test.ts\` | none | keep acceptance smoke | \`closed\` |
| version-up-nonbreaking | Version bump is nonbreaking. | \`tests/l14-close-audit.test.ts\` | publication not run | require release approval | \`external_required\` |
| brownfield-onboarding | Existing project is preserved. | \`tests/l14-close-audit.test.ts\` | none | keep setup tests | \`closed\` |
| cross-project-test-workflow | Tests work outside dogfood repo. | \`tests/l14-close-audit.test.ts\` | true external repo not mutated | run after publication | \`partial\` |
| l1-l2-mock-roundtrip | L2 mock feeds back into L1. | \`tests/l14-close-audit.test.ts\` | prototype review not run | require L1 back-prop when high-fi exists | \`partial\` |
| drive-model-bookbinding | Drive models merge back to V-model. | \`tests/l14-close-audit.test.ts\` | none | keep convergence lint | \`closed\` |
| l8-l14-right-arm | Right arm is locally closed. | \`tests/l14-close-audit.test.ts\` | production signoff external | PO signoff after release cut | \`human_required\` |
| release-publication-boundary | Release publication is controlled. | \`tests/l14-close-audit.test.ts\` | tag/tarball not published | perform only after PO approval | \`external_required\` |
| green-evidence-integrity | Green evidence is trustworthy. | \`tests/l14-close-audit.test.ts\` | historical digest mismatch remains | correct before hardening | \`partial\` |
`;

describe("l14-close-audit", () => {
  it("accepts the complete L14 close audit inventory", () => {
    const result = analyzeL14CloseAudit([{ file: "A.md", content: compliant }], process.cwd());

    expect(result.ok).toBe(true);
    expect(result.rows).toHaveLength(12);
    expect(l14CloseAuditMessages(result)[0]).toContain("OK");
  });

  it("fails when an expected audit item is missing", () => {
    const content = compliant.replace(
      "| green-evidence-integrity | Green evidence is trustworthy. | `tests/l14-close-audit.test.ts` | historical digest mismatch remains | correct before hardening | `partial` |\n",
      "",
    );
    const result = analyzeL14CloseAudit([{ file: "A.md", content }], process.cwd());

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: "A.md",
      item: "green-evidence-integrity",
      reason: "missing_expected_item",
    });
  });

  it("fails open rows without a next action", () => {
    const content = compliant.replace("correct before hardening | `partial`", "none | `partial`");
    const result = analyzeL14CloseAudit([{ file: "A.md", content }], process.cwd());

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: "A.md",
      item: "green-evidence-integrity",
      reason: "open_without_next_action",
    });
  });

  it("fails evidence paths that do not exist", () => {
    const content = compliant.replace("`tests/l14-close-audit.test.ts`", "`docs/missing.md`");
    const result = analyzeL14CloseAudit([{ file: "A.md", content }], process.cwd());

    expect(result.ok).toBe(false);
    expect(result.violations).toContainEqual({
      file: "A.md",
      item: "workflow-definition",
      reason: "missing_evidence_path",
    });
  });

  it("loads and validates the current A-143 audit", () => {
    const docs = loadL14CloseAuditDocs(process.cwd());
    const result = analyzeL14CloseAudit(docs, process.cwd());

    expect(docs.length).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
    expect(result.rows.map((row) => row.item)).toEqual([
      "workflow-definition",
      "system-foundation",
      "claude-codex-parity",
      "clean-distribution-package",
      "version-up-nonbreaking",
      "brownfield-onboarding",
      "cross-project-test-workflow",
      "l1-l2-mock-roundtrip",
      "drive-model-bookbinding",
      "l8-l14-right-arm",
      "release-publication-boundary",
      "green-evidence-integrity",
    ]);
  });

  it("reports missing audit file as a violation", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-tdd-l14-audit-"));
    try {
      mkdirSync(join(root, ".ut-tdd", "audit"), { recursive: true });
      writeFileSync(join(root, ".ut-tdd", "audit", ".gitkeep"), "");
      const docs = loadL14CloseAuditDocs(root);
      const result = analyzeL14CloseAudit(docs, root);

      expect(docs).toEqual([]);
      expect(result.ok).toBe(false);
      expect(l14CloseAuditMessages(result)[0]).toContain("A-143 audit not found");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
