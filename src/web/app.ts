/**
 * src/web アプリ層 — 1 リクエスト (URL) を解決し HTML レスポンスを生成する (server 非依存・test 可能)。
 * Bun.serve / 任意の HTTP 層から呼ばれる純粋な request→response 変換。
 */
import type { HarnessDb } from "./db";
import { layout } from "./render";
import { parseQuery, resolveRoute } from "./router";
import { navItems } from "./screens";

export interface WebResponse {
  status: number;
  contentType: string;
  body: string;
}

/** URL (path + query) を harness.db に対して描画する。未知 path は 404 ページ。 */
export function handleRequest(db: HarnessDb, urlString: string): WebResponse {
  const url = new URL(urlString, "http://localhost");
  const match = resolveRoute(url.pathname);
  const nav = navItems();
  if (!match) {
    const body = layout({
      title: "404",
      activeId: "",
      nav,
      body: `<h1>404 — 画面が見つかりません</h1><p class="sub">${url.pathname}</p><p><a href="/projects">PM-01 俯瞰へ</a></p>`,
    });
    return { status: 404, contentType: "text/html; charset=utf-8", body };
  }
  let inner: string;
  try {
    inner = match.screen.render({
      db,
      params: match.params,
      query: parseQuery(url.search),
    });
  } catch (err) {
    inner = `<h1>${match.screen.id} — 描画エラー</h1><p class="sub">${String(err)}</p>`;
  }
  const body = layout({
    title: `${match.screen.id} ${match.screen.name}`,
    activeId: match.screen.id,
    nav,
    body: inner,
  });
  return { status: 200, contentType: "text/html; charset=utf-8", body };
}
