// PLAN-L7-462 PR-A (AC-5 前半): 相対 import 指定子の拡張子必須 gate。
// 拡張子なし / .js 指定子 / 実在しない .ts target を fail-close し、fixture 文字列・
// コメント内の import 記述を誤検出しない (mini-scanner)。
import { describe, expect, it } from "vitest";
import {
  analyzeImportSpecifiers,
  extractImportSpecifiers,
  loadImportSpecifierInput,
} from "../src/lint/import-specifier.ts";

const FILES = new Set(["src/a.ts", "src/b/index.ts", "src/util.json"]);

function analyze(path: string, text: string) {
  return analyzeImportSpecifiers({ docs: [{ path, text }], files: FILES });
}

describe("extractImportSpecifiers (scanner)", () => {
  it("static / dynamic / require / side-effect / export-from を code 位置でだけ拾う", () => {
    const text = [
      'import { a } from "./a.ts";',
      'export { b } from "../b/index.ts";',
      'import "./side-effect";',
      'const m = await import("./dyn");',
      'const r = require("./req");',
      'vi.mock("./mocked");',
    ].join("\n");
    expect(extractImportSpecifiers(text).map((s) => s.specifier)).toEqual([
      "./a.ts",
      "../b/index.ts",
      "./side-effect",
      "./dyn",
      "./req",
      "./mocked",
    ]);
  });

  it("文字列リテラル・template・コメント内の import 記述は code として読まない", () => {
    const text = [
      "const fixture = 'import { x } from \"../lint/dead\";';",
      "const tpl = `",
      'import { y } from "./embedded";',
      "`;",
      '// import { z } from "./commented";',
      '/* import { w } from "./block"; */',
      'expect(src).toContain(\'} from "./runner"\');',
    ].join("\n");
    expect(extractImportSpecifiers(text)).toEqual([]);
  });
});

describe("analyzeImportSpecifiers", () => {
  it("拡張子なし相対 import は missing-extension で fail-close", () => {
    const r = analyze("src/x.ts", 'import { a } from "./a";');
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0].rule).toBe("missing-extension");
    expect(r.ok).toBe(false);
  });

  it("相対 .js 指定子は js-specifier で fail-close (bun では不可視の node blocker)", () => {
    const r = analyze("src/x.ts", 'import { a } from "./a.js";');
    expect(r.violations[0].rule).toBe("js-specifier");
  });

  it("実在しない .ts target は unresolved-ts-target", () => {
    const r = analyze("src/x.ts", 'import { c } from "./missing.ts";');
    expect(r.violations[0].rule).toBe("unresolved-ts-target");
  });

  it("実在 .ts / .json / 非相対 (bare specifier) は違反にしない", () => {
    const r = analyze(
      "src/x.ts",
      [
        'import { a } from "./a.ts";',
        'import { b } from "./b/index.ts";',
        'import u from "./util.json";',
        'import { join } from "node:path";',
        'import { z } from "zod";',
      ].join("\n"),
    );
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe("real repo regression", () => {
  it("実 repo の相対指定子は全件 実在 .ts 拡張子付き (再流入 0、fail-close 回帰網)", () => {
    const r = analyzeImportSpecifiers(loadImportSpecifierInput(process.cwd()));
    expect(r.violations).toEqual([]);
    expect(r.checked).toBeGreaterThan(600);
    expect(r.specifiers).toBeGreaterThan(1400);
  });
});
