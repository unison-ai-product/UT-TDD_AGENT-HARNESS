import { mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkTraceGate } from "../src/doctor/process-quality.ts";
import { evaluateStaticGate } from "../src/gate/static.ts";
import { missingTables, rowCounts } from "../src/state-db/migration.ts";
import {
  cleanupPlanretS7Fixtures,
  runScenario008,
  runScenario008Absent,
  runScenarioG,
  runScenarioJ,
  scanA,
  scanB,
  scanC,
  scanD,
  scanDSource,
  scanE,
  scanF,
  scanHPlanLintEntry,
  scanIPlanAssetImports,
} from "./support/planret-s7-acceptance.ts";
import { removeTestTree } from "./support/temp-tree.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

// S7 (#1379) の統合受入 oracle 008 / 018 (L7 plan-mechanism-retirement-test-design §3)。
// S7 の source 撤去 PR はすべて merge 済み (#1798 / #1801 / #1803)。Red 段の it.fails は、すべて it に戻した。
// (h)(i)(j) は Red 段の PR で足した。契約を満たさない (j) だけ it.fails で、(h)(i) は main が既に満たすので it。Green で (j) を it に戻す。
const root = headSnapshotRoot();
const emptyRoots: string[] = [];
afterEach(() => {
  cleanupPlanretS7Fixtures();
  for (const dir of emptyRoots.splice(0)) removeTestTree(dir);
});
function emptyRepoRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "planret-s7-h-"));
  mkdirSync(join(dir, "docs"), { recursive: true });
  emptyRoots.push(dir);
  return dir;
}

