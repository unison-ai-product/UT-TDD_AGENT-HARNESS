import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  analyzeDeliverablePlanTrace,
  analyzeDeliverableTraceGate,
  isDeliverableArtifactPath,
  loadDeliverablePlanTraceInput,
} from "../src/lint/deliverable-plan-trace.ts";
import {
  analyzeOracleTestTrace,
  collectOracleCitationSites,
  collectOracleDeclarationSites,
  loadOracleTestTraceInput,
} from "../src/lint/oracle-test-trace.ts";

const temporaryRoots: string[] = [];

function createTraceFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-deliverable-owner-"));
  temporaryRoots.push(root);
  for (const path of ["docs/plans", "docs/governance", "docs/test-design", "tests"]) {
    mkdirSync(join(root, path), { recursive: true });
  }
  writeFileSync(join(root, "docs/governance/deliverable-trace-debt-audit.md"), "", "utf8");
  return root;
}

function writeFixture(root: string, relativePath: string, contents: string): void {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

function formalOracleTable(id: string): string {
  return [
    "| IT-ID | Given | When | Then |",
    "|---|---|---|---|",
    `| \`${id}\` | isolated fixture | invoke | expected result |`,
  ].join("\n");
}

function candidateOracleTable(id: string, fixture = "isolated fixture"): string {
  return [
    "| 候補 ID | fixture / 入力 | command / query | 期待結果 |",
    "|---|---|---|---|",
    `| \`${id}\` | ${fixture} | candidate-only collection | trace only the matching test file |`,
  ].join("\n");
}

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

describe("PLAN-L7-450 W4/W3 deliverable trace", () => {
  it("U-L7-450-W4-001: a new orphan test file fails closed and a declared file is green", () => {
    const orphan = analyzeDeliverablePlanTrace({
      artifactFiles: ["tests/new.test.ts"],
      tracedPaths: new Set(),
      baseline: new Map(),
    });
    expect(orphan.ok).toBe(false);
    expect(orphan.findings).toContainEqual(
      expect.objectContaining({ kind: "orphan-deliverable", artifactPath: "tests/new.test.ts" }),
    );
    expect(
      analyzeDeliverablePlanTrace({
        artifactFiles: ["tests/new.test.ts"],
        tracedPaths: new Set(["tests/new.test.ts"]),
        baseline: new Map(),
      }).ok,
    ).toBe(true);
  });

  it("U-L7-450-W3-001: ledger and untraced deliverables must agree in both directions", () => {
    const result = analyzeDeliverablePlanTrace({
      artifactFiles: ["scripts/legacy.ts"],
      tracedPaths: new Set(),
      baseline: new Map([[".claude/removed.md", "PLAN-OLD"]]),
    });
    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.kind)).toEqual([
      "orphan-deliverable",
      "stale-deliverable-trace-debt",
    ]);
  });

  it("U-L7-450-W3-002: ignores gitignored Claude runtime state in every workspace", () => {
    expect(isDeliverableArtifactPath(".claude/agent-memory/reviewer/MEMORY.md")).toBe(false);
    expect(isDeliverableArtifactPath(".claude/settings.local.json")).toBe(false);
    expect(isDeliverableArtifactPath(".claude/scheduled_tasks.lock")).toBe(false);
    expect(isDeliverableArtifactPath(".claude/agents/code-reviewer.md")).toBe(true);
  });

  it("U-L7-450-W2-003: duplicate ownership shares the same fail-closed gate finding set", () => {
    const result = analyzeDeliverableTraceGate({
      artifactFiles: ["scripts/new.ts"],
      tracedPaths: new Set(["scripts/new.ts"]),
      ownersByPath: new Map([["scripts/new.ts", ["PLAN-A", "PLAN-B"]]]),
      baseline: new Map(),
      ownershipBaseline: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "duplicate-artifact-ownership",
        artifactPath: "scripts/new.ts",
      }),
    );
  });

  it("U-L7-450-W2-004: duplicate baseline is bidirectional and independent from orphan debt", () => {
    const green = analyzeDeliverableTraceGate({
      artifactFiles: ["scripts/owned.ts"],
      tracedPaths: new Set(["scripts/owned.ts"]),
      ownersByPath: new Map([["scripts/owned.ts", ["PLAN-A", "PLAN-B"]]]),
      baseline: new Map(),
      ownershipBaseline: new Set(["scripts/owned.ts"]),
    });
    expect(green.ok).toBe(true);
    expect(
      analyzeDeliverableTraceGate({
        ...green,
        artifactFiles: ["scripts/owned.ts"],
        tracedPaths: new Set(["scripts/owned.ts"]),
        ownersByPath: new Map([["scripts/owned.ts", ["PLAN-A"]]]),
        baseline: new Map(),
        ownershipBaseline: new Set(["scripts/owned.ts"]),
      }).findings,
    ).toContainEqual(
      expect.objectContaining({
        kind: "stale-deliverable-trace-debt",
        artifactPath: "scripts/owned.ts",
      }),
    );
  });
});

