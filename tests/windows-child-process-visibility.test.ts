import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const CHILD_CALLS = new Set(["spawn", "spawnSync", "execFileSync", "execSync"]);

describe("Windows noninteractive child-process visibility", () => {
  it("U-WINPROC-001: production/hooks/scriptsの直接child_process起動はwindowsHideを明示する", () => {
    const files = execFileSync(
      "rg",
      [
        "-l",
        String.raw`\b(spawnSync|execFileSync|execSync|spawn)\(`,
        ".claude/hooks",
        "scripts",
        "src",
        "--glob",
        "*.ts",
      ],
      { encoding: "utf8", windowsHide: true },
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    const violations: string[] = [];

    for (const file of files) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          const name = node.expression.text;
          if (CHILD_CALLS.has(name)) {
            const options = node.arguments[name === "execSync" ? 1 : 2];
            const explicitlyHidden =
              options &&
              ts.isObjectLiteralExpression(options) &&
              options.properties.some(
                (property) =>
                  (ts.isPropertyAssignment(property) &&
                    property.name.getText(source) === "windowsHide" &&
                    property.initializer.kind === ts.SyntaxKind.TrueKeyword) ||
                  (ts.isSpreadAssignment(property) &&
                    property.expression.getText(source).includes("snapshotChildProcessOptions")),
              );
            const forwardedHiddenOptions =
              file.replaceAll("\\", "/") === "src/state-db/stop-refresh.ts" &&
              name === "spawn" &&
              options?.getText(source) === "opts";
            if (!explicitlyHidden && !forwardedHiddenOptions) {
              const position = source.getLineAndCharacterOfPosition(node.getStart(source));
              violations.push(`${file}:${position.line + 1}:${name}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }

    expect(violations).toEqual([]);
  });
});
