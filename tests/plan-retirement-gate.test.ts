import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * Issue #1078 PLAN 退役 gate の候補 Red (CANDIDATE-U-PLRET-001..037、016 を除く)。
 * 契約: docs/design/harness/L6-function-design/plan-retirement-gate.md
 * テスト設計: docs/test-design/harness/L7-plan-retirement-gate-test-design.md
 *
 * 対象 module `src/lint/plan-retirement-gate.ts` は実装 PR で新設される (本 slice では存在しない)。
 * import 解決の失敗を「期待どおりの失敗」にしないため、module は動的に読み、未実装なら `expect` の
 * assertion で落とす。各テストは fixture を完備した形まで組んでから関数を呼ぶので、実装 PR では
 * `it.fails` を `it` に戻した後に、候補ごとの mutation probe で個別の Red 性を確かめる前提である。
 */

const MODULE_SPECIFIER = "../src/lint/plan-retirement-gate.ts";
const DISP_PATH =
  "docs/governance/candidates/v4-roadmap/migration/06_PLAN_DISPOSITION_FIRST_PASS.json";
const REPO_ROOT = process.cwd();

type Reason = string;
interface Violation {
  path: string;
  reason: Reason;
}
interface Result {
  violations: Violation[];
  ok: boolean;
}
interface Input {
  deletedPlanPaths: string[];
  headPlanPaths: string[];
  planReferrers: { path: string; refs: string[] }[];
  designOwners: { path: string; plan: string | null }[];
  disposition: unknown | null;
  dispositionChangedInPr: boolean;
  supersessionFacts: Record<
    string,
    { successorDeclaresTarget: boolean; targetBodyBackref: boolean }
  >;
  planHeadings: Record<string, string[] | null>;
  successorPlanHeadings: Record<string, string[] | null>;
  fileHeadings: Record<string, string[] | null>;
  fileTexts: Record<string, string | null>;
}
interface Api {
  analyzePlanRetirement(input: Input): Result;
  loadPlanRetirementInput(repoRoot: string, base: string, head: string): Input;
  planRetirementMessages(result: Result): string[];
}

async function api(): Promise<Api> {
  let mod: unknown = null;
  try {
    mod = await import(/* @vite-ignore */ MODULE_SPECIFIER);
  } catch {
    mod = null;
  }
  expect(mod, "src/lint/plan-retirement-gate.ts is not implemented yet").not.toBeNull();
  const m = mod as Partial<Api>;
  expect(typeof m.analyzePlanRetirement).toBe("function");
  expect(typeof m.loadPlanRetirementInput).toBe("function");
  expect(typeof m.planRetirementMessages).toBe("function");
  return m as Api;
}

// ---------------------------------------------------------------------------
// 純粋関数 fixture (最小の完備 fixture を基準に 1 点だけ壊す)
// ---------------------------------------------------------------------------

const X = "docs/plans/PLAN-L6-901-retire-x.md";
const Y = "docs/plans/PLAN-L6-903-retire-y.md";
const Z = "docs/plans/PLAN-L6-902-successor-z.md";
const A = "docs/plans/PLAN-L6-900-keep-a.md";
const DESIGN = "docs/design/harness/L6-function-design/fixture-dest.md";
const EVID = "docs/governance/candidates/fixture-evidence.md";
const EVID_ID = "CD-01";
const id = (p: string): string => basename(p, ".md");

type Rec = Record<string, unknown>;

function link(target: string, successor: string, over: Rec = {}): Rec {
  return {
    successorPlanId: id(successor),
    successorStatus: "draft",
    supersedesTarget: id(target),
    targetExistsAtSourceCommit: true,
    targetBodyBackrefCore: "PLAN-L6-902",
    targetBodyBackrefLines: [15],
    selfSupersedesExcluded: false,
    confirmedTwoSidedLink: true,
    ...over,
  };
}

const THREE_WAY = {
  kind: "three-way",
  verdict: "consistent",
  evidencePath: EVID,
  evidenceId: EVID_ID,
};

function rec(path: string, over: Rec = {}): Rec {
  return {
    planId: id(path),
    sourcePath: path,
    wholeSourceDisposition: "transferred",
    destinations: [{ kind: "design", path: DESIGN, section: "§4 判定規則" }],
    confirmedSupersededBy: [],
    reconciliation: { ...THREE_WAY },
    ...over,
  };
}

/** retired + 理由 + three-way の完備記録 (行き先なし)。 */
function retiredRec(path: string, over: Rec = {}): Rec {
  return rec(path, {
    wholeSourceDisposition: "retired",
    destinations: [],
    retirementReason: "後継 PLAN へ統合済みのため",
    ...over,
  });
}

/** 全面 supersede の coverage (旧 PLAN の見出し「概要」を全て覆う。契約改訂 #1078 の記録形式への追従)。 */
function fullCoverageFor(succ: string): Rec {
  return {
    coverage: "full",
    coverageBasis: [
      { anchor: "概要", successorLocation: { kind: "plan", planId: id(succ), section: "概要" } },
    ],
  };
}
const FULL_COVERAGE = fullCoverageFor(Z);

/** supersedes-two-sided で後継 Z (存続) を指す完備記録。 */
function twoSidedRec(path: string, succ: string, over: Rec = {}): Rec {
  return retiredRec(path, {
    reconciliation: { kind: "supersedes-two-sided", ...FULL_COVERAGE },
    confirmedSupersededBy: [link(path, succ)],
    ...over,
  });
}

function facts(target: string, succ: string, v = true, b = true): Input["supersessionFacts"] {
  return {
    [`${id(target)}->${id(succ)}`]: { successorDeclaresTarget: v, targetBodyBackref: b },
  };
}

function input(records: Rec[], over: Partial<Input> = {}): Input {
  return {
    deletedPlanPaths: [X],
    headPlanPaths: [],
    planReferrers: [],
    designOwners: [],
    disposition: { schemaVersion: 1, plans: records },
    dispositionChangedInPr: false,
    supersessionFacts: {},
    planHeadings: { [X]: ["概要"], [Y]: ["概要"] },
    successorPlanHeadings: { [Z]: ["概要"] },
    fileHeadings: { [DESIGN]: ["§4 判定規則", "判定規則 (DbC)"] },
    fileTexts: { [EVID]: `${EVID_ID} の三者照合は一致した。` },
    ...over,
  };
}

/**
 * 記録から、テスト内で独立に期待 reason と ok を算出する (analyzer の実装を使わない)。
 * 規則 2 が失敗した後に規則 3・4 を続けるかは契約が固定しないため、その分岐だけ打ち切りと継続の 2 通りを許容する。
 * 規則 2 を通った (最終化済み) 記録は、行き先・理由・照合証跡まで独立に数えて完全一致で比べる。
 * supersedes-two-sided は supersessionFacts と後継の存在に依存するので 024〜030 が担い、ここでは下限だけを見る。
 */
