import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const scan = vi.hoisted(() => vi.fn(() => []));
vi.mock("../src/state-db/token-tracker.ts", () => ({ loadRuntimeSessionUsage: scan }));

import { checkDbProjectionIngestion } from "../src/doctor/db-projection.ts";
import { refreshHarnessDbOnStop } from "../src/state-db/stop-refresh.ts";

const roots: string[] = [];

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-token-ingest-boundary-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  scan.mockClear();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("#789 常時 token scan の退役", () => {
  it("U-TOKSTOP-001: Stop refresh は rebuild 後も session log を走査しない", () => {
    const result = refreshHarnessDbOnStop({
      repoRoot: fixtureRoot(),
      vacuum: () => ({ ran: false }),
    });

    expect(result.rebuilt).toBe(true);
    expect(scan).not.toHaveBeenCalled();
  });

  it("U-TOKSTOP-002: doctor projection は session log を走査しない", () => {
    checkDbProjectionIngestion(fixtureRoot());

    expect(scan).not.toHaveBeenCalled();
  });
});
