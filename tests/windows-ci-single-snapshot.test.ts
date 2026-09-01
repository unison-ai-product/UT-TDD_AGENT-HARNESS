import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const RUNNER = "node scripts/run-vitest-snapshot.ts";
const FAST_EXCLUDES = [
  "tests/cli-surface.test.ts",
  "tests/db-projection-ingestion.test.ts",
  "tests/distribution-acceptance.test.ts",
  "tests/doctor.test.ts",
  "tests/drive-db-registration.test.ts",
  "tests/projection-writer.test.ts",
  "tests/review-green-command-projection.test.ts",
  "tests/runtime-hook-entrypoints.test.ts",
] as const;
const CLI_FILES = [
  "tests/cli-surface.test.ts",
  "tests/distribution-acceptance.test.ts",
  "tests/runtime-hook-entrypoints.test.ts",
] as const;
const CLI_FILE_SET = new Set<string>(CLI_FILES);
const WINDOWS_EXCLUDES = FAST_EXCLUDES.filter((file) => !CLI_FILE_SET.has(file));

interface PackageDocument {
  scripts?: Record<string, unknown>;
}

function packageDocument(): PackageDocument {
  return JSON.parse(readFileSync("package.json", "utf8")) as PackageDocument;
}

function runnerArguments(command: unknown, scriptName: string): string[] {
  if (typeof command !== "string" || !command.startsWith(`${RUNNER} `)) {
    throw new Error(`${scriptName} must invoke the sealed snapshot runner`);
  }
  return command.slice(RUNNER.length + 1).trim().split(/\s+/).filter(Boolean);
}

function assertWindowsSnapshotContract(document: PackageDocument): void {
  const scripts = document.scripts;
  if (!scripts) throw new Error("package.json scripts must be present");

  const fastArguments = runnerArguments(scripts["test:fast"], "test:fast");
  expect(fastArguments).toEqual(
    FAST_EXCLUDES.flatMap((file) => ["--exclude", file]),
  );

  const cliArguments = runnerArguments(scripts["test:cli"], "test:cli");
  expect(cliArguments).toEqual([...CLI_FILES]);

  const windowsArguments = runnerArguments(scripts["test:windows"], "test:windows");
  expect(windowsArguments).toEqual(
    WINDOWS_EXCLUDES.flatMap((file) => ["--exclude", file]),
  );
}

function mutatedPackage(mutator: (scripts: Record<string, unknown>) => void): PackageDocument {
  const document = packageDocument();
  if (!document.scripts) throw new Error("test fixture must contain package scripts");
  mutator(document.scripts);
  return document;
}

describe("Issue #490 Windows single sealed snapshot contract", () => {
  it("U-CI490-001: keeps test:fast and test:cli and defines test:windows as F union C", () => {
    expect(() => assertWindowsSnapshotContract(packageDocument())).not.toThrow();
  });

  it.each([
    ["missing test:fast", (scripts: Record<string, unknown>) => delete scripts["test:fast"]],
    ["empty test:fast", (scripts: Record<string, unknown>) => (scripts["test:fast"] = "")],
    [
      "wrong test:fast runner",
      (scripts: Record<string, unknown>) => (scripts["test:fast"] = "vitest run"),
    ],
    ["missing test:cli", (scripts: Record<string, unknown>) => delete scripts["test:cli"]],
    ["empty test:cli", (scripts: Record<string, unknown>) => (scripts["test:cli"] = "")],
    [
      "wrong test:cli runner",
      (scripts: Record<string, unknown>) => (scripts["test:cli"] = "vitest run tests/cli-surface.test.ts"),
    ],
  ])("U-CI490-002: rejects %s", (_label, mutator) => {
    expect(() => assertWindowsSnapshotContract(mutatedPackage(mutator))).toThrow();
  });

  it.each([
    [
      "missing exclusion",
      (scripts: Record<string, unknown>) =>
        (scripts["test:windows"] = `${RUNNER} ${WINDOWS_EXCLUDES.slice(1).flatMap((file) => ["--exclude", file]).join(" ")}`),
    ],
    [
      "unknown path",
      (scripts: Record<string, unknown>) =>
        (scripts["test:windows"] = `${RUNNER} ${WINDOWS_EXCLUDES.flatMap((file) => ["--exclude", file]).join(" ")} --exclude tests/unknown.test.ts`),
    ],
    [
      "CLI path excluded again",
      (scripts: Record<string, unknown>) =>
        (scripts["test:windows"] = `${RUNNER} ${WINDOWS_EXCLUDES.flatMap((file) => ["--exclude", file]).join(" ")} --exclude ${CLI_FILES[0]}`),
    ],
    [
      "duplicate exclusion",
      (scripts: Record<string, unknown>) =>
        (scripts["test:windows"] = `${RUNNER} --exclude ${WINDOWS_EXCLUDES[0]} ${WINDOWS_EXCLUDES.flatMap((file) => ["--exclude", file]).join(" ")}`),
    ],
    [
      "raw vitest",
      (scripts: Record<string, unknown>) => (scripts["test:windows"] = "vitest run"),
    ],
    [
      "second snapshot invocation",
      (scripts: Record<string, unknown>) =>
        (scripts["test:windows"] = `${RUNNER} ${WINDOWS_EXCLUDES.flatMap((file) => ["--exclude", file]).join(" ")} && ${RUNNER}`),
    ],
  ])("U-CI490-003: rejects test:windows mutation %s", (_label, mutator) => {
    expect(() => assertWindowsSnapshotContract(mutatedPackage(mutator))).toThrow();
  });
});
