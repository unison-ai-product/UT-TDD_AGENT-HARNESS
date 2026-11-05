import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { buildFullDoctorCheckDefinitions } from "../src/doctor/check-definitions.ts";
import { FULL_DOCTOR_OUTPUT_IDS } from "../src/doctor/profiles.ts";
import { nodeDoctorDeps } from "../src/doctor/runtime-state.ts";
import { analyzeL14CloseAudit, loadL14CloseAuditDocs } from "../src/lint/l14-close-audit.ts";
import * as githubForwardProjection from "../src/state-db/github-forward-projection.ts";
import { headSnapshotRoot } from "./support/workspace-roots.ts";

const snapshotRoot = headSnapshotRoot();

const retiredChecks = [
  "merged-plan-status",
  "plan-body-substance",
  "plan-completion-drift",
  "green-command-digest",
  "review-evidence",
  "guardrail-invariants",
];
const retiredModules = [
  "merged-plan-status",
  "plan-body-substance",
  "plan-completion-drift",
  "green-command-digest",
  "merged-plan-target-evidence",
];

function typescriptPaths(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptPaths(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}

function commandName(node: ts.Node, receiver: string): string | undefined {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "command" ||
    !ts.isIdentifier(node.expression.expression) ||
    node.expression.expression.text !== receiver
  )
    return undefined;
  const argument = node.arguments[0];
  return argument && ts.isStringLiteralLike(argument) ? argument.text : undefined;
}

function githubCommandSurface(source: string): { groupFound: boolean; children: string[] } {
  const file = ts.createSourceFile(
    "src/cli.ts",
    source,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );
  let groupFound = false;
  const children: string[] = [];
  const findGithubGroup = (node: ts.Node): void => {
    if (commandName(node, "program") === "github") groupFound = true;
    ts.forEachChild(node, findGithubGroup);
  };
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "github" &&
      node.initializer
    )
      findGithubGroup(node.initializer);
    const child = commandName(node, "github");
    if (child !== undefined) children.push(child);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return { groupFound, children };
}

function testCallbacks(source: string, path: string): Map<string, string> {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const callbacks = new Map<string, string>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "it" &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      node.arguments[1]
    )
      callbacks.set(node.arguments[0].text, node.arguments[1].getText(file));
    ts.forEachChild(node, visit);
  };
  visit(file);
  return callbacks;
}

function variableInitializer(source: string, path: string, name: string): string | undefined {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  let initializer: string | undefined;
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer
    )
      initializer = node.initializer.getText(file);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return initializer;
}

const retiredGithubWriterExports = [
  "recordGithubBinding",
  "queueGithubProjection",
  "claimGithubProjection",
  "markGithubProjectionApplied",
  "markGithubProjectionFailed",
  "syncForwardProject",
  "persistProjectSync",
  "syncRepositoryBindings",
];

const retiredGithubForwardHelpers = [
  "selectActiveProjectRows",
  "selectExistingProjectPlans",
  "isManualGithubObservationKind",
];

const retiredForwardStoreTestIds = [
  "U-GHPROJ-011",
  "U-GHPROJ-013",
  "U-GHPROJ-014",
  "U-GHPROJ-015",
  "U-GHPROJ-033",
  "U-GHPROJ-038",
  "U-GHPROJ-039",
  "U-GHPROJ-040",
  "U-GHPROJ-041",
  "U-GHPROJ-044",
  "U-GHPROJ-045",
  "U-GHPROJ-052",
];

const retainedForwardStoreTestIds = [
  "U-GHPROJ-010",
  "U-GHPROJ-012",
  "U-GHPROJ-030",
  "U-GHPROJ-031",
  "U-GHPROJ-032",
  "U-GHPROJ-034",
  "U-GHPROJ-035",
  "U-GHPROJ-036",
  "U-GHPROJ-037",
  "U-GHPROJ-046",
  "U-GHPROJ-047",
];

