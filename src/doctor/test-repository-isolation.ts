import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import type { LintResult } from "../plan/lint";

export type RepositoryReadMode = "head_snapshot" | "isolated_fixture";
export interface RepositoryReadContract {
  mode: RepositoryReadMode;
  calls: number;
  reason: string;
}

const CONTRACT_ROWS = `
asset-catalog:3 asset-drift:1 backfill-pairing:2 cited-command-existence:1 cli-surface:1 cli:1
codex-hook-adapter:1 coding-rules:1 context-doc-router:2 cycle-p4-verification:5 db-projection-coverage:1 db-projection-ingestion:3
dependency-drift:1 descent-obligation:3 distribution-acceptance:1 distribution-scratch-ignore:1 doctor-runtime-surface:2 doctor:25
drive-model-passage:2 fr-roadmap-coverage:4 frontend-design-coverage:1 g10-ux-workflow:5 g8-integration-workflow:6 g9-system-workflow:7
gate-static:10 impl-plan-trace:1 l14-close-audit:8 l6-completion:2 l6-fr-coverage:2 mode-catalog:1 model-id-ssot:1 model-id-ssot-drift:1 module-drift:2 oracle-test-trace:1
plan-id-naming:1 plan-lint:10 projection-writer:13 proposal-document-coverage:2 readability:5 relation-graph-loader:1 review-green-command-projection:1
right-arm-gate-planning:1 right-lung-doc-governance:1 roadmap:1 rule-automation-closure:1 rule-drift:2 runtime-hook-entrypoints:1
runtime-portability:2 screen-impl-pair-freeze:1 self-pair-normative-guard:1 setup-agent-floor:2 setup:7 skill-assignment:1 state-db:1
sub-doc-catalog-drift:5 sub-doc-section-structure:1 telemetry-closure:1 test-design-naming:1 toolchain-pin:1 tracked-canonical:1
update-check:1 vmodel-contract-compiler:1 vmodel-source-assets:1 work-guard:1 workspace-roots:3 write-encoding-guard:1
doctor-test-repository-isolation:1 persistent-db-cleanup-contract:1
feedback-log:2
global-setup.ts:1 support/workspace-roots.ts:3
`;

export const REPOSITORY_READ_CONTRACTS: Readonly<Record<string, RepositoryReadContract>> =
  Object.fromEntries(
    CONTRACT_ROWS.trim()
      .split(/\s+/)
      .map((row) => {
        const [name, calls] = row.split(":");
        return [
          `tests/${name.endsWith(".ts") ? name : `${name}.test.ts`}`,
          {
            mode: "head_snapshot",
            calls: Number(calls),
            reason: "repository contract read is fixed to detached HEAD",
          },
        ];
      }),
  );

function isProcessReference(node: ts.Expression): boolean {
  if (ts.isIdentifier(node) && node.text === "process") return true;
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "globalThis" &&
    node.name.text === "process"
  )
    return true;
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "require" &&
    node.arguments.length === 1 &&
    ts.isStringLiteralLike(node.arguments[0]) &&
    ["process", "node:process"].includes(node.arguments[0].text)
  );
}

const REPOSITORY_READ_APIS = new Set([
  "access",
  "accessSync",
  "existsSync",
  "file",
  "lstat",
  "lstatSync",
  "readFile",
  "readFileSync",
  "readdir",
  "readdirSync",
  "stat",
  "statSync",
]);
const REPOSITORY_PATH =
  /^(?:\.?(?:\/|\\))?(?:\.claude|\.codex|\.github|\.ut-tdd|docs|scripts|skills|src|tests)(?:\/|\\)|^(?:AGENTS\.md|CLAUDE\.md|package\.json|tsconfig\.json|vitest\.config\.ts)$/;

