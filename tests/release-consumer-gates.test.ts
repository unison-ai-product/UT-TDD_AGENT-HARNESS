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
import { checkG9SystemWorkflow } from "../src/doctor/workflow-quality.ts";
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
import {
  loadCompiledRightArmRegistry,
  VMODEL_CONTRACT_PATH,
} from "../src/vmodel-contract/adapters/yaml-contract-loader.ts";

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

const G8_CONSUMER_CASE_IDS = [
  "IT-CONSUMER-01",
  "IT-CONSUMER-02",
  "IT-CONSUMER-03",
  "IT-CONSUMER-04",
  "IT-CONSUMER-05",
  "IT-CONSUMER-06",
] as const;

type ConsumerG8Manifest = {
  schema_version: string;
  gate: string;
  profile: string;
  plan_id: string;
  selected_it_ids: string[];
  mandatory_it_ids: string[];
  deferred_it_ids: string[];
  commands: {
    command_id: string;
    command: string;
    runner: string;
    scope: string;
    exit_code: number;
    evidence_path: string;
    output_digest: string;
    it_ids: string[];
  }[];
  coverage: {
    it_id: string;
    status: string;
    evidence_paths: string[];
    command_ids: string[];
  }[];
  exit_criteria: {
    all_mandatory_passed: boolean;
    failed_mandatory_count: number;
    stale_defer_count: number;
    doctor_check: string;
  };
  artifacts: Record<string, string>;
};

function consumerG8Manifest(evidenceDirectory = "g8-integration"): ConsumerG8Manifest {
  const commandId = "cmd-consumer-integration";
  const evidencePath = "tests/fixtures/g8-consumer/integration-results.txt";
  return {
    schema_version: `${evidenceDirectory}-evidence-v1`,
    gate: "G8",
    profile: "consumer-integration-minimum",
    plan_id: "PLAN-CONSUMER-01",
    selected_it_ids: [...G8_CONSUMER_CASE_IDS],
    mandatory_it_ids: [...G8_CONSUMER_CASE_IDS],
    deferred_it_ids: [],
    commands: [
      {
        command_id: commandId,
        command: "node tests/consumer-integration-check.mjs",
        runner: "node",
        scope: "consumer fixture",
        exit_code: 0,
        evidence_path: "tests/fixtures/g8-consumer/command-output.txt",
        output_digest: `sha256:${"0".repeat(64)}`,
        it_ids: [...G8_CONSUMER_CASE_IDS],
      },
    ],
    coverage: G8_CONSUMER_CASE_IDS.map((itId) => ({
      it_id: itId,
      status: "passed",
      evidence_paths: [evidencePath],
      command_ids: [commandId],
    })),
    exit_criteria: {
      all_mandatory_passed: true,
      failed_mandatory_count: 0,
      stale_defer_count: 0,
      doctor_check: `${evidenceDirectory}-workflow`,
    },
    artifacts: {
      integration_manifest: `.ut-tdd/evidence/${evidenceDirectory}/ok.json`,
      integration_results: evidencePath,
    },
  };
}

