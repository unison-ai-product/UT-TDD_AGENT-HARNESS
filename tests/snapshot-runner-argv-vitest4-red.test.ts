import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSnapshotRunnerArgs } from "../scripts/run-vitest-snapshot.ts";

// 契約: docs/design/harness/L6-function-design/snapshot-runner-argv.md §2.1 / I5 (issue #1247)

const VALUE_PROBE = "1";

function allowedOptionsReportedByRunner(): string[] {
  const parsed = parseSnapshotRunnerArgs(["--not-a-vitest-option"]);
  if (parsed.kind !== "unknown-option") throw new Error("runner did not report its allowlist");
  const match = /Allowed options: (.+?)\. To pass/.exec(parsed.message);
  if (!match) throw new Error(`allowlist not found in diagnostic: ${parsed.message}`);
  return match[1].split(", ");
}

// 固定版 Vitest の実際の CLI 定義 (stub なし) を cli.js が import する chunk から取り出す。
async function loadRealVitestCli(): Promise<
  () => {
    parse: (argv: string[], o: { run: boolean }) => unknown;
    matchedCommand: { checkUnknownOptions: () => void };
  }
> {
  const root = dirname(createRequire(import.meta.url).resolve("vitest/package.json"));
  const cliSource = readFileSync(join(root, "dist", "cli.js"), "utf8");
  const chunk = /import \{ c as createCLI \} from '(\.\/chunks\/[^']+)'/.exec(cliSource);
  if (!chunk) throw new Error("createCLI chunk not found in vitest/dist/cli.js");
  const mod = await import(pathToFileURL(join(root, "dist", chunk[1])).href);
  return mod.c;
}

describe("snapshot runner argv vs pinned Vitest (issue #1247)", () => {
  it.fails("U-SNAPARG-003 rejects --minWorkers (removed in Vitest 4) as an unknown option", () => {
    for (const args of [["--minWorkers=1"], ["--minWorkers", "1"]]) {
      const parsed = parseSnapshotRunnerArgs(args);
      expect(parsed.kind).toBe("unknown-option");
      if (parsed.kind === "unknown-option") expect(parsed.token).toBe("--minWorkers");
    }
  });

  it("U-SNAPARG-004 every allowlisted option is accepted by the real pinned Vitest CLI", async () => {
    const createCLI = await loadRealVitestCli();
    const options = allowedOptionsReportedByRunner();
    expect(options.length).toBeGreaterThan(0);
    const rejected: string[] = [];
    for (const option of options) {
      const argv = option === "--browser" ? [option] : [option, VALUE_PROBE];
      const cli = createCLI();
      try {
        cli.parse(["node", "vitest", "run", ...argv], { run: false });
        cli.matchedCommand.checkUnknownOptions();
      } catch (error) {
        rejected.push(`${option}: ${(error as Error).message.split("\n")[0]}`);
      }
    }
    expect(rejected).toEqual([]);
  });
});
