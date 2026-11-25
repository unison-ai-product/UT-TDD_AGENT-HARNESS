import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveProjectMemoryRootWithPorts } from "../src/runtime/project-memory-root.ts";
import { defaultHarnessDbPath, openHarnessDb } from "../src/state-db/index.ts";
import { migrate } from "../src/state-db/migration.ts";
import { heavyAfterAll, heavyBeforeAll } from "./support/hook-bounds.ts";
import { ensureTrackedProjectIdentity } from "./support/project-identity-fixture.ts";
import { removeTestTree } from "./support/temp-tree.ts";

interface Command {
  file: "git" | "gh";
  args: string[];
}

const TOPOLOGY = ["rev-parse --show-toplevel", "rev-parse --path-format=absolute --git-common-dir"];
const IDENTITY_READ = [
  "rev-parse --show-object-format",
  "rev-parse HEAD",
  "ls-tree",
  "show",
  "rev-parse HEAD",
  "remote get-url origin",
];
const SESSION_ID = "session-start-identity-read";

function summarizeRootReads(commands: Command[]): string[][] {
  const resolutions: string[][] = [];
  for (const { file, args } of commands) {
    if (file !== "git" || args[0] !== "-C") continue;
    const git = args.slice(2);
    const command = git.join(" ");
    if (command === TOPOLOGY[0]) resolutions.push([]);
    const current = resolutions.at(-1);
    if (!current) continue;
    const signature = git[0] === "ls-tree" || git[0] === "show" ? git[0] : command;
    if (TOPOLOGY.includes(signature) || IDENTITY_READ.includes(signature)) {
      current.push(signature);
    }
  }
  return resolutions;
}

describe("SessionStart project identity reads", () => {
  let root: string;
  let commandLog: Command[];
  let start: ReturnType<typeof startSession>;

  function startSession(cwd: string) {
    return spawnSync(
      process.execPath,
      [
        "--import",
        pathToFileURL(resolve("tests/support/session-start-identity-preload.mjs")).href,
        resolve("src/cli.ts"),
        "session",
        "start",
        "--session",
        SESSION_ID,
      ],
      {
        cwd,
        encoding: "utf8",
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: "",
          UT_TDD_PROJECT_DIR: cwd,
          UT_TDD_SKIP_UPDATE_CHECK: "1",
          GIT_CONFIG_COUNT: "0",
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        timeout: 60_000,
      },
    );
  }

  heavyBeforeAll("db", () => {
    root = realpathSync(mkdtempSync(join(tmpdir(), "ut-session-start-identity-")));
    ensureTrackedProjectIdentity(root, "fixture/session-start-identity");
    const db = openHarnessDb(defaultHarnessDbPath(root), { repoRoot: root });
    try {
      migrate(db);
    } finally {
      db.close();
    }
    start = startSession(root);
    if (start.error) throw start.error;
    if (start.status !== 0) throw new Error(`SessionStart exit ${start.status}: ${start.stderr}`);
    commandLog = readFileSync(join(root, "session-start-commands.jsonl"), "utf8")
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line) as Command);
  });

  heavyAfterAll("teardown", () => {
    if (root) removeTestTree(root);
  });

  it("P-PMEMROOT-006: retains the session event, digest, and GitHub read", () => {
    expect({ status: start.status, signal: start.signal, stderr: start.stderr }).toMatchObject({
      status: 0,
      signal: null,
    });
    expect(start.stdout).toContain(`session-log: start ${SESSION_ID}`);
    expect(start.stdout).toContain(
      "session-start digest (source=harness.db + HEAD + HARNESS memory)",
    );
    expect(start.stdout).toContain("test: seed project identity");
    expect(start.stdout).toContain("inbox: no unclaimed Claude payload");
    const log = readFileSync(
      join(root, ".ut-tdd", "logs", "session", `${SESSION_ID}.jsonl`),
      "utf8",
    );
    const events = log
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
    expect(events).toContainEqual(
      expect.objectContaining({ event_type: "session_start", session_id: SESSION_ID }),
    );
    expect(commandLog.filter(({ file }) => file === "gh")).toEqual([
      {
        file: "gh",
        args: [
          "api",
          expect.stringMatching(/^repos\/fixture\/session-start-identity\/pulls\?.*&page=1$/),
        ],
      },
    ]);

    const resolutions = summarizeRootReads(commandLog);
    expect(resolutions).toHaveLength(3);
    for (const git of resolutions) {
      expect(git.slice(0, 2 + IDENTITY_READ.length)).toEqual([...TOPOLOGY, ...IDENTITY_READ]);
    }
  });

  it.fails("P-PMEMROOT-006: reads identity once in each of the three resolutions", () => {
    const resolutions = summarizeRootReads(commandLog);
    expect(resolutions.map((git) => git.filter((command) => command === "show").length)).toEqual([
      1, 1, 1,
    ]);
  });
});

