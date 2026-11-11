import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { removeTestTree } from "./support/temp-tree.ts";

const REPO_ROOT = process.cwd();
const CLI_PATH = join(REPO_ROOT, "src", "cli.ts");
const FIXTURES: string[] = [];
const CLAUDE_VERSION_FLOOR = "2.1.295";

interface PreparedClaudeVersionCases {
  cases001: { latest: string; result: HookResult }[];
  cases002: { name: string; result: HookResult }[];
  outputs003: HookResult[];
  case004: {
    floor: string;
    adapterDoc: string;
    generatedAdapter: string;
    belowOk: boolean;
    belowWarns: boolean;
    belowMessages: string;
    atOrAboveOk: boolean;
    atOrAboveWarns: boolean;
  };
  case005: {
    evaluated: string;
    doctorOk: boolean;
    doctorWarns: boolean;
    generatedAdapter: string;
    literalLocations: { path: string; count: number }[];
  };
}

let prepared: PreparedClaudeVersionCases;

interface HookResult {
  status: number | null;
  stdout: string;
  error?: Error;
}

type RuntimeSignals = Partial<Record<"CLAUDECODE" | "CODEX_SANDBOX" | "CODEX_HOME", string>>;
interface RuntimeCase007 {
  suffix: string;
  sessionId: string;
  result: HookResult;
  expectsWarning: boolean;
}

let runtimeCases007: RuntimeCase007[] = [];

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ut-tdd-ccver-"));
  FIXTURES.push(root);
  return root;
}

function writeTranscript(root: string, ...versions: string[]): string {
  const path = join(root, "transcript.jsonl");
  writeFileSync(
    path,
    `${versions.map((version) => JSON.stringify({ type: "user", version })).join("\n")}\n`,
    "utf8",
  );
  return path;
}