function writeConsumerG8Fixture(
  root: string,
  options: { evidenceDirectory?: string; contractOverride?: boolean } = {},
): void {
  const repositoryRoot = process.cwd();
  const evidenceDirectory = options.evidenceDirectory ?? "g8-integration";
  if (options.contractOverride) {
    const contractSource = readFileSync(
      join(repositoryRoot, "docs/process/vmodel-contract.yaml"),
      "utf8",
    );
    const contract = contractSource.replace(
      "evidence_manifest: .ut-tdd/evidence/g8-integration/engine-swap.json",
      `evidence_manifest: .ut-tdd/evidence/${evidenceDirectory}/engine-swap.json`,
    );
    writeFixtureDoc(root, "docs/process/vmodel-contract.yaml", contract);
  }

  const l8Template = readFileSync(
    join(repositoryRoot, "docs/templates/vmodel/L8-integration-test-design.md"),
    "utf8",
  );
  const rows = G8_CONSUMER_CASE_IDS.map(
    (caseId, index) =>
      `| ${caseId} | integration | Consumer boundary ${index + 1} | Exercise the consumer contract | Pass | DOC-L5-MODULE / DOC-L5-PHYSICAL-DATA |`,
  ).join("\n");
  const l8 = l8Template
    .replace(/^status: .*$/m, "status: confirmed")
    .replace(/^pair_artifact: .*$/m, "pair_artifact: docs/design/L5-detailed-design/")
    .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md")
    .replace(/^\| <記入> \| <記入> \| <記入> \| <記入> \| <記入> \| <記入> \|$/m, rows);
  writeFixtureDoc(root, "docs/test-design/L8-integration-test-design.md", l8);

  writeFixtureDoc(
    root,
    "docs/design/L5-detailed-design/module-decomposition.md",
    "---\ndoc_type_id: DOC-L5-MODULE\nlayer: L5\nstatus: confirmed\npair_artifact: docs/test-design/L8-integration-test-design.md\nplan: docs/plans/PLAN-CONSUMER-01.md\n---\n# DOC-L5-MODULE\n\n**DOC-L5-MODULE**\n",
  );
  writeFixtureDoc(
    root,
    "docs/design/L5-detailed-design/physical-data.md",
    "---\ndoc_type_id: DOC-L5-PHYSICAL-DATA\nlayer: L5\nstatus: confirmed\npair_artifact: docs/test-design/L8-integration-test-design.md\nplan: docs/plans/PLAN-CONSUMER-01.md\n---\n# DOC-L5-PHYSICAL-DATA\n\n**DOC-L5-PHYSICAL-DATA**\n",
  );
  writeFixtureDoc(root, "tests/fixtures/g8-consumer/integration-results.txt", "passed\n");
  writeFixtureDoc(root, "tests/fixtures/g8-consumer/command-output.txt", "passed\n");
  writeFixtureDoc(
    root,
    `.ut-tdd/evidence/${evidenceDirectory}/ok.json`,
    `${JSON.stringify(consumerG8Manifest(evidenceDirectory), null, 2)}\n`,
  );
}

function firstConsumerCommand(
  manifest: ConsumerG8Manifest,
): ConsumerG8Manifest["commands"][number] {
  const command = manifest.commands[0];
  if (!command) throw new Error("consumer G8 fixture command is missing");
  return command;
}