function staticPath(
  node: ts.Expression,
  paths: ReadonlyMap<string, string> = new Map(),
): string | null {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node)) return paths.get(node.text) ?? null;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = staticPath(node.left, paths);
    const right = staticPath(node.right, paths);
    return left !== null && right !== null ? left + right : null;
  }
  if (
    ts.isCallExpression(node) &&
    ((ts.isIdentifier(node.expression) && ["join", "resolve"].includes(node.expression.text)) ||
      (ts.isPropertyAccessExpression(node.expression) &&
        ["join", "resolve"].includes(node.expression.name.text)))
  ) {
    const parts = node.arguments.map((argument) => staticPath(argument, paths));
    return parts.every((part): part is string => part !== null) ? parts.join("/") : null;
  }
  return null;
}

function memberName(node: ts.Expression): string | null {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression))
    return node.argumentExpression.text;
  return null;
}

function isDirectRepositoryRead(
  node: ts.CallExpression,
  aliases: ReadonlyMap<string, string>,
  paths: ReadonlyMap<string, string>,
): boolean {
  const rawName = memberName(node.expression);
  const name = rawName ? (aliases.get(rawName) ?? rawName) : null;
  const target = node.arguments[0] ? staticPath(node.arguments[0], paths) : null;
  return Boolean(name && REPOSITORY_READ_APIS.has(name) && target && REPOSITORY_PATH.test(target));
}

function inspectSource(path: string, source: string): { calls: number; forbidden: boolean } {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const readAliases = new Map<string, string>();
  const pathAliases = new Map<string, string>();
  const processAliases = new Set<string>(["process"]);
  const collect = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings)
    )
      for (const element of node.importClause.namedBindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text;
        if (REPOSITORY_READ_APIS.has(imported)) readAliases.set(element.name.text, imported);
      }
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isObjectBindingPattern(node.name)) {
        for (const element of node.name.elements) {
          const imported = element.propertyName?.getText(file) ?? element.name.getText(file);
          if (REPOSITORY_READ_APIS.has(imported) && ts.isIdentifier(element.name))
            readAliases.set(element.name.text, imported);
        }
      } else if (ts.isIdentifier(node.name)) {
        const target = memberName(node.initializer);
        const canonical = target ? (readAliases.get(target) ?? target) : null;
        if (canonical && REPOSITORY_READ_APIS.has(canonical))
          readAliases.set(node.name.text, canonical);
        const value = staticPath(node.initializer, pathAliases);
        if (value !== null) pathAliases.set(node.name.text, value);
        if (
          isProcessReference(node.initializer) ||
          (ts.isIdentifier(node.initializer) && processAliases.has(node.initializer.text))
        )
          processAliases.add(node.name.text);
      }
    }
    ts.forEachChild(node, collect);
  };
  for (let pass = 0; pass < 4; pass += 1) collect(file);
  const isProcessRef = (node: ts.Expression): boolean =>
    isProcessReference(node) || (ts.isIdentifier(node) && processAliases.has(node.text));
  const isConsumedRootCall = (node: ts.CallExpression): boolean => {
    if (ts.isExpressionStatement(node.parent) || ts.isVoidExpression(node.parent)) return false;
    if (!ts.isVariableDeclaration(node.parent) || !ts.isIdentifier(node.parent.name)) return true;
    const declarationName = node.parent.name;
    const name = declarationName.text;
    let consumed = false;
    const findUse = (candidate: ts.Node): void => {
      if (
        ts.isIdentifier(candidate) &&
        candidate.text === name &&
        candidate !== declarationName &&
        ts.isCallExpression(candidate.parent) &&
        candidate.parent.arguments.includes(candidate)
      )
        consumed = true;
      ts.forEachChild(candidate, findUse);
    };
    findUse(file);
    return consumed;
  };
  let calls = 0;
  let forbidden = false;
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === "__dirname") forbidden = true;
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isMetaProperty(node.expression) &&
      ["dirname", "url"].includes(node.name.text)
    )
      forbidden = true;
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      ["process", "node:process"].includes(node.moduleSpecifier.text)
    )
      forbidden = true;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      node.name.elements.some(
        (element) =>
          element.propertyName?.getText(file) === "cwd" || element.name.getText(file) === "cwd",
      ) &&
      node.initializer &&
      isProcessReference(node.initializer)
    )
      forbidden = true;
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "cwd" &&
      isProcessRef(node.expression.expression)
    )
      calls += 1;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "headSnapshotRoot" &&
      isConsumedRootCall(node)
    )
      calls += 1;
    if (ts.isCallExpression(node) && isDirectRepositoryRead(node, readAliases, pathAliases))
      calls += 1;
    else if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === "cwd" &&
      isProcessRef(node.expression) &&
      !(ts.isCallExpression(node.parent) && node.parent.expression === node)
    )
      forbidden = true;
    if (ts.isElementAccessExpression(node) && isProcessReference(node.expression)) forbidden = true;
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "globalThis" &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      node.argumentExpression.text === "process"
    )
      forbidden = true;
    if (
      ts.isElementAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      isProcessRef(node.expression.expression) &&
      node.expression.name.text === "env" &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      ["INIT_CWD", "PWD"].includes(node.argumentExpression.text)
    )
      forbidden = true;
    if (
      ts.isPropertyAccessExpression(node) &&
      isProcessRef(node.expression) &&
      node.name.text === "chdir"
    )
      forbidden = true;
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      isProcessRef(node.expression.expression) &&
      node.expression.name.text === "env"
    ) {
      if (["INIT_CWD", "PWD"].includes(node.name.text)) forbidden = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return { calls, forbidden };
}

