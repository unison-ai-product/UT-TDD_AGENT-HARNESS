import { HARNESS_DB_INDEXES } from "./harness-db-indexes";
import { HARNESS_DB_CORE_TABLES } from "./harness-db-tables-core";
import { HARNESS_DB_EVALUATION_TABLES } from "./harness-db-tables-evaluation";
import { HARNESS_DB_GRAPH_EXPORT_TABLES } from "./harness-db-tables-graph";
import { HARNESS_DB_SPEC_IR_TABLES } from "./harness-db-tables-spec-ir";

export const HARNESS_DB_TABLES = [
  ...HARNESS_DB_CORE_TABLES,
  ...HARNESS_DB_GRAPH_EXPORT_TABLES,
  ...HARNESS_DB_EVALUATION_TABLES,
  ...HARNESS_DB_SPEC_IR_TABLES,
];

export { HARNESS_DB_INDEXES };
