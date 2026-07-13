import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", "coverage/**", ".git/**", "**/.ut-tdd/**"],
    testTimeout: 30_000,
    globalSetup: ["tests/global-setup.ts"],
    coverage: {
      reporter: ["text", "html", "clover", "json-summary"],
    },
  },
});
