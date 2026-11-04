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
- 生成物の行 (014) は、`src/setup/templates.ts` の生成結果と `docs/templates/adapter/.claude/settings.json` を読む。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-HOOKEXEC-011` | `analyzeProjectHook` の guard `onFailure` | 入力: agent-guard / work-guard の hook に (a) `blockOnFailure: true` のみで `onFailure` なし、(b) `onFailure: "continue"`、(c) `onFailure` 欠落、(d) `onFailure: "block"`。期待: (a)(b)(c) は typed finding (`missing_on_failure_block`) で fail-close、(d) は finding なし。反例: 実装が `blockOnFailure` の有無だけを見ると (a) を通す。値を見ず `onFailure` の存在だけを見ると (b) を通す。 |
| `CANDIDATE-U-HOOKEXEC-012` | `analyzeProjectHook` の旧 key `blockOnFailure` | 入力: Claude 設定の任意の hook (guard、記録 hook) に `blockOnFailure` (true / false) を足す。`onFailure: "block"` を併せ持つ guard も含める。期待: 全て typed finding (`legacy_block_on_failure`) で fail-close。反例: guard が `onFailure: "block"` を持てば旧 key を許す実装、記録 hook への旧 key を見逃す実装。 |
| `CANDIDATE-U-HOOKEXEC-013` | 記録 / session hook の `onFailure` 省略 | 入力: SessionStart、PostToolUse、Stop、SubagentStop の hook が `onFailure` を持たない設定。期待: finding なし (fail-open 既定を保つ)。反例: 全 hook に `onFailure: "block"` を要求する実装 (記録 hook が作業を止める)。 |
| `CANDIDATE-U-HOOKEXEC-014` | template / generator parity | 入力: `src/setup/templates.ts` の生成 Claude settings と `docs/templates/adapter/.claude/settings.json`。期待: (a) 両方の agent-guard / work-guard が `onFailure: "block"` を持つ。(b) 両方の記録 / session hook (SessionStart、PostToolUse、Stop、SubagentStop) のどれも `onFailure` を持たない。(c) どちらにも `blockOnFailure` が無い。(d) 両方の hook ごとの `onFailure` の有無と値が一致する。反例: 片方だけ更新して source と consumer 生成物が乖離する。旧 key が残る。どちらか片方の生成物の記録 hook に `onFailure: "block"` を足す (記録 hook が作業を止める)。guard の値と旧 key だけを見て、記録 hook の `onFailure` を検査しない。 |

## 4. 段の扱い

- 011〜014 は設計書保護の三段階に従う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID (`U-HOOKEXEC-011`〜`014`) に改め、実装 PR が `it` に戻す。
- 受け入れには、実際の Claude Code で guard script を起動不能にした状態の Edit が止まることを 1 回確かめた記録を含める
  (L6 の受け入れ注記)。この確認は自動テストの oracle ではない。