const win = process.platform === "win32";
const primary = win ? "C:\\dev\\product" : "/dev/product";
const linked = win ? "C:\\dev\\product-worker" : "/dev/product-worker";
const common = win ? `${primary}\\.git` : `${primary}/.git`;

function ports(overrides: Partial<Parameters<typeof resolveProjectMemoryRootWithPorts>[1]> = {}) {
  return {
    gitTopLevel: () => linked,
    gitCommonDir: () => common,
    realpath: (path: string) => path,
    isDirectory: () => true,
    isSafeDescendant: () => true,
    projectIdentity: () => "owner/product",
    ...overrides,
  };
}

describe("Project identity read boundaries", () => {
  it.fails("U-PMEMROOT-010: revalidates identity on a separate root resolution", () => {
    const identityReads: string[] = [];
    let identity: string | null = "owner/product";
    const resolverPorts = ports({
      gitTopLevel: () => primary,
      projectIdentity: (path) => {
        identityReads.push(path);
        return identity;
      },
    });

    const first = resolveProjectMemoryRootWithPorts(primary, resolverPorts);
    const firstReads = identityReads.splice(0);
    expect(first).toMatchObject({
      ok: true,
      projectId: "owner/product",
      canonicalProjectRoot: primary,
      currentWorktreeRoot: primary,
      authoredMemoryRoot: join(primary, ".ut-tdd", "memory"),
    });
    if (!first.ok) throw new Error(first.reason);
    const linkedResult = resolveProjectMemoryRootWithPorts(linked, ports());
    if (!linkedResult.ok) throw new Error(linkedResult.reason);
    expect(first.projectNamespace).toBe(linkedResult.projectNamespace);
    expect(first.runtimeBusRoot).toBe(linkedResult.runtimeBusRoot);

    identity = null;
    expect(resolveProjectMemoryRootWithPorts(primary, resolverPorts)).toEqual({
      ok: false,
      reason: "project_identity_unavailable",
    });
    expect({ first: firstReads, second: identityReads }).toEqual({
      first: [primary],
      second: [primary],
    });
  });

  it.each([
    { canonicalIdentity: "owner/product", expected: { ok: true, projectId: "owner/product" } },
    { canonicalIdentity: "owner/other", expected: { ok: false, reason: "project_identity_drift" } },
    { canonicalIdentity: null, expected: { ok: false, reason: "project_identity_unavailable" } },
  ])("U-PMEMROOT-011: verifies both distinct paths (canonical identity: $canonicalIdentity)", ({
    canonicalIdentity,
    expected,
  }) => {
    const identityReads: string[] = [];
    const result = resolveProjectMemoryRootWithPorts(
      linked,
      ports({
        projectIdentity: (path) => {
          identityReads.push(path);
          return path === linked ? "owner/product" : canonicalIdentity;
        },
      }),
    );
    expect(result).toMatchObject(expected);
    expect(identityReads).toEqual([linked, primary]);
  });
});
