import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CODEX_REQUIRED } from "../src/lint/codex-hook-adapter-policy.ts";

const repoRoot = process.cwd();

/** `blockOnFailure` の出現ごとに前後の文脈を返す (記述が「未対応・拒否」の文脈かを調べる入力)。 */
function blockOnFailureContexts(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/blockOnFailure/g)) {
    const at = m.index ?? 0;
    out.push(text.slice(Math.max(0, at - 160), at + 160));
  }
  return out;
}

const REJECTED_CONTEXT = /unsupported|rejected|not supported|未対応|拒否|持たない|無い|無視/;
const EXPLICIT_DENY = /確定 deny|confirmed deny|explicit deny/;
const UNMEASURED = /未実測|unmeasured|not measured/;

function agentsCodexHookSection(): string {
  const text = readFileSync(join(repoRoot, "AGENTS.md"), "utf8");
  const start = text.indexOf("Codex enforces the same guardrails");
  expect(start).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}

function lintHeaderComment(): string {
  const text = readFileSync(join(repoRoot, "src", "lint", "codex-hook-adapter.ts"), "utf8");
  const end = text.indexOf("*/");
  expect(end).toBeGreaterThan(0);
  return text.slice(0, end);
}

describe("CANDIDATE-U-HOOKEXEC-015/016: Codex hook failure policy (Issue #1538)", () => {
  // Red: CODEX_REQUIRED の guard entry が blockOnFailure: true を持つため、assertion の不一致で赤になる。
  it.fails("CANDIDATE-U-HOOKEXEC-015: CODEX_REQUIRED has no blockOnFailure property", () => {
    const ids = CODEX_REQUIRED.map((entry) => entry.id);
    // 検査を空で通す実装 (guard entry ごと消す) を拒否する。
    expect(ids).toContain("agent-guard");
    expect(ids).toContain("work-guard");
    for (const entry of CODEX_REQUIRED) {
      expect(Object.hasOwn(entry, "blockOnFailure"), `${entry.id} carries blockOnFailure`).toBe(
        false,
      );
    }
  });

  // Red: lint 冒頭注釈が blockOnFailure を Codex の機能として列挙し、(b)(c) の記述が無いため、assertion の不一致で赤になる。
  it.fails("CANDIDATE-U-HOOKEXEC-016: AGENTS.md and the lint header scope Codex guard fail-close to a confirmed deny", () => {
    const sources = [
      { label: "AGENTS.md", text: agentsCodexHookSection() },
      { label: "src/lint/codex-hook-adapter.ts", text: lintHeaderComment() },
    ];
    for (const { label, text } of sources) {
      // (a) blockOnFailure を Codex guard の機能と読める記述が無い (出現はすべて未対応・拒否の文脈)。
      for (const context of blockOnFailureContexts(text)) {
        expect(context, `${label}: blockOnFailure outside a rejection context`).toMatch(
          REJECTED_CONTEXT,
        );
      }
      // (b) fail-close は確定 deny の場合に限ると書く。
      expect(text, `${label}: missing confirmed-deny scope`).toMatch(EXPLICIT_DENY);
      // (c) 起動失敗・timeout・exit 1・不正出力は未実測と書く。
      expect(text, `${label}: missing unmeasured statement`).toMatch(UNMEASURED);
    }
  });
});
