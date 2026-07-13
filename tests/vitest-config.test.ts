import { describe, expect, it } from "vitest";
import config from "../vitest.config";

describe("U-TESTHYGIENE-001: vitest execution boundary", () => {
  it("pins test discovery, exclusions, and timeout", () => {
    const test = (config as {
      test?: {
        include?: string[];
        exclude?: string[];
        testTimeout?: number;
        globalSetup?: string[];
        setupFiles?: string[];
      };
    }).test;
    expect(test?.include).toEqual(["tests/**/*.test.ts"]);
    expect(test?.exclude).toEqual([
      "node_modules/**",
      "dist/**",
      "coverage/**",
      ".git/**",
      "**/.ut-tdd/**",
    ]);
    expect(test?.testTimeout).toBe(30_000);
    expect(test?.globalSetup).toEqual(["tests/global-setup.ts"]);
    expect(test?.setupFiles).toEqual(["tests/workspace-setup.ts"]);
  });
});
