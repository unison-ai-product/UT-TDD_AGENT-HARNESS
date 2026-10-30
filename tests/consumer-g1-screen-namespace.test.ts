import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const readTrace = vi.hoisted(() => ({
  active: false,
  root: "",
  paths: [] as string[],
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const normalized = (path: unknown): string =>
    typeof path === "string" || Buffer.isBuffer(path) ? String(path).replaceAll("\\", "/") : "";
  return {
    ...actual,
    existsSync: (path: Parameters<typeof actual.existsSync>[0]) => {
      const resolved = normalized(path);
      if (readTrace.active && resolved.toLowerCase().startsWith(readTrace.root)) {
        readTrace.paths.push(resolved);
      }
      return actual.existsSync(path);
    },
    readFileSync: (...args: Parameters<typeof actual.readFileSync>) => {
      const resolved = normalized(args[0]);
      if (readTrace.active && resolved.toLowerCase().startsWith(readTrace.root)) {
        readTrace.paths.push(resolved);
      }
      return actual.readFileSync(...args);
    },
  };
});

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { evaluateStaticGate } from "../src/gate/static.ts";
import { analyzeConsumerG1Trace } from "../src/lint/consumer-trace.ts";
import {
  analyzeG1Trace,
  extractG1ScreenTrace,
  g1TraceOk,
  loadG1TraceDocs,
} from "../src/lint/g1-trace.ts";
import { lintPlanWithGate } from "../src/plan/lint.ts";

const TEMPLATE_SLOTS = [
  [
    "docs/templates/vmodel/L1-requirements.md",
    "docs/design/L1-requirements/functional-requirements.md",
  ],
  ["docs/templates/vmodel/L2-screen-list.md", "docs/design/L2-screen/screen-list.md"],
  [
    "docs/templates/vmodel/L3-functional-requirements.md",
    "docs/design/L3-functional/functional-requirements.md",
  ],
  [
    "docs/templates/vmodel/L12-acceptance-test-design.md",
    "docs/test-design/L12-acceptance-test-design.md",
  ],
] as const;

const CORE_G1_PATHS = [
  "docs/design/L1-requirements/functional-requirements.md",
  "docs/design/L2-screen/screen-list.md",
  "docs/design/L3-functional/functional-requirements.md",
] as const;

const temporaryRoots: string[] = [];

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-consumer-g1-screen-namespace-"));
  temporaryRoots.push(root);
  return root;
}

