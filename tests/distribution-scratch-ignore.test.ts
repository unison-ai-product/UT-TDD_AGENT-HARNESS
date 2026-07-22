import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("distribution scratch gitignore", () => {
  it("keeps local Pack sync and release artifacts out of source commits", () => {
    const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");
    const patterns = gitignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(patterns).toEqual(
      expect.arrayContaining([
        ".ut-tdd/pack-sync/",
        ".ut-tdd/pack-stage/",
        ".ut-tdd/release/",
        ".ut-tdd/release-*/",
      ]),
    );
  });

  it("U-RGUARD-013: ignores only the canonical Plan ledger SQLite family", () => {
    const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");
    const patterns = gitignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(patterns).toEqual(
      expect.arrayContaining([
        "/.ut-tdd/ledger/harness-ledger.db",
        "/.ut-tdd/ledger/harness-ledger.db-journal",
        "/.ut-tdd/ledger/harness-ledger.db-wal",
        "/.ut-tdd/ledger/harness-ledger.db-shm",
      ]),
    );
    expect(patterns).not.toContain(".ut-tdd/ledger/");
    expect(patterns).not.toContain(".ut-tdd/ledger/*");
  });
});
