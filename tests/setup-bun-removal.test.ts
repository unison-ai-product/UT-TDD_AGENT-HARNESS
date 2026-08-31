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
  /**
   * 変異が生む finding を **case ごとに固定**する。`not.toEqual([])` の非空 assertion では
   * 別軸の finding で通ってしまい、宣言した変異が生き残っても Red にならない
   * (PR #478 Codex/Sol closing review blocking 2)。
   */
  expected: readonly string[];
};

const forbiddenGeneratedPatterns: readonly [string, RegExp][] = [
  // 実行子は変種ごとに独立ラベルで測る。1 本の正規表現へ畳むと、どの到達形が
  // 残っているか判別できず、変種の取りこぼしも見えない (同 review blocking 1)。
  ["bun executable", /(?:^|[\s"'`])bun(?=$|[\s"'`])/i],
  ["bunx executable", /(?:^|[\s"'`])bunx(?=$|[\s"'`])/i],
  ["bun.exe executable", /(?:^|[\s"'`])bun\.exe(?=$|[\s"'`])/i],
  ["bun.cmd executable", /(?:^|[\s"'`])bun\.cmd(?=$|[\s"'`])/i],
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
  // 実 source の package.json を通す。合成 fixture に差し替えると `build: bun build …` の
  // 素通しを見逃す (PLAN-L7-522 §2.1.1)。
  const sourcePackage = readFileSync(join(process.cwd(), "package.json"), "utf8");
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
    expected: [".ut-tdd/bin/ut-tdd.mjs: Bun shebang", ".ut-tdd/bin/ut-tdd.mjs: bun executable"],
    mutate: (root) => {
      const path = join(root, ".ut-tdd", "bin", "ut-tdd.mjs");
      writeFileSync(path, `#!/usr/bin/env bun\n${readFileSync(path, "utf8")}`, "utf8");
    },
  },
  {
    // 復活させる文字列は分割して組み立てる。literal で書くと本 test 自身が
    // runtime-portability の bun-runtime-spawn に刺さる (検出側 lint は正しく働いている)。
    name: `(b) common/run-bun.ts / ${["find", "Bun("].join("")}`,
    expected: [
      ".ut-tdd/bin/run-bun.ts: bun executable",
      ".ut-tdd/bin/run-bun.ts: findBun function",
      ".ut-tdd/bin/run-bun.ts: run-bun path",
    ],
    mutate: (root) => {
      const fn = ["find", "Bun"].join("");
      const launcher = `function ${fn}(): string { throw new Error("bun"); }
`;
      writeFileSync(join(root, ".ut-tdd", "bin", "run-bun.ts"), launcher, "utf8");
    },
  },
  {
    name: "(c) consumer CI の setup-bun / bun install / bun run",
    expected: [
      ".github/workflows/harness-check.yml: bun executable",
      ".github/workflows/harness-check.yml: setup-bun action",
    ],
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
    expected: [".claude/commands/ut-tdd-test.md: bun executable"],
    mutate: (root) => {
      const path = join(root, ".claude", "commands", "ut-tdd-test.md");
      writeFileSync(path, `${readFileSync(path, "utf8")}\nRun bun run lint.\n`, "utf8");
    },
  },
  {
    name: "(e) distribution.ts の package.json test script",
    expected: ["package.json: bun executable"],
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

  it.each(negativeCases)("U-PACKBUN-004 $name: the oracle turns Red", ({ mutate, expected }) => {
    const consumerRoot = generateConsumerTree();
    try {
      // baseline は 003 と同じく空でなければならない。ここが空でなければ以降の delta が
      // 意味を失うので先に固定する。
      expect(scanGeneratedConsumerTree(consumerRoot)).toEqual([]);
      mutate(consumerRoot);
      // 非空ではなく **この変異が生む finding 集合そのもの**を要求する。
      expect(scanGeneratedConsumerTree(consumerRoot)).toEqual([...expected].sort());
    } finally {
      rmSync(consumerRoot, { recursive: true, force: true });
    }
  });
});
