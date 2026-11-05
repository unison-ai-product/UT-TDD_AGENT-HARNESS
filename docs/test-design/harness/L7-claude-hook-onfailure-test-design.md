---
title: "L7 Claude hook onFailure test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/session-log.md
status: draft
updated: 2026-11-04
issue: 1521
---

# Claude hook の失敗時 block (`onFailure`) テスト設計 (issue #1521)

## 1. 対象と上位の契約

対象は Claude Code の hook 設定で、guard が失敗したときに tool call を止める配線だけである。上位の契約は
`docs/design/harness/L6-function-design/session-log.md` の「2026-11-04 Claude hook の `onFailure` 追加設計 (Issue #1521)」節。
既存の `U-HOOKEXEC-004` (`docs/test-design/harness/L7-unit-test-design.md`) は同じ方針の維持確認であり、本書の候補行は
その方針を lint と生成物で機械的に守るための行である。Codex の hook (`.codex/hooks.json`) は対象外とする。

## 2. fixture の作り方

- lint の行 (011〜013) は、設定 JSON を入力として直接渡す。実 repo の `.claude/settings.json` は読まない。
- 生成物の行 (014) は、source の `.claude/settings.json`、`src/setup/templates.ts` の生成結果、`docs/templates/adapter/.claude/settings.json` を読む。

## 3. Oracle

`U-HOOKEXEC-011`、`012`、`014` は #1521 の src-free 昇格で正式化する。`CANDIDATE-U-HOOKEXEC-013` は既存の fail-open 振る舞いを確認する通常 `it` として保持し、今回の昇格対象にしない。

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `U-HOOKEXEC-011` | `analyzeProjectHook` の guard `onFailure` | 入力: agent-guard / work-guard の hook に (a) `blockOnFailure: true` のみで `onFailure` なし、(b) `onFailure: "continue"`、(c) `onFailure` 欠落、(d) `onFailure: "block"`。期待: (a)(b)(c) は typed finding (`missing_on_failure_block`) で fail-close、(d) は finding なし。反例: 実装が `blockOnFailure` の有無だけを見ると (a) を通す。値を見ず `onFailure` の存在だけを見ると (b) を通す。 |
| `U-HOOKEXEC-012` | `analyzeProjectHook` の旧 key `blockOnFailure` | 入力: Claude 設定の任意の hook (guard、記録 hook) に `blockOnFailure` (true / false) を足す。`onFailure: "block"` を併せ持つ guard も含める。期待: 全て typed finding (`legacy_block_on_failure`) で fail-close。反例: guard が `onFailure: "block"` を持てば旧 key を許す実装、記録 hook への旧 key を見逃す実装。 |
| `CANDIDATE-U-HOOKEXEC-013` | 記録 / session hook の `onFailure` 省略 | 入力: SessionStart、PostToolUse、Stop、SubagentStop の hook が `onFailure` を持たない設定。期待: finding なし (fail-open 既定を保つ)。反例: 全 hook に `onFailure: "block"` を要求する実装 (記録 hook が作業を止める)。 |
| `U-HOOKEXEC-014` | source / template / generator parity | 入力: source の `.claude/settings.json`、`src/setup/templates.ts` の生成 Claude settings、`docs/templates/adapter/.claude/settings.json`。期待: (a) 3 者すべての agent-guard / work-guard が `onFailure: "block"` を持つ。(b) 3 者すべての記録 / session hook (SessionStart、PostToolUse、Stop、SubagentStop) のどれも `onFailure` を持たない。(c) 3 者すべてに `blockOnFailure` が無い。(d) 3 者の hook ごとの `onFailure` の有無と値が一致する。反例: 3 者のいずれかだけ更新して乖離する。source だけ旧 key のまま残す。いずれかの記録 hook に `onFailure: "block"` を足す (記録 hook が作業を止める)。guard の値と旧 key だけを見て、記録 hook の `onFailure` を検査しない。 |

## 4. 段の扱い

- 011・012・014 は設計書保護の三段階に従う。候補 Red は `it.fails` のまま正式 ID (`U-HOOKEXEC-011`・`012`・`014`) へ昇格し、後続の実装 PR で `it` に戻す。013 は既存の維持 oracle なので通常の `it` のまま保持し、今回昇格せず `it.fails` にもしない。
- 受け入れには、実際の Claude Code で guard script を起動不能にした状態の Edit が止まることを 1 回確かめた記録を含める
  (L6 の受け入れ注記)。この確認は自動テストの oracle ではない。
