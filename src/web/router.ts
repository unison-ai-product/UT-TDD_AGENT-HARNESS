/**
 * src/web ルーティング — URL path を画面 ID へ解決する (純関数、screen-list §2 ID↔URL 1:1)。
 * `:param` セグメントを抽出して params に載せる。server なしで test 可能。
 */
import { SCREENS, type ScreenDef } from "./screens";

export interface RouteMatch {
  screen: ScreenDef;
  params: Record<string, string>;
}

/** pathPattern (`/project/:case/layer/:L`) を実 path にマッチさせ param を抽出。 */
function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const pSeg = pattern.split("/").filter(Boolean);
  const aSeg = path.split("/").filter(Boolean);
  if (pSeg.length !== aSeg.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    const p = pSeg[i];
    const a = aSeg[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(a);
    } else if (p !== a) {
      return null;
    }
  }
  return params;
}

/** path を最初にマッチする画面へ解決 (なければ null = 404)。 */
export function resolveRoute(pathname: string): RouteMatch | null {
  // ルート "/" は PM-01 (俯瞰) へ。
  const path = pathname === "/" ? "/projects" : pathname;
  for (const screen of SCREENS) {
    const params = matchPattern(screen.pathPattern, path);
    if (params) return { screen, params };
  }
  return null;
}

/** URLSearchParams を plain object に。 */
export function parseQuery(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [k, v] of sp) out[k] = v;
  return out;
}