function independentReasons(
  matches: Rec[],
  files: Pick<Input, "fileHeadings" | "fileTexts">,
): { allowed: string[][]; exact: boolean } {
  if (matches.length === 0) return { allowed: [["plan_not_in_disposition"]], exact: true };
  if (matches.length > 1) return { allowed: [["duplicate_disposition"]], exact: true };
  const r = matches[0];
  const w = r.wholeSourceDisposition as string;
  const rule2 =
    w === "not-finalized"
      ? ["not_finalized"]
      : ["transferred", "merged", "retired"].includes(w)
        ? []
        : ["invalid_disposition"];
  const rule3: string[] = [];
  if (!rule2.length) {
    const dests = (Array.isArray(r.destinations) ? r.destinations : []) as Rec[];
    if (w === "retired") {
      const reason = typeof r.retirementReason === "string" ? r.retirementReason.trim() : "";
      if (!reason) rule3.push("missing_retirement_reason");
    } else if (!dests.some((d) => d.kind === "design" || d.kind === "issue")) {
      rule3.push("missing_destination");
    }
    for (const d of dests) {
      if (d.kind === "issue") {
        if (!Number.isInteger(d.number) || (d.number as number) <= 0)
          rule3.push("invalid_issue_ref");
      } else if (d.kind === "design") {
        const p = d.path;
        const headings = typeof p === "string" ? files.fileHeadings[p] : null;
        const underDocs =
          typeof p === "string" &&
          (p.startsWith("docs/design/") || p.startsWith("docs/test-design/"));
        if (!underDocs || !Array.isArray(headings)) rule3.push("destination_path_missing");
        else {
          const sec = typeof d.section === "string" ? d.section.trim() : "";
          if (!sec || !headings.some((h) => h.trim().startsWith(sec)))
            rule3.push("destination_section_missing");
        }
      }
    }
  }
  const rc = r.reconciliation as Rec | undefined;
  const rule4: string[] = [];
  let exact = true;
  if (!rc || (rc.kind !== "three-way" && rc.kind !== "supersedes-two-sided")) {
    rule4.push("missing_reconciliation");
  } else if (rc.kind === "three-way") {
    if (rc.verdict !== "consistent" && rc.verdict !== "plan-stale")
      rule4.push("reconciliation_unresolved");
    const text = typeof rc.evidencePath === "string" ? files.fileTexts[rc.evidencePath] : null;
    const evId = typeof rc.evidenceId === "string" ? rc.evidenceId.trim() : "";
    if (typeof text !== "string" || !evId || !text.includes(evId))
      rule4.push("reconciliation_evidence_missing");
  } else {
    exact = false;
  }
  const full = [...rule2, ...rule3, ...rule4];
  return { allowed: rule2.length ? [rule2, full] : [full], exact: rule2.length > 0 || exact };
}

const reasonsAt = (r: Result, path: string): Reason[] =>
  r.violations.filter((v) => v.path === path).map((v) => v.reason);

/** 完備 fixture (X: transferred + design + three-way) は通る。双子の受理を先に確かめる。 */
async function expectTwinOk(a: Api, records: Rec[], over: Partial<Input> = {}): Promise<void> {
  const r = a.analyzePlanRetirement(input(records, over));
  expect(r.violations).toEqual([]);
  expect(r.ok).toBe(true);
}

// ---------------------------------------------------------------------------
// temp git repo fixture (base / head blob)
// ---------------------------------------------------------------------------

