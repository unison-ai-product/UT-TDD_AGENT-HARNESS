import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function createsPersistedHarnessDb(path: string, source: string): boolean {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const tracked = new Map<string, string>();
  const namespaces = new Set<string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings) continue;
    if (ts.isNamespaceImport(statement.importClause.namedBindings)) {
      namespaces.add(statement.importClause.namedBindings.name.text);
      continue;
    }
    if (!ts.isNamedImports(statement.importClause.namedBindings)) continue;
    for (const element of statement.importClause.namedBindings.elements) {
      const imported = element.propertyName?.text ?? element.name.text;
      if (
        [
          "defaultHarnessDbPath",
          "ensureHarnessSchema",
          "openHarnessDb",
          "rebuildHarnessDb",
        ].includes(imported)
      )
        tracked.set(element.name.text, imported);
    }
  }
  let persisted = false;
  const visit = (node: ts.Node): void => {
    if (!ts.isCallExpression(node)) {
      ts.forEachChild(node, visit);
      return;
    }
    const called = ts.isIdentifier(node.expression)
      ? (tracked.get(node.expression.text) ?? node.expression.text)
      : ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          namespaces.has(node.expression.expression.text)
        ? node.expression.name.text
        : "";
    if (["defaultHarnessDbPath", "ensureHarnessSchema"].includes(called)) persisted = true;
    if (called === "openHarnessDb") {
      const dbPath = node.arguments[0];
      if (!dbPath || !ts.isStringLiteralLike(dbPath) || dbPath.text !== ":memory:")
        persisted = true;
    }
    if (called === "rebuildHarnessDb" && ts.isObjectLiteralExpression(node.arguments[0])) {
      const suppliesDb = node.arguments[0].properties.some(
        (property) =>
          (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) &&
          property.name.getText(file) === "db",
      );
      if (!suppliesDb) persisted = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return persisted;
}

function usesRawRecursiveTreeRemoval(path: string, source: string): boolean {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const aliases = new Set(["rmSync"]);
  const namespaces = new Set<string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings) continue;
    if (ts.isNamespaceImport(statement.importClause.namedBindings)) {
      namespaces.add(statement.importClause.namedBindings.name.text);
      continue;
    }
    if (!ts.isNamedImports(statement.importClause.namedBindings)) continue;
    for (const element of statement.importClause.namedBindings.elements) {
      if ((element.propertyName?.text ?? element.name.text) === "rmSync")
        aliases.add(element.name.text);
    }
  }
  let raw = false;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) && aliases.has(node.expression.text)) ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          namespaces.has(node.expression.expression.text) &&
          node.expression.name.text === "rmSync"))
    ) {
      const options = node.arguments[1];
      if (
        options &&
        ts.isObjectLiteralExpression(options) &&
        options.properties.some(
          (property) =>
            ts.isPropertyAssignment(property) &&
            property.name.getText(file) === "recursive" &&
            property.initializer.kind === ts.SyntaxKind.TrueKeyword,
        )
      )
        raw = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return raw;
}

describe("persistent harness DB cleanup contract", () => {
  it("U-TESTHYGIENE-026: resolves namespace DB owners and namespace recursive removal", () => {
    expect(
      createsPersistedHarnessDb(
        "tests/nested/owner.test.ts",
        "import * as db from '../src/db'; db.ensureHarnessSchema(root);",
      ),
    ).toBe(true);
    expect(
      usesRawRecursiveTreeRemoval(
        "tests/nested/owner.test.ts",
        "import * as fs from 'node:fs'; fs.rmSync(root, { recursive: true });",
      ),
    ).toBe(true);
  });

  it("U-TESTHYGIENE-019: auto-discovers every persisted DB owner and requires retrying cleanup", () => {
    const root = process.cwd();
    const pending = [join(root, "tests")];
    const files: Array<{ path: string; source: string }> = [];
    while (pending.length > 0) {
      const directory = pending.pop();
      if (!directory) break;
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) pending.push(path);
        else if (entry.isFile() && entry.name.endsWith(".test.ts"))
          files.push({
            path: relative(root, path).replaceAll("\\", "/"),
            source: readFileSync(path, "utf8"),
          });
      }
    }
    const owners = files.filter((file) => createsPersistedHarnessDb(file.path, file.source));

    expect(owners.length).toBeGreaterThan(0);
    for (const owner of owners) {
      expect(owner.source, owner.path).toContain('from "./support/temp-tree"');
      expect(owner.source, owner.path).toMatch(/removeTestTree(?:\(|;)/);
      expect(usesRawRecursiveTreeRemoval(owner.path, owner.source), owner.path).toBe(false);
    }
  });
});
