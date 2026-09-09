import type { LintResult } from "../plan/lint.ts";
import { inspectProjectMemoryCompletion } from "../runtime/project-memory-completion-fence.ts";

export function checkMemoryMigrationCompletion(repoRoot: string): LintResult {
  const result = inspectProjectMemoryCompletion(repoRoot);
  if (result.ok) {
    return {
      ok: true,
      messages: [
        `memory-migration-completion - OK (operation=${result.operationId}, inventory=${result.inventoryDigest})`,
      ],
    };
  }
  return {
    ok: false,
    messages: [`memory-migration-completion - violation: ${result.reason}`],
  };
}
