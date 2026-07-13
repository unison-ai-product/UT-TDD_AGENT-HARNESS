import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function createsPersistedHarnessDb(path: string, source: string): boolean {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const tracked = new Map<string, string>();
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    )
      continue;
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
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) {
      ts.forEachChild(node, visit);
      return;
    }
    const called = tracked.get(node.expression.text) ?? node.expression.text;
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
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    )
      continue;
    for (const element of statement.importClause.namedBindings.elements) {
      if ((element.propertyName?.text ?? element.name.text) === "rmSync")
        aliases.add(element.name.text);
    }
  }
  let raw = false;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      aliases.has(node.expression.text)
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
  it("U-TESTHYGIENE-019: auto-discovers every persisted DB owner and requires retrying cleanup", () => {
    const root = process.cwd();
    const owners = readdirSync(join(root, "tests"))
      .filter((name) => name.endsWith(".test.ts"))
      .map((name) => ({
        path: `tests/${name}`,
        source: readFileSync(join(root, "tests", name), "utf8"),
      }))
      .filter((file) => createsPersistedHarnessDb(file.path, file.source));

    expect(owners.length).toBeGreaterThan(0);
    for (const owner of owners) {
      expect(owner.source, owner.path).toContain('from "./support/temp-tree"');
      expect(owner.source, owner.path).toMatch(/removeTestTree(?:\(|;)/);
      expect(usesRawRecursiveTreeRemoval(owner.path, owner.source), owner.path).toBe(false);
    }
  });
});
