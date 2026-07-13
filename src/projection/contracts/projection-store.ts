/** Projection application が永続化adapterへ要求する最小契約。 */
export interface ProjectionStatement {
  run(...params: unknown[]): void;
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

/** projector の読取側port。 */
export interface ProjectionReadPort {
  prepare(sql: string): ProjectionStatement;
}

/** rebuild境界を原子的にするtransaction port。 */
export interface ProjectionTransaction {
  exec(sql: string): void;
}

/** SQLiteなどのprojection storeがapplicationへ公開する契約。 */
export interface ProjectionStore extends ProjectionReadPort, ProjectionTransaction {
  readonly path: string;
  readonly driver: "bun" | "node";
  userVersion(): number;
  setUserVersion(version: number): void;
  close(): void;
}

export function withinProjectionTransaction<T>(
  transaction: ProjectionTransaction,
  run: () => T,
): T {
  transaction.exec("BEGIN IMMEDIATE");
  try {
    const result = run();
    transaction.exec("COMMIT");
    return result;
  } catch (error) {
    transaction.exec("ROLLBACK");
    throw error;
  }
}
