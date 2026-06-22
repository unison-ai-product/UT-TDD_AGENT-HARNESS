/**
 * src/web HTTP アダプタ — Bun.serve で local read-only ダッシュボードを起動する (Phase B、Phase A=local)。
 *
 * 薄い I/O 層: request ごとに harness.db を read で開き handleRequest に委譲して閉じる
 * (projection は再構築されうるため per-request open で鮮度を担保、WAL で読取非ブロック ADR-005)。
 * 中央 server 同期 (VPS / GitHub webhook) は ADR-005 D2 で direction-only・auth-gated ゆえ本実装の射程外。
 *
 * Bun の型は devDeps に無いため (@types/bun 不使用、state-db と同方針) globalThis 経由で最小型付け。
 */

import { handleRequest } from "./app";
import { openWebDb } from "./db";

interface BunServeOptions {
  port: number;
  fetch: (req: { url: string }) => Response;
}
interface BunLike {
  serve(options: BunServeOptions): { port: number };
}

function bun(): BunLike | null {
  const g = globalThis as { Bun?: BunLike };
  return g.Bun ?? null;
}

export interface WebServerHandle {
  port: number;
}

/** local ダッシュボードを起動 (Bun 必須)。返り値は実 port。 */
export function startWebServer(
  options: { port?: number; repoRoot?: string } = {},
): WebServerHandle {
  const runtime = bun();
  if (!runtime) {
    throw new Error("src/web の HTTP server は Bun runtime が必要です (bun src/web/server.ts)");
  }
  const repoRoot = options.repoRoot ?? process.cwd();
  const server = runtime.serve({
    port: options.port ?? 4173,
    fetch(req) {
      const db = openWebDb(repoRoot);
      try {
        const res = handleRequest(db, req.url);
        return new Response(res.body, {
          status: res.status,
          headers: { "content-type": res.contentType },
        });
      } finally {
        db.close();
      }
    },
  });
  return { port: server.port };
}

// `bun src/web/server.ts` で直接起動可能 (Phase A local bootstrap)。
if (import.meta.main) {
  const handle = startWebServer();
  process.stdout.write(`UT-TDD 中央 UI (read-only) → http://localhost:${handle.port}/projects\n`);
}
