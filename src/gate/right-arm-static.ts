import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import {
  parseG8IntegrationEvidenceManifest,
  validateG8IntegrationEvidenceManifest,
} from "../lint/g8-integration-workflow.ts";
import { readGateAssetText } from "../lint/gate-confirm.ts";
import { fmValue } from "../lint/shared.ts";
import { resolveAuthoringSourceAbsolutePath } from "../shared/design-root.ts";
import { designLayerFromPath, loadPairDocs } from "../vmodel/lint.ts";
import {
  loadCompiledRightArmRegistry,
  VMODEL_CONTRACT_PATH,
} from "../vmodel-contract/adapters/yaml-contract-loader.ts";
import type { CompiledVerificationObligation } from "../vmodel-contract/application/contract-compiler.ts";

interface CaseRow {
  id: string;
  citations: string;
  family?: string;
}

interface CheckCaseIdsInput {
  rows: readonly CaseRow[];
  prefix: string;
  content: string;
  violations: string[];
}

interface CheckManifestInput {
  repoRoot: string;
  absolutePath: string;
  evidenceDirectory: string;
  obligation: CompiledVerificationObligation;
  caseIds: ReadonlySet<string>;
  deferCaseIdField: "it_id" | "st_id";
  violations: string[];
}

type JsonRecord = Record<string, unknown>;

const REQUIRED_G8_HEADINGS = [
  "# DOC-L8-INTEGRATION-TEST-DESIGN: 結合テスト設計書",
  "#### 第1章 テスト方針",
  "#### 第2章 テスト観点",
  "#### 第3章 テストケース一覧",
  "#### 第4章 不具合・判定基準",
  "##### 4-1 重要度定義",
  "##### 4-2 不具合記録",
] as const;
const REQUIRED_G8_CASE_COLUMNS = [
  "テストID",
  "分類",
  "テスト項目",
  "検証内容/手順",
  "期待結果",
  "トレース元",
] as const;
const REQUIRED_G9_HEADINGS = [
  "# DOC-L9-SYSTEM-TEST-DESIGN: 総合テスト設計書 / セキュリティテスト計画・脆弱性診断書",
  "#### 第1章 テスト方針",
  "#### 第2章 テスト観点",
  "#### 第3章 テストケース一覧",
  "#### 第4章 不具合・判定基準",
  "##### 4-1 重要度定義",
  "##### 4-2 不具合記録",
] as const;
const REQUIRED_G9_CASE_COLUMNS = [...REQUIRED_G8_CASE_COLUMNS.slice(0, -1), "family", "トレース元"];
function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function tableCells(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim().replace(/\*\*/g, ""));
}

function parseG8CaseRows(content: string, violations: string[]): CaseRow[] {
  for (const heading of REQUIRED_G8_HEADINGS) {
    if (!content.includes(heading)) violations.push(`missing section ${heading}`);
  }
  const lines = content.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const cells = tableCells(line);
    return REQUIRED_G8_CASE_COLUMNS.every((column) => cells.includes(column));
  });
  if (headerIndex < 0) {
    violations.push("missing section 第3章 テストケース一覧: required case table columns");
    return [];
  }
  const header = tableCells(lines[headerIndex] ?? "");
  const idIndex = header.indexOf("テストID");
  const citationIndex = header.indexOf("トレース元");
  const rows: CaseRow[] = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trimStart().startsWith("|")) break;
    const cells = tableCells(line);
    const id = cells[idIndex] ?? "";
    if (!id || id.startsWith("<")) continue;
    rows.push({ id, citations: cells[citationIndex] ?? "" });
  }
  if (rows.length === 0) violations.push("missing section 第3章 テストケース一覧: case rows");
  return rows;
}

