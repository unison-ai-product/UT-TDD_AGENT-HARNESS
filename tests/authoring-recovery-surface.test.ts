import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("authoring recovery runtime surfaces", () => {
  it("blocks SessionStart before any session side effect", () => {
    const cli = readFileSync("src/cli.ts", "utf8");
    const action = cli.slice(cli.indexOf('.command("start")'), cli.indexOf('.command("summary")'));
    expect(action.indexOf("assertNoUnresolvedAuthoringRecovery")).toBeGreaterThan(-1);
    expect(action.indexOf("assertNoUnresolvedAuthoringRecovery")).toBeLessThan(
      action.indexOf("runSessionStartSideEffects"),
    );
    expect(action.indexOf("assertNoUnresolvedAuthoringRecovery")).toBeLessThan(
      action.indexOf("dispatch(input"),
    );
  });

  it("runs the recovery gate before collecting or scanning pushed commits", () => {
    const hook = readFileSync("scripts/git-hooks/pre-push", "utf8");
    const recoveryCommand = 'bun "$' + '{hook_dir}/authoring-recovery-gate.ts"';
    expect(hook.indexOf(recoveryCommand)).toBeGreaterThan(-1);
    expect(hook.indexOf(recoveryCommand)).toBeLessThan(
      hook.indexOf('entries="$(collect_pushed_entries)"'),
    );
  });
});