const tmpRoots: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function put(root: string, path: string, content: string): void {
  const abs = join(root, path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function planDoc(
  planId: string,
  opts: {
    requires?: string[];
    parent?: string;
    references?: string[];
    supersedes?: string[];
    body?: string;
  } = {},
): string {
  const list = (key: string, values: string[] | undefined, indent = ""): string =>
    values?.length
      ? `${indent}${key}:\n${values.map((v) => `${indent}  - ${v}`).join("\n")}\n`
      : "";
  const deps =
    opts.requires || opts.parent || opts.references
      ? `dependencies:\n${opts.parent ? `  parent: ${opts.parent}\n` : ""}${list("requires", opts.requires, "  ")}${list("references", opts.references, "  ")}`
      : "";
  return `---\nplan_id: ${planId}\nkind: design\nlayer: L6\nstatus: confirmed\n${deps}${list("supersedes", opts.supersedes)}---\n\n# ${planId}\n\n${opts.body ?? `${planId} の本文。固有の説明をここに置く。`}\n`;
}

interface HeadChange {
  write?: Record<string, string>;
  remove?: string[];
  rename?: [string, string][];
}

function repo(
  baseFiles: Record<string, string>,
  head: HeadChange,
): { root: string; base: string; head: string } {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-plret-"));
  tmpRoots.push(root);
  git(root, "init", "--quiet");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "user.name", "UT-TDD test");
  for (const [p, c] of Object.entries(baseFiles)) put(root, p, c);
  git(root, "add", "-A");
  git(root, "commit", "--quiet", "-m", "base");
  const base = git(root, "rev-parse", "HEAD").trim();
  for (const p of head.remove ?? []) rmSync(join(root, p));
  for (const [from, to] of head.rename ?? []) {
    mkdirSync(dirname(join(root, to)), { recursive: true });
    renameSync(join(root, from), join(root, to));
  }
  for (const [p, c] of Object.entries(head.write ?? {})) put(root, p, c);
  git(root, "add", "-A");
  git(root, "commit", "--quiet", "--allow-empty", "-m", "head");
  return { root, base, head: git(root, "rev-parse", "HEAD").trim() };
}

const json = (records: Rec[]): string =>
  `${JSON.stringify({ schemaVersion: 1, plans: records }, null, 2)}\n`;

const DEST_DOC = ["# 文書", "", "## §4 判定規則", "", "### 判定規則 (DbC)", ""].join("\n");
const SUPPORT = {
  [DESIGN]: DEST_DOC,
  [EVID]: `${EVID_ID} の照合記録。\n`,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const root of tmpRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Issue #1078 PLAN retirement gate (CANDIDATE-U-PLRET, Red)", () => {
  it.fails("CANDIDATE-U-PLRET-001: unreadable disposition yields only disposition_unreadable", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    for (const disposition of [null, { schemaVersion: 1, plans: { not: "array" } }]) {
      const r = a.analyzePlanRetirement(input([rec(X)], { disposition }));
      expect(r.violations).toEqual([{ path: DISP_PATH, reason: "disposition_unreadable" }]);
      expect(r.ok).toBe(false);
    }
  });

  it.fails("CANDIDATE-U-PLRET-002: no deletion never fires even with broken or unfinalized disposition", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    const nf = rec(A, { wholeSourceDisposition: "not-finalized" });
    for (const disposition of [null, { plans: [nf] }]) {
      const r = a.analyzePlanRetirement(input([], { deletedPlanPaths: [], disposition }));
      expect(r.violations).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });

  it.fails("CANDIDATE-U-PLRET-003: only deleted plans are checked against the disposition", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X), rec(A, { wholeSourceDisposition: "not-finalized" })]);
    for (const records of [[], [rec(A, { wholeSourceDisposition: "not-finalized" })]]) {
      const r = a.analyzePlanRetirement(input(records));
      expect(r.violations).toEqual([{ path: X, reason: "plan_not_in_disposition" }]);
    }
  });

  it.fails("CANDIDATE-U-PLRET-004: duplicate disposition records are rejected", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    const r = a.analyzePlanRetirement(input([rec(X), rec(X)]));
    expect(reasonsAt(r, X).filter((x) => x === "duplicate_disposition")).toHaveLength(1);
    expect(r.ok).toBe(false);
  });

  it.fails("CANDIDATE-U-PLRET-005: wholeSourceDisposition enum is enforced", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    await expectTwinOk(a, [rec(X, { wholeSourceDisposition: "merged" })]);
    await expectTwinOk(a, [retiredRec(X)]);
    const nf = a.analyzePlanRetirement(
      input([rec(X, { wholeSourceDisposition: "not-finalized" })]),
    );
    expect(reasonsAt(nf, X)).toContain("not_finalized");
    const unknown = a.analyzePlanRetirement(input([rec(X, { wholeSourceDisposition: "keep" })]));
    expect(reasonsAt(unknown, X)).toContain("invalid_disposition");
    const { wholeSourceDisposition: _omit, ...missing } = rec(X);
    const m = a.analyzePlanRetirement(input([missing]));
    expect(reasonsAt(m, X)).toContain("invalid_disposition");
  });

  it.fails("CANDIDATE-U-PLRET-006: transferred and merged require a design or issue destination", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    await expectTwinOk(a, [retiredRec(X)]);
    const { destinations: _omit, ...noDest } = rec(X);
    for (const disposition of ["transferred", "merged"]) {
      for (const variant of [
        rec(X, { wholeSourceDisposition: disposition, destinations: [] }),
        { ...noDest, wholeSourceDisposition: disposition },
        rec(X, { wholeSourceDisposition: disposition, destinations: [{ kind: "url", href: "x" }] }),
      ]) {
        const r = a.analyzePlanRetirement(input([variant]));
        expect(reasonsAt(r, X)).toContain("missing_destination");
      }
    }
  });

  it.fails("CANDIDATE-U-PLRET-007: design destination path must exist under docs/design or docs/test-design", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    const other = "docs/design/harness/other-dir/fixture-dest.md";
    const outside = "docs/governance/outside.md";
    const cases: [string, Input["fileHeadings"]][] = [
      ["docs/design/harness/missing.md", { [DESIGN]: ["§4 判定規則"] }],
      [other, { [DESIGN]: ["§4 判定規則"] }],
      [outside, { [outside]: ["§4 判定規則"] }],
    ];
    for (const [path, fileHeadings] of cases) {
      const r = a.analyzePlanRetirement(
        input([rec(X, { destinations: [{ kind: "design", path, section: "§4 判定規則" }] })], {
          fileHeadings,
        }),
      );
      expect(reasonsAt(r, X)).toContain("destination_path_missing");
    }
  });

  it.fails("CANDIDATE-U-PLRET-008: section must match a heading by prefix and not inside code fences", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    const dest = (section: unknown): Rec[] => [
      rec(X, { destinations: [{ kind: "design", path: DESIGN, section }] }),
    ];
    for (const section of ["存在しない見出し", "DbC", "", "   ", 123]) {
      const r = a.analyzePlanRetirement(input(dest(section)));
      expect(reasonsAt(r, X), `section=${String(section)}`).toContain(
        "destination_section_missing",
      );
    }

    // コードフェンス内の見出し風の行は見出しに数えない (loader の見出し抽出を含む)
    const doc = ["# 文書", "", "```md", "# フェンス内だけの見出し", "```", ""].join("\n");
    const mk = (section: string): Input => {
      const r = repo(
        {
          [X]: planDoc(id(X)),
          [DISP_PATH]: json([
            rec(X, { destinations: [{ kind: "design", path: DESIGN, section }] }),
          ]),
          [DESIGN]: doc,
          [EVID]: SUPPORT[EVID],
        },
        { remove: [X] },
      );
      return a.loadPlanRetirementInput(r.root, r.base, r.head);
    };
    expect(a.analyzePlanRetirement(mk("文書")).violations).toEqual([]);
    const fenced = a.analyzePlanRetirement(mk("フェンス内だけの見出し"));
    expect(reasonsAt(fenced, X)).toContain("destination_section_missing");
  });

  it.fails("CANDIDATE-U-PLRET-009: decorated headings match by prefix and only 1-6 leading # are headings", async () => {
    const a = await api();
    const fileHeadings = { [DESIGN]: ["§4 判定規則", "  判定規則 (DbC)  "] };
    for (const section of ["§4", "判定規則", " §4 判定規則 "]) {
      await expectTwinOk(
        a,
        [rec(X, { destinations: [{ kind: "design", path: DESIGN, section }] })],
        { fileHeadings },
      );
    }

    // 見出し記号 1〜6 個は見出し、7 個以上は見出しではない (loader の見出し抽出)
    const doc = ["# 見出し一", "###### 見出し六", "####### 七個の記号", ""].join("\n");
    const run = (section: string): Result => {
      const r = repo(
        {
          [X]: planDoc(id(X)),
          [DISP_PATH]: json([
            rec(X, { destinations: [{ kind: "design", path: DESIGN, section }] }),
          ]),
          [DESIGN]: doc,
          [EVID]: SUPPORT[EVID],
        },
        { remove: [X] },
      );
      return a.analyzePlanRetirement(a.loadPlanRetirementInput(r.root, r.base, r.head));
    };
    expect(run("見出し一").violations).toEqual([]);
    expect(run("見出し六").violations).toEqual([]);
    expect(reasonsAt(run("七個の記号"), X)).toContain("destination_section_missing");
  });

  it.fails("CANDIDATE-U-PLRET-010: issue destination number must be a positive integer", async () => {
    const a = await api();
    const issue = (n: unknown): Rec[] => [
      rec(X, { destinations: [{ kind: "issue", ...(n === undefined ? {} : { number: n }) }] }),
    ];
    const good = a.analyzePlanRetirement(input(issue(1078)));
    expect(good.violations).toEqual([]);
    for (const n of [0, -1, 1.5, "12", undefined]) {
      const r = a.analyzePlanRetirement(input(issue(n)));
      expect(reasonsAt(r, X), `number=${String(n)}`).toContain("invalid_issue_ref");
    }
  });

  it.fails("CANDIDATE-U-PLRET-011: retired requires a trimmed non-empty retirementReason", async () => {
    const a = await api();
    await expectTwinOk(a, [retiredRec(X)]);
    await expectTwinOk(a, [rec(X, { retirementReason: "" })]);
    const { retirementReason: _omit, ...noReason } = retiredRec(X);
    for (const variant of [
      noReason,
      retiredRec(X, { retirementReason: "" }),
      retiredRec(X, { retirementReason: "   " }),
    ]) {
      const r = a.analyzePlanRetirement(input([variant]));
      expect(reasonsAt(r, X)).toContain("missing_retirement_reason");
    }
  });

  it.fails("CANDIDATE-U-PLRET-012: reconciliation must exist and three-way verdict must be resolved", async () => {
    const a = await api();
    for (const verdict of ["consistent", "plan-stale"]) {
      await expectTwinOk(a, [rec(X, { reconciliation: { ...THREE_WAY, verdict } })]);
    }
    const { reconciliation: _omit, ...none } = rec(X);
    for (const variant of [none, rec(X, { reconciliation: { kind: "other" } })]) {
      const r = a.analyzePlanRetirement(input([variant]));
      expect(reasonsAt(r, X)).toContain("missing_reconciliation");
    }
    const { verdict: _v, ...noVerdict } = THREE_WAY;
    for (const reconciliation of [
      { ...THREE_WAY, verdict: "conflict" },
      { ...THREE_WAY, verdict: "pending" },
      noVerdict,
    ]) {
      const r = a.analyzePlanRetirement(input([rec(X, { reconciliation })]));
      expect(reasonsAt(r, X)).toContain("reconciliation_unresolved");
    }
  });

  it.fails("CANDIDATE-U-PLRET-013: reconciliation evidence must exist and contain the evidenceId", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    const evidenceMissing: [Rec, Partial<Input>][] = [
      [rec(X), { fileTexts: {} }],
      [rec(X), { fileTexts: { [EVID]: null } }],
      [rec(X), { fileTexts: { [EVID]: "この文書に照合 ID は無い。" } }],
      ...(["", "   ", 5] as unknown[]).map((evidenceId): [Rec, Partial<Input>] => [
        rec(X, { reconciliation: { ...THREE_WAY, evidenceId } }),
        { fileTexts: { [EVID]: `${EVID_ID} 5 本文には ID がありうる。` } },
      ]),
    ];
    for (const [record, over] of evidenceMissing) {
      const r = a.analyzePlanRetirement(input([record], over));
      expect(reasonsAt(r, X)).toContain("reconciliation_evidence_missing");
    }
    // supersedes-two-sided: link 要素が空は未解決、1 件以上で終端条件を満たせば通る
    await expectTwinOk(a, [twoSidedRec(X, Z)], {
      headPlanPaths: [Z],
      supersessionFacts: facts(X, Z),
    });
    const empty = a.analyzePlanRetirement(
      input([twoSidedRec(X, Z, { confirmedSupersededBy: [] })], { headPlanPaths: [Z] }),
    );
    expect(reasonsAt(empty, X)).toContain("reconciliation_unresolved");
  });

  it.fails("CANDIDATE-U-PLRET-014: complete fixture passes and output order is deterministic", async () => {
    const a = await api();
    const B = Y;
    const C = "docs/plans/PLAN-L6-904-merged-c.md";
    const complete = [
      rec(X),
      twoSidedRec(B, Z),
      rec(C, { wholeSourceDisposition: "merged", destinations: [{ kind: "issue", number: 7 }] }),
    ];
    const over: Partial<Input> = {
      deletedPlanPaths: [X, B, C],
      headPlanPaths: [Z],
      supersessionFacts: facts(B, Z),
    };
    const r1 = a.analyzePlanRetirement(input(complete, over));
    expect(r1.violations).toEqual([]);
    expect(r1.ok).toBe(true);
    const r2 = a.analyzePlanRetirement(
      input([...complete].reverse(), { ...over, deletedPlanPaths: [C, B, X] }),
    );
    expect(r2).toEqual(r1);

    // 複数 violation: path 辞書順、同一 path は規則番号順 (規則 3 の次に規則 4)
    const broken = [
      retiredRec(X, { retirementReason: "", reconciliation: undefined }),
      rec(B, { wholeSourceDisposition: "not-finalized" }),
    ];
    const bOver: Partial<Input> = { deletedPlanPaths: [X, B, C] };
    const v1 = a.analyzePlanRetirement(input(broken, bOver));
    const v2 = a.analyzePlanRetirement(
      input([...broken].reverse(), { deletedPlanPaths: [C, B, X] }),
    );
    expect(v2).toEqual(v1);
    const paths = v1.violations.map((v) => v.path);
    expect(paths).toEqual([...paths].sort());
    expect(reasonsAt(v1, X)).toEqual(["missing_retirement_reason", "missing_reconciliation"]);
    expect(reasonsAt(v1, C)).toEqual(["plan_not_in_disposition"]);
  });

  it.fails("CANDIDATE-U-PLRET-015: real disposition JSON yields the independently counted result", async () => {
    const a = await api();
    const real = JSON.parse(readFileSync(join(REPO_ROOT, DISP_PATH), "utf8")) as {
      plans: Rec[];
    };
    const tracked = execFileSync("git", ["ls-files", "docs/plans"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .filter((p) => /^docs\/plans\/PLAN-[^/]+\.md$/.test(p));
    expect(tracked.length).toBeGreaterThan(0);

    const none = a.analyzePlanRetirement({ ...input([]), deletedPlanPaths: [], disposition: real });
    expect(none.ok).toBe(true);
    expect(none.violations).toEqual([]);

    const candidates = [
      tracked[0],
      ...tracked.filter((p) => !real.plans.some((r) => r.sourcePath === p)),
    ];
    const base = input([]);
    const check = (path: string, disposition: { plans: Rec[] }): void => {
      const r = a.analyzePlanRetirement({ ...base, deletedPlanPaths: [path], disposition });
      const { allowed, exact } = independentReasons(
        disposition.plans.filter((p) => p.sourcePath === path),
        base,
      );
      const got = r.violations.map((v) => v.reason).sort();
      expect(r.violations.every((v) => v.path === path)).toBe(true);
      expect(r.ok).toBe(got.length === 0);
      if (exact) {
        // 規則 2 が失敗した後の打ち切り / 継続だけを許容し、それ以外は完全一致 (件数と ok を含む)
        expect(allowed.map((x) => [...x].sort())).toContainEqual(got);
      } else {
        expect(got).toEqual(expect.arrayContaining(allowed[allowed.length - 1]));
      }
    };
    for (const path of candidates) check(path, real);

    // 最終化が進んだ状態でも式が成り立つこと: 実 JSON の 1 件をメモリ上で最終化して同じ集計と比べる
    const target = tracked[0];
    const finalize = (over: Rec): { plans: Rec[] } => ({
      ...real,
      plans: real.plans.map((p) =>
        p.sourcePath === target ? { ...rec(target), planId: p.planId, ...over } : p,
      ),
    });
    const complete = finalize({});
    const done = a.analyzePlanRetirement({
      ...base,
      deletedPlanPaths: [target],
      disposition: complete,
    });
    expect(done.violations).toEqual([]);
    expect(done.ok).toBe(true);
    check(target, complete);
    check(target, finalize({ destinations: [] }));
    check(target, finalize({ reconciliation: { ...THREE_WAY, evidenceId: "ABSENT-ID" } }));
    check(target, finalize({ reconciliation: { ...THREE_WAY, verdict: "pending" } }));
    check(target, finalize({ wholeSourceDisposition: "retired", destinations: [] }));
  });

  it.fails("CANDIDATE-U-PLRET-016: --write-json refuses to overwrite once any record is finalized", () => {
    const script =
      "docs/governance/candidates/v4-roadmap/migration/06_PLAN_DISPOSITION_FIRST_PASS.mjs";
    const sourceRef = "3ca0692d6c6a180b058c492475080be2a140e667";
    const work = mkdtempSync(join(tmpdir(), "ut-tdd-plret016-"));
    tmpRoots.push(work);
    const clone = join(work, "repo");
    // 隔離複製: スクリプトが固定する source commit を checkout した複製に、検証対象のスクリプト source と
    // 処分 JSON の temp 複製だけを重ねる (開発 repo の JSON は書き換えない)。依存の yaml だけを複製する。
    git(work, "clone", "--quiet", "--local", "--no-checkout", REPO_ROOT, clone);
    git(clone, "checkout", "--quiet", sourceRef);
    cpSync(join(REPO_ROOT, "node_modules", "yaml"), join(clone, "node_modules", "yaml"), {
      recursive: true,
    });
    put(clone, script, readFileSync(join(REPO_ROOT, script), "utf8"));
    const original = readFileSync(join(REPO_ROOT, DISP_PATH), "utf8");
    const run = (): { status: number | null; bytes: Buffer } => {
      const r = spawnSync(process.execPath, [join(clone, script), "--write-json"], {
        cwd: clone,
        encoding: "utf8",
        timeout: 100_000,
      });
      return { status: r.status, bytes: readFileSync(join(clone, DISP_PATH)) };
    };

    // 双子: 全件 not-finalized なら従来どおり書き込める
    put(clone, DISP_PATH, original);
    expect(run().status).toBe(0);

    // 最終化済みが 1 件ある JSON では、非 0 で終了し bytes を変えない
    const doc = JSON.parse(original) as { plans: Rec[] };
    doc.plans[0].wholeSourceDisposition = "retired";
    const finalized = `${JSON.stringify(doc, null, 2)}
`;
    put(clone, DISP_PATH, finalized);
    const refused = run();
    expect(refused.status).not.toBe(0);
    expect(refused.bytes.toString("utf8")).toBe(finalized);
  }, 180_000);

  it.fails("CANDIDATE-U-PLRET-017: analysis is offline, deterministic and ignores issue existence", async () => {
    const a = await api();
    const records = [rec(X, { destinations: [{ kind: "issue", number: 999999 }] })];
    const fixture = input(records);
    const savedPath = process.env.PATH;
    const forbidden = (): never => {
      throw new Error("external call is forbidden in analyzePlanRetirement");
    };
    vi.stubGlobal("fetch", forbidden);
    vi.spyOn(Date, "now").mockImplementation(forbidden);
    vi.stubGlobal(
      "Date",
      new Proxy(Date, {
        construct: forbidden,
        get: (t, k) => (k === "now" ? forbidden : Reflect.get(t, k)),
      }),
    );
    process.env.PATH = "";
    let first: Result;
    let second: Result;
    try {
      first = a.analyzePlanRetirement(fixture);
      second = a.analyzePlanRetirement(fixture);
    } finally {
      process.env.PATH = savedPath;
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
    expect(first.ok).toBe(true);
    expect(first.violations).toEqual([]);
    expect(second).toEqual(first);
  });

  it.fails("CANDIDATE-U-PLRET-018: loader classifies deletions, renames and head plan paths", async () => {
    const a = await api();
    const P = (n: string): string => `docs/plans/${n}`;
    const mkBase = (): Record<string, string> => ({
      [P("PLAN-L6-801-del.md")]: planDoc("PLAN-L6-801-del", { body: "削除される。".repeat(40) }),
      [P("PLAN-L6-802-out.md")]: planDoc("PLAN-L6-802-out", { body: "外へ移動する。".repeat(40) }),
      [P("PLAN-L6-803-pat.md")]: planDoc("PLAN-L6-803-pat", {
        body: "パターン内改名。".repeat(40),
      }),
      [P("PLAN-L6-804-txt.md")]: planDoc("PLAN-L6-804-txt", {
        body: "拡張子を変える。".repeat(40),
      }),
      [P("PLAN-L6-805-bak.md")]: planDoc("PLAN-L6-805-bak", { body: "bak を付ける。".repeat(40) }),
      [P("PLAN-L6-806-mod.md")]: planDoc("PLAN-L6-806-mod", { body: "変更だけ。".repeat(40) }),
      [P("README.md")]: "# plans\n",
      [DISP_PATH]: json([]),
    });
    const r = repo(mkBase(), {
      remove: [P("PLAN-L6-801-del.md"), P("README.md")],
      rename: [
        [P("PLAN-L6-802-out.md"), "docs/archive/PLAN-L6-802-out.md"],
        [P("PLAN-L6-803-pat.md"), P("PLAN-L6-803-pat2.md")],
        [P("PLAN-L6-804-txt.md"), P("retired-804.txt")],
        [P("PLAN-L6-805-bak.md"), P("PLAN-L6-805-bak.md.bak")],
      ],
      write: {
        [P("PLAN-L6-806-mod.md")]:
          `${planDoc("PLAN-L6-806-mod", { body: "変更だけ。".repeat(40) })}追記\n`,
        [P("PLAN-L6-807-new.md")]: planDoc("PLAN-L6-807-new"),
      },
    });
    const got = a.loadPlanRetirementInput(r.root, r.base, r.head);
    expect([...got.deletedPlanPaths].sort()).toEqual(
      [
        P("PLAN-L6-801-del.md"),
        P("PLAN-L6-802-out.md"),
        P("PLAN-L6-804-txt.md"),
        P("PLAN-L6-805-bak.md"),
      ].sort(),
    );
    expect([...got.headPlanPaths].sort()).toEqual(
      [P("PLAN-L6-803-pat2.md"), P("PLAN-L6-806-mod.md"), P("PLAN-L6-807-new.md")].sort(),
    );
    expect(got.dispositionChangedInPr).toBe(false);

    const changed = repo(mkBase(), {
      remove: [P("PLAN-L6-801-del.md")],
      write: { [DISP_PATH]: json([rec(P("PLAN-L6-801-del.md"))]) },
    });
    const c = a.loadPlanRetirementInput(changed.root, changed.base, changed.head);
    expect(c.dispositionChangedInPr).toBe(true);
    expect(c.deletedPlanPaths).toEqual([P("PLAN-L6-801-del.md")]);
  });

  it.fails("CANDIDATE-U-PLRET-019: loader is read-only and prefetches every referenced path", async () => {
    const a = await api();
    const missing = "docs/design/harness/missing-dest.md";
    const records = [
      rec(X, {
        destinations: [
          { kind: "design", path: DESIGN, section: "§4 判定規則" },
          { kind: "design", path: missing, section: "x" },
        ],
      }),
    ];
    const r = repo(
      { [X]: planDoc(id(X)), [DISP_PATH]: json(records), ...SUPPORT },
      { remove: [X] },
    );
    const files = [DISP_PATH, DESIGN, EVID];
    const before = files.map((f) => readFileSync(join(r.root, f)));
    const got = a.loadPlanRetirementInput(r.root, r.base, r.head);
    const after = files.map((f) => readFileSync(join(r.root, f)));
    for (const [i, buf] of before.entries()) expect(after[i].equals(buf)).toBe(true);
    expect(got.fileHeadings[DESIGN]).toEqual(expect.arrayContaining(["§4 判定規則"]));
    expect(typeof got.fileTexts[EVID]).toBe("string");
    expect(Object.hasOwn(got.fileHeadings, missing)).toBe(true);
    expect(got.fileHeadings[missing]).toBeNull();
  });

  it.fails("CANDIDATE-U-PLRET-020: messages are path:reason lines in deterministic order", async () => {
    const a = await api();
    const result: Result = {
      ok: false,
      violations: [
        { path: A, reason: "dangling_plan_reference" },
        { path: X, reason: "missing_retirement_reason" },
        { path: X, reason: "missing_reconciliation" },
      ],
    };
    const lines = a.planRetirementMessages(result);
    expect(lines).toEqual([
      `${A}:dangling_plan_reference`,
      `${X}:missing_retirement_reason`,
      `${X}:missing_reconciliation`,
    ]);
    expect(a.planRetirementMessages(result)).toEqual(lines);
    expect(a.planRetirementMessages({ ok: true, violations: [] })).toEqual([]);
  });

  it.fails("CANDIDATE-U-PLRET-021: surviving plan frontmatter references to a deleted plan are dangling (loader)", async () => {
    const a = await api();
    const keeper = "docs/plans/PLAN-L6-910-keeper.md";
    const forms = [id(X), X];
    const fields: [string, (v: string) => Parameters<typeof planDoc>[1]][] = [
      ["requires", (v) => ({ requires: [v] })],
      ["parent", (v) => ({ parent: v })],
      ["supersedes", (v) => ({ supersedes: [v] })],
      ["references", (v) => ({ references: [v] })],
    ];
    const run = (opts: Parameters<typeof planDoc>[1]): Result => {
      const r = repo(
        {
          [X]: planDoc(id(X)),
          [keeper]: planDoc(id(keeper), opts),
          [DISP_PATH]: json([rec(X)]),
          ...SUPPORT,
        },
        { remove: [X] },
      );
      return a.analyzePlanRetirement(a.loadPlanRetirementInput(r.root, r.base, r.head));
    };
    expect(run({ references: ["docs/plans/PLAN-L6-999-unrelated.md"] }).violations).toEqual([]);
    for (const [field, make] of fields) {
      for (const form of forms) {
        const r = run(make(form));
        expect(reasonsAt(r, keeper), `${field}=${form}`).toEqual(["dangling_plan_reference"]);
      }
    }
  });

  it.fails("CANDIDATE-U-PLRET-022: design owner plan field pointing at a deleted plan is dangling", async () => {
    const a = await api();
    const doc = "docs/design/harness/L6-function-design/owned.md";
    await expectTwinOk(a, [rec(X)], { designOwners: [{ path: doc, plan: null }] });
    const other = a.analyzePlanRetirement(
      input([rec(X)], { designOwners: [{ path: doc, plan: A }] }),
    );
    expect(other.violations).toEqual([]);
    const hit = a.analyzePlanRetirement(
      input([rec(X)], { designOwners: [{ path: doc, plan: X }] }),
    );
    expect(hit.violations).toEqual([{ path: doc, reason: "dangling_plan_reference" }]);
  });

  it.fails("CANDIDATE-U-PLRET-023: body mentions, self references and deleted-to-deleted references are not dangling (loader)", async () => {
    const a = await api();
    const keeper = "docs/plans/PLAN-L6-910-keeper.md";
    const run = (files: Record<string, string>, remove: string[]): Result => {
      const r = repo({ ...files, ...SUPPORT }, { remove });
      return a.analyzePlanRetirement(a.loadPlanRetirementInput(r.root, r.base, r.head));
    };
    // (a) 存続 PLAN の本文中だけの言及
    const a1 = run(
      {
        [X]: planDoc(id(X)),
        [keeper]: planDoc(id(keeper), { body: `履歴として ${id(X)} に触れる。` }),
        [DISP_PATH]: json([rec(X)]),
      },
      [X],
    );
    expect(a1.violations).toEqual([]);
    // (b) 削除される PLAN 自身の self reference
    const b1 = run(
      {
        [X]: planDoc(id(X), { references: [id(X)] }),
        [DISP_PATH]: json([rec(X)]),
      },
      [X],
    );
    expect(b1.violations).toEqual([]);
    // (c) 削除対象どうしの相互参照
    const c1 = run(
      {
        [X]: planDoc(id(X), { references: [id(Y)] }),
        [Y]: planDoc(id(Y), { references: [id(X)] }),
        [DISP_PATH]: json([rec(X), rec(Y)]),
      },
      [X, Y],
    );
    expect(c1.violations).toEqual([]);
    expect(c1.ok).toBe(true);
  });

  it.fails("CANDIDATE-U-PLRET-024: successor that survives or is finalized elsewhere closes the chain", async () => {
    const a = await api();
    // (a) 後継が head に存在し削除されない
    await expectTwinOk(a, [twoSidedRec(X, Z)], {
      headPlanPaths: [Z],
      supersessionFacts: facts(X, Z),
    });
    // (b) 後継は head に無いが、後継の記録が transferred + design で規則 2・3 を満たす
    await expectTwinOk(a, [twoSidedRec(X, Z), rec(Z)], { supersessionFacts: facts(X, Z) });
    // 双子の否定: 後継が head に無く記録も無ければ連鎖は閉じない
    const open = a.analyzePlanRetirement(
      input([twoSidedRec(X, Z)], { supersessionFacts: facts(X, Z) }),
    );
    expect(reasonsAt(open, X)).toContain("supersedes_chain_open");
  });

  it.fails("CANDIDATE-U-PLRET-025: chains that stay open or end in retired are rejected", async () => {
    const a = await api();
    await expectTwinOk(a, [twoSidedRec(X, Z), rec(Z)], { supersessionFacts: facts(X, Z) });
    const W = "docs/plans/PLAN-L6-905-chain-w.md";
    const zRecords: Rec[] = [
      // (a) 未最終化
      rec(Z, { wholeSourceDisposition: "not-finalized" }),
      // (b) 連鎖が PLAN のまま続く: Z は transferred だが行き先が無く、後継 W も存在しない
      rec(Z, {
        destinations: [],
        reconciliation: { kind: "supersedes-two-sided" },
        confirmedSupersededBy: [link(Z, W)],
      }),
      // (b2) transferred だが行き先が空 (retired の拒否とは別経路)
      rec(Z, { destinations: [] }),
      // (c) retired
      retiredRec(Z),
    ];
    for (const z of zRecords) {
      const r = a.analyzePlanRetirement(
        input([twoSidedRec(X, Z), z], { supersessionFacts: facts(X, Z) }),
      );
      expect(reasonsAt(r, X)).toContain("supersedes_chain_open");
    }
  });

  it.fails("CANDIDATE-U-PLRET-026: a successor deleted in the same PR must itself be finalized", async () => {
    const a = await api();
    const over: Partial<Input> = {
      deletedPlanPaths: [X, Z],
      supersessionFacts: facts(X, Z),
    };
    const ok = a.analyzePlanRetirement(
      input(
        [
          twoSidedRec(X, Z),
          rec(Z, {
            wholeSourceDisposition: "merged",
            destinations: [{ kind: "issue", number: 5 }],
          }),
        ],
        over,
      ),
    );
    expect(ok.violations).toEqual([]);
    expect(ok.ok).toBe(true);
    const bad = a.analyzePlanRetirement(
      input([twoSidedRec(X, Z), rec(Z, { wholeSourceDisposition: "not-finalized" })], over),
    );
    expect(reasonsAt(bad, Z)).toContain("not_finalized");
    expect(reasonsAt(bad, X)).toContain("supersedes_chain_open");
  });

  it.fails("CANDIDATE-U-PLRET-027: real confirmedSupersededBy elements are link objects the analyzer can consume", async () => {
    const a = await api();
    const real = JSON.parse(readFileSync(join(REPO_ROOT, DISP_PATH), "utf8")) as {
      plans: Rec[];
    };
    const withLinks = real.plans.filter(
      (p) => Array.isArray(p.confirmedSupersededBy) && p.confirmedSupersededBy.length > 0,
    );
    expect(withLinks.length).toBeGreaterThan(0);
    for (const p of withLinks) {
      for (const el of p.confirmedSupersededBy as unknown[]) {
        expect(typeof el).toBe("object");
        const e = el as Rec;
        expect(typeof e.successorPlanId === "string" && e.successorPlanId.trim() !== "").toBe(true);
        expect(e.supersedesTarget).toBe(p.planId);
        expect(e.confirmedTwoSidedLink).toBe(true);
      }
    }
    // 実データの 1 件を supersedes-two-sided の記録として analyzer へ渡す
    const sample = withLinks[0];
    const el = (sample.confirmedSupersededBy as Rec[])[0];
    const target = sample.sourcePath as string;
    const succ = `docs/plans/${el.successorPlanId as string}.md`;
    const record = retiredRec(target, {
      planId: sample.planId,
      reconciliation: { kind: "supersedes-two-sided", ...fullCoverageFor(succ) },
      confirmedSupersededBy: [el],
    });
    const r = a.analyzePlanRetirement(
      input([record], {
        deletedPlanPaths: [target],
        headPlanPaths: [succ],
        planHeadings: { [target]: ["概要"] },
        successorPlanHeadings: { [succ]: ["概要"] },
        supersessionFacts: facts(target, succ),
      }),
    );
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it.fails("CANDIDATE-U-PLRET-028: forged self-reported links are rejected when blob-derived facts disagree", async () => {
    const a = await api();
    const over: Partial<Input> = { headPlanPaths: [Z] };
    await expectTwinOk(a, [twoSidedRec(X, Z)], { ...over, supersessionFacts: facts(X, Z) });
    for (const supersessionFacts of [facts(X, Z, false, true), facts(X, Z, true, false), {}]) {
      const r = a.analyzePlanRetirement(input([twoSidedRec(X, Z)], { ...over, supersessionFacts }));
      expect(reasonsAt(r, X)).toContain("reconciliation_unresolved");
    }
  });

  it.fails("CANDIDATE-U-PLRET-029: simultaneous disposition edit is rejected and head edits are ignored", async () => {
    const a = await api();
    await expectTwinOk(a, [rec(X)]);
    const changed = a.analyzePlanRetirement(input([rec(X)], { dispositionChangedInPr: true }));
    expect(changed.violations).toEqual([
      { path: DISP_PATH, reason: "disposition_changed_with_deletion" },
    ]);
    // base の値が not-finalized なら、head で最終化されていても X は未最終化として落ちる
    const baseValue = a.analyzePlanRetirement(
      input([rec(X, { wholeSourceDisposition: "not-finalized" })]),
    );
    expect(reasonsAt(baseValue, X)).toContain("not_finalized");
  });

  it.fails("CANDIDATE-U-PLRET-030: malformed link elements leave zero valid links", async () => {
    const a = await api();
    const opts: Partial<Input> = { headPlanPaths: [Z], supersessionFacts: facts(X, Z) };
    await expectTwinOk(a, [twoSidedRec(X, Z)], opts);
    const good = link(X, Z);
    const variants: unknown[] = [
      id(Z),
      { ...good, successorPlanId: undefined },
      { ...good, successorPlanId: "   " },
      { ...good, supersedesTarget: "PLAN-L6-000-other" },
      { ...good, confirmedTwoSidedLink: false },
      { ...good, selfSupersedesExcluded: true },
    ];
    for (const element of variants) {
      const r = a.analyzePlanRetirement(
        input([twoSidedRec(X, Z, { confirmedSupersededBy: [element] })], opts),
      );
      expect(reasonsAt(r, X), JSON.stringify(element)).toContain("reconciliation_unresolved");
    }
  });

  it.fails("CANDIDATE-U-PLRET-031: supersession facts come from base blobs only (loader)", async () => {
    const a = await api();
    const pair = (n: number): { x: string; z: string } => ({
      x: `docs/plans/PLAN-L6-92${n}-target-x.md`,
      z: `docs/plans/PLAN-L6-93${n}-successor-z.md`,
    });
    const [p1, p2, p3] = [pair(1), pair(2), pair(3)];
    const core = (p: string): string => id(p).match(/^(PLAN-[A-Z0-9]+-\d+)/)?.[1] ?? id(p);
    const base: Record<string, string> = {
      // (a) base に宣言と back-reference の両方がある
      [p1.x]: planDoc(id(p1.x), { body: `後継は ${core(p1.z)} である。` }),
      [p1.z]: planDoc(id(p1.z), { supersedes: [id(p1.x)] }),
      // (b) 宣言は同じ PR で追加される (base に無い。back-reference も base に無い)
      [p2.x]: planDoc(id(p2.x)),
      [p2.z]: planDoc(id(p2.z)),
      // (c) 宣言はあるが X の本文に back-reference が無い
      [p3.x]: planDoc(id(p3.x)),
      [p3.z]: planDoc(id(p3.z), { supersedes: [id(p3.x)] }),
      [DISP_PATH]: json([p1, p2, p3].map((p) => twoSidedRec(p.x, p.z))),
      ...SUPPORT,
    };
    const r = repo(base, {
      remove: [p1.x, p2.x, p3.x],
      write: {
        [p2.z]: planDoc(id(p2.z), { supersedes: [id(p2.x)] }),
      },
    });
    const got = a.loadPlanRetirementInput(r.root, r.base, r.head);
    const key = (p: { x: string; z: string }): string => `${id(p.x)}->${id(p.z)}`;
    expect(got.supersessionFacts[key(p1)]).toEqual({
      successorDeclaresTarget: true,
      targetBodyBackref: true,
    });
    expect(got.supersessionFacts[key(p2)]).toEqual({
      successorDeclaresTarget: false,
      targetBodyBackref: false,
    });
    expect(got.supersessionFacts[key(p3)]).toEqual({
      successorDeclaresTarget: true,
      targetBodyBackref: false,
    });
  });

  it.fails("CANDIDATE-U-PLRET-032: supersedes-two-sided requires an explicit coverage of full or partial", async () => {
    const a = await api();
    await expectTwinOk(a, [twoSidedRec(X, Z)], {
      headPlanPaths: [Z],
      supersessionFacts: facts(X, Z),
    });
    for (const coverage of [undefined, null, "all", "FULL", 1]) {
      const record = twoSidedRec(X, Z, {
        reconciliation: { kind: "supersedes-two-sided", ...FULL_COVERAGE, coverage },
      });
      const r = a.analyzePlanRetirement(
        input([record], { headPlanPaths: [Z], supersessionFacts: facts(X, Z) }),
      );
      expect(reasonsAt(r, X)).toContain("coverage_missing");
    }
  });

  it.fails("CANDIDATE-U-PLRET-033: coverage must agree with the disposition (full=retired, partial=transferred or merged)", async () => {
    const a = await api();
    const over = { headPlanPaths: [Z], supersessionFacts: facts(X, Z) };
    const partialRec = (extra: Rec): Rec =>
      twoSidedRec(X, Z, {
        wholeSourceDisposition: "transferred",
        destinations: [{ kind: "design", path: DESIGN, section: "§4 判定規則" }],
        reconciliation: { kind: "supersedes-two-sided", coverage: "partial" },
        ...extra,
      });
    await expectTwinOk(a, [partialRec({})], over);
    await expectTwinOk(a, [partialRec({ wholeSourceDisposition: "merged" })], over);
    const bad: Rec[] = [
      // full なのに残った契約を移している
      twoSidedRec(X, Z, {
        wholeSourceDisposition: "transferred",
        destinations: [{ kind: "design", path: DESIGN, section: "§4 判定規則" }],
      }),
      // partial なのに retired (残った契約の行き先が無い)
      partialRec({ wholeSourceDisposition: "retired", destinations: [] }),
    ];
    for (const record of bad) {
      const r = a.analyzePlanRetirement(input([record], over));
      expect(reasonsAt(r, X)).toContain("coverage_disposition_mismatch");
    }
  });

  it.fails("CANDIDATE-U-PLRET-034: full coverage must cover every heading of the old plan", async () => {
    const a = await api();
    const over = { headPlanPaths: [Z], supersessionFacts: facts(X, Z) };
    await expectTwinOk(a, [twoSidedRec(X, Z)], {
      ...over,
      planHeadings: { [X]: ["  概要 "] },
    });
    const cases: Partial<Input>[] = [
      { planHeadings: { [X]: ["概要", "残った契約"] } },
      { planHeadings: { [X]: null } },
      // 見出し (level 2〜3) が無い PLAN は H4 だけに契約があっても full を名乗れない
      { planHeadings: { [X]: [] } },
      { planHeadings: {} },
    ];
    for (const extra of cases) {
      const r = a.analyzePlanRetirement(input([twoSidedRec(X, Z)], { ...over, ...extra }));
      expect(reasonsAt(r, X)).toContain("coverage_basis_incomplete");
    }
    for (const coverageBasis of [
      [{ anchor: "概要", successorLocation: " " }],
      [{ anchor: "概要" }],
      "概要",
      undefined,
    ]) {
      const record = twoSidedRec(X, Z, {
        reconciliation: { kind: "supersedes-two-sided", coverage: "full", coverageBasis },
      });
      const r = a.analyzePlanRetirement(input([record], over));
      expect(reasonsAt(r, X)).toContain("coverage_basis_incomplete");
    }
  });

  it.fails("CANDIDATE-U-PLRET-035: governance destination is accepted only under docs/governance excluding candidates", async () => {
    const a = await api();
    const GOV = "docs/governance/fixture-canon.md";
    const dest = (path: string, section = "§4 判定規則"): Rec[] => [
      { kind: "governance", path, section },
    ];
    const headings = { [GOV]: ["§4 判定規則"] };
    await expectTwinOk(a, [rec(X, { destinations: dest(GOV) })], { fileHeadings: headings });
    const cand = "docs/governance/candidates/fixture-candidate.md";
    const outside = "docs/design/harness/fixture-dest.md";
    for (const path of [cand, outside, "docs/governance/missing.md"]) {
      const r = a.analyzePlanRetirement(
        input([rec(X, { destinations: dest(path) })], {
          fileHeadings: {
            [GOV]: ["§4 判定規則"],
            [cand]: ["§4 判定規則"],
            [outside]: ["§4 判定規則"],
          },
        }),
      );
      expect(reasonsAt(r, X)).toContain("destination_path_missing");
    }
    const r = a.analyzePlanRetirement(
      input([rec(X, { destinations: dest(GOV, "存在しない節") })], { fileHeadings: headings }),
    );
    expect(reasonsAt(r, X)).toContain("destination_section_missing");
  });

  it.fails("CANDIDATE-U-PLRET-036: full coverage successorLocation must be a structured reference that actually exists", async () => {
    const a = await api();
    const GOV = "docs/governance/fixture-canon.md";
    const cand = "docs/governance/candidates/fixture-candidate.md";
    const over = { headPlanPaths: [Z], supersessionFacts: facts(X, Z) };
    const withLocation = (successorLocation: unknown): Rec =>
      twoSidedRec(X, Z, {
        reconciliation: {
          kind: "supersedes-two-sided",
          coverage: "full",
          coverageBasis: [{ anchor: "概要", successorLocation }],
        },
      });
    // 双子の受理: plan / design / governance の構造化参照
    for (const loc of [
      { kind: "plan", planId: id(Z), section: "概要" },
      { kind: "design", path: DESIGN, section: "§4 判定規則" },
      { kind: "governance", path: GOV, section: "§4 判定規則" },
    ]) {
      await expectTwinOk(a, [withLocation(loc)], {
        ...over,
        fileHeadings: { [DESIGN]: ["§4 判定規則"], [GOV]: ["§4 判定規則"] },
      });
    }
    const bad: unknown[] = [
      "後継 PLAN の概要",
      { kind: "plan", planId: id(Z), section: "存在しない節" },
      { kind: "design", path: "docs/design/harness/missing.md", section: "§4 判定規則" },
      { kind: "design", path: DESIGN, section: "存在しない節" },
      { kind: "governance", path: cand, section: "§4 判定規則" },
      { kind: "url", href: "x" },
    ];
    for (const loc of bad) {
      const r = a.analyzePlanRetirement(
        input([withLocation(loc)], {
          ...over,
          fileHeadings: { [DESIGN]: ["§4 判定規則"], [cand]: ["§4 判定規則"] },
        }),
      );
      expect(reasonsAt(r, X)).toContain("coverage_basis_incomplete");
    }
    // (c1)(c2) 実在するが有効な後継ではない置換先: link の後継 Z は有効なまま (facts も維持)、
    // 別 PLAN と自己参照先 X の見出しを実在させ、所属検査だけが拒否理由になるようにする
    const other = "docs/plans/PLAN-L6-999-not-a-link-successor.md";
    for (const target of [other, X]) {
      const r = a.analyzePlanRetirement(
        input([withLocation({ kind: "plan", planId: id(target), section: "概要" })], {
          ...over,
          successorPlanHeadings: { [Z]: ["概要"], [target]: ["概要"] },
        }),
      );
      expect(reasonsAt(r, X)).toContain("coverage_basis_incomplete");
    }
    // 後継 PLAN の見出しを読めない (blob 不在) 場合も plan 参照は実在と言えない
    const r = a.analyzePlanRetirement(
      input([withLocation({ kind: "plan", planId: id(Z), section: "概要" })], {
        ...over,
        successorPlanHeadings: { [Z]: null },
      }),
    );
    expect(reasonsAt(r, X)).toContain("coverage_basis_incomplete");
  });

  it.fails("CANDIDATE-U-PLRET-037: a successor finalized into governance closes the chain like design or issue", async () => {
    const a = await api();
    const GOV = "docs/governance/fixture-canon.md";
    const govRec = (path: string): Rec =>
      rec(path, { destinations: [{ kind: "governance", path: GOV, section: "§4 判定規則" }] });
    const files = { fileHeadings: { [DESIGN]: ["§4 判定規則"], [GOV]: ["§4 判定規則"] } };
    // 後継 Z は head に無いが governance へ transferred 済み
    await expectTwinOk(a, [twoSidedRec(X, Z), govRec(Z)], {
      ...files,
      supersessionFacts: facts(X, Z),
    });
    // 後継 Z が同じ PR で削除され、governance へ merged 済み
    await expectTwinOk(a, [twoSidedRec(X, Z), { ...govRec(Z), wholeSourceDisposition: "merged" }], {
      ...files,
      deletedPlanPaths: [X, Z],
      supersessionFacts: facts(X, Z),
    });
    // 双子の否定: governance の行き先の節が無ければ Z の最終化が成立せず連鎖は閉じない
    const open = a.analyzePlanRetirement(
      input([twoSidedRec(X, Z), govRec(Z)], {
        fileHeadings: { [DESIGN]: ["§4 判定規則"], [GOV]: ["別の節"] },
        supersessionFacts: facts(X, Z),
      }),
    );
    expect(reasonsAt(open, X)).toContain("supersedes_chain_open");
  });
});
