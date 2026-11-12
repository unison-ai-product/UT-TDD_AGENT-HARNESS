import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureTrackedProjectIdentity } from "./project-identity-fixture.ts";

/**
 * Seeds one tracked git repo (build) and hands out an identical, isolated copy
 * per test (copy). Each copy keeps its own .git, so runtime state under the
 * git common dir is per-test. dispose removes the template.
 */
export function seedFixtureTemplate(repositoryIdentity: string, prefix: string) {
  let template: string | undefined;
  return {
    build(): void {
      template = mkdtempSync(join(tmpdir(), `${prefix}-template-`));
      ensureTrackedProjectIdentity(template, repositoryIdentity);
    },
    copy(): string {
      if (template === undefined) throw new Error("fixture template is not built");
      const root = mkdtempSync(join(tmpdir(), `${prefix}-`));
      cpSync(template, root, { recursive: true });
      return root;
    },
    dispose(): void {
      if (template !== undefined) rmSync(template, { recursive: true, force: true });
      template = undefined;
    },
  };
}
