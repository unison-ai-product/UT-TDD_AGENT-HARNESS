import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  emitSetup,
  loadTemplates,
  nodeSetupDeps,
  planSetup,
  transformCleanDistributionArtifact,
} from "../src/setup/index.ts";

type BunRemovalCase = {
  name: string;
  mutate: (consumerRoot: string) => void;
};

const forbiddenGeneratedPatterns: readonly [string, RegExp][] = [
  ["bun executable", /(?:^|[\s"'`])bun(?:\.exe)?(?=$|[\s"'`])/i],
  ["Bun shebang", /#!\/usr\/bin\/env bun\b/i],
  ["setup-bun action", /oven-sh\/setup-bun\b/i],
  ["run-bun path", /\brun-bun\.ts\b/i],
  ["findBun function", /\bfindBun\s*\(/i],
];

function walkFiles(root: string, directory = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(root, absolute));
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function scanGeneratedConsumerTree(root: string): string[] {
  const hits: string[] = [];
  for (const absolute of walkFiles(root)) {
    const relative = absolute.slice(root.length + 1).replace(/\\/g, "/");
    if (/\brun-bun\.ts\b/i.test(relative)) hits.push(`${relative}: run-bun path`);
    const content = readFileSync(absolute, "utf8");
    for (const [label, pattern] of forbiddenGeneratedPatterns) {
      if (pattern.test(content)) hits.push(`${relative}: ${label}`);
    }
  }
  return hits.sort();
}

function generateConsumerTree(): string {
  const consumerRoot = mkdtempSync(join(tmpdir(), "ut-tdd-packbun-"));
  const templates = loadTemplates(process.cwd());
  emitSetup(planSetup("0-A", { dryRun: false }), templates, nodeSetupDeps(consumerRoot));
  const sourcePackage = JSON.stringify({
    name: "consumer-fixture",
    scripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  });
  writeFileSync(
    join(consumerRoot, "package.json"),
    transformCleanDistributionArtifact("package.json", sourcePackage),
    "utf8",
  );
  return consumerRoot;
}

const negativeCases: readonly BunRemovalCase[] = [
  {
    name: "(a) common/ut-tdd.mjs の Bun shebang",
    mutate: (root) => {
      const path = join(root, ".ut-tdd", "bin", "ut-tdd.mjs");
      writeFileSync(path, `#!/usr/bin/env bun\n${readFileSync(path, "utf8")}`, "utf8");
    },
  },
  {
    name: "(b) common/run-bun.ts / findBun()",
    mutate: (root) => {
      writeFileSync(
        join(root, ".ut-tdd", "bin", "run-bun.ts"),
        'function findBun(): string { throw new Error("bun"); }\n',
        "utf8",
      );
    },
  },
  {
    name: "(c) consumer CI の setup-bun / bun install / bun run",
    mutate: (root) => {
      const path = join(root, ".github", "workflows", "harness-check.yml");
      writeFileSync(
        path,
        `${readFileSync(path, "utf8")}\n      - uses: oven-sh/setup-bun@v2\n      - run: bun install --frozen-lockfile\n      - run: bun run test\n`,
        "utf8",
      );
    },
  },
  {
    name: "(d) adapter の案内文",
    mutate: (root) => {
      const path = join(root, ".claude", "commands", "ut-tdd-test.md");
      writeFileSync(path, `${readFileSync(path, "utf8")}\nRun bun run lint.\n`, "utf8");
    },
  },
  {
    name: "(e) distribution.ts の package.json test script",
    mutate: (root) => {
      const path = join(root, "package.json");
      const packageJson = JSON.parse(readFileSync(path, "utf8")) as {
        scripts: Record<string, string>;
      };
      packageJson.scripts.test = "bun run test:pack";
      writeFileSync(path, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
    },
  },
];

describe("Issue #470 S1-b setup generated Bun removal", () => {
  it("U-PACKBUN-003: recursively scans the complete generated consumer tree", () => {
    const consumerRoot = generateConsumerTree();
    try {
      expect(scanGeneratedConsumerTree(consumerRoot)).toEqual([]);
    } finally {
      rmSync(consumerRoot, { recursive: true, force: true });
    }
  });

  it.each(negativeCases)("U-PACKBUN-004 $name: the oracle turns Red", ({ mutate }) => {
    const consumerRoot = generateConsumerTree();
    try {
      mutate(consumerRoot);
      expect(scanGeneratedConsumerTree(consumerRoot)).not.toEqual([]);
    } finally {
      rmSync(consumerRoot, { recursive: true, force: true });
    }
  });
});
