import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeBunDependencies,
  BUN_SURFACES,
  BUN_WITHDRAWAL_STEPS,
  type BunDependencyDoc,
  bunInventoryMessages,
  crossCheckPlanSurfaces,
  loadBunDependencyDocs,
  stripStringLiterals,
} from "../src/lint/bun-dependency-inventory";

const REPO_ROOT = join(__dirname, "..");
const PLAN_PATH = "docs/plans/PLAN-L7-462-bun-runtime-withdrawal.md";

function doc(path: string, text: string): BunDependencyDoc {
  return { path, text };
}

describe("bun dependency classifier", () => {
  it("classifies real bun runtime invocation as execution", () => {
    const result = analyzeBunDependencies([
      doc("package.json", '{"scripts":{"dev":"bun run src/cli.ts"}}'),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["execution"]);
    expect(result.points[0].withdrawalStep).toBe("step-2");
  });

  it("classifies bun: imports and Bun global calls as api", () => {
    const result = analyzeBunDependencies([
      doc(
        "src/state-db/index.ts",
        'import { Database } from "bun:sqlite";\nBun.write(target, body);\n',
      ),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["api", "api"]);
  });

  it("counts a runtime-branched dynamic bun: require as api", () => {
    // src/state-db/index.ts の二重ドライバ形。static import が無いので grep では見えない。
    const result = analyzeBunDependencies([
      doc("src/state-db/index.ts", '  const { Database } = nodeRequire("bun:sqlite") as {\n'),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["api"]);
  });

  it("treats a bun: specifier used as detector data as policy, not api", () => {
    const result = analyzeBunDependencies([
      doc(
        "src/lint/runtime-portability.ts",
        '  if (stateDb.text.includes("bun:sqlite")) return [];\n',
      ),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["policy"]);
  });

  it("does not mistake a string-literal Bun name in a detector table for an api call", () => {
    // src/doctor/test-repository-isolation.ts の検出テーブルと同型。実行経路ではない。
    const result = analyzeBunDependencies([
      doc(
        "src/doctor/test-repository-isolation.ts",
        '  "Bun.write": [0],\n    return "Bun.write";\n',
      ),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["policy", "policy"]);
    expect(result.byCoupling.api).toBe(0);
  });

  it("does not match bun as a substring of another word", () => {
    // 実測で出た誤検出: `ubuntu-latest` / `AuthoringBundle` / 正規表現内の `\\bunimplemented`。
    const result = analyzeBunDependencies([
      doc(".github/workflows/harness-check.yml", "    runs-on: ubuntu-latest\n"),
      doc("src/disposition/adapters/tracked-vmodel-loader.ts", "  bundle: AuthoringBundle;\n"),
      doc("src/lint/l7-completion.ts", "  if (/\\bunimplemented module\\b/i.test(line)) {\n"),
    ]);
    expect(result.points).toHaveLength(0);
  });

  it("still detects bun in camelCase identifiers and env constants", () => {
    const result = analyzeBunDependencies([
      doc("src/setup/distribution.ts", "  const bunOk = Boolean(input.bunVersion);\n"),
      doc("scripts/run-vitest-snapshot.ts", "      UT_TDD_BUN_BINARY: bun,\n"),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["toolchain", "execution"]);
  });

  it("classifies installer and lockfile wiring as toolchain", () => {
    const result = analyzeBunDependencies([
      doc(".github/workflows/harness-check.yml", "        uses: oven-sh/setup-bun@v2\n"),
    ]);
    expect(result.points.map((point) => point.coupling)).toEqual(["toolchain"]);
  });

  it("fails closed on an unrecognized bun coupling shape", () => {
    const result = analyzeBunDependencies([
      doc("src/runtime/frobnicate.ts", "await frobnicate(bunSpecificThing());\n"),
    ]);
    expect(result.ok).toBe(false);
    expect(result.unclassified).toHaveLength(1);
    expect(bunInventoryMessages(result)[0]).toContain("unclassified 1");
  });

  it("ignores files outside the declared surface catalog", () => {
    const result = analyzeBunDependencies([doc("docs/plans/PLAN-L7-462.md", "bun を撤退する")]);
    expect(result.scanned).toBe(0);
    expect(result.points).toHaveLength(0);
  });

  it("strips string literals without dropping surrounding code", () => {
    expect(stripStringLiterals('const a = "bun"; Bun.write(x);')).toBe(
      'const a = ""; Bun.write(x);',
    );
  });
});

describe("bun surface catalog", () => {
  it("declares a known withdrawal step for every surface", () => {
    for (const surface of BUN_SURFACES) {
      expect(BUN_WITHDRAWAL_STEPS).toContain(surface.withdrawalStep);
      expect(surface.description.length).toBeGreaterThan(0);
    }
    expect(new Set(BUN_SURFACES.map((surface) => surface.id)).size).toBe(BUN_SURFACES.length);
  });
});

describe("real repository inventory (PLAN-L7-462 R3 spike oracle)", () => {
  const docs = loadBunDependencyDocs(REPO_ROOT);
  const result = analyzeBunDependencies(docs);

  it("scans every declared surface that exists in the repository", () => {
    const scannedSurfaces = new Set(result.points.map((point) => point.surface));
    // lockfile / core-source 以外の全 surface は HEAD に実体があるので必ず点が立つ。
    for (const id of [
      "claude-hooks",
      "package-scripts",
      "ci-workflow",
      "os-entrypoint",
      "test-runner",
      "git-hook",
    ]) {
      expect(scannedSurfaces, `surface ${id} must be inventoried`).toContain(id);
    }
    expect(result.scanned).toBeGreaterThan(0);
  });

  it("classifies every bun mention on the runtime surfaces (fail-close on drift)", () => {
    const sample = result.unclassified
      .slice(0, 10)
      .map((point) => `${point.path}:${point.line} ${point.evidence}`)
      .join("\n");
    expect(result.unclassified, `unclassified bun couplings:\n${sample}`).toHaveLength(0);
    expect(result.ok).toBe(true);
  });

  it("gives every inventoried point a surface, step and evidence", () => {
    for (const point of result.points) {
      expect(point.surface.length).toBeGreaterThan(0);
      expect(BUN_WITHDRAWAL_STEPS).toContain(point.withdrawalStep);
      expect(point.evidence.length).toBeGreaterThan(0);
      expect(point.line).toBeGreaterThan(0);
    }
  });

  it("still holds bun execution coupling on the entrypoint surfaces (withdrawal not yet done)", () => {
    // 撤退が完了したら本 assertion は逆転させる (step-1/2 の完了 oracle)。
    expect(result.byCoupling.execution).toBeGreaterThan(0);
    expect(result.blockingSurfaces.length).toBeGreaterThan(0);
  });

  it("keeps PLAN-L7-462 dependency table and the surface catalog bidirectionally consistent", () => {
    const planText = readFileSync(join(REPO_ROOT, PLAN_PATH), "utf8");
    const crossCheck = crossCheckPlanSurfaces(planText);
    expect(crossCheck.planRows.length).toBe(BUN_SURFACES.length);
    expect(crossCheck.missingInPlan).toEqual([]);
    expect(crossCheck.unknownInPlan).toEqual([]);
    expect(crossCheck.stepMismatch).toEqual([]);
    expect(crossCheck.ok).toBe(true);
  });
});