describe("CANDIDATE-U-PLANRET-018 S7 の静的 scan (src / scripts / .github の tracked file)", () => {
  it("CANDIDATE-U-PLANRET-018(a) PLAN 用の表の名前を含む SQL 文字列が無い", () => {
    expect(scanA(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(b) harness-ledger.db の path が無い", () => {
    expect(scanB(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(c) PLAN 用の表と台帳への DROP / VACUUM / DELETE が無い", () => {
    expect(scanC(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(d) docs/plans の実在を確かめるコードが無い", () => {
    expect(scanD(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(e) Project の item を消す GraphQL mutation が無い", () => {
    expect(scanE(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(f) PLAN 専用の SQL 読み手と review lane receipt の書き手が無い", () => {
    expect(scanF(root)).toEqual([]);
  });
});

describe("CANDIDATE-U-PLANRET-018(d) scanner の正例と負例 (合成入力)", () => {
  const src = (...lines: string[]) =>
    ['import { existsSync, statSync } from "node:fs";', ...lines].join("\n");
  it("docs/plans を引数に直接取る実在確認を検出する", () => {
    expect(
      scanDSource("a.ts", src('export const x = existsSync(join(root, "docs/plans"));')),
    ).toEqual([2]);
  });
  it("docs/plans を初期化式に持つ変数 (関数内・module 直下) を経由する実在確認を検出する", () => {
    const local = src(
      "export function f(r: string) {",
      '  const d = join(r, "docs", "plans");',
      "  return statSync(d);",
      "}",
    );
    const top = src('const D = "docs/plans";', "export const f = () => existsSync(D);");
    expect(scanDSource("a.ts", local)).toEqual([4]);
    expect(scanDSource("a.ts", top)).toEqual([3]);
  });
  it("無関係な FS 検査と docs/plans の除外規則が同じ file にあっても hit にしない", () => {
    const s = src(
      'export const skip = (p: string) => p.startsWith("docs/plans/");',
      'export const g = () => existsSync(".git");',
    );
    expect(scanDSource("a.ts", s)).toEqual([]);
  });
  it("別の関数にある docs/plans の変数は実在確認に流れ込まない", () => {
    const s = src(
      'export const a = () => { const d = "docs/plans"; return d; };',
      "export const b = (d: string) => existsSync(d);",
    );
    expect(scanDSource("a.ts", s)).toEqual([]);
  });
  it("仮引数の d は、入れ子の関数にある同名の docs/plans 変数に結び付かない", () => {
    const s = src(
      "function f(d: string) {",
      '  function unrelated() { const d = "docs/plans"; return d; }',
      "  return existsSync(d);",
      "}",
    );
    expect(scanDSource("a.ts", s)).toEqual([]);
  });
  it("別のブロックにある docs/plans の変数は、同名の別の束縛に結び付かない", () => {
    const s = src(
      "function f() {",
      '  { const d = "docs/plans"; }',
      '  const d = ".git";',
      "  return existsSync(d);",
      "}",
    );
    expect(scanDSource("a.ts", s)).toEqual([]);
  });
  it("内側の scope の docs/plans 変数が外側の同名変数を隠し、同じ scope の実在確認を検出する", () => {
    const s = src(
      'const d = ".git";',
      "function f() {",
      '  if (true) { const d = "docs/plans"; return existsSync(d); }',
      "}",
    );
    expect(scanDSource("a.ts", s)).toEqual([4]);
  });
});

describe("CANDIDATE-U-PLANRET-018(g) 新規 DB と旧表入り DB の非 PLAN 動作", () => {
  it("CANDIDATE-U-PLANRET-018(g) text 推薦が新規 DB と旧表入り DB で同じ結果になる", () => {
    const g = runScenarioG();
    expect(g.legacyOut.recommend).toEqual(g.freshOut.recommend);
  });
  it("CANDIDATE-U-PLANRET-018(g) PLAN に依らない digest が両 DB で同じ結果になる", () => {
    const g = runScenarioG();
    expect(g.legacyOut.digest).toEqual(g.freshOut.digest);
  });
  it("CANDIDATE-U-PLANRET-018(g) 旧表の行が出力に現れない", () => {
    expect(runScenarioG().leaked).toBe(false);
  });
  it("CANDIDATE-U-PLANRET-018(g) 旧表と保存対象 12 表の DDL と行数が変わらない", () => {
    const g = runScenarioG();
    expect(g.after).toEqual(g.before);
  });
});

describe("CANDIDATE-U-PLANRET-008 登録の無い PLAN 表の保全", () => {
  it("CANDIDATE-U-PLANRET-008 migrate 2 回と rebuild の truncate で DDL と行数が変わらない", () => {
    const r = runScenario008();
    expect(r.after).toEqual(r.before);
    expect(r.after.plan_registry?.rows).toBe(3);
    expect(r.after.schedule_entries?.rows).toBe(2);
    expect(r.second.tables).toEqual(expect.arrayContaining(["plan_registry", "schedule_entries"]));
  });
  for (const table of ["plan_registry", "schedule_entries"]) {
    it(`CANDIDATE-U-PLANRET-008 rowCounts に ${table} が出ない`, () => {
      expect(Object.keys(rowCounts(runScenario008().db))).not.toContain(table);
    });
    it(`CANDIDATE-U-PLANRET-008 表の無い DB でも missingTables が ${table} を要求しない`, () => {
      expect(missingTables(runScenario008Absent())).not.toContain(table);
    });
  }
});

describe("CANDIDATE-U-PLANRET-018(h) G1 / G3 trace の直接経路", () => {
  for (const gate of ["G1", "G3"] as const) {
    it(`CANDIDATE-U-PLANRET-018(h) gate ${gate} と doctor が実 repo で trace を直接動かす`, () => {
      const trace = `${gate}-trace` as const;
      expect(checkTraceGate(root, trace).ok).toBe(true);
      const result = evaluateStaticGate({ gate, repoRoot: root });
      expect(result.applicable).toBe(true);
      expect(result.passed).toBe(true);
    });
    it(`CANDIDATE-U-PLANRET-018(h) 対象文書が欠けると gate ${gate} と doctor が fail-close する`, () => {
      const dir = emptyRepoRoot();
      const trace = `${gate}-trace` as const;
      const doctor = checkTraceGate(dir, trace);
      expect(doctor.ok).toBe(false);
      const result = evaluateStaticGate({ gate, repoRoot: dir });
      expect(result.passed).toBe(false);
    });
  }
  it("CANDIDATE-U-PLANRET-018(h) plan lint の互換入口が無い", () => {
    expect(scanHPlanLintEntry(root)).toEqual([]);
  });
});

describe("CANDIDATE-U-PLANRET-018(i) 共用型の移し先と plan-asset 参照", () => {
  const exportsOf: [string, RegExp][] = [
    ["src/github/git-diff.ts", /export type GitChange(?![A-Za-z])/],
    ["src/lint/lint-result.ts", /export interface LintResult(?![A-Za-z])/],
    ["src/kernel/project-identity.ts", /export function loadTrackedProjectIdentity(?![A-Za-z])/],
  ];
  for (const [path, pattern] of exportsOf) {
    it(`CANDIDATE-U-PLANRET-018(i) ${path} が移し先として宣言を持つ`, () => {
      expect(readFileSync(join(root, path), "utf8")).toMatch(pattern);
    });
  }
  it("CANDIDATE-U-PLANRET-018(i) src/plan-asset/ を参照する import が無い", () => {
    expect(scanIPlanAssetImports(root)).toEqual([]);
  });
});

describe("CANDIDATE-U-PLANRET-018(j) document_scale_profile_entries の defer 行 (required_plan_id=NULL)", () => {
  it.fails("CANDIDATE-U-PLANRET-018(j) 旧 CHECK のある DDL からの migrate 後に defer 行を NULL で投影する", () => {
    const j = runScenarioJ();
    expect(j.legacyBefore).toMatch(/required_plan_id IS NOT NULL/);
    expect(j.legacy.thrown).toBeNull();
    expect(j.legacy.entries).toEqual([
      {
        profile_id: "PLANRET-J-A",
        doc_type_id: "DOC-L0-CHARTER",
        decision: "defer",
        required_plan_id: null,
      },
      {
        profile_id: "PLANRET-J-B",
        doc_type_id: "DOC-L0-CHARTER",
        decision: "adopt",
        required_plan_id: null,
      },
    ]);
    expect(j.legacy.reviewCount).toBe(2);
    expect(j.legacy.deferNullInsert).toBeNull();
    expect(j.legacy.ddl).not.toMatch(/required_plan_id IS NOT NULL/);
  }, 120000);
  it.fails("CANDIDATE-U-PLANRET-018(j) 新規 DB で defer 行を NULL で投影し document profile / decision / count の正例を保つ", () => {
    const j = runScenarioJ();
    expect(j.fresh.thrown).toBeNull();
    expect(j.fresh.entries).toEqual([
      {
        profile_id: "PLANRET-J-A",
        doc_type_id: "DOC-L0-CHARTER",
        decision: "defer",
        required_plan_id: null,
      },
      {
        profile_id: "PLANRET-J-B",
        doc_type_id: "DOC-L0-CHARTER",
        decision: "adopt",
        required_plan_id: null,
      },
    ]);
    expect(j.fresh.reviewCount).toBe(2);
    expect(j.fresh.deferNullInsert).toBeNull();
    expect(j.fresh.ddl).not.toMatch(/required_plan_id IS NOT NULL/);
  }, 120000);
});
