import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadFrUnitCoverageOracles } from "../src/lint/descent-obligation.ts";
import {
  analyzeL6FrCoverage,
  type L6FrCoverageDocs,
  type L6FrCoverageResult,
  loadL6FrCoverageDocs,
  parseL6FrCoverageRows,
} from "../src/lint/l6-fr-coverage.ts";

describe("L6 FR coverage (FR registry -> unit-level function spec)", () => {
  it("parses FR coverage rows from the L6 matrix", () => {
    const rows = parseL6FrCoverageRows(`
| FR | L6 spec | unit contract | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/function-spec.md | planDraft | U-FR-L1-01 |
`);
    expect(rows).toEqual([
      {
        fr_id: "FR-L1-01",
        l6_spec: "docs/design/harness/L6-function-design/function-spec.md",
        unit_contract: "planDraft",
        unit_oracle: "U-FR-L1-01",
      },
    ]);
  });

  it("reports missing, unknown, and incomplete FR rows", () => {
    const result = analyzeL6FrCoverage({
      frIds: ["FR-L1-01", "FR-L1-02"],
      coverageText: `
| FR | L6 spec | unit contract | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/function-spec.md | \`planDraft\` |  |
| FR-L1-99 | docs/design/harness/L6-function-design/function-spec.md | \`unknown\` | U-FR-L1-98 |
`,
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["FR-L1-02"]);
    expect(result.unknown).toEqual(["FR-L1-99"]);
    expect(result.incomplete).toEqual([
      { fr_id: "FR-L1-01", missing: ["unit_oracle"] },
      { fr_id: "FR-L1-99", missing: ["unit_oracle_match"] },
    ]);
  });

  it("requires contract references to be present in the referenced L6 spec", () => {
    const result = analyzeL6FrCoverage({
      frIds: ["FR-L1-01"],
      coverageText: `
| FR | L6 spec | unit contract | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/session-log.md | \`missingContract\` validates input. | U-FR-L1-01 |
`,
      repoRoot: process.cwd(),
    });
    expect(result.ok).toBe(false);
    expect(result.weakContracts).toEqual([
      {
        fr_id: "FR-L1-01",
        contract: "missingContract",
        reason: "contract_ref_missing_in_l6_spec",
      },
    ]);
    expect(result.missingSubstance).toEqual([]);
  });

  it("requires function-spec refs to carry type body plus pseudocode or explicit defer", () => {
    const result = analyzeL6FrCoverage({
      frIds: ["FR-L1-01"],
      coverageText: `
| FR | L6 spec | unit contract | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/function-spec.md | \`runDoctor\` validates input. | U-FR-L1-01 |
`,
      repoRoot: process.cwd(),
    });
    expect(result.ok).toBe(false);
    expect(result.missingSubstance).toEqual([
      {
        fr_id: "FR-L1-01",
        contract: "runDoctor",
        reason: "missing_type_body_or_pseudocode_defer_marker",
      },
    ]);
  });

  it("requires explicit L7 defer rows to include a structured field block", () => {
    const repoRoot = join(tmpdir(), `ut-tdd-l6-fr-${Date.now()}`);
    const specDir = join(repoRoot, "docs", "design", "harness", "L6-function-design");
    mkdirSync(specDir, { recursive: true });
    writeFileSync(
      join(specDir, "function-spec.md"),
      `
| function | type body | pseudocode / implementation_state |
|---|---|---|
| \`deferredContract\` | \`DeferredInput -> DeferredResult\` | explicit_l7_defer; pseudocode = validate input and return result |
`,
      "utf8",
    );
    try {
      const result = analyzeL6FrCoverage({
        frIds: ["FR-L1-01"],
        coverageText: `
| FR | L6 spec | unit contract | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/function-spec.md | \`deferredContract\` validates input. | U-FR-L1-01 |
`,
        repoRoot,
      });
      expect(result.ok).toBe(false);
      expect(result.missingSubstance).toEqual([
        {
          fr_id: "FR-L1-01",
          contract: "deferredContract",
          reason: "missing_type_body_or_pseudocode_defer_marker",
        },
      ]);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("real repo covers every FR-L1 row with an L6 spec and U-* oracle", () => {
    const result = analyzeL6FrCoverage(loadL6FrCoverageDocs());
    expect(result.totalFr).toBe(51);
    expect(result.covered).toBe(51);
    expect(result.missing).toEqual([]);
    expect(result.unknown).toEqual([]);
    expect(result.incomplete).toEqual([]);
    expect(result.missingSpecFiles).toEqual([]);
    expect(result.weakContracts).toEqual([]);
    expect(result.missingSubstance).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Issue #848 退役行 coverage 契約の Red 候補 (CANDIDATE-U-FRCOV-007..023)。
// 契約: docs/design/harness/L6-function-design/fr-unit-coverage.md §Issue #848
//       docs/test-design/harness/L7-unit-test-design.md (候補表)
// 入力は既存公開 API の `analyzeL6FrCoverage({ frIds, coverageText, repoRoot })` と
// `loadFrUnitCoverageOracles(root)` のみ。退役状態・PLAN・oracle 宣言・実 test は
// fixture repoRoot の正規パス配下の文書から読まれる前提 (L6 契約が signature を変えないため)。
// 各 negative は「有効な双子 fixture が受理されること」を先に確かめ、その後に1条件だけ変えた
// fixture が拒否されることを確かめる。現行実装は退役状態を読まず双子を拒否するので、
// assertion (expect) まで届いて落ちる (import 不足・余分引数・setup 失敗による偽 Red ではない)。
// ---------------------------------------------------------------------------

const RET_SPEC_REL = "docs/design/harness/L6-function-design/retire-fixture.md";
const RET_FS_REL = "docs/design/harness/L6-function-design/function-spec.md";
const RET_TEST_REL = "tests/fixture/retired.test.ts";
const RET_TEST_REL_2 = "tests/fixture/retired-second.test.ts";
const RET_PLAN_ID = "PLAN-L6-RET-01-fixture";
const RET_PLAN_REL = `docs/plans/${RET_PLAN_ID}.md`;
const CAND = "CANDIDATE-U-RET-001";
const FORMAL = "U-RET-001";

interface RetDecl {
  id: string;
  path: string;
  target: string;
}

interface RetFx {
  /** undefined のとき registry は既存7列だけ (fr_state / retirement_plan 列なし)。 */
  frState?: string;
  plan?: string;
  coverageOracle: string;
  specRel: string;
  specText: string;
  candDecls: RetDecl[];
  formalDecls: RetDecl[];
  testFiles: Record<string, string>;
  /** repo-relative path -> frontmatter plan_id */
  plans: Record<string, string>;
  /** L7 test-design 文書へ追記する prose (宣言ではない言及)。 */
  prose: string;
}

const PLAIN_SPEC = "# retire fixture\n\n`retireContract` is the fixture contract.\n";
const FS_SPEC_OK = [
  "| Function | Signature | pre | post |",
  "|---|---|---|---|",
  "| `retireContract` | f | p | q |",
  "",
  "| function | type body | pseudocode / implementation_state |",
  "|---|---|---|",
  "| `retireContract` | `RetireInput { id: string; ok?: boolean } -> RetireResult` | explicit_l7_defer; pseudocode = validate |",
  "",
].join("\n");
const FS_SPEC_HOLLOW = FS_SPEC_OK.replace(
  "RetireInput { id: string; ok?: boolean }",
  "RetireInput",
);

function retDecl(id: string, path = RET_TEST_REL, target = "FR-L1-05"): RetDecl {
  return { id, path, target };
}

/** 有効な candidate-positive fixture (CANDIDATE-U-FRCOV-008 の正例)。 */
function candidateFx(over: Partial<RetFx> = {}): RetFx {
  return {
    frState: "retired",
    plan: RET_PLAN_ID,
    coverageOracle: CAND,
    specRel: RET_SPEC_REL,
    specText: PLAIN_SPEC,
    candDecls: [retDecl(CAND)],
    formalDecls: [],
    testFiles: { [RET_TEST_REL]: `it("${CAND} retired row", () => {});\n` },
    plans: { [RET_PLAN_REL]: RET_PLAN_ID },
    prose: "",
    ...over,
  };
}

/** 有効な formal-positive fixture (CANDIDATE-U-FRCOV-009 の正例)。 */
function formalFx(over: Partial<RetFx> = {}): RetFx {
  return candidateFx({
    coverageOracle: FORMAL,
    candDecls: [],
    formalDecls: [retDecl(FORMAL)],
    testFiles: { [RET_TEST_REL]: `it("${FORMAL} retired row", () => {});\n` },
    ...over,
  });
}

function declTable(title: string, decls: RetDecl[]): string {
  const rows = decls.map(
    (d) => `| ${d.id} | ${d.path} | ${d.target ? `${d.target} の退役 oracle` : "退役 oracle"} |`,
  );
  return [
    `### ${title}`,
    "",
    "| Test ID | 対象 / 実test引用予定 | 期待 |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

const tmpRoots: string[] = [];

function materialize(fx: RetFx): { docs: L6FrCoverageDocs; root: string } {
  const root = join(tmpdir(), `ut-tdd-fr-retire-${process.pid}-${tmpRoots.length}-${Date.now()}`);
  tmpRoots.push(root);
  const put = (rel: string, text: string) => {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text, "utf8");
  };
  const stateCols = fx.frState === undefined ? "" : ` ${fx.frState} | ${fx.plan ?? ""} |`;
  put(
    "docs/design/harness/L1-requirements/functional-requirements.md",
    [
      "## §1 機能一覧",
      "",
      "| ID | 機能名 | 出典 | 入力 | 出力 | 重要度 | 画面 | fr_state | retirement_plan |",
      "|---|---|---|---|---|---|---|---|---|",
      `| **FR-L1-05** | retired fn | src | in | out | P1 | - |${stateCols}`,
      "",
      "### §1.1 end",
      "",
    ].join("\n"),
  );
  put(
    "docs/test-design/harness/L7-unit-test-design.md",
    `# L7 fixture\n\n${fx.prose}\n\n${declTable("candidate oracle 宣言表", fx.candDecls)}\n${declTable("正式 oracle 宣言表", fx.formalDecls)}`,
  );
  for (const [rel, planId] of Object.entries(fx.plans)) {
    put(rel, `---\nplan_id: ${planId}\nstatus: confirmed\n---\n\n# ${planId}\n`);
  }
  for (const [rel, text] of Object.entries(fx.testFiles)) put(rel, text);
  put(fx.specRel, fx.specText);
  const coverageText = [
    "| FR | L6 spec | unit contract | unit oracle |",
    "|---|---|---|---|",
    `| FR-L1-05 | ${fx.specRel} | \`retireContract\` validates retirement. | ${fx.coverageOracle} |`,
    "",
  ].join("\n");
  put("docs/design/harness/L6-function-design/fr-unit-coverage.md", coverageText);
  return { docs: { frIds: ["FR-L1-05"], coverageText, repoRoot: root }, root };
}

function runFx(fx: RetFx): L6FrCoverageResult {
  return analyzeL6FrCoverage(materialize(fx).docs);
}

/** 双子 (有効 fixture) が受理され、1条件だけ変えた fixture が拒否されること。 */
function expectPairRejected(valid: RetFx, mutated: RetFx): void {
  expect(runFx(valid).ok).toBe(true);
  expect(runFx(mutated).ok).toBe(false);
}

describe("Issue #848 FR retirement coverage (CANDIDATE-U-FRCOV-007..023, Red)", () => {
  afterEach(() => {
    for (const root of tmpRoots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  // 現行実装でも成立する回帰 guard。Red にならないため it.fails ではなく通常の it とする。
  it("CANDIDATE-U-FRCOV-007: active FR keeps the exact U-FR oracle and rejects a candidate id", () => {
    const active = candidateFx({
      frState: "active",
      plan: "",
      coverageOracle: "U-FR-L1-05",
      candDecls: [],
    });
    expect(runFx(active).ok).toBe(true);
    const candidateOnActive = runFx({ ...active, coverageOracle: CAND });
    expect(candidateOnActive.ok).toBe(false);
    expect(candidateOnActive.incomplete).toContainEqual({
      fr_id: "FR-L1-05",
      missing: ["unit_oracle_match"],
    });
  });

  it.fails("CANDIDATE-U-FRCOV-008: retired row with resolved plan, candidate declaration and test citation is accepted as candidate", () => {
    const result = runFx(candidateFx());
    expect(result.incomplete).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.fails("CANDIDATE-U-FRCOV-009: formal state is accepted only when coverage, declaration and test citation are all formal", () => {
    const result = runFx(formalFx());
    expect(result.incomplete).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.fails("CANDIDATE-U-FRCOV-010: retired row without retirement_plan is rejected", () => {
    expectPairRejected(candidateFx(), candidateFx({ plan: "" }));
  });

  it.fails("CANDIDATE-U-FRCOV-011: retirement_plan that does not resolve is rejected", () => {
    expectPairRejected(
      candidateFx(),
      candidateFx({ plan: "docs/plans/PLAN-L6-RET-99-missing.md" }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-012: ambiguous or shortened plan references are rejected", () => {
    const dupRel = "docs/plans/PLAN-L6-RET-01-fixture-copy.md";
    expect(runFx(candidateFx()).ok).toBe(true);
    // 同じ frontmatter plan_id を持つ文書が2つ: ID 参照は一意に解決しない。
    const dup = candidateFx({ plans: { [RET_PLAN_REL]: RET_PLAN_ID, [dupRel]: RET_PLAN_ID } });
    expect(runFx(dup).ok).toBe(false);
    // 短縮形 / 数値 suffix だけの参照は認めない。
    expect(runFx(candidateFx({ plan: "RET-01" })).ok).toBe(false);
    expect(runFx(candidateFx({ plan: "01" })).ok).toBe(false);
  });

  it.fails("CANDIDATE-U-FRCOV-013: candidate id without a declaration row is rejected even if prose mentions it", () => {
    expectPairRejected(
      candidateFx(),
      candidateFx({ candDecls: [], prose: `${CAND} は本文で言及されるだけ。` }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-014: formal id without a declaration row is rejected even if prose and candidate row mention it", () => {
    expectPairRejected(
      formalFx(),
      formalFx({
        formalDecls: [],
        candDecls: [retDecl(CAND)],
        prose: `${FORMAL} は本文で言及されるだけ。`,
      }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-015: declaration whose real test file is missing is rejected", () => {
    expectPairRejected(candidateFx(), candidateFx({ testFiles: {} }));
  });

  it.fails("CANDIDATE-U-FRCOV-016: test file citing a different oracle id is rejected", () => {
    expectPairRejected(
      candidateFx(),
      candidateFx({
        testFiles: {
          [RET_TEST_REL]:
            'it("CANDIDATE-U-RET-0010 prefix lookalike", () => {});\nit("CANDIDATE-U-RET-002", () => {});\n',
        },
      }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-017: partial promotion (one or two surfaces to formal) is rejected in all 6 cases", () => {
    expect(runFx(candidateFx()).ok).toBe(true);
    const candTest = { [RET_TEST_REL]: `it("${CAND}", () => {});\n` };
    const formalTest = { [RET_TEST_REL]: `it("${FORMAL}", () => {});\n` };
    const formalDecl = { candDecls: [], formalDecls: [retDecl(FORMAL)] };
    const cases: [string, RetFx][] = [
      ["coverage only", candidateFx({ coverageOracle: FORMAL })],
      ["declaration only", candidateFx(formalDecl)],
      ["test citation only", candidateFx({ testFiles: formalTest })],
      [
        "coverage+declaration",
        candidateFx({ coverageOracle: FORMAL, ...formalDecl, testFiles: candTest }),
      ],
      ["coverage+test", candidateFx({ coverageOracle: FORMAL, testFiles: formalTest })],
      ["declaration+test", candidateFx({ ...formalDecl, testFiles: formalTest })],
    ];
    for (const [label, fx] of cases) {
      expect(runFx(fx).ok, `partial promotion must be rejected: ${label}`).toBe(false);
    }
  });

  it.fails("CANDIDATE-U-FRCOV-018: unknown or evidence-less state never falls back to a normal FR, and retired labels do not hide substance errors", () => {
    // 未知 state: 通常 oracle U-FR-L1-05 が揃っていても通常 FR へ fallback しない。
    const unknown = candidateFx({
      frState: "suspended",
      coverageOracle: "U-FR-L1-05",
      candDecls: [],
    });
    expect(runFx(unknown).ok).toBe(false);
    // 既知 retired でも退役根拠 (plan) 欠落なら通常 oracle fallback で通さない。
    const noPlan = candidateFx({ plan: "", coverageOracle: "U-FR-L1-05", candDecls: [] });
    expect(runFx(noPlan).ok).toBe(false);
    // retired + candidate でも U-FRCOV-006 既存反例 (field block なし explicit_l7_defer) の substance error は残る。
    const valid = candidateFx({ specRel: RET_FS_REL, specText: FS_SPEC_OK });
    const hollow = candidateFx({ specRel: RET_FS_REL, specText: FS_SPEC_HOLLOW });
    expect(runFx(valid).ok).toBe(true);
    const hollowResult = runFx(hollow);
    expect(hollowResult.ok).toBe(false);
    expect(hollowResult.missingSubstance.map((m) => m.fr_id)).toEqual(["FR-L1-05"]);
    // loadFrUnitCoverageOracles (descent reader) は doctor と同じ有効 / 無効判定を返す。
    expect([...loadFrUnitCoverageOracles(materialize(valid).root)]).toContain("FR-L1-05");
    expect([...loadFrUnitCoverageOracles(materialize(hollow).root)]).not.toContain("FR-L1-05");
  });

  it.fails("CANDIDATE-U-FRCOV-019: active row carrying retirement_plan is rejected", () => {
    const active = candidateFx({
      frState: "active",
      plan: "",
      coverageOracle: "U-FR-L1-05",
      candDecls: [],
    });
    expectPairRejected(active, { ...active, plan: RET_PLAN_ID });
  });

  it.fails("CANDIDATE-U-FRCOV-020: ambiguous double declaration of the exact oracle id is rejected", () => {
    expectPairRejected(
      candidateFx(),
      candidateFx({
        candDecls: [retDecl(CAND), retDecl(CAND, RET_TEST_REL_2)],
        testFiles: {
          [RET_TEST_REL]: `it("${CAND}", () => {});\n`,
          [RET_TEST_REL_2]: `it("${CAND} second", () => {});\n`,
        },
      }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-021: resolved plan document whose frontmatter plan_id differs is rejected", () => {
    expectPairRejected(
      candidateFx({ plan: RET_PLAN_REL }),
      candidateFx({ plan: RET_PLAN_REL, plans: { [RET_PLAN_REL]: "PLAN-L6-RET-77-other" } }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-022: declaration row without the target FR id is rejected", () => {
    expectPairRejected(
      candidateFx(),
      candidateFx({ candDecls: [retDecl(CAND, RET_TEST_REL, "")] }),
    );
  });

  it.fails("CANDIDATE-U-FRCOV-023: declaration row targeting a different FR id is rejected", () => {
    expectPairRejected(
      candidateFx(),
      candidateFx({ candDecls: [retDecl(CAND, RET_TEST_REL, "FR-L1-06")] }),
    );
  });
});
