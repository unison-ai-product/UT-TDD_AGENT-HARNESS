import { spawnSync } from "node:child_process";
import { appendFileSync, rmSync } from "node:fs";
import { relative, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const runnerTemp = resolve(process.env.RUNNER_TEMP ?? process.env.TEMP ?? ".");
const headRoot = resolve(runnerTemp, "ut-tdd-node-head");
const githubEnv = process.env.GITHUB_ENV;
if (!githubEnv) throw new Error("node-bootstrap-test-fence requires GITHUB_ENV");
if (relative(runnerTemp, headRoot) !== "ut-tdd-node-head") {
  throw new Error("node-bootstrap-test-fence target escaped runner temp");
}

function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (result.status !== 0 || result.error) {
    throw new Error(`git ${args.join(" ")} failed: ${result.error?.message ?? result.stderr}`);
  }
}

rmSync(headRoot, { recursive: true, force: true });
git(["clone", "--no-hardlinks", "--no-checkout", repoRoot, headRoot], repoRoot);
git(["checkout", "--detach", "HEAD"], headRoot);
appendFileSync(
  githubEnv,
  [
    `UT_TDD_TEST_EXECUTION_ROOT=${repoRoot}`,
    `UT_TDD_TEST_FENCE_ROOT=${repoRoot}`,
    `UT_TDD_HEAD_SNAPSHOT_ROOT=${headRoot}`,
    "",
  ].join("\n"),
  "utf8",
);
