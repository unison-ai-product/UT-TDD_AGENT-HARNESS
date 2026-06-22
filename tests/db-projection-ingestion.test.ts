import { describe, expect, it } from "vitest";
import {
  AUTOMATIC_DB_PROJECTION_REQUIREMENTS,
  analyzeDbProjectionIngestion,
  dbProjectionIngestionMessages,
  EVIDENCE_GATED_DB_PROJECTION_TABLES,
} from "../src/lint/db-projection-ingestion";
import { openHarnessDb } from "../src/state-db/index";
import { rebuildHarnessDb } from "../src/state-db/projection-writer";

describe("db projection ingestion detector", () => {
  it("passes when rebuildHarnessDb auto-populates catalog and graph projection tables", () => {
    const db = openHarnessDb(":memory:");
    try {
      const rebuilt = rebuildHarnessDb({ repoRoot: process.cwd(), db });
      const result = analyzeDbProjectionIngestion(rebuilt.rowCounts);

      expect(result.ok).toBe(true);
      expect(result.missingRows).toEqual([]);
      expect(result.rowCounts.graph_nodes).toBeGreaterThan(0);
      expect(result.rowCounts.trace_edges).toBeGreaterThan(0);
      expect(result.rowCounts.mcp_server_profiles).toBeGreaterThan(0);
      expect(result.rowCounts.document_export_profiles).toBeGreaterThan(0);
      expect(result.rowCounts.test_cases).toBeGreaterThan(0);
    } finally {
      db.close();
    }
  });

  it("fails closed when an automatic projection table is empty", () => {
    const result = analyzeDbProjectionIngestion({
      graph_nodes: 1,
      dependency_edges: 1,
      trace_edges: 1,
      graph_snapshots: 1,
      impact_rules: 1,
      verification_profiles: 1,
      mcp_server_profiles: 0,
      mcp_profile_triggers: 1,
      document_export_profiles: 1,
      document_export_triggers: 1,
      document_export_runs: 1,
      document_export_datasets: 1,
      test_cases: 1,
      test_artifact_edges: 1,
      artifact_progress: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.missingRows.map((row) => row.table)).toEqual(["mcp_server_profiles"]);
    expect(dbProjectionIngestionMessages(result).join("\n")).toContain(
      "empty automatic projection table mcp_server_profiles",
    );
  });

  it("treats trace_edges as automatic and telemetry-only tables as explicit evidence-gated zeros", () => {
    expect(AUTOMATIC_DB_PROJECTION_REQUIREMENTS.map((item) => item.table)).toContain("trace_edges");
    expect(EVIDENCE_GATED_DB_PROJECTION_TABLES).toEqual(
      expect.arrayContaining(["model_evaluations", "retry_events"]),
    );
  });

  it("fails closed when trace_edges is not populated", () => {
    const result = analyzeDbProjectionIngestion({
      graph_nodes: 1,
      dependency_edges: 1,
      trace_edges: 0,
      graph_snapshots: 1,
      impact_rules: 1,
      verification_profiles: 1,
      mcp_server_profiles: 1,
      mcp_profile_triggers: 1,
      document_export_profiles: 1,
      document_export_triggers: 1,
      document_export_runs: 1,
      document_export_datasets: 1,
      test_cases: 1,
      test_artifact_edges: 1,
      artifact_progress: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.missingRows.map((row) => row.table)).toEqual(["trace_edges"]);
  });
});