function writeFixtureDoc(root: string, relativePath: string, content: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

function readTemplate(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function appendRowsToTemplateTable(
  template: string,
  heading: string,
  rows: readonly string[],
): string {
  if (rows.length === 0) return template;
  const lines = template.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex < 0) throw new Error(`template heading not found: ${heading}`);
  const headerIndex = lines.findIndex(
    (line, index) => index > headingIndex && line.trimStart().startsWith("|"),
  );
  if (headerIndex < 0) throw new Error(`template table not found: ${heading}`);
  lines.splice(headerIndex + 2, 0, ...rows);
  return lines.join("\n");
}

function addLegacyHarnessDocs(root: string, includeFixedPrefixLabels = false): void {
  const business = [
    "---",
    "layer: L1",
    "status: confirmed",
    "---",
    "# Harness business requirements",
    "| BR-ID | 要求 |",
    "|---|---|",
    "| BR-01 | First requirement |",
    "| BR-02 | Second requirement |",
    "| BR-03 | Third requirement |",
  ].join("\n");
  const screenRows = Array.from({ length: 16 }, (_, index) => {
    const id = `SC-${String(index + 1).padStart(2, "0")}`;
    return `| ${id} | Screen ${id} |`;
  });
  screenRows.push("| SC-20 | Screen SC-20 |");
  const extraLabels = includeFixedPrefixLabels
    ? [
        "| PM-01 | Legacy project screen |",
        "| HM-01 | Legacy harness screen |",
        "| GD-01 | Legacy guide screen |",
      ]
    : [];
  const screen = [
    "---",
    "layer: L1",
    "sub_doc: screen",
    "status: confirmed",
    "---",
    "# Harness screen requirements",
    "## §1 画面一覧",
    "| 画面ID | 名称 |",
    "|---|---|",
    ...screenRows,
    ...extraLabels,
    "## §2 詳細",
    "### §5.1 業務要求トレース",
    "| 要求ID | 画面ID |",
    "|---|---|",
    "| BR-01 | SC-01〜16、SC-20 |",
    "### §5.3 機能要求トレース",
    "### §5.5 画面トレース",
    "| 画面ID | 業務要求 |",
    "|---|---|",
    "| **PM-01** | BR-01 |",
    "### §5.6 詳細",
  ].join("\n");
  writeFixtureDoc(root, "docs/design/L1-requirements/business-requirements.md", business);
  writeFixtureDoc(root, "docs/design/L1-requirements/screen-requirements.md", screen);
}

function consumerFixture(
  options: {
    requirementRows?: readonly string[];
    screenRows?: readonly string[];
    extraLegacyScreenLabels?: boolean;
  } = {},
): string {
  const root = fixtureRoot();
  const requirements = options.requirementRows ?? [
    "| REQ-01 | First requirement | details | Must | SC-01〜03, F-01 |",
    "| REQ-02 | Second requirement | details | Must | SC-02, F-02 |",
    "| REQ-03 | Third requirement | details | Must | SC-03, F-03 |",
  ];
  const screens = options.screenRows ?? [
    "| SC-01 | Screen 1 | overview | F-01 | user |",
    "| SC-02 | Screen 2 | overview | F-02 | user |",
    "| SC-03 | Screen 3 | overview | F-03 | user |",
  ];
  const l1Rows = appendRowsToTemplateTable(
    readTemplate(TEMPLATE_SLOTS[0][0]),
    "#### 第4章 機能要求一覧",
    requirements,
  );
  const l2Template = readTemplate(TEMPLATE_SLOTS[1][0]);
  let l2Rows = appendRowsToTemplateTable(l2Template, "#### 第4章 画面一覧", screens);
  if (options.extraLegacyScreenLabels) {
    l2Rows = l2Rows
      .replace(
        "### 構成元: diagrams.yaml `画面遷移図` (semantic item catalog `d_screen` skeleton)",
        "Legacy labels outside the required table: PM-01, HM-01, GD-01.\n\n### 構成元: diagrams.yaml `画面遷移図` (semantic item catalog `d_screen` skeleton)",
      )
      .replace(
        "| signup | SC-001 サインアップ |",
        "| signup | PM-01 Legacy project screen |\n| harness | HM-01 Legacy harness screen |\n| guide | GD-01 Legacy guide screen |\n| signup | SC-001 サインアップ |",
      );
  }
  const l3Rows = appendRowsToTemplateTable(
    readTemplate(TEMPLATE_SLOTS[2][0]),
    "##### 3-1 機能一覧",
    [
      "| F-01 | First function | details | user | REQ-01 |",
      "| F-02 | Second function | details | user | REQ-02 |",
      "| F-03 | Third function | details | user | REQ-03 |",
    ],
  );
  const l12Rows = appendRowsToTemplateTable(
    readTemplate(TEMPLATE_SLOTS[3][0]),
    "#### 第3章 テストケース一覧",
    [
      "| AT-01 | functional | First case | execute | pass | REQ-01, SC-01, F-01 |",
      "| AT-02 | functional | Second case | execute | pass | REQ-02, SC-02, F-02 |",
      "| AT-03 | functional | Third case | execute | pass | REQ-03, SC-03, F-03 |",
    ],
  );

  for (const [, targetPath] of TEMPLATE_SLOTS) {
    const source =
      targetPath === TEMPLATE_SLOTS[0][1]
        ? l1Rows
        : targetPath === TEMPLATE_SLOTS[1][1]
          ? l2Rows
          : targetPath === TEMPLATE_SLOTS[2][1]
            ? l3Rows
            : l12Rows;
    writeFixtureDoc(root, targetPath, source);
  }
  addLegacyHarnessDocs(root, options.extraLegacyScreenLabels);
  return root;
}

function observeFixture<T>(root: string, run: () => T): { result: T; paths: string[] } {
  readTrace.root = resolve(root).replaceAll("\\", "/").toLowerCase();
  readTrace.paths = [];
  readTrace.active = true;
  try {
    return { result: run(), paths: [...readTrace.paths] };
  } finally {
    readTrace.active = false;
    readTrace.root = "";
  }
}

function screenTraceCalls(paths: readonly string[]): string[] {
  return paths.filter((path) =>
    /(?:^|\/)docs\/design\/L1-requirements\/(business-requirements|screen-requirements)\.md$/i.test(
      path,
    ),
  );
}

function fixtureReader(root: string): {
  reader: (relativePath: string) => string | undefined;
  requestedPaths: string[];
} {
  const requestedPaths: string[] = [];
  return {
    reader: (relativePath) => {
      requestedPaths.push(relativePath);
      const path = join(root, relativePath);
      return existsSync(path) ? readFileSync(path, "utf8") : undefined;
    },
    requestedPaths,
  };
}

function pureAnalyze(root: string) {
  const fake = fixtureReader(root);
  return { result: analyzeConsumerG1Trace(fake.reader), requestedPaths: fake.requestedPaths };
}

function consumerTraceReasons(messages: readonly string[]): string[] {
  const message = messages.find((entry) =>
    entry.startsWith("g1-trace - violation (consumer column trace): "),
  );
  return message?.replace("g1-trace - violation (consumer column trace): ", "").split("; ") ?? [];
}

afterEach(() => {
  readTrace.active = false;
  readTrace.root = "";
  readTrace.paths = [];
});

describe("consumer G1 screen namespace (issue #1273)", () => {
  const fixtures = {
    fixture042: "",
    fixture043a: "",
    fixture043b: "",
    fixture044: { "SC-001": "", "sc-01": "", "ＳＣ-01": "" } as Record<
      "SC-001" | "sc-01" | "ＳＣ-01",
      string
    >,
    fixture044d: "",
  };
  const mismatchTokens = ["SC-001", "sc-01", "ＳＣ-01"] as const;
  beforeAll(() => {
    fixtures.fixture042 = consumerFixture();
    fixtures.fixture043a = consumerFixture({
      requirementRows: [
        "| REQ-01 | First requirement | details | Must | SC-01, F-01 |",
        "| REQ-02 | Second requirement | details | Must | SC-02, F-02 |",
        "| REQ-03 | Third requirement | details | Must | SC-03, F-03 |",
      ],
      screenRows: [],
    });
    fixtures.fixture043b = consumerFixture({
      requirementRows: [
        "| REQ-01 | First requirement | details | Must | PM-01, F-01 |",
        "| REQ-02 | Second requirement | details | Must | SC-02, F-02 |",
        "| REQ-03 | Third requirement | details | Must | SC-03, F-03 |",
      ],
      screenRows: [],
      extraLegacyScreenLabels: true,
    });
    for (const token of mismatchTokens) {
      fixtures.fixture044[token] = consumerFixture({
        requirementRows: [
          "| REQ-01 | First requirement | details | Must | SC-01〜03, F-01 |",
          `| REQ-02 | Second requirement | details | Must | ${token}, F-02 |`,
          "| REQ-03 | Third requirement | details | Must | SC-03, F-03 |",
        ],
      });
    }
    fixtures.fixture044d = consumerFixture({
      requirementRows: [
        "| REQ-01 | First requirement | details | Must | SC-01〜03, F-01 |",
        "| REQ-02 | Second requirement | details | Must | SC-02, F-02 |",
        "| REQ-03 | Third requirement | details | Must | ADM-01, F-03 |",
      ],
      screenRows: [
        "| SC-01 | Screen 1 | overview | F-01 | user |",
        "| SC-02 | Screen 2 | overview | F-02 | user |",
        "| SC-03 | Screen 3 | overview | F-03 | user |",
        "| ADM-01 | Admin screen | overview | F-01 | admin |",
      ],
    });
  });

  it("CANDIDATE-U-CTRACE-042: pure analyzer import and result shape are valid", () => {
    const { result } = pureAnalyze(fixtures.fixture042);

    expect(result.branch).toBe("consumer");
    expect(Array.isArray(result.violations)).toBe(true);
    expect(typeof result.ok).toBe("boolean");
    expect(Object.keys(result.totals).sort()).toEqual(["functions", "requirements", "screens"]);
    expect(Object.values(result.totals).every((count) => typeof count === "number")).toBe(true);
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages.every((message) => message.includes("consumer column trace"))).toBe(
      true,
    );
  });

  it.fails("CANDIDATE-U-CTRACE-042: pure result reports the fixture's three-by-three totals", () => {
    const { result } = pureAnalyze(fixtures.fixture042);
    expect(result.totals).toEqual({ requirements: 3, screens: 3, functions: 3 });
  });

  it.fails("CANDIDATE-U-CTRACE-042: pure result has the fixture's contract OK message", () => {
    const { result } = pureAnalyze(fixtures.fixture042);
    expect(result.messages).toEqual([
      "g1-trace - OK (consumer column trace: requirements=3, screens=3, functions=3)",
    ]);
  });

  it.fails("CANDIDATE-U-CTRACE-042: pure reader requests the three consumer core documents", () => {
    const { requestedPaths } = pureAnalyze(fixtures.fixture042);
    expect([...new Set(requestedPaths)].sort()).toEqual([...CORE_G1_PATHS].sort());
  });

  it("CANDIDATE-U-CTRACE-042: pure reader does not request the legacy business/screen documents", () => {
    const { requestedPaths } = pureAnalyze(fixtures.fixture042);
    expect(screenTraceCalls(requestedPaths)).toEqual([]);
  });

  it.fails("CANDIDATE-U-CTRACE-042: uses consumer columns and never reads harness business/screen docs", () => {
    const observed = observeFixture(fixtures.fixture042, () =>
      lintPlanWithGate(undefined, fixtures.fixture042, "G1-trace"),
    );
    const gate = evaluateStaticGate({ gate: "G1", repoRoot: fixtures.fixture042 });
    const expected =
      "g1-trace - OK (consumer column trace: requirements=3, screens=3, functions=3)";

    expect(observed.result.ok).toBe(true);
    const lintTraceMessages = observed.result.messages.filter((message) =>
      message.startsWith("g1-trace - OK (consumer column trace:"),
    );
    const gateTraceMessages = gate.messages.filter((message) =>
      message.startsWith("g1-trace - OK (consumer column trace:"),
    );
    expect(lintTraceMessages).toEqual([expected]);
    expect(gateTraceMessages).toEqual([expected]);
    expect(observed.result.messages.join("\n")).not.toMatch(/orphan(Business|Screen|P0Fr)/);
    expect(gate.messages.join("\n")).not.toMatch(/orphan(Business|Screen|P0Fr)/);
    expect(screenTraceCalls(observed.paths)).toEqual([]);
  });

  it.fails("CANDIDATE-U-CTRACE-043(a): empty L2 declaration does not fall back to harness screen docs", () => {
    const result = lintPlanWithGate(undefined, fixtures.fixture043a, "G1-trace");
    const reasons = consumerTraceReasons(result.messages);

    expect(result.ok).toBe(false);
    expect(reasons).toContain("empty_required_set:DOC-L2-SCREEN:画面ID");
    expect(reasons).toContain("dangling_reference:DOC-L1-REQUIREMENTS:REQ-01:展開先:SC-01");
    expect(result.messages.join("\n")).not.toContain("required docs could not be read");
  });

  it.fails("CANDIDATE-U-CTRACE-043(a): pure result counts zero declared screens", () => {
    const { result } = pureAnalyze(fixtures.fixture043a);
    expect(result.totals.screens).toBe(0);
  });

  it.fails("CANDIDATE-U-CTRACE-043(a): pure result reports the empty screen declaration", () => {
    const { result } = pureAnalyze(fixtures.fixture043a);
    expect(result.violations).toContain("empty_required_set:DOC-L2-SCREEN:画面ID");
  });

  it.fails("CANDIDATE-U-CTRACE-043(a): pure result keeps the SC-01 dangling reference", () => {
    const { result } = pureAnalyze(fixtures.fixture043a);
    expect(result.violations).toContain(
      "dangling_reference:DOC-L1-REQUIREMENTS:REQ-01:展開先:SC-01",
    );
  });

  it.fails("CANDIDATE-U-CTRACE-043(b): empty declaration ignores fixed-prefix labels outside the L2 table", () => {
    const result = lintPlanWithGate(undefined, fixtures.fixture043b, "G1-trace");
    const reasons = consumerTraceReasons(result.messages);

    expect(result.ok).toBe(false);
    expect(reasons).toContain("empty_required_set:DOC-L2-SCREEN:画面ID");
    expect(reasons).toContain("dangling_reference:DOC-L1-REQUIREMENTS:REQ-01:展開先:PM-01");
    expect(result.messages.join("\n")).not.toContain("required docs could not be read");
  });

  it.fails("CANDIDATE-U-CTRACE-043(b): pure result counts zero declared screens", () => {
    const { result } = pureAnalyze(fixtures.fixture043b);
    expect(result.totals.screens).toBe(0);
  });

  it.fails("CANDIDATE-U-CTRACE-043(b): pure result reports the empty screen declaration", () => {
    const { result } = pureAnalyze(fixtures.fixture043b);
    expect(result.violations).toContain("empty_required_set:DOC-L2-SCREEN:画面ID");
  });

  it.fails("CANDIDATE-U-CTRACE-043(b): pure result keeps the PM-01 dangling reference", () => {
    const { result } = pureAnalyze(fixtures.fixture043b);
    expect(result.violations).toContain(
      "dangling_reference:DOC-L1-REQUIREMENTS:REQ-01:展開先:PM-01",
    );
  });

  it.fails("CANDIDATE-U-CTRACE-044(a): SC-001 is not equal to declared SC-01", () => {
    const result = lintPlanWithGate(undefined, fixtures.fixture044["SC-001"], "G1-trace");
    const reasons = consumerTraceReasons(result.messages);
    expect(result.ok).toBe(false);
    expect(reasons).toContain("dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:SC-001");
  });

  it.fails("CANDIDATE-U-CTRACE-044(a): pure result rejects SC-001 by exact equality", () => {
    const { result } = pureAnalyze(fixtures.fixture044["SC-001"]);
    expect(result.violations).toContain(
      "dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:SC-001",
    );
  });

  it.fails("CANDIDATE-U-CTRACE-044(b): sc-01 is not equal to declared SC-01", () => {
    const result = lintPlanWithGate(undefined, fixtures.fixture044["sc-01"], "G1-trace");
    const reasons = consumerTraceReasons(result.messages);
    expect(result.ok).toBe(false);
    expect(reasons).toContain("dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:sc-01");
  });

  it.fails("CANDIDATE-U-CTRACE-044(b): pure result rejects sc-01 by exact equality", () => {
    const { result } = pureAnalyze(fixtures.fixture044["sc-01"]);
    expect(result.violations).toContain(
      "dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:sc-01",
    );
  });

  it.fails("CANDIDATE-U-CTRACE-044(c): fullwidth ＳＣ-01 is not equal to declared SC-01", () => {
    const result = lintPlanWithGate(undefined, fixtures.fixture044["ＳＣ-01"], "G1-trace");
    const reasons = consumerTraceReasons(result.messages);
    expect(result.ok).toBe(false);
    expect(reasons).toContain("dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:ＳＣ-01");
  });

  it.fails("CANDIDATE-U-CTRACE-044(c): pure result rejects fullwidth ＳＣ-01 by exact equality", () => {
    const { result } = pureAnalyze(fixtures.fixture044["ＳＣ-01"]);
    expect(result.violations).toContain(
      "dangling_reference:DOC-L1-REQUIREMENTS:REQ-02:展開先:ＳＣ-01",
    );
  });

  it.fails("CANDIDATE-U-CTRACE-044(a-c): pure results retain the three declared screens", () => {
    const screenCounts = mismatchTokens.map(
      (token) => pureAnalyze(fixtures.fixture044[token]).result.totals.screens,
    );
    expect(screenCounts).toEqual([3, 3, 3]);
  });

  it.fails("CANDIDATE-U-CTRACE-044(d): permits a second declared screen prefix", () => {
    const result = lintPlanWithGate(undefined, fixtures.fixture044d, "G1-trace");

    expect(result.ok).toBe(true);
    expect(
      result.messages.filter((message) =>
        message.startsWith("g1-trace - OK (consumer column trace:"),
      ),
    ).toEqual(["g1-trace - OK (consumer column trace: requirements=3, screens=4, functions=3)"]);
  });

  it.fails("CANDIDATE-U-CTRACE-044(d): pure result includes the additional declared screen", () => {
    const { result } = pureAnalyze(fixtures.fixture044d);
    expect(result.totals.screens).toBe(4);
  });

  it("CANDIDATE-U-CTRACE-045: keeps the harness screen prefix fixed, including the direct trace map", () => {
    const root = fixtureRoot();
    writeFixtureDoc(
      root,
      "docs/design/harness/L1-requirements/business-requirements.md",
      "| BR-01 | Business requirement |\n",
    );
    writeFixtureDoc(
      root,
      "docs/design/harness/L1-requirements/functional-requirements.md",
      "| **FR-L1-01** | P0 |\n",
    );
    const baseScreen = [
      "## §1 画面一覧",
      "| PM-01 | Main screen |",
      "## §2 画面詳細",
      "### §5.1 BR/UX to screen trace",
      "| BR-01 | PM-01 |",
      "### §5.3 Functional trace",
      "| **FR-L1-01** | PM-01 |",
      "### §5.5 Screen trace",
      "| **PM-01** | BR-01 / FR-L1-01 |",
      "### §5.6 Details",
    ].join("\n");
    writeFixtureDoc(root, "docs/design/harness/L1-requirements/screen-requirements.md", baseScreen);

    const loadedBase = loadG1TraceDocs(root);
    const baseResult = analyzeG1Trace(loadedBase);
    const screenWithCustomId = baseScreen
      .replace(
        "## §2 画面詳細",
        "| SC-99 | Custom screen | Custom overview | FR-L1-01 | user |\n\n## §2 画面詳細",
      )
      .replace(
        "| **PM-01** | BR-01 / FR-L1-01 |",
        "| **PM-01** | BR-01 / FR-L1-01 |\n| **SC-99** | BR-01 | FR-L1-01 |",
      );
    const loadedWithCustomId = loadG1TraceDocs(root);
    const result = analyzeG1Trace({ ...loadedWithCustomId, screen: screenWithCustomId });
    const trace = extractG1ScreenTrace(screenWithCustomId);
    const screenBusinessTraceOnlyCustomId = screenWithCustomId.replace(
      "| BR-01 | PM-01 |",
      "| BR-01 | SC-99 |",
    );
    const brokenBusinessTrace = analyzeG1Trace({
      ...loadedWithCustomId,
      screen: screenBusinessTraceOnlyCustomId,
    });

    expect(g1TraceOk(baseResult)).toBe(true);
    expect(baseResult.totals.screen).toBe(1);
    expect(baseResult.orphanBusiness).toEqual([]);
    expect(baseResult.orphanScreen).toEqual([]);
    expect(baseResult.orphanP0Fr).toEqual([]);
    expect(g1TraceOk(result)).toBe(true);
    expect(result.totals.screen).toBe(baseResult.totals.screen);
    expect(result.orphanScreen).toEqual([]);
    expect(g1TraceOk(brokenBusinessTrace)).toBe(false);
    expect(brokenBusinessTrace.orphanBusiness).toContain("BR-01");
    expect(trace.has("SC-99")).toBe(false);
    expect([...trace.keys()]).toEqual(["PM-01"]);
    expect([...trace.keys()].every((id) => /^(PM|HM|GD)-\d{2}$/.test(id))).toBe(true);
  });
});

afterAll(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});
