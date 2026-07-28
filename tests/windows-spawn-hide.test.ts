import { describe, expect, it } from "vitest";
import { checkWindowsSpawnHide } from "../src/doctor/rule-quality";
import {
  analyzeWindowsSpawnHide,
  loadWindowsSpawnHideDocs,
  windowsSpawnHideMessages,
} from "../src/lint/windows-spawn-hide";
import { headSnapshotRoot } from "./support/workspace-roots";

const CHILD_PROCESS_IMPORT = 'import { execFileSync, spawn } from "node:child_process";';

describe("windows-spawn-hide lint (issue #123 の残件、PO 報告 2026-07-28)", () => {
  // U-WINSPAWN-001: 実 repo 回帰 — 子プロセス起動はすべて windowsHide 指定
  it("real repo guard has no unhidden child-process spawns", () => {
    const result = analyzeWindowsSpawnHide(loadWindowsSpawnHideDocs(headSnapshotRoot()));
    expect(result.violations).toEqual([]);
    expect(result.checked).toBeGreaterThan(100);
    expect(windowsSpawnHideMessages(result)[0]).toContain("windows-spawn-hide — OK");
  });

  // U-WINSPAWN-002: 負例 — windowsHide の無い spawn は fail-close する
  it("fails closed when a spawn omits windowsHide", () => {
    const result = analyzeWindowsSpawnHide([
      {
        path: "src/example.ts",
        content: [
          CHILD_PROCESS_IMPORT,
          'execFileSync("git", ["status"], { encoding: "utf8" });',
        ].join("\n"),
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toMatchObject({ path: "src/example.ts", api: "execFileSync" });
    expect(windowsSpawnHideMessages(result)[0]).toContain("windowsHide なしの子プロセス起動 1件");
  });

  // U-WINSPAWN-003: 正例 — windowsHide があれば通る (過剰検出の回帰防止)
  it("accepts a spawn that passes windowsHide", () => {
    const result = analyzeWindowsSpawnHide([
      {
        path: "src/example.ts",
        content: [
          CHILD_PROCESS_IMPORT,
          "spawn(command, args, {",
          '  cwd: "/tmp",',
          "  windowsHide: true,",
          "});",
        ].join("\n"),
      },
    ]);
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  // U-WINSPAWN-004: 誤検出しない面 — db.exec / regex.exec は子プロセスではない
  it("does not flag member calls such as db.exec or pattern.exec", () => {
    const result = analyzeWindowsSpawnHide([
      {
        path: "src/db.ts",
        content: [
          CHILD_PROCESS_IMPORT,
          'db.exec("BEGIN");',
          "const match = PATTERN.exec(planId);",
          'execFileSync("git", ["status"], { windowsHide: true });',
        ].join("\n"),
      },
    ]);
    expect(result.violations).toEqual([]);
  });

  // U-WINSPAWN-005: child_process を import しないファイルは走査対象外 (誤検出の主因だった)
  it("ignores files that never import node:child_process", () => {
    const result = analyzeWindowsSpawnHide([
      { path: "src/schema.ts", content: "const match = PATTERN.exec(value);\ndb.exec(sql);" },
    ]);
    expect(result.violations).toEqual([]);
  });

  // U-WINSPAWN-006: doctor 面 — 実 repo で OK を返し、gate として配線されている
  it("surfaces the guard through doctor", () => {
    const check = checkWindowsSpawnHide(headSnapshotRoot());
    expect(check.ok).toBe(true);
    expect(check.messages.join("\n")).toContain("windows-spawn-hide");
  });

  // U-WINSPAWN-007: doctor 面の fail-close — 読めない repo root は違反として返す
  it("fails closed when the repo root cannot be read", () => {
    const check = checkWindowsSpawnHide("no-such-directory-for-windows-spawn-hide");
    expect(check.ok).toBe(false);
    expect(check.messages.join("\n")).toContain("repo root could not be read");
  });
});