describe("PLAN 機構の S1 退役", () => {
  it("CANDIDATE-U-PLANRET-015: 専用検査・flag・監査の必須参照を同期退役する", () => {
    const checkIds = buildFullDoctorCheckDefinitions(nodeDoctorDeps(snapshotRoot)).map(
      ({ id }) => id,
    );
    for (const id of retiredChecks) {
      expect(checkIds).not.toContain(id);
      expect(FULL_DOCTOR_OUTPUT_IDS).not.toContain(id);
    }
    for (const name of retiredModules) {
      expect(existsSync(join(snapshotRoot, "src", "lint", `${name}.ts`)), name).toBe(false);
      expect(existsSync(join(snapshotRoot, "tests", `${name}.test.ts`)), name).toBe(false);
    }
    const retiredFlag = "--strict-green-command-digest";
    expect(
      readFileSync(join(snapshotRoot, ".github/workflows/harness-check.yml"), "utf8"),
    ).not.toContain(retiredFlag);
    for (const path of typescriptPaths(join(snapshotRoot, "src"))) {
      expect(readFileSync(path, "utf8"), path).not.toContain(retiredFlag);
    }
    const audit = analyzeL14CloseAudit(loadL14CloseAuditDocs(snapshotRoot), snapshotRoot);
    expect(audit.ok, JSON.stringify(audit.violations)).toBe(true);
    const row = audit.rows.find(({ item }) => item === "green-evidence-integrity");
    if (!row) throw new Error("green-evidence-integrity audit row is missing");
    expect(row.status).toBe("closed");
    expect(row.evidencePaths).not.toContain("src/lint/green-command-digest.ts");
    expect(row.evidencePaths).not.toContain("tests/green-command-digest.test.ts");
    expect(row.evidencePaths).toContain(
      ".ut-tdd/audit/A-155-green-command-digest-rebind-2026-07-01.md",
    );
    expect(row.evidencePaths).toContain(
      ".ut-tdd/audit/A-156-pack-repo-default-and-digest-rebind-2026-07-01.md",
    );
  });
});

describe("PLAN 機構の S5 退役", () => {
  it("CANDIDATE-U-PLANRET-014: S5のProject/binding surfaceを退役し、readinessを保持する", () => {
    const cliSource = readFileSync(join(snapshotRoot, "src/cli.ts"), "utf8");
    const github = githubCommandSurface(cliSource);
    expect(github.groupFound).toBe(true);
    expect(github.children).toContain("guard");
    expect(github.children).toContain("pr");
    expect(github.children).not.toContain("project");
    expect(github.children).not.toContain("binding");

    for (const path of [
      "src/github/project-v2.ts",
      "src/github/repository-bindings.ts",
      "tests/github-project-v2.test.ts",
      "tests/github-repository-bindings.test.ts",
    ])
      expect(existsSync(join(snapshotRoot, path)), path).toBe(false);

    const githubForwardExports = Object.keys(githubForwardProjection);
    for (const name of [...retiredGithubWriterExports, ...retiredGithubForwardHelpers])
      expect(githubForwardExports, name).not.toContain(name);
    expect(typeof githubForwardProjection.rebuildExecutionReadiness).toBe("function");

    const forwardStorePath = "tests/github-forward-store.test.ts";
    const forwardStoreSource = readFileSync(join(snapshotRoot, forwardStorePath), "utf8");
    const forwardStoreCases = testCallbacks(forwardStoreSource, forwardStorePath);
    const actualForwardStoreIds = [...forwardStoreCases.keys()]
      .map((title) => title.match(/^U-GHPROJ-\d{3}/)?.[0])
      .filter((id): id is string => id !== undefined)
      .sort();
    for (const id of retiredForwardStoreTestIds)
      expect(actualForwardStoreIds, id).not.toContain(id);
    expect(actualForwardStoreIds).toEqual([...retainedForwardStoreTestIds].sort());

    const pendingCase = [...forwardStoreCases].find(([title]) =>
      title.startsWith("U-GHPROJ-012:"),
    )?.[1];
    expect(pendingCase).toContain("INSERT INTO github_projection_outbox");
    const bindingInitializer = variableInitializer(
      forwardStoreSource,
      forwardStorePath,
      "insertGithubBinding",
    );
    expect(bindingInitializer).toContain("INSERT INTO github_object_bindings");
    expect(forwardStoreSource).not.toContain("recordGithubBinding");
  });
});