function parseG9CaseRows(content: string, violations: string[]): CaseRow[] {
  for (const heading of REQUIRED_G9_HEADINGS) {
    if (!content.includes(heading)) violations.push(`missing section ${heading}`);
  }
  const lines = content.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const cells = tableCells(line);
    return REQUIRED_G9_CASE_COLUMNS.every((column) => cells.includes(column));
  });
  if (headerIndex < 0) {
    violations.push("missing section 第3章 テストケース一覧: required case table columns");
    return [];
  }
  const header = tableCells(lines[headerIndex] ?? "");
  const idIndex = header.indexOf("テストID");
  const citationIndex = header.indexOf("トレース元");
  const familyIndex = header.indexOf("family");
  const rows: CaseRow[] = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trimStart().startsWith("|")) break;
    const cells = tableCells(line);
    const id = cells[idIndex] ?? "";
    if (!id || id.startsWith("<")) continue;
    rows.push({
      id,
      citations: cells[citationIndex] ?? "",
      family: cells[familyIndex] ?? "",
    });
  }
  if (rows.length === 0) violations.push("missing section 第3章 テストケース一覧: case rows");
  return rows;
}

function g8SlotContent(
  repoRoot: string,
  obligation: CompiledVerificationObligation,
): string | null {
  const slot = resolveAuthoringSourceAbsolutePath(repoRoot, obligation.governanceArtifact);
  if (!existsSync(slot)) return null;
  const content = readFileSync(slot, "utf8");
  return fmValue(content, "doc_type_id") === "DOC-L8-INTEGRATION-TEST-DESIGN" ? content : null;
}

function g9SlotContent(
  repoRoot: string,
  obligation: CompiledVerificationObligation,
): string | null {
  const slot = resolveAuthoringSourceAbsolutePath(repoRoot, obligation.governanceArtifact);
  if (!existsSync(slot)) return null;
  const content = readFileSync(slot, "utf8");
  return fmValue(content, "doc_type_id") === "DOC-L9-SYSTEM-TEST-DESIGN" ? content : null;
}

function pairLayerIds(repoRoot: string, pairLayers: readonly string[]): Set<string> {
  const ids = new Set<string>();
  for (const doc of loadPairDocs(repoRoot)) {
    const layer = designLayerFromPath(doc.path);
    if (!doc.content || !layer || !pairLayers.includes(layer)) continue;
    const docTypeId = fmValue(doc.content, "doc_type_id");
    if (docTypeId) ids.add(docTypeId);
    for (const match of doc.content.matchAll(/\*\*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\*\*/g)) {
      ids.add(match[1] as string);
    }
  }
  return ids;
}

function allDesignIds(repoRoot: string): Set<string> {
  const ids = new Set<string>();
  for (const doc of loadPairDocs(repoRoot)) {
    if (!doc.content) continue;
    const docTypeId = fmValue(doc.content, "doc_type_id");
    if (docTypeId) ids.add(docTypeId);
    for (const match of doc.content.matchAll(/\*\*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\*\*/g)) {
      ids.add(match[1] as string);
    }
  }
  return ids;
}

function checkCaseIds({ rows, prefix, content, violations }: CheckCaseIdsInput): void {
  const defined = new Set<string>();
  for (const { id } of rows) {
    if (!id.startsWith(prefix)) violations.push(`case id must start with ${prefix}: ${id}`);
    if (defined.has(id)) violations.push(`duplicate case id ${id}`);
    defined.add(id);
  }
  const pattern = new RegExp(`\\b${prefix}[A-Z0-9][A-Z0-9-]*\\b`, "g");
  for (const match of content.matchAll(pattern)) {
    if (!defined.has(match[0])) violations.push(`dangling reference ${match[0]}`);
  }
}

function checkCaseTraces(
  rows: readonly CaseRow[],
  pairIds: ReadonlySet<string>,
  violations: string[],
): void {
  for (const row of rows) {
    const citedIds = [...row.citations.matchAll(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g)].map(
      (match) => match[0],
    );
    if (citedIds.length === 0) {
      violations.push(`untraced case ${row.id}`);
      continue;
    }
    for (const id of citedIds) {
      if (!pairIds.has(id)) violations.push(`trace target missing ${id}`);
    }
  }
}

function checkG9CaseTraces(
  rows: readonly CaseRow[],
  pairIds: ReadonlySet<string>,
  definedIds: ReadonlySet<string>,
  violations: string[],
): void {
  for (const row of rows) {
    const citedIds = [...row.citations.matchAll(/\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+\b/g)].map(
      (match) => match[0],
    );
    if (!citedIds.some((id) => pairIds.has(id))) {
      violations.push(`untraced case ${row.id}`);
    }
    for (const id of citedIds) {
      if (!definedIds.has(id)) violations.push(`trace target missing ${id}`);
    }
  }
}

