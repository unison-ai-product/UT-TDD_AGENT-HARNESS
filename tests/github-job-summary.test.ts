// PLAN-L7-451 W3: Job Summary projection の unit oracle。

import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectJobSummary, renderJobSummary } from "../src/github/job-summary";

const tempDirs: string[] = [];

function makeDb(rows: Array<[string, string, string, string]>): string {
  const dir = mkdtempSync(join(tmpdir(), "ut-tdd-summary-"));
  tempDirs.push(dir);
  const dbPath = join(dir, "harness.db");
  const db = new Database(dbPath);
  db.run("CREATE TABLE gate_runs (gate_id TEXT, plan_id TEXT, status TEXT, checked_at TEXT)");
  const insert = db.prepare("INSERT INTO gate_runs VALUES (?, ?, ?, ?)");
  for (const row of rows) insert.run(...row);
  db.close();
  return dbPath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("github job summary (PLAN-L7-451 W3)", () => {
  it("U-L7-451-W3-001: gate matrix を含む markdown を出力し、gate_id ごとに最新観測を採用する", () => {
    const dbPath = makeDb([
      ["G4", "PLAN-A", "failed", "2026-07-01"],
      ["G4", "PLAN-A", "passed", "2026-07-02"],
      ["G8", "PLAN-B", "failed", "2026-07-03"],
    ]);
    const data = collectJobSummary({ dbPath, headSha: "abc1234", branch: "work/x" });
    expect(data.dbObserved).toBe(true);
    expect(data.gates).toHaveLength(2);
    expect(data.gates.find((g) => g.gateId === "G4")?.status).toBe("passed");
    const markdown = renderJobSummary(data);
    expect(markdown).toContain("### Gate matrix");
    expect(markdown).toContain("| G8 | ❌ failed | PLAN-B |");
    expect(markdown).toContain("Next action");
    expect(markdown).toContain("abc1234");
  });

  it("U-L7-451-W3-002: harness.db 欠落時は degrade して note を出す (throw しない)", () => {
    const data = collectJobSummary({
      dbPath: join(tmpdir(), "ut-tdd-summary-missing", "harness.db"),
      headSha: "abc1234",
      branch: "main",
    });
    expect(data.dbObserved).toBe(false);
    expect(data.gates).toHaveLength(0);
    const markdown = renderJobSummary(data);
    expect(markdown).toContain("unobserved");
  });

  it("U-L7-451-W3-003: 判定正本ではない旨を常に明記する (projection 原則)", () => {
    const dbPath = makeDb([]);
    const markdown = renderJobSummary(
      collectJobSummary({ dbPath, headSha: "abc1234", branch: "main" }),
    );
    expect(markdown).toContain("判定正本ではない");
  });
});
