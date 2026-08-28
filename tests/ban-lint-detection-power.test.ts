import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeGithubCiPolicy } from "../src/lint/github-ci-policy.ts";
import { analyzeRuleDrift } from "../src/lint/rule-drift.ts";
import { analyzeRuntimePortability } from "../src/lint/runtime-portability.ts";
import { analyzeToolchainPin } from "../src/lint/toolchain-pin.ts";
import { BUILTIN_GITHUB_TEMPLATES } from "../src/setup/templates.ts";

// U-PACKBUN-006 (PLAN-L7-522 §3.3): BAN 検出側 lint の「検出能力」を behavioral に測る。
// 条文の逐語一致では測らない。§3.3 が freeze した 16 サンプルを各 lint へ入力し、
// 凍結した期待 violation と一致することを要求する。分岐削除・同数のままの matcher 緩和・
// rule 削除・allowlist への path 追加・pin 引き上げは、いずれも対応サンプルが violation を
// 落とすので Red になる。
//
// Bun 到達形は literal で書くと本 test 自身が runtime-portability に刺さるため、
// 分割して組み立てる (repo 既存の LEGACY_RUNTIME_NAME と同じ手法)。
const B = ["b", "un"].join("");
const BU = ["B", "un"].join("");

// allowlist 非収載 path を使う。収載 path は pin により debt が許容されてしまう。
const PROBE = "src/__packbun_probe__.ts";

type PortabilitySample = { readonly id: string; readonly rule: string; readonly text: string };

const PORTABILITY_SAMPLES: readonly PortabilitySample[] = [
  { id: "1", rule: `${B}-runtime-spawn`, text: `spawnSync("${B}", args);` },
  { id: "2", rule: `${B}-runtime-spawn`, text: `const p = find${BU}();` },
  { id: "3", rule: `${B}-runtime-spawn`, text: `const exe = env.EXE ?? "${B}";` },
  { id: "4", rule: `${B}-runtime-spawn`, text: `spawn(comspec, ["/c", "${B}", "x"]);` },
  { id: "5", rule: `${B}-runtime-spawn`, text: `const cmd = ["${B}", ["run"]];` },
  { id: "6", rule: `${B}-runtime-spawn`, text: `const sh = "exec ${B} run test";` },
  { id: "7", rule: `${B}-module-import`, text: `import { Database } from "${B}:sqlite";` },
  { id: "8", rule: `${B}-global-reference`, text: `${BU}.write(path, body);` },
  { id: "9", rule: `${B}-global-reference`, text: `if (typeof ${BU} !== "undefined") return 1;` },
  {
    id: "10",
    rule: `${B}-global-reference`,
    text: `const r = (globalThis as { ${BU}?: unknown }).${BU};`,
  },
  { id: "11", rule: `${B}-global-reference`, text: `if (globalThis.${BU}) return 1;` },
  { id: "12", rule: `${B}-global-reference`, text: `if (process.versions.${B}) return 1;` },
];

// 実 Pack template に違反 step を 1 本挿す。合成 yaml だと workflow shape 検査が
// `malformed_workflow_shape` で先に落ちて deny rule まで到達しない。
const packWorkflow = (step: string): string => {
  const template = BUILTIN_GITHUB_TEMPLATES["common/pack-harness-check.yml"];
  const marker = "    steps:\n";
  const at = template.indexOf(marker);
  expect(at).toBeGreaterThan(-1);
  const cut = at + marker.length;
  return `${template.slice(0, cut)}      - run: ${step}\n${template.slice(cut)}`;
};