export function analyzeTestRepositoryIsolation(input: {
  files: Array<{ path: string; source: string }>;
  contracts?: Readonly<Record<string, RepositoryReadContract>>;
}): LintResult {
  const contracts = input.contracts ?? REPOSITORY_READ_CONTRACTS;
  const actual = new Map<string, number>();
  const forbidden: string[] = [];
  for (const file of input.files) {
    const path = file.path.replaceAll("\\", "/");
    const inspected = inspectSource(path, file.source);
    if (inspected.forbidden) {
      forbidden.push(`forbidden-live-root-source:${path}`);
    }
    const calls = inspected.calls;
    if (calls > 0) actual.set(path, calls);
  }
  const violations: string[] = [...forbidden];
  for (const [path, calls] of actual) {
    const contract = contracts[path];
    if (!contract) violations.push(`unclassified:${path}:repository-read=${calls}`);
    else if (contract.mode !== "head_snapshot")
      violations.push(`invalid-mode:${path}:${contract.mode}`);
    else if (contract.calls !== calls)
      violations.push(`callsite-drift:${path}:expected=${contract.calls}:actual=${calls}`);
  }
  for (const path of Object.keys(contracts)) {
    if (!actual.has(path)) violations.push(`stale-contract:${path}`);
  }
  return violations.length === 0
    ? {
        ok: true,
        messages: [`test-repository-isolation - OK (contracts=${actual.size}, live_runtime=0)`],
      }
    : {
        ok: false,
        messages: violations.map(
          (violation) => `test-repository-isolation - violation: ${violation}`,
        ),
      };
}

function testFiles(root: string): Array<{ path: string; source: string }> {
  const testsRoot = join(root, "tests");
  const pending = [testsRoot];
  const files: Array<{ path: string; source: string }> = [];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) break;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push({
          path: relative(root, path).replaceAll("\\", "/"),
          source: readFileSync(path, "utf8"),
        });
      }
    }
  }
  return files;
}

export function checkTestRepositoryIsolation(repoRoot: string): LintResult {
  try {
    return analyzeTestRepositoryIsolation({ files: testFiles(repoRoot) });
  } catch {
    return {
      ok: false,
      messages: ["test-repository-isolation - violation: scan-error"],
    };
  }
}