function writeTranscriptRows(root: string, rows: Record<string, unknown>[]): string {
  const path = join(root, "transcript.jsonl");
  writeFileSync(path, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  return path;
}

function invokePostToolUse(
  root: string,
  input: Record<string, unknown>,
  runtimeSignals: RuntimeSignals = { CLAUDECODE: "1" },
): HookResult {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: root };
  delete env.CLAUDECODE;
  delete env.CODEX_SANDBOX;
  delete env.CODEX_HOME;
  Object.assign(env, runtimeSignals);
  const result = spawnSync(process.execPath, [CLI_PATH, "hook", "post-tool-use"], {
    cwd: root,
    env,
    encoding: "utf8",
    input: JSON.stringify(input),
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    ...(result.error ? { error: result.error } : {}),
  };
}

function systemMessage(output: string): string | undefined {
  try {
    const parsed = JSON.parse(output) as { systemMessage?: unknown };
    return typeof parsed.systemMessage === "string" ? parsed.systemMessage : undefined;
  } catch {
    return undefined;
  }
}

function sourceTypeScriptFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

afterAll(() => {
  for (const fixture of FIXTURES.splice(0)) removeTestTree(fixture);
});

describe.sequential("Claude Code version floor warning (Issue #1561)", () => {
  beforeAll(async () => {
    const cases001 = [
      { previous: "2.1.318", latest: "2.1.293" },
      { previous: "2.1.293", latest: "2.1.295" },
      { previous: "2.1.293", latest: "2.1.318" },
      { previous: "2.1.293", latest: "2.2.0" },
      { previous: "2.1.293", latest: "10.0.0" },
    ].map(({ previous, latest }, index) => {
      const root = createFixture();
      const transcriptPath = writeTranscript(root, previous, latest);
      return {
        latest,
        result: invokePostToolUse(root, {
          session_id: `ccver-001-${index}`,
          transcript_path: transcriptPath,
          hook_event_name: "PostToolUse",
        }),
      };
    });

    const cases002Inputs: {
      name: string;
      input: (root: string) => Record<string, unknown>;
    }[] = [
      {
        name: "missing transcript_path",
        input: () => ({ session_id: "ccver-002-a", hook_event_name: "PostToolUse" }),
      },
      {
        name: "missing transcript file",
        input: (root: string) => ({
          session_id: "ccver-002-b",
          hook_event_name: "PostToolUse",
          transcript_path: join(root, "missing.jsonl"),
        }),
      },
      {
        name: "message has no version field",
        input: (root: string) => ({
          session_id: "ccver-002-c",
          hook_event_name: "PostToolUse",
          transcript_path: writeTranscriptRows(root, [{ type: "user", message: "no version" }]),
        }),
      },
      {
        name: "message has malformed version",
        input: (root: string) => ({
          session_id: "ccver-002-d",
          hook_event_name: "PostToolUse",
          transcript_path: writeTranscript(root, "x.y"),
        }),
      },
    ];
    const cases002 = cases002Inputs.map(({ name, input }) => {
      const root = createFixture();
      return {
        name,
        result: invokePostToolUse(root, input(root)),
      };
    });

    const root003 = createFixture();
    const transcriptPath003 = writeTranscript(root003, "2.1.293");
    const sessionIds003 = ["ccver-003-a", "ccver-003-a", "ccver-003-a", "ccver-003-b"];
    const outputs003 = sessionIds003.map((session_id) =>
      invokePostToolUse(root003, {
        session_id,
        transcript_path: transcriptPath003,
        hook_event_name: "PostToolUse",
      }),
    );

    const [
      { CLAUDE_CODE_VERSION_FLOOR: floor },
      { checkClaudeVersionFloor },
      { BUILTIN_GITHUB_TEMPLATES },
    ] = await Promise.all([
      import("../src/runtime/claude-version-floor.ts"),
      import("../src/doctor/claude-version-floor-check.ts"),
      import("../src/setup/templates.ts"),
    ]);
    const below = checkClaudeVersionFloor({ readPathClaudeVersion: () => "2.1.293" });
    const atOrAbove = checkClaudeVersionFloor({ readPathClaudeVersion: () => "2.1.318" });
    const case004 = {
      floor,
      adapterDoc: readFileSync(
        join(REPO_ROOT, "docs", "templates", "adapter", "CLAUDE.md"),
        "utf8",
      ),
      generatedAdapter: BUILTIN_GITHUB_TEMPLATES["adapter/CLAUDE.md"] ?? "",
      belowOk: below.ok,
      belowWarns: below.messages.some((message) => /warn|⚠/i.test(message)),
      belowMessages: below.messages.join("\n"),
      atOrAboveOk: atOrAbove.ok,
      atOrAboveWarns: atOrAbove.messages.some((message) => /warn|⚠/i.test(message)),
    };

    vi.resetModules();
    vi.doMock("../src/runtime/claude-version-floor.ts", () => ({
      CLAUDE_CODE_VERSION_FLOOR: "9.9.9",
    }));
    let case005: PreparedClaudeVersionCases["case005"] | undefined;
    try {
      const [comparison, doctor, setup] = await Promise.all([
        import("../src/runtime/claude-version-check.ts"),
        import("../src/doctor/claude-version-floor-check.ts"),
        import("../src/setup/templates.ts"),
      ]);
      const doctorResult = doctor.checkClaudeVersionFloor({
        readPathClaudeVersion: () => "2.1.318",
      });
      const sourceFiles = sourceTypeScriptFiles(join(REPO_ROOT, "src"));
      const literalLocations = sourceFiles.flatMap((path) => {
        const matches = readFileSync(path, "utf8").match(/2\.1\.295/g) ?? [];
        return matches.length === 0 ? [] : [{ path, count: matches.length }];
      });
      case005 = {
        evaluated: comparison.evaluateClaudeVersion("2.1.318"),
        doctorOk: doctorResult.ok,
        doctorWarns: doctorResult.messages.some((message) => /warn|⚠/i.test(message)),
        generatedAdapter: setup.BUILTIN_GITHUB_TEMPLATES["adapter/CLAUDE.md"] ?? "",
        literalLocations,
      };
    } finally {
      vi.doUnmock("../src/runtime/claude-version-floor.ts");
      vi.resetModules();
    }

    if (!case005) throw new Error("case 005 precondition did not complete");
    prepared = { cases001, cases002, outputs003, case004, case005 };
    for (const [label, result] of [
      ...cases001.map(({ result }, index) => [`001 case ${index}`, result] as const),
      ...cases002.map(({ name, result }) => [`002 ${name}`, result] as const),
      ...outputs003.map((result, index) => [`003 call ${index}`, result] as const),
    ]) {
      expect(result.error, `${label}: CLI process must start`).toBeUndefined();
      expect(result.status, `${label}: CLI process must exit normally`).toBe(0);
    }
  }, 300_000);

  it("Red fixture precondition: version-floor seams and contract inputs are present", async () => {
    const floor = await import("../src/runtime/claude-version-floor.ts");
    const comparison = await import("../src/runtime/claude-version-check.ts");
    const doctor = await import("../src/doctor/claude-version-floor-check.ts");
    const setup = await import("../src/setup/templates.ts");

    expect(floor.CLAUDE_CODE_VERSION_FLOOR).toBe("2.1.295");
    expect(typeof comparison.evaluateClaudeVersion).toBe("function");
    expect(typeof comparison.readTranscriptClaudeVersion).toBe("function");
    expect(typeof doctor.checkClaudeVersionFloor).toBe("function");
    expect(existsSync(join(REPO_ROOT, "docs", "templates", "adapter", "CLAUDE.md"))).toBe(true);
    expect(typeof setup.BUILTIN_GITHUB_TEMPLATES["adapter/CLAUDE.md"]).toBe("string");
  });

  it("Red fixture precondition: the shared-floor mock resolves through all consumer seams", async () => {
    vi.resetModules();
    vi.doMock("../src/runtime/claude-version-floor.ts", () => ({
      CLAUDE_CODE_VERSION_FLOOR: "9.9.9",
    }));
    try {
      const [comparison, doctor, setup] = await Promise.all([
        import("../src/runtime/claude-version-check.ts"),
        import("../src/doctor/claude-version-floor-check.ts"),
        import("../src/setup/templates.ts"),
      ]);
      expect(typeof comparison.evaluateClaudeVersion).toBe("function");
      expect(typeof doctor.checkClaudeVersionFloor).toBe("function");
      expect(typeof setup.BUILTIN_GITHUB_TEMPLATES["adapter/CLAUDE.md"]).toBe("string");
    } finally {
      vi.doUnmock("../src/runtime/claude-version-floor.ts");
      vi.resetModules();
    }
  });

  it("Red fixture precondition: the real PostToolUse CLI runs in an isolated temp repository", () => {
    expect(existsSync(CLI_PATH)).toBe(true);

    const root = createFixture();
    const transcriptPath = writeTranscript(root, "2.1.318");
    const result = invokePostToolUse(root, {
      session_id: "ccver-precondition",
      transcript_path: transcriptPath,
      hook_event_name: "PostToolUse",
    });

    expect(existsSync(transcriptPath)).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(typeof result.stdout).toBe("string");
    const eventPath = join(root, ".ut-tdd", "logs", "session", "ccver-precondition.jsonl");
    expect(existsSync(eventPath)).toBe(true);
    expect(readFileSync(eventPath, "utf8")).toContain('"session_id":"ccver-precondition"');
  });

  it.fails("U-CCVER-001: warns only below the floor using one hook JSON object", () => {
    const violations: string[] = [];
    for (const [index, { latest, result }] of prepared.cases001.entries()) {
      if (index === 0) {
        const warning = systemMessage(result.stdout);
        if (
          typeof warning !== "string" ||
          !warning.includes(latest) ||
          !warning.includes(CLAUDE_VERSION_FLOOR) ||
          !/guard/i.test(warning) ||
          !/onFailure/i.test(warning) ||
          !/update|更新/i.test(warning) ||
          result.stdout.includes("session-log: post-tool-use")
        ) {
          violations.push(`${latest}: expected a single stdout hook warning JSON object`);
        }
      } else {
        const normalLine = `session-log: post-tool-use ccver-001-${index}\n`;
        if (systemMessage(result.stdout) || result.stdout !== normalLine) {
          violations.push(`${latest}: expected normal session-log output only`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it.fails("U-CCVER-002: reports when the running Claude version cannot be read", () => {
    const violations: string[] = [];
    for (const { name, result } of prepared.cases002) {
      if (
        !systemMessage(result.stdout)?.includes("Claude Code の版を確かめられない") ||
        result.stdout.includes("session-log: post-tool-use")
      ) {
        violations.push(`${name}: expected the unreadable-version warning JSON object`);
      }
    }
    expect(violations).toEqual([]);
  });

  it.fails("U-CCVER-003: emits the warning once per session", () => {
    const sessionIds = ["ccver-003-a", "ccver-003-a", "ccver-003-a", "ccver-003-b"];
    const violations: string[] = [];
    const outputs = prepared.outputs003;
    const warningsBySession = new Map<string, number>();
    sessionIds.forEach((sessionId, index) => {
      const warning = systemMessage(outputs[index]?.stdout ?? "");
      if (warning) warningsBySession.set(sessionId, (warningsBySession.get(sessionId) ?? 0) + 1);
      if (
        index > 0 &&
        index < 3 &&
        outputs[index]?.stdout !== `session-log: post-tool-use ${sessionId}\n`
      ) {
        violations.push(`repeat call ${index}: expected normal output after the first warning`);
      }
    });
    if (warningsBySession.get("ccver-003-a") !== 1 || warningsBySession.get("ccver-003-b") !== 1) {
      violations.push("each session must receive exactly one warning");
    }
    expect(violations).toEqual([]);
  });

  it.fails("U-CCVER-004: keeps the floor consistent and doctor advisory", async () => {
    const violations: string[] = [];
    if (!prepared.case004.adapterDoc.includes(prepared.case004.floor)) {
      violations.push("adapter doc must contain the shared floor");
    }
    if (!prepared.case004.generatedAdapter.includes(prepared.case004.floor)) {
      violations.push("generated adapter must contain the shared floor");
    }
    if (!prepared.case004.belowOk) {
      violations.push("below-floor doctor result must remain advisory");
    }
    if (!prepared.case004.belowWarns) violations.push("below-floor doctor result must warn");
    if (!prepared.case004.belowMessages.includes("PATH の claude の版")) {
      violations.push("doctor warning must identify the PATH claude version");
    }
    if (!prepared.case004.atOrAboveOk) {
      violations.push("at-or-above doctor result must remain advisory");
    }
    if (prepared.case004.atOrAboveWarns) violations.push("at-or-above doctor result must not warn");
    expect(violations).toEqual([]);
  });

  it.fails("U-CCVER-005: makes the shared floor authoritative across seams", async () => {
    const violations: string[] = [];
    if (prepared.case005.evaluated !== "below") {
      violations.push("comparison must follow the mocked shared floor");
    }
    if (!prepared.case005.doctorOk) violations.push("doctor result must remain advisory");
    if (!prepared.case005.doctorWarns) {
      violations.push("doctor must warn against the mocked shared floor");
    }
    if (!prepared.case005.generatedAdapter.includes("9.9.9")) {
      violations.push("generated adapter must follow the mocked shared floor");
    }
    const expectedLiteralLocations = [
      { path: join(REPO_ROOT, "src", "runtime", "claude-version-floor.ts"), count: 1 },
    ];
    if (
      JSON.stringify(prepared.case005.literalLocations) !== JSON.stringify(expectedLiteralLocations)
    ) {
      violations.push("the literal floor must appear only in the authoritative source module");
    }
    expect(violations).toEqual([]);
  });

  it("U-CCVER-007 prerequisite: all runtime combinations start and exit normally", () => {
    const cases: {
      suffix: string;
      runtimeSignals: RuntimeSignals;
      expectsWarning: boolean;
    }[] = [
      { suffix: "a", runtimeSignals: { CLAUDECODE: "1" }, expectsWarning: true },
      {
        suffix: "b",
        runtimeSignals: { CLAUDECODE: "1", CODEX_SANDBOX: "1" },
        expectsWarning: false,
      },
      { suffix: "c", runtimeSignals: { CODEX_SANDBOX: "1" }, expectsWarning: false },
      { suffix: "d", runtimeSignals: {}, expectsWarning: false },
    ];
    runtimeCases007 = cases.map(({ suffix, runtimeSignals, expectsWarning }) => {
      const root = createFixture();
      const sessionId = `ccver-007-${suffix}`;
      const result = invokePostToolUse(
        root,
        { session_id: sessionId, hook_event_name: "PostToolUse" },
        runtimeSignals,
      );
      return { suffix, sessionId, result, expectsWarning };
    });
    expect(runtimeCases007).toHaveLength(4);
    const failures = runtimeCases007.flatMap(({ suffix, result }) => [
      ...(result.error ? [`${suffix}: CLI process did not start`] : []),
      ...(result.status !== 0 ? [`${suffix}: CLI process did not exit normally`] : []),
    ]);
    expect(failures).toEqual([]);
  });

  it.fails("U-CCVER-007: warns only in a Claude runtime", () => {
    const violations: string[] = [];
    for (const { suffix, sessionId, result, expectsWarning } of runtimeCases007) {
      if (expectsWarning) {
        let output: Record<string, unknown> | undefined;
        try {
          output = JSON.parse(result.stdout) as Record<string, unknown>;
        } catch {
          // Report malformed or mixed stdout through the assertion below.
        }
        if (
          !output ||
          Object.keys(output).length !== 1 ||
          typeof output.systemMessage !== "string" ||
          !output.systemMessage.includes("Claude Code の版を確かめられない")
        ) {
          violations.push(`${suffix}: expected one Claude version warning JSON object`);
        }
      } else if (result.stdout !== `session-log: post-tool-use ${sessionId}\n`) {
        violations.push(`${suffix}: expected normal session-log output only`);
      }
    }

    expect(violations).toEqual([]);
  });
});