describe("U-PACKBUN-006: BAN lint detection power (PLAN-L7-522 §3.3)", () => {
  it.each(PORTABILITY_SAMPLES)("sample $id still fail-closes as $rule in runtime-portability", ({
    rule,
    text,
  }) => {
    const result = analyzeRuntimePortability([{ path: PROBE, text }]);
    expect(result.violations.map((violation) => violation.rule)).toContain(rule);
  });

  // サンプル 13 / 13b は github-ci-policy の別 rule であり、片方では他方を刺激できない。
  it("sample 13 still fail-closes as forbidden_raw_vitest", () => {
    const result = analyzeGithubCiPolicy([
      {
        file: ".github/workflows/pack-harness-check.yml",
        content: packWorkflow("vitest run"),
        profile: "pack",
        role: "pack_template",
      },
    ]);
    expect(result.violations.map((violation) => violation.reason)).toContain(
      "forbidden_raw_vitest",
    );
  });

  it("sample 13b still fail-closes as forbidden_source_full_tests", () => {
    const result = analyzeGithubCiPolicy([
      {
        file: ".github/workflows/pack-harness-check.yml",
        content: packWorkflow(`${B} run test`),
        profile: "pack",
        role: "pack_template",
      },
    ]);
    expect(result.violations.map((violation) => violation.reason)).toContain(
      "forbidden_source_full_tests",
    );
  });

  it("sample 14 still fail-closes the rule-drift bun execution form marker", () => {
    const adapter = (extra: string): string =>
      ["# Adapter", "", "## Hooks", "", extra, ""].join("\n");
    const clean = analyzeRuleDrift({
      agents: adapter("- `node .ut-tdd/bin/ut-tdd.mjs hook work-guard`"),
      claudeProject: adapter("- `node .ut-tdd/bin/ut-tdd.mjs hook work-guard`"),
      claudeRuntime: adapter("- `node .ut-tdd/bin/ut-tdd.mjs hook work-guard`"),
    });
    const dirty = analyzeRuleDrift({
      agents: adapter(`- run \`${B} .ut-tdd/bin/ut-tdd.mjs hook work-guard\``),
      claudeProject: adapter("- `node .ut-tdd/bin/ut-tdd.mjs hook work-guard`"),
      claudeRuntime: adapter("- `node .ut-tdd/bin/ut-tdd.mjs hook work-guard`"),
    });
    // 実行指示の Bun 形が増えたぶんだけ forbidden marker が増えることを要求する。
    expect(dirty.forbiddenMarkers.length).toBeGreaterThan(clean.forbiddenMarkers.length);
    expect(dirty.forbiddenMarkers.map((entry) => entry.marker)).toContain(`${B} execution form`);
  });

  it("sample 15 still fail-closes as bun-direct-parity-drift", () => {
    const packageJson = JSON.stringify({
      dependencies: { "some-pkg": "1.0.0" },
    });
    const lock = JSON.stringify({ workspaces: { "": { dependencies: {} } } });
    const result = analyzeToolchainPin({ packageJson, bunLock: lock });
    expect(result.violations.map((violation) => violation.rule)).toContain(
      `${B}-direct-parity-drift`,
    );
  });

  // §3.3 の不変条件 (i): source の `build` script は本 slice で不変。
  // 生成物からの除去 (§2.1.1) と source の維持 (PLAN-L6-93 §5.2) を取り違えないための固定。
  it("keeps the source package.json build script untouched", () => {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(parsed.scripts.build).toBe(`${B} build src/cli.ts --compile --outfile dist/ut-tdd`);
  });
});

// §3.3 の構造的補助 (behavioral 検査の代替ではない):
// deny rule の本数 / debt allowlist の path 集合 / pin 値を凍結する。protected file を
// 変更せずに測るため、lint の source text を読んで数える。
describe("U-PACKBUN-006 structural supplements (PLAN-L7-522 §3.3)", () => {
  const lintSource = (file: string): string =>
    readFileSync(join(process.cwd(), "src", "lint", file), "utf8");

  it("freezes the github-ci-policy Pack deny rule set", () => {
    const source = lintSource("github-ci-policy.ts");
    const reasons = [...source.matchAll(/reason: "(forbidden_[a-z_]+)"/g)].map((m) => m[1]);
    expect(new Set(reasons)).toEqual(
      new Set([
        "forbidden_full_doctor",
        "forbidden_job_level_lane_skip",
        "forbidden_lane_skip_step",
        "forbidden_pull_request_input_execution",
        "forbidden_raw_vitest",
        "forbidden_source_full_tests",
      ]),
    );
  });

  it("freezes the runtime-portability Bun debt allowlist paths and pins", () => {
    const source = lintSource("runtime-portability.ts");
    const block = (name: string): ReadonlyArray<readonly [string, number]> => {
      const start = source.indexOf(`const ${name} = new Map<string, number>([`);
      expect(start).toBeGreaterThan(-1);
      const end = source.indexOf("]);", start);
      return [...source.slice(start, end).matchAll(/\["([^"]+)",\s*(\d+)\]/g)].map(
        (m) => [m[1], Number(m[2])] as const,
      );
    };
    expect(Object.fromEntries(block(`${BU.toUpperCase()}_SPAWN_DEBT_ALLOWLIST`))).toEqual({
      "src/cli/distribution.ts": 2,
      "scripts/run-vitest-snapshot.ts": 1,
      "tests/distribution-acceptance.test.ts": 2,
      "tests/dependency-drift.test.ts": 1,
      "tests/runtime-portability.test.ts": 11,
      "tests/doctor-setup-smoke.test.ts": 1,
      "tests/doctor.test.ts": 1,
      "src/lint/runtime-portability.ts": 4,
    });
    expect(Object.fromEntries(block(`${BU.toUpperCase()}_IMPORT_DEBT_ALLOWLIST`))).toEqual({
      "src/state-db/index.ts": 2,
      "tests/runtime-portability.test.ts": 5,
    });
  });
});
