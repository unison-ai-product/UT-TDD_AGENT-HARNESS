/**
 * Contract-shape stub for the #1310 Red tests.
 * The code-size behavior and runtime wiring belong to the Green PR.
 */

export type CodeClass = "src" | "tests";

export interface CodeSizeSource {
  path: string;
  text: string;
}

export interface CodeRename {
  from: string;
  to: string;
}

export type CodeSizeBaseline = Readonly<
  Record<string, { lines: number | null; functionExcess: number | null }>
>;

export interface CodeSizeInput {
  sources: readonly CodeSizeSource[];
  baseline: CodeSizeBaseline;
  previousBaseline: CodeSizeBaseline | null;
  mergeBaseMeasures: CodeSizeBaseline | null;
  renames: readonly CodeRename[];
}

export interface CodeFunctionMeasure {
  name: string;
  line: number;
  lines: number;
}

export interface CodeStatementMeasure {
  name: string;
  lines: number;
}

export interface CodeMeasure {
  path: string;
  codeClass: CodeClass;
  lines: number;
  functionExcess: number | null;
  overFunctions: CodeFunctionMeasure[];
  topLevel: CodeStatementMeasure[];
}

export interface CodeSizeFinding {
  path: string;
  kind: string;
  reason: string;
}

export interface CodeSizeSummary {
  checked: number;
  over: number;
  stale: number;
  baseline: number;
}

export interface CodeSizeResult {
  ok: boolean;
  findings: CodeSizeFinding[];
  summary: CodeSizeSummary;
}

export const CODE_SIZE_LIMITS = {
  src: { lines: 500, functionLines: 120 },
  tests: { lines: 500 },
} as const;

export function classifyCodeFile(_path: string): CodeClass | null {
  return null;
}

export function measureCodeFile(source: CodeSizeSource): CodeMeasure {
  return {
    path: source.path,
    codeClass: "src",
    lines: 0,
    functionExcess: null,
    overFunctions: [],
    topLevel: [],
  };
}

export function analyzeCodeSize(_input: CodeSizeInput): CodeSizeResult {
  return {
    ok: true,
    findings: [],
    summary: { checked: 0, over: 0, stale: 0, baseline: 0 },
  };
}

export function parseCodeSizeBaseline(_sourceText: string): CodeSizeBaseline | null {
  return null;
}
