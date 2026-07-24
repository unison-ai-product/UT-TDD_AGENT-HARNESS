import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: process.env.UT_TDD_VITEST_CACHE_DIR ?? "node_modules/.vite-workers",
  test: {
    include: ["tests/workers/**/*.worker.ts"],
    exclude: ["node_modules/**", "dist/**", "coverage/**", ".git/**", "**/.ut-tdd/**"],
    testTimeout: 30_000,
    globalSetup: ["tests/global-setup.ts"],
  },
});
