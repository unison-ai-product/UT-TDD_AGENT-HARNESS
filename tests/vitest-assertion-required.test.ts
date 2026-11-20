import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// #1452 / L7-vitest-assertion-required-test-design.md の候補 oracle。
// 開発リポジトリの vitest 実行設定を通した独立 fixture を CLI 子プロセスで実行する。
const repoRoot = process.cwd();
const created: string[] = [];
const TIMEOUT = { timeout: 150_000 };

interface CaseResult {
  status: string;
  messages: string;
}
interface RunOutcome {
  exitCode: number | null;
  byName: Map<string, CaseResult>;
  raw: string;
}

function runFixture(files: Record<string, string>): RunOutcome {
  const dir = mkdtempSync(join(tmpdir(), "ut-vitassert-"));
  created.push(dir);
  symlinkSync(join(repoRoot, "node_modules"), join(dir, "node_modules"), "junction");
  const base = join(repoRoot, "vitest.config.ts").replace(/\\/g, "/");
  writeFileSync(
    join(dir, "vitest.config.mts"),
    `import base from ${JSON.stringify(base)};
export default {
  ...base,
  root: ${JSON.stringify(dir.replace(/\\/g, "/"))},
  test: { ...base.test, include: ["*.test.ts"], setupFiles: [], globalSetup: [] },
};
`,
  );
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  const out = join(dir, "out.json");
  const proc = spawnSync(
    process.execPath,
    [
      join(repoRoot, "node_modules", "vitest", "vitest.mjs"),
      "run",
      "--config",
      join(dir, "vitest.config.mts"),
      "--reporter=json",
      `--outputFile=${out}`,
    ],
    { cwd: dir, encoding: "utf8", timeout: 120_000 },
  );
  const byName = new Map<string, CaseResult>();
  let raw = "";
  try {
    raw = readFileSync(out, "utf8");
    const json = JSON.parse(raw) as {
      testResults: {
        assertionResults: { title: string; status: string; failureMessages: string[] }[];
      }[];
    };
    for (const f of json.testResults)
      for (const a of f.assertionResults)
        byName.set(a.title, { status: a.status, messages: a.failureMessages.join("\n") });
  } catch {
    raw = `${raw}\n${proc.stdout}\n${proc.stderr}`;
  }
  return { exitCode: proc.status, byName, raw };
}

function statusOf(run: RunOutcome, name: string): string {
  return run.byName.get(name)?.status ?? `missing(${run.raw.slice(0, 200)})`;
}
function messagesOf(run: RunOutcome, name: string): string {
  return run.byName.get(name)?.messages ?? "";
}

const HEAD = `import { beforeEach, describe, expect, it } from "vitest";\n`;

afterAll(() => {
  for (const d of created) rmSync(d, { recursive: true, force: true });
});