function checkG9Families(
  rows: readonly CaseRow[],
  evidenceFamilies: readonly string[],
  violations: string[],
): void {
  const found = new Set<string>();
  for (const row of rows) {
    const family = stringValue(row.family);
    if (!evidenceFamilies.includes(family)) {
      violations.push(`invalid evidence family ${family || "<empty>"} for ${row.id}`);
    } else {
      found.add(family);
    }
  }
  for (const family of evidenceFamilies) {
    if (!found.has(family)) violations.push(`missing evidence family ${family}`);
  }
}

function manifestFiles(repoRoot: string, evidenceDirectory: string): string[] {
  const absoluteDirectory = resolve(repoRoot, evidenceDirectory);
  if (!existsSync(absoluteDirectory)) return [];
  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(absoluteDirectory, entry.name))
    .sort();
}

function manifestPath(repoRoot: string, absolutePath: string): string {
  return relative(repoRoot, absolutePath).replaceAll("\\", "/");
}

function resolveRepoFile(repoRoot: string, path: unknown): string | null {
  const value = stringValue(path);
  if (!value || value.includes("\\") || isAbsolute(value)) return null;
  const absolutePath = resolve(repoRoot, value);
  const rel = relative(repoRoot, absolutePath);
  if (!rel || rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`))
    return null;
  return absolutePath;
}

function parseG9EvidenceManifest(path: string, raw: unknown) {
  if (!isRecord(raw)) return parseG8IntegrationEvidenceManifest(path, raw);
  const commands = Array.isArray(raw.commands)
    ? raw.commands.map((command) =>
        isRecord(command) ? { ...command, it_ids: command.st_ids } : command,
      )
    : raw.commands;
  const coverage = Array.isArray(raw.coverage)
    ? raw.coverage.map((entry) => (isRecord(entry) ? { ...entry, it_id: entry.st_id } : entry))
    : raw.coverage;
  return parseG8IntegrationEvidenceManifest(path, {
    ...raw,
    selected_it_ids: raw.selected_st_ids,
    mandatory_it_ids: raw.mandatory_st_ids,
    deferred_it_ids: raw.deferred_st_ids,
    commands,
    coverage,
  });
}

function checkManifest({
  repoRoot,
  absolutePath,
  evidenceDirectory,
  obligation,
  caseIds,
  deferCaseIdField,
  violations,
}: CheckManifestInput): { mandatoryIds: Set<string>; deferredIds: Set<string> } {
  const path = manifestPath(repoRoot, absolutePath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as unknown;
  } catch {
    violations.push(`${path}: invalid JSON`);
    return { mandatoryIds: new Set(), deferredIds: new Set() };
  }
  if (!isRecord(parsed)) {
    violations.push(`${path}: manifest must be an object`);
    return { mandatoryIds: new Set(), deferredIds: new Set() };
  }
  const evidence =
    obligation.gate === "G9"
      ? parseG9EvidenceManifest(path, parsed)
      : parseG8IntegrationEvidenceManifest(path, parsed);
  violations.push(
    ...validateG8IntegrationEvidenceManifest(evidence, repoRoot, {
      gate: obligation.gate,
      schemaVersion: `${basename(evidenceDirectory)}-evidence-v1`,
      doctorCheck: `${basename(evidenceDirectory)}-workflow`,
    }),
  );
  const mandatoryIds = new Set(evidence.mandatory_it_ids);
  const deferredIds = new Set(evidence.deferred_it_ids);
  const selectedIds = new Set(evidence.selected_it_ids);
  for (const id of selectedIds) {
    if (!caseIds.has(id)) violations.push(`${path}: evidence references undefined case ${id}`);
  }
  for (const id of [...mandatoryIds, ...deferredIds]) {
    if (!caseIds.has(id)) violations.push(`${path}: evidence references undefined case ${id}`);
  }
  for (const id of deferredIds) {
    const deferEntries = Array.isArray(evidence.defer) ? evidence.defer : [];
    const defer = deferEntries.find((entry) => isRecord(entry) && entry[deferCaseIdField] === id);
    if (!isRecord(defer) || !stringValue(defer.reason) || !stringValue(defer.plan_id)) {
      violations.push(`${path}: stale defer ${id}`);
      continue;
    }
    const planId = stringValue(defer.plan_id);
    if (
      !/^PLAN-[A-Z0-9-]+$/.test(planId) ||
      !existsSync(join(repoRoot, "docs", "plans", `${planId}.md`))
    ) {
      violations.push(`${path}: stale defer ${id}`);
    }
  }
  const artifacts = isRecord(evidence.artifacts) ? evidence.artifacts : {};
  for (const key of obligation.requiredArtifacts) {
    const artifactPath = resolveRepoFile(repoRoot, artifacts[key]);
    if (!artifactPath || !existsSync(artifactPath)) {
      violations.push(`${path}: missing artifact ${key}`);
    }
  }
  return { mandatoryIds, deferredIds };
}

export function evaluateRightArmStaticGate(
  gate: string,
  repoRoot: string,
): {
  passed: boolean;
  messages: string[];
} {
  const key = gate.trim().toUpperCase();
  if (key !== "G8" && key !== "G9") {
    return {
      passed: false,
      messages: [`right-arm-static - violation: no evaluator for ${key}`],
    };
  }
  const registry = loadCompiledRightArmRegistry(
    repoRoot,
    readGateAssetText(repoRoot, VMODEL_CONTRACT_PATH),
  );
  const obligation = registry.obligations.find((entry) => entry.gate === key);
  if (!obligation) {
    return {
      passed: false,
      messages: [`right-arm-static - violation: contract has no obligation for ${key}`],
    };
  }
  const violations: string[] = [];
  const slot =
    key === "G9" ? g9SlotContent(repoRoot, obligation) : g8SlotContent(repoRoot, obligation);
  const slotDocTypeId =
    key === "G9" ? "DOC-L9-SYSTEM-TEST-DESIGN" : "DOC-L8-INTEGRATION-TEST-DESIGN";
  if (!slot) violations.push(`missing slot ${slotDocTypeId}`);
  const content = slot ?? "";
  const rows =
    key === "G9" ? parseG9CaseRows(content, violations) : parseG8CaseRows(content, violations);
  const caseIds = new Set(rows.map((row) => row.id));
  checkCaseIds({
    rows,
    prefix: obligation.caseIdPrefix,
    content,
    violations,
  });
  const pairIds = pairLayerIds(repoRoot, obligation.pairLayers);
  if (key === "G9") {
    checkG9CaseTraces(rows, pairIds, allDesignIds(repoRoot), violations);
    checkG9Families(rows, obligation.evidenceFamilies, violations);
  } else {
    checkCaseTraces(rows, pairIds, violations);
  }
  const evidenceDirectory = dirname(obligation.evidenceManifest).replaceAll("\\", "/");
  const files = manifestFiles(repoRoot, evidenceDirectory);
  if (files.length === 0) violations.push(`evidence manifest missing under ${evidenceDirectory}`);
  const evidenced = new Set<string>();
  for (const file of files) {
    const manifestResult = checkManifest({
      repoRoot,
      absolutePath: file,
      evidenceDirectory,
      obligation,
      caseIds,
      deferCaseIdField: key === "G9" ? "st_id" : "it_id",
      violations,
    });
    for (const id of [...manifestResult.mandatoryIds, ...manifestResult.deferredIds])
      evidenced.add(id);
  }
  for (const id of caseIds) {
    if (!evidenced.has(id)) violations.push(`missing row evidence ${id}`);
  }
  const messages =
    violations.length > 0
      ? [`right-arm-static - violation: ${violations.join("; ")}`]
      : [`right-arm-static - OK (${key}, cases=${caseIds.size}, manifests=${files.length})`];
  messages.push(`未判定 (review): ${obligation.approvalRole}`);
  return { passed: violations.length === 0, messages };
}