function updateConsumerG8Manifest(
  root: string,
  mutate: (manifest: ConsumerG8Manifest) => void,
  evidenceDirectory = "g8-integration",
): void {
  const path = join(root, ".ut-tdd", "evidence", evidenceDirectory, "ok.json");
  const manifest = JSON.parse(readFileSync(path, "utf8")) as ConsumerG8Manifest;
  mutate(manifest);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

const G9_CONSUMER_CASE_IDS = [
  "ST-CONSUMER-01",
  "ST-CONSUMER-02",
  "ST-CONSUMER-03",
  "ST-CONSUMER-04",
  "ST-CONSUMER-05",
  "ST-CONSUMER-06",
] as const;

type ConsumerG9Manifest = {
  schema_version: string;
  gate: string;
  profile: string;
  plan_id: string;
  selected_st_ids: string[];
  mandatory_st_ids: string[];
  deferred_st_ids: string[];
  commands: {
    command_id: string;
    command: string;
    runner: string;
    scope: string;
    exit_code: number;
    evidence_path: string;
    output_digest: string;
    st_ids: string[];
  }[];
  coverage: {
    st_id: string;
    status: string;
    evidence_paths: string[];
    command_ids: string[];
  }[];
  defer: { st_id: string; reason: string; plan_id: string }[];
  exit_criteria: {
    all_mandatory_passed: boolean;
    failed_mandatory_count: number;
    stale_defer_count: number;
    doctor_check: string;
  };
  artifacts: Record<string, string>;
};

function g9ContractObligation() {
  const repositoryRoot = process.cwd();
  const contract = readFileSync(join(repositoryRoot, VMODEL_CONTRACT_PATH), "utf8");
  const obligation = loadCompiledRightArmRegistry(repositoryRoot, contract).obligations.find(
    (entry) => entry.gate === "G9",
  );
  if (!obligation) throw new Error("consumer G9 fixture requires the contract G9 obligation");
  return obligation;
}

function consumerG9Manifest(evidenceDirectory: string): ConsumerG9Manifest {
  const commandId = "cmd-consumer-system";
  const evidencePath = "tests/fixtures/g9-consumer/system-results.txt";
  return {
    schema_version: `${evidenceDirectory}-evidence-v1`,
    gate: "G9",
    profile: "consumer-system-minimum",
    plan_id: "PLAN-CONSUMER-01",
    selected_st_ids: [...G9_CONSUMER_CASE_IDS],
    mandatory_st_ids: [...G9_CONSUMER_CASE_IDS],
    deferred_st_ids: [],
    commands: [
      {
        command_id: commandId,
        command: "node tests/consumer-system-check.mjs",
        runner: "node",
        scope: "consumer fixture",
        exit_code: 0,
        evidence_path: "tests/fixtures/g9-consumer/command-output.txt",
        output_digest: `sha256:${"0".repeat(64)}`,
        st_ids: [...G9_CONSUMER_CASE_IDS],
      },
    ],
    coverage: G9_CONSUMER_CASE_IDS.map((stId) => ({
      st_id: stId,
      status: "passed",
      evidence_paths: [evidencePath],
      command_ids: [commandId],
    })),
    defer: [],
    exit_criteria: {
      all_mandatory_passed: true,
      failed_mandatory_count: 0,
      stale_defer_count: 0,
      doctor_check: `${evidenceDirectory}-workflow`,
    },
    artifacts: {
      system_manifest: `.ut-tdd/evidence/${evidenceDirectory}/ok.json`,
      system_results: evidencePath,
    },
  };
}

function writeConsumerG9Fixture(root: string): void {
  const repositoryRoot = process.cwd();
  const obligation = g9ContractObligation();
  const evidenceDirectory = obligation.evidenceManifest.replaceAll("\\", "/").split("/").at(-2);
  if (!evidenceDirectory) throw new Error("consumer G9 contract has no evidence directory");
  const families = obligation.evidenceFamilies;
  const caseRows = G9_CONSUMER_CASE_IDS.map((caseId, index) => {
    const family = families[index % families.length];
    if (!family) throw new Error("consumer G9 contract has no evidence families");
    return `| ${caseId} | system | Consumer system boundary ${index + 1} | Exercise the consumer contract | Pass | ${family} | DOC-L4-ARCHITECTURE |`;
  }).join("\n");
  const l9Template = readFileSync(
    join(repositoryRoot, "docs/templates/vmodel/L9-system-test-design.md"),
    "utf8",
  );
  const l9 = l9Template
    .replace(/^status: .*$/m, "status: confirmed")
    .replace(/^pair_artifact: .*$/m, "pair_artifact: docs/design/L4-basic-design/")
    .replace(/^plan: .*$/m, "plan: docs/plans/PLAN-CONSUMER-01.md")
    .replace(
      "| テストID | 分類 | テスト項目 | 検証内容/手順 | 期待結果 | トレース元 |",
      "| テストID | 分類 | テスト項目 | 検証内容/手順 | 期待結果 | family | トレース元 |",
    )
    .replace("|---|---|---|---|---|---|", "|---|---|---|---|---|---|---|")
    .replace("| <記入> | <記入> | <記入> | <記入> | <記入> | <記入> |", caseRows);
  writeFixtureDoc(root, "docs/test-design/L9-system-test-design.md", l9);
  writeFixtureDoc(
    root,
    "docs/design/L4-basic-design/architecture.md",
    "---\ndoc_type_id: DOC-L4-ARCHITECTURE\nlayer: L4\nstatus: confirmed\npair_artifact: docs/test-design/L9-system-test-design.md\nplan: docs/plans/PLAN-CONSUMER-01.md\n---\n# DOC-L4-ARCHITECTURE\n\n**DOC-L4-ARCHITECTURE**\n",
  );
  writeFixtureDoc(
    root,
    "docs/design/L5-detailed-design/module-decomposition.md",
    "---\ndoc_type_id: DOC-L5-MODULE\nlayer: L5\nstatus: confirmed\npair_artifact: docs/test-design/L9-system-test-design.md\nplan: docs/plans/PLAN-CONSUMER-01.md\n---\n# DOC-L5-MODULE\n\n**DOC-L5-MODULE**\n",
  );
  writeFixtureDoc(root, "tests/fixtures/g9-consumer/system-results.txt", "passed\n");
  writeFixtureDoc(root, "tests/fixtures/g9-consumer/command-output.txt", "passed\n");
  writeFixtureDoc(
    root,
    `.ut-tdd/evidence/${evidenceDirectory}/ok.json`,
    `${JSON.stringify(consumerG9Manifest(evidenceDirectory), null, 2)}\n`,
  );
}

function updateConsumerG9Manifest(
  root: string,
  mutate: (manifest: ConsumerG9Manifest) => void,
): void {
  const obligation = g9ContractObligation();
  const evidenceDirectory = obligation.evidenceManifest.replaceAll("\\", "/").split("/").at(-2);
  if (!evidenceDirectory) throw new Error("consumer G9 contract has no evidence directory");
  const path = join(root, ".ut-tdd", "evidence", evidenceDirectory, "ok.json");
  const manifest = JSON.parse(readFileSync(path, "utf8")) as ConsumerG9Manifest;
  mutate(manifest);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function updateConsumerG9Design(root: string, mutate: (content: string) => string): void {
  const path = join(root, "docs", "test-design", "L9-system-test-design.md");
  writeFileSync(path, mutate(readFileSync(path, "utf8")), "utf8");
}

function firstConsumerG9Command(
  manifest: ConsumerG9Manifest,
): ConsumerG9Manifest["commands"][number] {
  const command = manifest.commands[0];
  if (!command) throw new Error("consumer G9 fixture command is missing");
  return command;
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
            CLAUDE_CODE_ENTRYPOINT: "",
            UT_TDD_DISABLE_CLAUDE_MEMORY_WAKE: "1",
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

  it("U-RCDEV-028: returns a typed missing-coverage reason and accepts an 80% consumer summary", () => {
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
    writeFixtureDoc(root, "coverage/unreadable.json", "{");
    expect(readCoverageSummary(join(root, "coverage", "unreadable.json"))).toMatchObject({
      ok: false,
      pct: null,
      reasons: ["coverage_summary_unreadable"],
    });
    writeFixtureDoc(root, "coverage/null-summary.json", "null");
    expect(readCoverageSummary(join(root, "coverage", "null-summary.json"))).toMatchObject({
      ok: false,
      pct: null,
      reasons: ["coverage_summary_unreadable"],
    });
    writeFixtureDoc(
      root,
      "coverage/missing-pct.json",
      JSON.stringify({ total: { branches: { pct: 100 } } }),
    );
    expect(readCoverageSummary(join(root, "coverage", "missing-pct.json"))).toMatchObject({
      ok: false,
      pct: null,
      reasons: ["coverage_summary_unreadable"],
    });
    writeFixtureDoc(
      root,
      "coverage/below-threshold.json",
      JSON.stringify({ total: { lines: { pct: 79 } } }),
    );
    expect(readCoverageSummary(join(root, "coverage", "below-threshold.json"))).toMatchObject({
      ok: false,
      pct: 79,
      reasons: ["coverage_below_threshold"],
    });

    writeFixtureDoc(
      root,
      "coverage/coverage-summary.json",
      JSON.stringify({ total: { lines: { pct: 80 } } }),
    );

    const passingCoverage = readCoverageSummary(coveragePath);
    const withCoverage = evaluateStaticGate({ gate: "G7", repoRoot: root });

    expect(passingCoverage).toMatchObject({ ok: true, pct: 80 });
    expect(passingCoverage.reasons).toBeUndefined();
    expect(passingCoverage.message).toBe("g7-coverage - OK (80% >= 80%)");
    expect(withCoverage.passed).toBe(false);
    expect(withCoverage.reasons).toBeUndefined();
    expect(withCoverage.messages).toContain("g7-coverage - OK (80% >= 80%)");
  });
});

describe("PR-GR consumer G8 predicates", () => {
  it("U-RCDEV-029: evaluates consumer G8 from the embedded contract without a local copy", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(true);
    expect(messages).toContain("未判定 (review): QA/TL");
  });

  it("U-RCDEV-029: prefers a consumer contract override for G8 manifest location", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root, {
      evidenceDirectory: "g8-consumer-override",
      contractOverride: true,
    });
    expect(readFileSync(join(root, "docs/process/vmodel-contract.yaml"), "utf8")).toContain(
      "evidence_manifest: .ut-tdd/evidence/g8-consumer-override/engine-swap.json",
    );

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.messages.join("\n")).toContain("未判定 (review): QA/TL");
  });

  it("U-RCDEV-029: rejects a missing required case-table column (S)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    const path = join(root, "docs/test-design/L8-integration-test-design.md");
    writeFileSync(path, readFileSync(path, "utf8").replace("期待結果", "結果"), "utf8");

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(messages).toContain("missing section");
  });

  it("U-RCDEV-029: rejects duplicate IT case IDs (I)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    const path = join(root, "docs/test-design/L8-integration-test-design.md");
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace("IT-CONSUMER-02", "IT-CONSUMER-01"),
      "utf8",
    );

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("duplicate case id");
  });

  it("U-RCDEV-029: rejects a citation to an undefined L5 target (T)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    const path = join(root, "docs/test-design/L8-integration-test-design.md");
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace(
        "DOC-L5-MODULE / DOC-L5-PHYSICAL-DATA",
        "DOC-L5-UNKNOWN / DOC-L5-PHYSICAL-DATA",
      ),
      "utf8",
    );

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("trace target missing");
  });

  it("U-RCDEV-029: rejects a case without an L5 citation (T)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    const path = join(root, "docs/test-design/L8-integration-test-design.md");
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace(" | DOC-L5-MODULE / DOC-L5-PHYSICAL-DATA |", " | |"),
      "utf8",
    );

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("untraced case IT-CONSUMER-01");
  });

  it("U-RCDEV-029: rejects a nonzero command result (E)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    updateConsumerG8Manifest(root, (manifest) => {
      firstConsumerCommand(manifest).exit_code = 1;
    });

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("exit_code is non-zero");
  });

  it("U-RCDEV-029: rejects a malformed output digest (E)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    updateConsumerG8Manifest(root, (manifest) => {
      firstConsumerCommand(manifest).output_digest = "sha256:xyz";
    });

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("invalid digest");
  });

  it("U-RCDEV-029: rejects a missing or disallowed command evidence path (E)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    updateConsumerG8Manifest(root, (manifest) => {
      firstConsumerCommand(manifest).evidence_path = ".external/command-output.txt";
    });

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("evidence_path missing");
  });

  it("U-RCDEV-029: rejects a G9 manifest schema in consumer G8 (E)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    updateConsumerG8Manifest(root, (manifest) => {
      manifest.schema_version = "g9-system-evidence-v1";
    });

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("invalid schema_version");
  });

  it("U-RCDEV-029: rejects a designed case omitted from all evidence (F)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    updateConsumerG8Manifest(root, (manifest) => {
      const missingId = "IT-CONSUMER-06";
      manifest.selected_it_ids = manifest.selected_it_ids.filter((id) => id !== missingId);
      manifest.mandatory_it_ids = manifest.mandatory_it_ids.filter((id) => id !== missingId);
      firstConsumerCommand(manifest).it_ids = firstConsumerCommand(manifest).it_ids.filter(
        (id) => id !== missingId,
      );
      manifest.coverage = manifest.coverage.filter((entry) => entry.it_id !== missingId);
    });

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("missing row evidence IT-CONSUMER-06");
  });

  it("U-RCDEV-029: rejects a missing contract-required result artifact (A)", () => {
    const root = fixtureRoot();
    writeConsumerG8Fixture(root);
    updateConsumerG8Manifest(root, (manifest) => {
      delete manifest.artifacts.integration_results;
    });

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("missing artifact integration_results");
  });

  it("U-RCDEV-029: routes each E-only mutation to consumer G8 validation", () => {
    const mutations: {
      name: string;
      expected: string;
      mutate: (manifest: ConsumerG8Manifest) => void;
    }[] = [
      {
        name: "schema",
        expected: "invalid schema_version",
        mutate: (manifest) => {
          manifest.schema_version = "g9-system-evidence-v1";
        },
      },
      {
        name: "gate",
        expected: "gate must be G8",
        mutate: (manifest) => {
          manifest.gate = "G9";
        },
      },
      {
        name: "exit code",
        expected: "exit_code is non-zero",
        mutate: (manifest) => {
          firstConsumerCommand(manifest).exit_code = 1;
        },
      },
      {
        name: "digest",
        expected: "invalid digest",
        mutate: (manifest) => {
          firstConsumerCommand(manifest).output_digest = `sha256:${"a".repeat(63)}`;
        },
      },
      {
        name: "stale defer count type",
        expected: "stale_defer_count must be 0",
        mutate: (manifest) => {
          (manifest.exit_criteria as unknown as Record<string, unknown>).stale_defer_count = "0";
        },
      },
    ];

    for (const mutation of mutations) {
      const root = fixtureRoot();
      writeConsumerG8Fixture(root);
      updateConsumerG8Manifest(root, mutation.mutate);

      const result = evaluateStaticGate({ gate: "G8", repoRoot: root });

      expect(result.passed, mutation.name).toBe(false);
      expect(result.messages.join("\n"), mutation.name).toContain(mutation.expected);
    }
  });

  it("U-RCDEV-029: keeps harness G8 family checks on the public gate path", () => {
    const root = fixtureRoot();
    const repositoryRoot = process.cwd();
    const harnessResult = evaluateStaticGate({ gate: "G8", repoRoot: repositoryRoot });
    expect(harnessResult.passed).toBe(true);
    expect(harnessResult.messages).toContain("未判定 (review): QA/TL");
    writeFixtureDoc(
      root,
      "docs/test-design/harness/L8-integration-test-design.md",
      readFileSync(
        join(repositoryRoot, "docs/test-design/harness/L8-integration-test-design.md"),
        "utf8",
      ),
    );
    writeFixtureDoc(
      root,
      "docs/process/gates.md",
      readFileSync(join(repositoryRoot, "docs/process/gates.md"), "utf8"),
    );
    const sourceManifestPath = join(
      repositoryRoot,
      ".ut-tdd/evidence/g8-integration/20260626-it-module-state-minimum.json",
    );
    const manifest = JSON.parse(readFileSync(sourceManifestPath, "utf8")) as {
      selected_it_ids: string[];
      mandatory_it_ids: string[];
      commands: { it_ids: string[]; evidence_path: string }[];
      coverage: { it_id: string; evidence_paths: string[] }[];
    };
    // 別familyの負例データであり、そのfamilyのoracle実装citationではない。
    const unrelatedFamilyIds = ["01", "02"].map((suffix) => ["IT", "ASSET", suffix].join("-"));
    manifest.selected_it_ids = [...unrelatedFamilyIds];
    manifest.mandatory_it_ids = [...unrelatedFamilyIds];
    manifest.commands = manifest.commands.map((command) => ({
      ...command,
      it_ids: [...unrelatedFamilyIds],
    }));
    manifest.coverage = manifest.coverage.map((entry, index) => ({
      ...entry,
      it_id: unrelatedFamilyIds[index % unrelatedFamilyIds.length] as string,
    }));
    const evidencePaths = new Set([
      ...manifest.commands.map((command) => command.evidence_path),
      ...manifest.coverage.flatMap((entry) => entry.evidence_paths),
    ]);
    for (const path of evidencePaths) {
      writeFixtureDoc(root, path, readFileSync(join(repositoryRoot, path), "utf8"));
    }
    writeFixtureDoc(
      root,
      ".ut-tdd/evidence/g8-integration/consumer-family-negative.json",
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    const result = evaluateStaticGate({ gate: "G8", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(messages).toContain("selected IT coverage missing IT-MODULE- family");
    expect(messages).toContain("mandatory IT coverage missing IT-STATE- family");
    expect(messages).toContain("未判定 (review): QA/TL");

    writeFixtureDoc(
      root,
      "docs/process/vmodel-contract.yaml",
      readFileSync(join(repositoryRoot, "docs/process/vmodel-contract.yaml"), "utf8").replace(
        "    approval_role: QA/TL",
        "    approval_role: TL",
      ),
    );
    const changedRole = evaluateStaticGate({ gate: "G8", repoRoot: root });
    expect(changedRole.passed).toBe(false);
    expect(changedRole.messages).toContain("未判定 (review): TL");
    expect(changedRole.messages).not.toContain("未判定 (review): QA/TL");
  });
});

describe("PR-G9 consumer G9 predicates", () => {
  it("U-RCDEV-030: evaluates consumer G9 from the contract and emits its review tier", () => {
    const root = fixtureRoot();
    const obligation = g9ContractObligation();
    writeConsumerG9Fixture(root);

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(obligation.evidenceFamilies).toEqual(
      expect.arrayContaining(["ST", "performance", "security"]),
    );
    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(true);
    expect(messages).toContain(`未判定 (review): ${obligation.approvalRole}`);
  });

  it("U-RCDEV-030: rejects each missing G9 template chapter and subsection (S)", () => {
    const template = readFileSync(
      join(process.cwd(), "docs/templates/vmodel/L9-system-test-design.md"),
      "utf8",
    );
    const headings = template.split(/\r?\n/).filter((line) => /^#{4,5} /.test(line));
    expect(headings.length).toBeGreaterThan(7);
    const acceptedMissingHeadings: string[] = [];
    for (const heading of headings) {
      const root = fixtureRoot();
      writeConsumerG9Fixture(root);
      updateConsumerG9Design(root, (content) =>
        content
          .split(/\r?\n/)
          .filter((line) => line !== heading)
          .join("\n"),
      );
      const result = evaluateStaticGate({ gate: "G9", repoRoot: root });
      if (result.passed || !result.messages.join("\n").includes(`missing section ${heading}`)) {
        acceptedMissingHeadings.push(heading);
      }
    }
    expect(acceptedMissingHeadings).toEqual([]);
  });

  it("U-RCDEV-030: rejects a missing required G9 case-table column (S)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    updateConsumerG9Design(root, (content) => content.replace("期待結果", "結果"));

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("missing section");
  });

  it("U-RCDEV-030: rejects duplicate ST case IDs (I)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    updateConsumerG9Design(root, (content) => content.replace("ST-CONSUMER-02", "ST-CONSUMER-01"));

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("duplicate case id");
  });

  it("U-RCDEV-030: rejects a case whose only citation is outside the L4 pair (T)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    updateConsumerG9Design(root, (content) =>
      content.replace("DOC-L4-ARCHITECTURE", "DOC-L5-MODULE"),
    );

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("untraced case ST-CONSUMER-01");
  });

  it("U-RCDEV-030: rejects a defer to a missing PLAN (F)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    updateConsumerG9Manifest(root, (manifest) => {
      const deferredId = "ST-CONSUMER-06";
      manifest.mandatory_st_ids = manifest.mandatory_st_ids.filter((id) => id !== deferredId);
      manifest.deferred_st_ids = [deferredId];
      manifest.coverage = manifest.coverage.filter((entry) => entry.st_id !== deferredId);
      manifest.defer = [
        {
          st_id: deferredId,
          reason: "Consumer fixture defer mutation",
          plan_id: "PLAN-CONSUMER-MISSING-01",
        },
      ];
    });

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("stale defer ST-CONSUMER-06");
  });

  it("U-RCDEV-030: accepts a deferred ST row routed to an existing PLAN (F)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    writeFixtureDoc(root, "docs/plans/PLAN-CONSUMER-DEFER-01.md", "# Consumer defer plan\n");
    updateConsumerG9Manifest(root, (manifest) => {
      const deferredId = "ST-CONSUMER-06";
      manifest.mandatory_st_ids = manifest.mandatory_st_ids.filter((id) => id !== deferredId);
      manifest.deferred_st_ids = [deferredId];
      manifest.coverage = manifest.coverage.filter((entry) => entry.st_id !== deferredId);
      manifest.defer = [
        {
          st_id: deferredId,
          reason: "Consumer fixture defers this row to its tracked plan",
          plan_id: "PLAN-CONSUMER-DEFER-01",
        },
      ];
    });

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.messages.join("\n")).toContain("未判定 (review): QA/TL");
  });

  it("U-RCDEV-030: rejects a missing contract-required system manifest artifact (A)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    updateConsumerG9Manifest(root, (manifest) => {
      delete manifest.artifacts.system_manifest;
    });

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.messages.join("\n")).toContain("missing artifact system_manifest");
  });

  it("U-RCDEV-030: requires every contract evidence family in consumer case rows", () => {
    const root = fixtureRoot();
    const securityFamily = g9ContractObligation().evidenceFamilies.find(
      (family) => family === "security",
    );
    if (!securityFamily) throw new Error("consumer G9 contract has no security evidence family");
    writeConsumerG9Fixture(root);
    updateConsumerG9Design(root, (content) =>
      content.replaceAll(`| ${securityFamily} |`, "| ST |"),
    );

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(messages).toContain(securityFamily);
  });

  it("U-RCDEV-030: rejects an unknown per-row G9 evidence family", () => {
    const root = fixtureRoot();
    const securityFamily = g9ContractObligation().evidenceFamilies.find(
      (family) => family === "security",
    );
    if (!securityFamily) throw new Error("consumer G9 contract has no security evidence family");
    writeConsumerG9Fixture(root);
    updateConsumerG9Design(root, (content) =>
      content.replace(
        `| ${securityFamily} | DOC-L4-ARCHITECTURE |`,
        "| UNKNOWN-FAMILY | DOC-L4-ARCHITECTURE |",
      ),
    );

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });
    const messages = result.messages.join("\n");

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
    expect(messages).toContain("UNKNOWN-FAMILY");
  });

  it("U-RCDEV-030: rejects failed mandatory G9 exit criteria (E)", () => {
    const root = fixtureRoot();
    writeConsumerG9Fixture(root);
    updateConsumerG9Manifest(root, (manifest) => {
      manifest.exit_criteria.failed_mandatory_count = 1;
    });

    const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("U-RCDEV-030: routes each E-only mutation through consumer G9 validation", () => {
    const mutations: {
      name: string;
      expected: string;
      mutate: (manifest: ConsumerG9Manifest) => void;
    }[] = [
      {
        name: "schema",
        expected: "invalid schema_version",
        mutate: (manifest) => {
          manifest.schema_version = "g8-integration-evidence-v1";
        },
      },
      {
        name: "gate",
        expected: "gate must be G9",
        mutate: (manifest) => {
          manifest.gate = "G8";
        },
      },
      {
        name: "exit code",
        expected: "exit_code is non-zero",
        mutate: (manifest) => {
          firstConsumerG9Command(manifest).exit_code = 1;
        },
      },
      {
        name: "digest",
        expected: "invalid digest",
        mutate: (manifest) => {
          firstConsumerG9Command(manifest).output_digest = `sha256:${"a".repeat(63)}`;
        },
      },
      {
        name: "stale defer count type",
        expected: "stale_defer_count must be 0",
        mutate: (manifest) => {
          (manifest.exit_criteria as unknown as Record<string, unknown>).stale_defer_count = "0";
        },
      },
    ];

    for (const mutation of mutations) {
      const root = fixtureRoot();
      writeConsumerG9Fixture(root);
      updateConsumerG9Manifest(root, mutation.mutate);

      const result = evaluateStaticGate({ gate: "G9", repoRoot: root });

      expect(result.applicable, mutation.name).toBe(true);
      expect(result.passed, mutation.name).toBe(false);
      expect(result.messages.join("\n"), mutation.name).toContain(mutation.expected);
    }
  });

  it("U-RCDEV-030: preserves the existing harness G9 workflow result on the public gate path", () => {
    const repositoryRoot = process.cwd();
    const workflow = checkG9SystemWorkflow(repositoryRoot);
    const result = evaluateStaticGate({ gate: "G9", repoRoot: repositoryRoot });
    const workflowMessages = result.messages.filter((message) =>
      message.startsWith("g9-system-workflow"),
    );

    expect(result.applicable).toBe(true);
    expect(result.passed).toBe(workflow.ok);
    expect(workflowMessages).toEqual(workflow.messages);
    expect(result.messages).toContain(`未判定 (review): ${g9ContractObligation().approvalRole}`);
  });
});