describe("Vitest assertion required (#1452, L7 CANDIDATE-U-VITASSERT)", () => {
  it.fails(
    "CANDIDATE-U-VITASSERT-001: 早期 return の通常テストは 0 件で FAIL し CLI は非 0",
    TIMEOUT,
    () => {
      const run = runFixture({
        "a.test.ts": `${HEAD}
it("ok", () => { expect(1).toBe(1); });
it("zero early return", () => { if (Date.now() > 0) return; expect(1).toBe(1); });
`,
      });
      expect(statusOf(run, "ok")).toBe("passed");
      expect(statusOf(run, "zero early return")).toBe("failed");
      expect(messagesOf(run, "zero early return")).toMatch(/assertion/i);
      expect(run.exitCode).not.toBe(0);
    },
  );

  it.fails(
    "CANDIDATE-U-VITASSERT-002: it.fails は反転を維持し 0 件判定は適用しない",
    TIMEOUT,
    () => {
      const run = runFixture({
        "a.test.ts": `${HEAD}
it("zero normal", () => { return; });
it.fails("fails returns normally", () => { return; });
it.fails("fails really throws", () => { expect(1).toBe(2); });
`,
      });
      expect(statusOf(run, "zero normal")).toBe("failed");
      expect(statusOf(run, "fails returns normally")).toBe("failed");
      expect(messagesOf(run, "fails returns normally")).toMatch(/expect test to fail/i);
      expect(statusOf(run, "fails really throws")).toBe("passed");
    },
  );

  it.fails(
    "CANDIDATE-U-VITASSERT-003: import と context.expect は同じ counter に入る",
    TIMEOUT,
    () => {
      const run = runFixture({
        "a.test.ts": `${HEAD}
it("import only", () => { expect(1).toBe(1); });
it("local only", (ctx) => { ctx.expect(1).toBe(1); });
it("both two", (ctx) => { expect.assertions(2); expect(1).toBe(1); ctx.expect(1).toBe(1); });
it("local get only", (ctx) => { void ctx.expect; });
it("soft only", () => { expect.soft(1).toBe(1); });
it("poll only", async () => { await expect.poll(() => 1).toBe(1); });
`,
      });
      for (const n of ["import only", "local only", "both two", "soft only", "poll only"])
        expect(statusOf(run, n)).toBe("passed");
      expect(statusOf(run, "local get only")).toBe("failed");
    },
  );

  it.fails("CANDIDATE-U-VITASSERT-004: helper 経由・parameterized・例外の扱い", TIMEOUT, () => {
    const run = runFixture({
      "a.test.ts": `${HEAD}
function check(): void { expect(1).toBe(1); }
it("via helper", () => { check(); });
it.each([[true], [false]])("param %s", (flag) => { if (flag) expect(1).toBe(1); });
it("throws originally", () => { throw new Error("boom-original"); });
`,
    });
    expect(statusOf(run, "via helper")).toBe("passed");
    expect(statusOf(run, "param true")).toBe("passed");
    expect(statusOf(run, "param false")).toBe("failed");
    expect(statusOf(run, "throws originally")).toBe("failed");
    expect(messagesOf(run, "throws originally")).toContain("boom-original");
    expect(messagesOf(run, "throws originally")).not.toMatch(/no assertion|0 assertion/i);
  });

  it.fails(
    "CANDIDATE-U-VITASSERT-005: retry は各試行の 0 件を判定し skip/todo は維持",
    TIMEOUT,
    () => {
      const run = runFixture({
        "a.test.ts": `${HEAD}
let n = 0;
it("retry zero", { retry: 1 }, (ctx) => { n += 1; if (n === 1) ctx.expect(1).toBe(2); });
it.skip("skipped", () => { return; });
it.todo("todoed");
`,
      });
      expect(statusOf(run, "retry zero")).toBe("failed");
      expect(["skipped", "pending"]).toContain(statusOf(run, "skipped"));
      expect(["todo", "pending"]).toContain(statusOf(run, "todoed"));
    },
  );

  it.fails(
    "CANDIDATE-U-VITASSERT-006: hook と並行する別ケースの assertion を混ぜない",
    TIMEOUT,
    () => {
      const run = runFixture({
        "a.test.ts": `${HEAD}
describe("hook", () => {
  beforeEach(() => { expect(1).toBe(1); });
  it("hook only zero", () => { return; });
});
describe.concurrent("concurrent", () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((r) => { release = r; });
  it("waiting zero", async () => { await gate; });
  it("calls expect", () => { expect(1).toBe(1); release(); });
});
`,
      });
      expect(statusOf(run, "hook only zero")).toBe("failed");
      expect(statusOf(run, "waiting zero")).toBe("failed");
      expect(statusOf(run, "calls expect")).toBe("passed");
    },
  );

  it.fails("CANDIDATE-U-VITASSERT-007: 標準診断を上書きしない", TIMEOUT, () => {
    const run = runFixture({
      "a.test.ts": `${HEAD}
it("mismatch three", (ctx) => { expect.assertions(3); expect(1).toBe(1); ctx.expect(1).toBe(1); });
it("assertions two none", () => { expect.assertions(2); });
it("has assertions none", () => { expect.hasAssertions(); });
`,
    });
    expect(messagesOf(run, "mismatch three")).toMatch(
      /expected 3 assertions to be called but got 2/,
    );
    expect(messagesOf(run, "assertions two none")).toMatch(
      /expected 2 assertions to be called but got 0/,
    );
    expect(messagesOf(run, "has assertions none")).toMatch(/expected any number of assertion/);
  });
});
