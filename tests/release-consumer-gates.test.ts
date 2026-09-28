import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  analyzeLayerPairGate,
  evaluateStaticGate,
  readCoverageSummary,
} from "../src/gate/static.ts";
import {
  analyzeG1Trace,
  g1TraceMessages,
  g1TraceOk,
  loadG1TraceDocs,
} from "../src/lint/g1-trace.ts";
import { analyzeG3Trace, g3TraceMessages, g3TraceOk, loadDocs } from "../src/lint/g3-trace.ts";
import { loadGateConfirmDocs, parseGateStatuses } from "../src/lint/gate-confirm.ts";
import { buildNodeGeneration } from "../src/runtime/node-bootstrap.ts";
import type { PairDoc } from "../src/vmodel/lint.ts";

const GATE_ASSETS = [
  "docs/governance/gate-design.md",
  "docs/process/gates.md",
  "docs/process/vmodel-contract.yaml",
] as const;

const CONSUMER_TEMPLATE_SLOTS = [
  [
    "docs/templates/vmodel/L1-requirements.md",
    "docs/design/L1-requirements/functional-requirements.md",
  ],
  ["docs/templates/vmodel/L2-screen-list.md", "docs/design/L2-screen/screen-list.md"],
  [
    "docs/templates/vmodel/L3-functional-requirements.md",
    "docs/design/L3-functional/functional-requirements.md",
  ],
  ["docs/templates/vmodel/L4-data.md", "docs/design/L4-basic-design/data.md"],
  ["docs/templates/vmodel/L4-architecture.md", "docs/design/L4-basic-design/architecture.md"],
  ["docs/templates/vmodel/L4-external-if.md", "docs/design/L4-basic-design/external-if.md"],
  ["docs/templates/vmodel/L4-function.md", "docs/design/L4-basic-design/function.md"],
  ["docs/templates/vmodel/L4-ui-standard.md", "docs/design/L4-basic-design/ui-standard.md"],
  ["docs/templates/vmodel/L4-security.md", "docs/design/L4-basic-design/security.md"],
  ["docs/templates/vmodel/L5-physical-data.md", "docs/design/L5-detailed-design/physical-data.md"],
  [
    "docs/templates/vmodel/L5-module-decomposition.md",
    "docs/design/L5-detailed-design/module-decomposition.md",
  ],
  ["docs/templates/vmodel/L6-function-spec.md", "docs/design/L6-function-design/function-spec.md"],
  ["docs/templates/vmodel/L7-unit-test-design.md", "docs/test-design/L7-unit-test-design.md"],
] as const;

const roots: string[] = [];
let buildOutputRoot: string | undefined;

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-release-consumer-gates-"));
  roots.push(root);
  return root;
}

