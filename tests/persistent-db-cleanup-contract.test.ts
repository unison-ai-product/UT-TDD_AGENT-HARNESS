import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PERSISTENT_DB_OWNERS = [
  "tests/cli-surface.test.ts",
  "tests/db-currency.test.ts",
  "tests/drive-db-registration.test.ts",
  "tests/state-db.test.ts",
];

describe("persistent harness DB cleanup contract", () => {
  it("U-TESTHYGIENE-019: every persisted harness DB owner uses retrying tree cleanup", () => {
    for (const owner of PERSISTENT_DB_OWNERS) {
      const source = readFileSync(join(process.cwd(), owner), "utf8");
      expect(source, owner).toContain('from "./support/temp-tree"');
      expect(source, owner).toMatch(/removeTestTree(?:\(|;)/);
    }
  });
});
