/**
 * Contract-shape stub for the #1307 Red tests.
 * The doc-split behavior and runtime wiring belong to #1309 Green.
 */

export type DocClass = "l6-topic" | "l7-topic" | "layer-doc";

export interface DocSplitSource {
  path: string;
  text: string;
}

export interface DocRename {
  from: string;
  to: string;
}

export type DocSplitBaseline = Readonly<
  Record<string, { lines: number; responsibilities: number | null }>
>;

export interface DocSplitInput {
  sources: readonly DocSplitSource[];
  baseline: DocSplitBaseline;
  previousBaseline: DocSplitBaseline | null;
  mergeBaseMeasures: DocSplitBaseline | null;
  renames: readonly DocRename[];
}

export interface DocMeasure {
  path: string;
  docClass: DocClass;
  lines: number;
  responsibilities: number | null;
  names: string[];
}

export interface DocSplitFinding {
  path: string;
  kind: string;
  reason: string;
}

export interface DocSplitSummary {
  checked: number;
  over: number;
  stale: number;
  baseline: number;
}

export interface DocSplitResult {
  ok: boolean;
  findings: DocSplitFinding[];
  summary: DocSplitSummary;
}

export function classifyDoc(_path: string): DocClass | null {
  return null;
}

export function measureDoc(source: DocSplitSource): DocMeasure {
  return {
    path: source.path,
    docClass: "layer-doc",
    lines: 0,
    responsibilities: null,
    names: [],
  };
}

export function analyzeDocSplit(_input: DocSplitInput): DocSplitResult {
  return {
    ok: true,
    findings: [],
    summary: { checked: 0, over: 0, stale: 0, baseline: 0 },
  };
}

export function parseDocSplitBaseline(_sourceText: string): DocSplitBaseline | null {
  return null;
}
