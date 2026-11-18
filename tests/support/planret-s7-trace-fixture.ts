import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeLayerPairGate } from "../../src/gate/static.ts";
import { loadPairDocs } from "../../src/vmodel/lint.ts";
import { removeTestTree } from "./temp-tree.ts";

const roots: string[] = [];
export function cleanupTraceFixtures(): void {
  for (const dir of roots.splice(0)) removeTestTree(dir);
}

/** (h): trace の対象文書 1 つだけを欠落させた、実 repo の design / test-design の複製。 */
export function copyDocsWithout(realRoot: string, missingDoc: string): string {
  const dir = mkdtempSync(join(tmpdir(), "planret-s7-h-"));
  roots.push(dir);
  for (const base of ["docs/design/harness", "docs/test-design/harness"]) {
    mkdirSync(join(dir, base), { recursive: true });
    cpSync(join(realRoot, base), join(dir, base), { recursive: true });
  }
  rmSync(join(dir, missingDoc));
  return dir;
}

/** layer-pair の判定そのもの (trace を含まない)。 */
export function layerPairOk(root: string, gate: "G1" | "G3", layer: "L1" | "L3"): boolean {
  return analyzeLayerPairGate(loadPairDocs(root), gate, {
    layer,
    l10PairPath: "docs/test-design/harness/L10-ux-validation-test-design.md",
  }).ok;
}
