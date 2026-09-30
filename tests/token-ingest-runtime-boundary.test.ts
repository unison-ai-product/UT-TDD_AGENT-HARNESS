import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const scans = vi.hoisted(() => ({
  all: vi.fn(() => []),
  repoScoped: vi.fn(() => {
    throw new Error("unexpected repo-scoped token scan");
  }),
}));
vi.mock("../src/state-db/token-tracker.ts", () => ({
  loadRuntimeSessionUsage: scans.all,
  loadRepoScopedRuntimeSessionUsage: scans.repoScoped,
}));

import { checkDbProjectionIngestion } from "../src/doctor/db-projection.ts";
import { refreshHarnessDbOnStop } from "../src/state-db/stop-refresh.ts";

const roots: string[] = [];

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-token-ingest-boundary-"));
  roots.push(root);
  return root;
}

afterEach(() => {
  scans.all.mockClear();
  scans.repoScoped.mockClear();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("#789 常時 token scan の退役", () => {
  it("U-TOKSTOP-001: Stop refresh は rebuild 後も session log を走査しない", () => {
    const result = refreshHarnessDbOnStop({
      repoRoot: fixtureRoot(),
      vacuum: () => ({ ran: false }),
    });

    expect(result.rebuilt).toBe(true);
    expect(scans.all).not.toHaveBeenCalled();
    expect(scans.repoScoped).not.toHaveBeenCalled();
  });

  it("U-TOKSTOP-002: doctor projection は session log を走査しない", () => {
    checkDbProjectionIngestion(fixtureRoot());

    expect(scans.all).not.toHaveBeenCalled();
    expect(scans.repoScoped).not.toHaveBeenCalled();
  });
});
