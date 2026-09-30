import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveLiveReviewDelegationEntrypoint } from "../src/cli/review-live.ts";
import { removeTestTree } from "./support/temp-tree.ts";

describe("#779 Pack-only review delegation entrypoint", () => {
  it("CANDIDATE-U-RVPACK-001: source CLI re-enters the invoked source path", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-rvpack-source-"));
    try {
      const source = join(root, "src", "cli.ts");
      mkdirSync(join(root, "src"));
      writeFileSync(source, "// source CLI\n");
      expect(resolveLiveReviewDelegationEntrypoint(root, source)).toBe(source);
    } finally {
      removeTestTree(root);
    }
  });

  it("CANDIDATE-U-RVPACK-002: sealed consumer re-enters through the validating wrapper", () => {
    const root = mkdtempSync(join(tmpdir(), "ut-rvpack-sealed-"));
    try {
      const runtime = join(root, ".ut-tdd", "runtime");
      const entry = join(runtime, "bundles", "generation", "ut-tdd.mjs");
      const wrapper = join(root, ".ut-tdd", "bin", "ut-tdd.mjs");
      mkdirSync(join(runtime, "bundles", "generation"), { recursive: true });
      mkdirSync(join(runtime, "activation"), { recursive: true });
      mkdirSync(join(root, ".ut-tdd", "bin"), { recursive: true });
      writeFileSync(entry, "// sealed CLI\n");
      writeFileSync(wrapper, "// validating wrapper\n");
      writeFileSync(
        join(runtime, "activation", "active.json"),
        JSON.stringify({ entry_path: entry }),
      );
      expect(resolveLiveReviewDelegationEntrypoint(root, entry)).toBe(wrapper);
      const foreign = join(root, "foreign-cli.mjs");
      writeFileSync(foreign, "// wrong entry\n");
      expect(resolveLiveReviewDelegationEntrypoint(root, foreign)).toBeNull();
      expect(resolveLiveReviewDelegationEntrypoint(root, undefined)).toBeNull();
      writeFileSync(
        join(runtime, "activation", "active.json"),
        JSON.stringify({ entry_path: foreign }),
      );
      expect(resolveLiveReviewDelegationEntrypoint(root, entry)).toBeNull();
    } finally {
      removeTestTree(root);
    }
  });
});
