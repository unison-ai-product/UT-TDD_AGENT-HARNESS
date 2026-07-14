import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { normalizePath } from "../../shared/source-text";
import type { ProjectionPlanSource } from "../domain/plan-projection";

/** Repository I/O を plan projection から隔離する source adapter。 */
export function loadRepositoryPlanSources(repoRoot: string): readonly ProjectionPlanSource[] {
  const plansRoot = join(repoRoot, "docs", "plans");
  return readdirSync(plansRoot)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const path = join(plansRoot, name);
      return Object.freeze({
        path: normalizePath(relative(repoRoot, path)),
        content: readFileSync(path, "utf8"),
      });
    });
}
