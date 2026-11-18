import { afterEach, describe, expect, it } from "vitest";
import { missingTables, rowCounts } from "../src/state-db/migration.ts";
import {
  cleanupPlanretS7Fixtures,
  runScenario008,
  runScenario008Absent,
  runScenarioG,
  scanA,
  scanB,
  scanC,
  scanD,
  scanDSource,
  scanE,
  scanF,
} from "./support/planret-s7-acceptance.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

// S7 (#1379) の統合受入 oracle 008 / 018 (L7 plan-mechanism-retirement-test-design §3)。
// S7 の source 撤去 PR はすべて merge 済み (#1798 / #1801 / #1803)。Red 段の it.fails は、すべて it に戻した。
// (h)(i)(j) は別の PR で扱う。
const root = headSnapshotRoot();
afterEach(cleanupPlanretS7Fixtures);

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
