import type { HarnessDb } from "./index";

/** SQLite固有の原子境界。applicationはこの実装を直接参照しない。 */
export function runSqliteTransaction<T>(db: HarnessDb, work: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
