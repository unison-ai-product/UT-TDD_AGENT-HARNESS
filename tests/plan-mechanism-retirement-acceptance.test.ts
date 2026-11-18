import { afterEach, describe, expect, it } from "vitest";
import { missingTables, rowCounts } from "../src/state-db/migration.ts";
import {
  cleanupPlanretS7Fixtures,
  runScenario008,
  runScenarioG,
  scanA,
  scanB,
  scanC,
  scanD,
  scanE,
  scanF,
} from "./support/planret-s7-acceptance.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

// S7 (#1379) の統合受入 oracle 008 / 018 (L7 plan-mechanism-retirement-test-design §3)。
// Red 段: S7 の source 撤去 PR が全て merge される前は、残っている sub-assertion を it.fails にする。
// 撤去が済んだ段で it.fails を it に戻す (probe の hit が 0 件になった sub-assertion から)。
// (h)(i)(j) は別の PR で扱う。
const root = headSnapshotRoot();
afterEach(cleanupPlanretS7Fixtures);

describe("CANDIDATE-U-PLANRET-018 S7 の静的 scan (src / scripts / .github の tracked file)", () => {
  it.fails("CANDIDATE-U-PLANRET-018(a) PLAN 用の表の名前を含む SQL 文字列が無い", () => {
    expect(scanA(root)).toEqual([]);
  });
  it.fails("CANDIDATE-U-PLANRET-018(b) harness-ledger.db の path が無い", () => {
    expect(scanB(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(c) PLAN 用の表と台帳への DROP / VACUUM / DELETE が無い", () => {
    expect(scanC(root)).toEqual([]);
  });
  it.fails("CANDIDATE-U-PLANRET-018(d) docs/plans の実在を確かめるコードが無い", () => {
    expect(scanD(root)).toEqual([]);
  });
  it("CANDIDATE-U-PLANRET-018(e) Project の item を消す GraphQL mutation が無い", () => {
    expect(scanE(root)).toEqual([]);
  });
  it.fails("CANDIDATE-U-PLANRET-018(f) PLAN 専用の SQL 読み手と review lane receipt の書き手が無い", () => {
    expect(scanF(root)).toEqual([]);
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
  it.fails("CANDIDATE-U-PLANRET-008 migrate 2 回と rebuild の truncate で DDL と行数が変わらない", () => {
    const r = runScenario008();
    expect(r.after).toEqual(r.before);
    expect(r.after.plan_registry?.rows).toBe(3);
    expect(r.after.schedule_entries?.rows).toBe(2);
    expect(r.second.tables).toEqual(expect.arrayContaining(["plan_registry", "schedule_entries"]));
    expect(missingTables(r.db)).not.toEqual(expect.arrayContaining(["plan_registry"]));
    expect(Object.keys(rowCounts(r.db))).not.toEqual(expect.arrayContaining(["plan_registry"]));
  });
});
