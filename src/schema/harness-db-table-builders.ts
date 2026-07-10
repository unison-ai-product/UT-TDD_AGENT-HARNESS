import type { CheckExpression, ColumnReference, ColumnType, ForeignKeyDef } from "./harness-db";

export const col = (name: string, type: ColumnType = "TEXT") => ({ name, type });
export const pk = (name: string) => ({ name, type: "TEXT" as const, primaryKey: true });

export const requiredCol = (name: string, type: ColumnType = "TEXT") => ({
  name,
  type,
  notNull: true,
});

export const reference = (name: string, target: ColumnReference, type: ColumnType = "TEXT") => ({
  name,
  type,
  references: target,
});

export const foreignKey = (
  columns: readonly string[],
  referencedTable: string,
  referencedColumns: readonly string[],
  actions: Pick<ForeignKeyDef, "onDelete" | "onUpdate"> = {},
): ForeignKeyDef => ({ columns, referencedTable, referencedColumns, ...actions });

export const enumCheck = (column: string, values: readonly string[]): CheckExpression => ({
  kind: "in",
  column,
  values,
});