function writeGateDefinition(root: string, content: string): void {
  const path = join(root, "docs", "governance", "gate-design.md");
  mkdirSync(join(root, "docs", "governance"), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function writeFixtureDoc(root: string, path: string, content: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

function writeConsumerGateFixture(
  root: string,
  options: { omitRequiredSlot?: boolean; omitWireframe?: boolean } = {},
): void {
  const repositoryRoot = process.cwd();
  for (const [templatePath, targetPath] of CONSUMER_TEMPLATE_SLOTS) {
    const template = readFileSync(join(repositoryRoot, templatePath), "utf8");
    const testDesign = targetPath.startsWith("docs/test-design/");
    const pairArtifact = testDesign ? "docs/design/" : "docs/test-design/L7-unit-test-design.md";
    const adapted = template
      .replace(/^status: .*$/m, "status: confirmed")
      .replace(/^pair_artifact: .*$/m, `pair_artifact: ${pairArtifact}`)
      .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md");
    writeFixtureDoc(root, targetPath, adapted);
  }

  const l1Template = readFileSync(
    join(repositoryRoot, "docs/templates/vmodel/L1-requirements.md"),
    "utf8",
  );
  const l3Template = readFileSync(
    join(repositoryRoot, "docs/templates/vmodel/L3-functional-requirements.md"),
    "utf8",
  );
  const l1Adapt = () =>
    l1Template
      .replace(/^status: .*$/m, "status: confirmed")
      .replace(/^pair_artifact: .*$/m, `pair_artifact: docs/test-design/L7-unit-test-design.md`)
      .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md");
  const l3Adapt = () =>
    l3Template
      .replace(/^status: .*$/m, "status: confirmed")
      .replace(/^pair_artifact: .*$/m, "pair_artifact: docs/test-design/L7-unit-test-design.md")
      .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md");
  if (!options.omitRequiredSlot) {
    writeFixtureDoc(
      root,
      "docs/design/L1-requirements/business-requirements.md",
      `${l1Adapt()}\n| **BR-01** | Consumer goal |\n`,
    );
  }
  writeFixtureDoc(
    root,
    "docs/design/L1-requirements/functional-requirements.md",
    `${l1Adapt()}\n| **FR-L1-01** | Consumer function | P0 |\n`,
  );
  writeFixtureDoc(
    root,
    "docs/design/L1-requirements/screen-requirements.md",
    `${l1Adapt()}\n\n## §1 画面一覧\nPM-01\n## §2 次\n### §5.1 業務要求トレース\n| **BR-01** | PM-01 |\n### §5.3 機能要求トレース\n| **FR-L1-01** | PM-01 |\n### §5.4 次\n### §5.5 画面トレース\n| **PM-01** | BR-01 / FR-L1-01 |\n### §5.6 次\n`,
  );
  for (const path of ["business-detail.md", "nfr-grade.md"]) {
    let content = l3Adapt();
    if (path === "business-detail.md") content += "\n";
    else {
      content += `\n${[1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17].map((n) => `| **NFR-${String(n).padStart(2, "0")}** | covered |`).join("\n")}\n`;
    }
    writeFixtureDoc(root, `docs/design/L3-functional/${path}`, content);
  }
  writeFixtureDoc(
    root,
    "docs/design/L3-functional/functional-requirements.md",
    `${l3Adapt()}\n### FR-01: Consumer function\n#### AC-FR-01-01\n`,
  );

  const l10 = readFileSync(
    join(repositoryRoot, "docs/templates/vmodel/L10-ux-validation.md"),
    "utf8",
  )
    .replace(/^status: .*$/m, "status: confirmed")
    .replace(/^pair_artifact: .*$/m, "pair_artifact: docs/design/L2-screen/")
    .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md");
  writeFixtureDoc(root, "docs/test-design/L10-ux-validation-test-design.md", l10);
  const l12 = readFileSync(
    join(repositoryRoot, "docs/templates/vmodel/L12-acceptance-test-design.md"),
    "utf8",
  )
    .replace(/^status: .*$/m, "status: confirmed")
    .replace(/^pair_artifact: .*$/m, "pair_artifact: docs/design/")
    .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md");
  writeFixtureDoc(
    root,
    "docs/test-design/L12-acceptance-test-design.md",
    `${l12}\n| **AT-FR-01-01** | Consumer acceptance |\n`,
  );
  if (!options.omitWireframe) {
    writeFixtureDoc(
      root,
      "docs/design/L2-screen/wireframe.md",
      "---\nlayer: L2\nstatus: confirmed\npair_artifact: docs/test-design/L10-ux-validation-test-design.md\n---\n# Consumer wireframe\n",
    );
  }
}

function makeWritableTree(path: string): void {
  const stat = statSync(path);
  chmodSync(path, stat.isDirectory() ? 0o700 : 0o600);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) makeWritableTree(join(path, entry));
  }
}

afterAll(() => {
  for (const root of roots) {
    makeWritableTree(root);
    rmSync(root, { recursive: true, force: true });
  }
  if (buildOutputRoot) {
    makeWritableTree(buildOutputRoot);
    rmSync(buildOutputRoot, { recursive: true, force: true });
  }
});

describe("PR-G0 release-consumer gates", () => {
  it("keeps the public layer-pair API default bound to the harness L10 artifact", () => {
    const docs: PairDoc[] = [
      {
        path: "docs/design/harness/L2-screen/wireframe.md",
        layer: "L2",
        status: "confirmed",
        pairArtifact: "docs/test-design/harness/L10-ux-validation-test-design.md",
      },
      {
        path: "docs/test-design/harness/L10-ux-validation-test-design.md",
        layer: "L10",
        status: "confirmed",
        pairArtifact: "docs/design/harness/L2-screen/",
      },
    ];

    const result = analyzeLayerPairGate(docs, "G2", "L2");

    expect(result.ok).toBe(true);
    expect(result.mockMissing).toBe(false);
  });

  it("U-RCDEV-026: uses the embedded gate definition when the consumer has no copy", () => {
    const docs = loadGateConfirmDocs(fixtureRoot());
    const statuses = parseGateStatuses(docs.gateText);

    expect(docs.gateText.length).toBeGreaterThan(0);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.map((status) => status.gate)).toContain("G1");
  });

  it("U-RCDEV-026: lets the consumer gate definition override the embedded default", () => {
    const root = fixtureRoot();
    const consumerDefinition = [
      "## §2 Consumer gate ledger",
      "| Gate | Layer | Status | Evidence |",
      "| --- | --- | --- | --- |",
      "| G1 | L1 | consumer override | fixture |",
      "",
    ].join("\n");
    writeGateDefinition(root, consumerDefinition);

    const docs = loadGateConfirmDocs(root);

    expect(docs.gateText).toBe(consumerDefinition);
    expect(parseGateStatuses(docs.gateText)).toEqual([
      { gate: "G1", layer: "L1", status: "consumer override", pass: false },
    ]);
  });

  it("U-RCDEV-026: seals all three tracked gate assets in the generated receipt", async () => {
    buildOutputRoot = mkdtempSync(join(tmpdir(), "ut-tdd-release-consumer-gates-build-"));
    const candidateRevision = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();

    const generation = await buildNodeGeneration({
      outputRoot: buildOutputRoot,
      candidateRevision,
    });

    const receipt = new Map(
      generation.receipt.source_files.map((source) => [source.path, source.sha256]),
    );
    for (const path of GATE_ASSETS) {
      const trackedBytes = execFileSync("git", ["show", `HEAD:${path}`]);
      const expectedDigest = createHash("sha256").update(trackedBytes).digest("hex");
      expect(receipt.get(path), path).toBe(expectedDigest);
    }

    const consumer = fixtureRoot();
    writeFixtureDoc(
      consumer,
      "docs/design/L1-requirements/consumer.md",
      "---\nlayer: L1\nstatus: confirmed\n---\n# Consumer requirement\n",
    );
    const bundledGateMessage = (): string => {
      const result = spawnSync(
        generation.nodePath,
        [generation.compiledCliPath, "doctor", "--json"],
        {
          cwd: consumer,
          encoding: "utf8",
          timeout: 60_000,
          windowsHide: true,
          env: {
            ...process.env,
            HOME: consumer,
            USERPROFILE: consumer,
            APPDATA: consumer,
            CLAUDE_PROJECT_DIR: "",
            UT_TDD_PROJECT_DIR: "",
            UT_TDD_CLAUDE_SESSIONS_DIR: join(consumer, ".claude", "projects"),
            UT_TDD_CODEX_SESSIONS_DIR: join(consumer, ".codex", "sessions"),
          },
        },
      );
      expect(result.error, result.stderr).toBeUndefined();
      expect([0, 1], result.stderr).toContain(result.status);
      const report = JSON.parse(result.stdout) as { messages: string[] };
      const messages = report.messages.filter((message) =>
        message.startsWith("doctor: gate-confirm"),
      );
      expect(messages, result.stdout).toHaveLength(1);
      return messages[0] as string;
    };

    // No checkout gate assets exist in this consumer; the compiled CLI must
    // parse its embedded ledger rather than catch a missing source-file error.
    expect(bundledGateMessage()).toContain("gate-confirm — OK");
    writeGateDefinition(
      consumer,
      "## §2 Consumer gate ledger\n| Gate | Layer | Status | Evidence |\n| --- | --- | --- | --- |\n| G1 | L1 | consumer override | fixture |\n",
    );
    // Doctor's aggregate can fail for this deliberately minimal fixture.
    // Only the named production check proves consumer precedence here.
    expect(bundledGateMessage()).toContain("G1=consumer override");
  });

  it("U-RCDEV-027: evaluates consumer G1-G6 fixture with non-empty bidirectional traces", () => {
    const root = fixtureRoot();
    writeConsumerGateFixture(root);

    const g1Trace = analyzeG1Trace(loadG1TraceDocs(root));
    const g3Trace = analyzeG3Trace(loadDocs(root));
    expect(g1TraceOk(g1Trace)).toBe(true);
    expect(g1Trace.totals.business).toBeGreaterThan(0);
    expect(g1Trace.totals.screen).toBeGreaterThan(0);
    expect(g1Trace.totals.p0Fr).toBeGreaterThan(0);
    expect(g3TraceOk(g3Trace)).toBe(true);
    expect(g3Trace.totals).toMatchObject({ frL1: 1, l3Fr: 1, ac: 1, at: 1, l1Nfr: 15, l3Nfr: 15 });

    const results = ["G1", "G2", "G3", "G4", "G5", "G6"].map((gate) =>
      evaluateStaticGate({ gate, repoRoot: root }),
    );
    expect(results.map(({ gate, applicable }) => [gate, applicable])).toEqual(
      ["G1", "G2", "G3", "G4", "G5", "G6"].map((gate) => [gate, true]),
    );
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results.flatMap((result) => result.messages).join("\n")).not.toContain("could not run");
    expect(g1TraceMessages(g1Trace).join("\n")).toContain("business=1");
    expect(g3TraceMessages(g3Trace).join("\n")).toContain("frL1=1, l3Fr=1, ac=1, at=1");
  });

  it("U-RCDEV-027: reports the missing required consumer slot, not could-not-run", () => {
    const root = fixtureRoot();
    writeConsumerGateFixture(root, { omitRequiredSlot: true });

    const result = evaluateStaticGate({ gate: "G1", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(messages).toContain(
      "required doc not created: docs/design/harness/L1-requirements/business-requirements.md",
    );
    expect(messages).not.toContain("could not run");
  });

  it("U-RCDEV-027: rejects a consumer fixture without its L2-to-L10 wireframe pair", () => {
    const root = fixtureRoot();
    writeConsumerGateFixture(root, { omitWireframe: true });

    const result = evaluateStaticGate({ gate: "G2", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(messages).toContain("mock=missing");
    expect(messages).not.toContain("could not run");
  });

  it(
    "CANDIDATE-U-RCDEV-028: returns a typed missing-coverage reason and accepts an 80% consumer summary",
    () => {
      const root = fixtureRoot();
      writeConsumerGateFixture(root);
      const coveragePath = join(root, "coverage", "coverage-summary.json");

      const missing = evaluateStaticGate({ gate: "G7", repoRoot: root });
      const missingCoverage = readCoverageSummary(coveragePath);

      expect(missing.applicable).toBe(true);
      expect(missing.passed).toBe(false);
      expect(missing.reasons).toEqual(["coverage_evidence_missing"]);
      expect(missing.messages.join("\n")).toContain(
        `g7-coverage - violation: coverage summary not found (${coveragePath}); run test coverage before G7`,
      );
      expect(missing.messages.join("\n")).not.toContain("could not run");
      expect(missingCoverage).toMatchObject({
        ok: false,
        pct: null,
        reasons: ["coverage_evidence_missing"],
      });

      writeFixtureDoc(
        root,
        "coverage/coverage-summary.json",
        JSON.stringify({ total: { lines: { pct: 80 } } }),
      );

      const passingCoverage = readCoverageSummary(coveragePath);
      const withCoverage = evaluateStaticGate({ gate: "G7", repoRoot: root });

      expect(passingCoverage).toMatchObject({ ok: true, pct: 80 });
      expect(passingCoverage.message).toBe("g7-coverage - OK (80% >= 80%)");
      expect(withCoverage.messages).toContain("g7-coverage - OK (80% >= 80%)");
    },
  );
});
