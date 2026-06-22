// src/web Phase B: 15 画面 read-only ダッシュボード (ADR-005 D2 中央 UI / L2 screen-list)。
// router (URL↔画面 ID 1:1) + render (純 HTML) + app (request→response) を server なしで検証。
import { describe, expect, it } from "vitest";
import { type HarnessDb, openHarnessDb } from "../src/state-db/index";
import { handleRequest } from "../src/web/app";
import { escapeHtml, statusBadge, table } from "../src/web/render";
import { parseQuery, resolveRoute } from "../src/web/router";
import { navItems, SCREENS } from "../src/web/screens";

describe("render (pure HTML helpers) U-WEB-001..003", () => {
  it("U-WEB-001: escapeHtml が XSS 文字を無害化", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });

  it("U-WEB-002: table は空配列で「該当データなし」、行ありで th/td 生成", () => {
    expect(table([])).toContain("該当データなし");
    const html = table([{ a: 1, b: "x" }], ["a", "b"]);
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td>x</td>");
  });

  it("U-WEB-003: statusBadge が green/yellow/red を色分け", () => {
    expect(statusBadge("confirmed")).toContain("green");
    expect(statusBadge("draft")).toContain("yellow");
    expect(statusBadge("open")).toContain("red");
  });
});

describe("router (URL↔画面 1:1) U-WEB-004..008", () => {
  it("U-WEB-004: 15 画面すべての navHref が解決し自分の ID に戻る (ID↔URL 1:1)", () => {
    expect(SCREENS).toHaveLength(15);
    for (const s of SCREENS) {
      const m = resolveRoute(new URL(s.navHref, "http://x").pathname);
      expect(m, `${s.id} navHref=${s.navHref}`).not.toBeNull();
      expect(m?.screen.id).toBe(s.id);
    }
  });

  it("U-WEB-005: ルート / は PM-01 (俯瞰) へ", () => {
    expect(resolveRoute("/")?.screen.id).toBe("PM-01");
  });

  it("U-WEB-006: path param (:case/:L) を抽出", () => {
    const m = resolveRoute("/project/demo/layer/L4");
    expect(m?.screen.id).toBe("PM-02");
    expect(m?.params).toMatchObject({ case: "demo", L: "L4" });
  });

  it("U-WEB-007: 未知 path は null (404)", () => {
    expect(resolveRoute("/nope/x")).toBeNull();
  });

  it("U-WEB-008: parseQuery が ?table=x を抽出", () => {
    expect(parseQuery("?table=screens&tab=1")).toEqual({ table: "screens", tab: "1" });
  });

  it("U-WEB-009: navItems は 15 件で PM/HM/GD を含む", () => {
    const nav = navItems();
    expect(nav).toHaveLength(15);
    expect(nav.filter((n) => n.category === "PM")).toHaveLength(6);
    expect(nav.filter((n) => n.category === "HM")).toHaveLength(8);
    expect(nav.filter((n) => n.category === "GD")).toHaveLength(1);
  });
});

function seedDb(): HarnessDb {
  const db = openHarnessDb(":memory:");
  db.exec(
    "CREATE TABLE plan_registry (plan_id TEXT PRIMARY KEY, layer TEXT, kind TEXT, status TEXT, drive TEXT)",
  );
  db.exec(
    "INSERT INTO plan_registry VALUES ('PLAN-L7-99-x','L7','troubleshoot','draft','be'),('PLAN-L4-00-m','L4','design','confirmed','be')",
  );
  db.exec(
    "CREATE TABLE screens (screen_id TEXT PRIMARY KEY, name TEXT, category TEXT, url TEXT, status TEXT, implemented INTEGER)",
  );
  db.exec("INSERT INTO screens VALUES ('PM-01','俯瞰','PM','/projects','confirmed',0)");
  return db;
}

describe("app (request→response over harness.db) U-WEB-010..013", () => {
  it("U-WEB-010: /projects は 200 + PM-01 + 実データ件数を描画", () => {
    const db = seedDb();
    const res = handleRequest(db, "/projects");
    db.close();
    expect(res.status).toBe(200);
    expect(res.body).toContain("PM-01");
    expect(res.body).toContain("PLAN 総数");
  });

  it("U-WEB-011: 空 (テーブル不在) db でも全 15 画面が 200 で落ちない (queryAll が握る)", () => {
    const db = openHarnessDb(":memory:");
    for (const s of SCREENS) {
      const res = handleRequest(db, new URL(s.navHref, "http://x").pathname);
      expect(res.status, s.id).toBe(200);
      expect(res.body, s.id).toContain(s.id);
    }
    db.close();
  });

  it("U-WEB-012: 未知 path は 404 ページ", () => {
    const db = openHarnessDb(":memory:");
    const res = handleRequest(db, "/does/not/exist");
    db.close();
    expect(res.status).toBe(404);
    expect(res.body).toContain("404");
  });

  it("U-WEB-013: HM-04 ?table=screens がブラウズ行を描画", () => {
    const db = seedDb();
    const res = handleRequest(db, "/harness/db?table=screens");
    db.close();
    expect(res.status).toBe(200);
    expect(res.body).toContain("先頭 100 行");
  });

  it("U-WEB-014: 404 ページは反映 path を escapeHtml する (reflected XSS 防止、code-reviewer Important)", () => {
    const db = openHarnessDb(":memory:");
    // URL は pathname の <> を %エンコードするため、path で生存する & が escape されることで検証する。
    const res = handleRequest(db, "/ghost&page");
    db.close();
    expect(res.status).toBe(404);
    expect(res.body).toContain("&amp;");
    expect(res.body).not.toContain("/ghost&page");
  });
});
