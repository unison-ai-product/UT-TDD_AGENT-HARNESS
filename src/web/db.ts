/**
 * src/web 読み取り層 — harness.db を read-only で開き SELECT を実行する薄いヘルパ。
 * 正本境界 (ADR-005 §75): 各 project の git state が正本、harness.db は非正本 projection。
 * web は projection を表示するのみで書き込まない。
 */
import { defaultHarnessDbPath, type HarnessDb, openHarnessDb } from "../state-db/index";

export type { HarnessDb };

/** repo 既定の harness.db を開く (read 用途、書き込みはしない)。 */
export function openWebDb(repoRoot: string = process.cwd()): HarnessDb {
  return openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot });
}

/** SELECT 全行。テーブル不在等の SQL エラーは空配列に握る (UI 堅牢性 = 1 画面の失敗で全体を落とさない)。 */
export function queryAll(
  db: HarnessDb,
  sql: string,
  params: unknown[] = [],
): Record<string, unknown>[] {
  try {
    return db.prepare(sql).all(...params);
  } catch {
    return [];
  }
}

/** SELECT 1 行 (なければ undefined)。 */
export function queryOne(
  db: HarnessDb,
  sql: string,
  params: unknown[] = [],
): Record<string, unknown> | undefined {
  try {
    return db.prepare(sql).get(...params);
  } catch {
    return undefined;
  }
}

/** scalar (1 列 1 行) を数値で。 */
export function scalar(db: HarnessDb, sql: string, params: unknown[] = []): number {
  const row = queryOne(db, sql, params);
  if (!row) return 0;
  const v = Object.values(row)[0];
  return typeof v === "number" ? v : Number(v ?? 0);
}

/** sqlite のユーザーテーブル名一覧 (sqlite_* 除外、昇順)。 */
export function listTables(db: HarnessDb): string[] {
  return queryAll(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  ).map((r) => String(r.name));
}

/** SQL 識別子として安全なテーブル名か (英数 + _ のみ、injection 防止)。 */
export function isSafeTableName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/** 指定テーブルの行数 (識別子検証済みテーブルのみ)。 */
export function tableCount(db: HarnessDb, table: string): number {
  if (!isSafeTableName(table)) return 0;
  return scalar(db, `SELECT COUNT(*) AS n FROM ${table}`);
}
