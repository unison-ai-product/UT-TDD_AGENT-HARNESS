/**
 * issue #1607 生成される source の windowsHide 静的検査。
 * Contract: docs/design/harness/L6-function-design/windows-hide-default.md §3
 * Test design: docs/test-design/harness/L7-windows-hide-default-test-design.md
 */
import { describe, expect, it } from "vitest";
import { MISSING_RUNTIME_GUARD_BOOTSTRAP } from "../src/lint/project-hook.ts";
import { renderConsumerNodeWrapper } from "../src/setup/consumer-node-runtime.ts";
import { CONSUMER_RUNTIME_ABSENT_WRAPPER_SOURCE } from "../src/setup/consumer-runtime-absent-guidance.ts";

type ChildProcessCall = { name: string; args: string };
type GeneratedSourceScan = { calls: number; violations: ChildProcessCall[] };

const CALL = /\b(execFileSync|execSync|spawnSync|spawn|execFile|exec)\s*\(/g;
const HIDE_TRUE = /\bwindowsHide\s*:\s*true\b/;

/** 開き括弧の位置から対応する閉じ括弧までを返す。文字列 literal の中の括弧は数えない。 */
function readCallArguments(source: string, open: number): string {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' || char === "'" || char === "`") {
      for (index += 1; index < source.length && source[index] !== char; index += 1) {
        if (source[index] === "\\") index += 1;
      }
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  return source.slice(open + 1);
}

function scanGeneratedSource(source: string): GeneratedSourceScan {
  const scan: GeneratedSourceScan = { calls: 0, violations: [] };
  for (const match of source.matchAll(CALL)) {
    const args = readCallArguments(source, (match.index ?? 0) + match[0].length - 1);
    scan.calls += 1;
    if (!HIDE_TRUE.test(args)) scan.violations.push({ name: match[1] ?? "", args });
  }
  return scan;
}

/** 呼び出しが 0 件の入力は検査できていないので失敗させる。 */
function violationsOf(label: string, source: string): string[] {
  const scan = scanGeneratedSource(source);
  if (scan.calls === 0) throw new Error(`${label}: child_process の呼び出しを検出できない`);
  return scan.violations.map((call) => `${label}: ${call.name}(${call.args})`);
}

const GENERATED_SOURCES: Record<string, string> = {
  MISSING_RUNTIME_GUARD_BOOTSTRAP,
  CONSUMER_RUNTIME_ABSENT_WRAPPER_SOURCE,
  renderConsumerNodeWrapper: renderConsumerNodeWrapper(),
};

describe("issue #1607 生成される source の windowsHide (Red)", () => {
  describe("U-WHIDE-015", () =>
    it.fails("U-WHIDE-015: 生成される source の child_process 呼び出しはすべて windowsHide: true を持つ", () => {
      const violations = Object.entries(GENERATED_SOURCES).flatMap(([label, source]) =>
        violationsOf(label, source),
      );
      expect(violations).toEqual([]);
    }));

  describe("U-WHIDE-016", () =>
    it("U-WHIDE-016: 検査関数は windowsHide の無い・false の呼び出しだけを指摘し、0 件の入力は検査不能とする", () => {
      const missing =
        'cp.execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"});cp.spawnSync(process.execPath,[a],{windowsHide:true})';
      const missingScan = scanGeneratedSource(missing);
      expect(missingScan.calls).toBe(2);
      expect(missingScan.violations.map((call) => call.name)).toEqual(["execFileSync"]);

      const falseScan = scanGeneratedSource('cp.spawn("x",[],{ windowsHide : false })');
      expect(falseScan.violations.map((call) => call.name)).toEqual(["spawn"]);

      expect(() => violationsOf("empty", "const x = 1; spawnSyncLike(1)")).toThrow(/検出できない/);
    }));
});
