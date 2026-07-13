import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function createsPersistedHarnessDb(path: string, source: string): boolean {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  let persisted = false;
  const visit = (node: ts.Node): void => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) {
      ts.forEachChild(node, visit);
      return;
    }
    if (["defaultHarnessDbPath", "ensureHarnessSchema"].includes(node.expression.text))
      persisted = true;
    if (
      node.expression.text === "rebuildHarnessDb" &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const suppliesDb = node.arguments[0].properties.some(
        (property) => ts.isPropertyAssignment(property) && property.name.getText(file) === "db",
      );
      if (!suppliesDb) persisted = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return persisted;
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
    }
  });
});
