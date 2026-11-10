/**
 * Inline source used by the generated consumer launcher. Keeping this fragment
 * separate keeps consumer-node-runtime focused on bundle validation while the
 * emitted launcher remains a single self-contained ESM file.
 */
export const CONSUMER_RUNTIME_ABSENT_WRAPPER_SOURCE = [
  "const runtimeAbsent = () => {",
  "  const worktreeRoot = consumerRoot ?? process.cwd();",
  '  let mainLauncher = "<main worktree>/.ut-tdd/bin/ut-tdd.mjs";',
  '  let mainExplanation = " (resolve <main worktree> from git rev-parse --git-common-dir)";',
  "  try {",
  '    const common = resolve(worktreeRoot, execFileSync("git", ["rev-parse", "--git-common-dir"], {',
  "      cwd: worktreeRoot,",
  '      encoding: "utf8",',
  '      stdio: ["ignore", "pipe", "ignore"],',
  "    }).trim());",
  '    mainLauncher = resolve(dirname(common), ".ut-tdd", "bin", "ut-tdd.mjs");',
  '    mainExplanation = "";',
  "  } catch {}",
  "  const quote = String.fromCharCode(34);",
  '  console.error("consumer_runtime_absent: runtime is missing from this worktree. Run: node " + quote + mainLauncher + quote + " setup --worktree " + quote + worktreeRoot + quote + mainExplanation);',
  "  process.exit(2);",
  "};",
].join("\n");
