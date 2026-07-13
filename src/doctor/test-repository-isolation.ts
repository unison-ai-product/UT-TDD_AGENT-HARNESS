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
  return ts.isIdentifier(node) && node.text === "process";
}

function isCwdAccess(node: ts.Node): node is ts.PropertyAccessExpression {
  return (
    ts.isPropertyAccessExpression(node) &&
    isProcessReference(node.expression) &&
    node.name.text === "cwd"
  );
}

const REPOSITORY_READ_APIS = new Set([
  "accessSync",
  "existsSync",
  "file",
  "lstatSync",
  "readFileSync",
  "readdirSync",
  "statSync",
]);
const REPOSITORY_PATH =
  /^(?:\.?(?:\/|\\))?(?:\.claude|\.codex|\.github|\.ut-tdd|docs|scripts|skills|src|tests)(?:\/|\\)|^(?:AGENTS\.md|CLAUDE\.md|package\.json|tsconfig\.json|vitest\.config\.ts)$/;

function isDirectRepositoryRead(node: ts.CallExpression): boolean {
  const name = ts.isIdentifier(node.expression)
    ? node.expression.text
    : ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : null;
  const target = node.arguments[0];
  return Boolean(
    name &&
      REPOSITORY_READ_APIS.has(name) &&
      target &&
      ts.isStringLiteralLike(target) &&
      REPOSITORY_PATH.test(target.text),
  );
}

function inspectSource(path: string, source: string): { calls: number; forbidden: boolean } {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
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
    if (ts.isCallExpression(node) && isCwdAccess(node.expression)) calls += 1;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "headSnapshotRoot"
    )
      calls += 1;
    if (ts.isCallExpression(node) && isDirectRepositoryRead(node)) calls += 1;
    else if (
      isCwdAccess(node) &&
      !(ts.isCallExpression(node.parent) && node.parent.expression === node)
    )
      forbidden = true;
    if (ts.isElementAccessExpression(node) && isProcessReference(node.expression)) forbidden = true;
    if (
      ts.isPropertyAccessExpression(node) &&
      isProcessReference(node.expression) &&
      node.name.text === "chdir"
    )
      forbidden = true;
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      isProcessReference(node.expression.expression) &&
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
    return { ok: false, messages: ["test-repository-isolation - violation: scan-error"] };
  }
}