describe("Issue #958 test-design owner candidates", () => {
  it("U-DPTOWN-001: PLAN generates remains a valid owner", () => {
    const root = createTraceFixture();
    try {
      const target = "tests/new.test.ts";
      writeFixture(root, target, 'import { it } from "vitest"; it("PLAN-owned", () => {});');
      writeFixture(
        root,
        "docs/plans/PLAN-OWNER-001.md",
        [
          "---",
          "plan_id: PLAN-OWNER-001",
          "generates:",
          `  - artifact_path: ${target}`,
          "---",
          "",
        ].join("\n"),
      );

      const input = loadDeliverablePlanTraceInput(root);
      expect(input.artifactFiles).toContain(target);
      expect(input.tracedPaths.has(target)).toBe(true);
      expect(input.ownersByPath.get(target)).toEqual(["PLAN-OWNER-001"]);
      expect(analyzeDeliverableTraceGate(input).ok).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  describe("U-DPTOWN-002: formal declaration and static citation own a test", () => {
    let root: string;
    let input: ReturnType<typeof loadDeliverablePlanTraceInput>;
    let declarations: ReturnType<typeof collectOracleDeclarationSites>;
    let citations: ReturnType<typeof collectOracleCitationSites>;
    const target = "tests/new.test.ts";
    const oracleId = "U-ZZOWNER-002";

    beforeAll(() => {
      root = createTraceFixture();
      writeFixture(root, "docs/test-design/L7-fixture.md", formalOracleTable(oracleId));
      writeFixture(
        root,
        target,
        `import { it } from "vitest";\nit("${oracleId}: formal static citation", () => {});`,
      );
      input = loadDeliverablePlanTraceInput(root);
      declarations = collectOracleDeclarationSites(root);
      citations = collectOracleCitationSites(root);
    });

    afterAll(() => rmSync(root, { recursive: true, force: true }));

    it("formal fixture and existing collectors load independently of owner completion", () => {
      expect(input.artifactFiles).toContain(target);
      expect(input.ownersByPath.has(target)).toBe(false);
      expect(declarations).toContainEqual(
        expect.objectContaining({ id: oracleId, path: "docs/test-design/L7-fixture.md" }),
      );
      expect(citations).toContainEqual(
        expect.objectContaining({ id: oracleId, path: target, kind: "static-test-label" }),
      );
    });

    it("U-DPTOWN-002: formal oracle trace supplies test ownership", () => {
      expect(input.tracedPaths.has(target)).toBe(true);
    });
  });

  describe("U-DPTOWN-003: candidate it.fails citation owns the probe test", () => {
    let root: string;
    let input: ReturnType<typeof loadDeliverablePlanTraceInput>;
    let declarations: ReturnType<typeof collectOracleDeclarationSites>;
    let citations: ReturnType<typeof collectOracleCitationSites>;
    const target = "tests/deliverable-plan-trace.test.ts";
    const candidateId = "CANDIDATE-U-DPTOWN-003";

    beforeAll(() => {
      root = createTraceFixture();
      writeFixture(
        root,
        "docs/test-design/harness/L7-deliverable-plan-trace-test-design.md",
        candidateOracleTable(candidateId),
      );
      writeFixture(
        root,
        target,
        `import { it } from "vitest";\nit.fails("${candidateId}: candidate static Red", () => {});`,
      );
      input = loadDeliverablePlanTraceInput(root);
      declarations = collectOracleDeclarationSites(root);
      citations = collectOracleCitationSites(root);
    });

    afterAll(() => rmSync(root, { recursive: true, force: true }));

    it("candidate fixture loads but remains outside formal oracle collections", () => {
      expect(input.artifactFiles).toContain(target);
      expect(input.ownersByPath.has(target)).toBe(false);
      expect(declarations.some((site) => site.id === candidateId)).toBe(false);
      expect(citations.some((site) => site.id === candidateId)).toBe(false);
    });

    it("U-DPTOWN-003: candidate it.fails trace owns its test file", () => {
      expect(input.tracedPaths.has(target)).toBe(true);
    });
  });

  it("U-DPTOWN-004: undeclared candidate and formal IDs do not supply ownership", () => {
    const candidateRoot = createTraceFixture();
    const formalRoot = createTraceFixture();
    try {
      const candidatePath = "tests/undeclared-candidate.test.ts";
      const formalPath = "tests/undeclared-formal.test.ts";
      const formalId = "U-ZZUNDECLARED-004";
      writeFixture(
        candidateRoot,
        candidatePath,
        'import { it } from "vitest"; it("CANDIDATE-U-ZZPROBE-004", () => {});',
      );
      writeFixture(
        formalRoot,
        formalPath,
        `import { it } from "vitest";\nit("${formalId}: no declaration", () => {});`,
      );

      const candidateInput = loadDeliverablePlanTraceInput(candidateRoot);
      const formalInput = loadDeliverablePlanTraceInput(formalRoot);
      const formalTrace = analyzeOracleTestTrace(loadOracleTestTraceInput(formalRoot));
      expect(candidateInput.artifactFiles).toContain(candidatePath);
      expect(candidateInput.tracedPaths.has(candidatePath)).toBe(false);
      expect(analyzeDeliverableTraceGate(candidateInput).findings).toContainEqual(
        expect.objectContaining({ kind: "orphan-deliverable", artifactPath: candidatePath }),
      );
      expect(formalInput.artifactFiles).toContain(formalPath);
      expect(formalInput.tracedPaths.has(formalPath)).toBe(false);
      expect(formalTrace.undeclaredCitations.map((site) => site.id)).toEqual([formalId]);
      expect(analyzeDeliverableTraceGate(formalInput).findings).toContainEqual(
        expect.objectContaining({ kind: "orphan-deliverable", artifactPath: formalPath }),
      );
    } finally {
      rmSync(candidateRoot, { recursive: true, force: true });
      rmSync(formalRoot, { recursive: true, force: true });
    }
  });

  it("U-DPTOWN-005: body, comment, and dynamic labels are not candidate citations", () => {
    const root = createTraceFixture();
    try {
      const candidateId = "CANDIDATE-U-ZZPROBE-905";
      const targets = [
        "tests/comment-only.test.ts",
        "tests/body-only.test.ts",
        "tests/dynamic-only.test.ts",
      ];
      writeFixture(
        root,
        "docs/test-design/harness/L7-fixture.md",
        candidateOracleTable(candidateId),
      );
      writeFixture(
        root,
        targets[0] as string,
        `// ${candidateId}\nimport { it } from "vitest";\nit("ordinary comment case", () => {});`,
      );
      writeFixture(
        root,
        targets[1] as string,
        `import { it } from "vitest";\nit("ordinary body case", () => { const fixture = "${candidateId}"; void fixture; });`,
      );
      writeFixture(
        root,
        targets[2] as string,
        `import { it } from "vitest";\nconst dynamicLabel = \`${candidateId}\`;\nit(dynamicLabel, () => {});`,
      );

      const input = loadDeliverablePlanTraceInput(root);
      expect(input.artifactFiles).toEqual(expect.arrayContaining(targets));
      for (const target of targets) {
        expect(input.tracedPaths.has(target)).toBe(false);
      }
      expect(analyzeDeliverableTraceGate(input).findings).toEqual(
        targets
          .map((artifactPath) => ({ kind: "orphan-deliverable", artifactPath }))
          .sort((a, b) => a.artifactPath.localeCompare(b.artifactPath)),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-DPTOWN-006: test-design trace does not join PLAN duplicate owners", () => {
    const root = createTraceFixture();
    try {
      const target = "tests/plan-and-formal-owner.test.ts";
      const oracleId = "U-ZZOWNER-006";
      writeFixture(root, "docs/test-design/L7-fixture.md", formalOracleTable(oracleId));
      writeFixture(
        root,
        target,
        `import { it } from "vitest";\nit("${oracleId}: formal owner alongside PLAN", () => {});`,
      );
      writeFixture(
        root,
        "docs/plans/PLAN-OWNER-006.md",
        [
          "---",
          "plan_id: PLAN-OWNER-006",
          "generates:",
          `  - artifact_path: ${target}`,
          "---",
          "",
        ].join("\n"),
      );

      const input = loadDeliverablePlanTraceInput(root);
      expect(input.tracedPaths.has(target)).toBe(true);
      expect(input.ownersByPath.get(target)).toEqual(["PLAN-OWNER-006"]);
      expect(collectOracleDeclarationSites(root)).toContainEqual(
        expect.objectContaining({ id: oracleId, path: "docs/test-design/L7-fixture.md" }),
      );
      expect(analyzeDeliverableTraceGate(input).findings).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-DPTOWN-007: tests helper files outside .test.ts are not deliverable artifacts", () => {
    const root = createTraceFixture();
    try {
      const target = "tests/helper.ts";
      writeFixture(
        root,
        "docs/test-design/harness/L7-fixture.md",
        candidateOracleTable("CANDIDATE-U-ZZPROBE-907"),
      );
      writeFixture(
        root,
        target,
        'import { it } from "vitest"; it("CANDIDATE-U-ZZPROBE-907", () => {});',
      );

      const input = loadDeliverablePlanTraceInput(root);
      expect(isDeliverableArtifactPath(target)).toBe(false);
      expect(input.artifactFiles).not.toContain(target);
      expect(input.tracedPaths.has(target)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-DPTOWN-008: candidate owner scope does not expand to scripts or .claude", () => {
    const root = createTraceFixture();
    try {
      const scriptPath = "scripts/candidate-probe.ts";
      const claudePath = ".claude/candidate-probe.md";
      const target = "tests/candidate-probe.test.ts";
      const candidateId = "CANDIDATE-U-ZZPROBE-908";
      writeFixture(
        root,
        "docs/test-design/harness/L7-fixture.md",
        candidateOracleTable(candidateId),
      );
      writeFixture(root, target, `import { it } from "vitest"; it("${candidateId}", () => {});`);
      writeFixture(root, scriptPath, `// ${candidateId}\nexport const fixture = true;`);
      writeFixture(root, claudePath, `<!-- ${candidateId} -->\nfixture`);

      const input = loadDeliverablePlanTraceInput(root);
      expect(input.artifactFiles).toEqual(expect.arrayContaining([scriptPath, claudePath, target]));
      expect(input.tracedPaths.has(scriptPath)).toBe(false);
      expect(input.tracedPaths.has(claudePath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("U-DPTOWN-009: prose-only and other-cell candidate references do not declare", () => {
    const proseRoot = createTraceFixture();
    const partialRoot = createTraceFixture();
    try {
      const probeId = "CANDIDATE-U-ZZPROBE-909";
      const target = "tests/probe.test.ts";
      const source = `import { it } from "vitest";\nit("${probeId}: static candidate label", () => {});`;
      writeFixture(proseRoot, target, source);
      writeFixture(
        proseRoot,
        "docs/test-design/harness/L7-fixture.md",
        `Candidate detail mentions ${probeId}, but has no declaration table.`,
      );

      writeFixture(partialRoot, target, source);
      writeFixture(
        partialRoot,
        "docs/test-design/harness/L7-fixture.md",
        [
          "| 候補 ID | fixture / 入力 | command / query | 期待結果 |",
          "|---|---|---|---|",
          `| CANDIDATE-U-ZZOTHER-909 | mentions ${probeId} as partial prose | none | reject |`,
        ].join("\n"),
      );

      for (const root of [proseRoot, partialRoot]) {
        const input = loadDeliverablePlanTraceInput(root);
        expect(input.artifactFiles).toContain(target);
        expect(input.tracedPaths.has(target)).toBe(false);
        expect(analyzeDeliverableTraceGate(input).findings).toContainEqual(
          expect.objectContaining({ kind: "orphan-deliverable", artifactPath: target }),
        );
        expect(collectOracleDeclarationSites(root).some((site) => site.id === probeId)).toBe(false);
        expect(collectOracleCitationSites(root).some((site) => site.id === probeId)).toBe(false);
      }
    } finally {
      rmSync(proseRoot, { recursive: true, force: true });
      rmSync(partialRoot, { recursive: true, force: true });
    }
  });
});
