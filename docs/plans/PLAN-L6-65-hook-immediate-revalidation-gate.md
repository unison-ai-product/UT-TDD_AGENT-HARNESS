---
plan_id: PLAN-L6-65-hook-immediate-revalidation-gate
title: "PLAN-L6-65 (add-design): 編集直後 fail-close 即時再検証 hook (ZIP hook_gate.py 相当)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - post-tool-use hook の即時再検証範囲 (どの doctor/lint サブセットを即時発火するか) の契約設計"
generates:
  - artifact_path: docs/plans/PLAN-L6-65-hook-immediate-revalidation-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  references:
    - docs/design/harness/L6-function-design/governance-enforcement.md
    - src/cli.ts
    - .claude/settings.json
    - .ut-tdd/audit/A-185-vmodel-docgen-reference-mining-2026-07-07.md
---

# PLAN-L6-65: 編集直後 fail-close 即時再検証 hook

## 0. 背景 (ZIP 再監査 2026-07-08、advisor 相談済み、PO 指示による起票)

ZIP `hook_gate.py` は `docs/*.yaml` への Edit/Write を検知して detect を即実行し、赤なら PostToolUse
段階でブロックする。UT-TDD 側 `.claude/settings.json` の `PostToolUse(Edit|Write|MultiEdit|Bash)` →
`bun src/cli.ts hook post-tool-use` (`src/cli.ts:855`) は、実体を確認すると `session-log: post-tool-use`
という**ログ記録のみ** (`src/cli.ts:892`) であり、編集直後にゲートを即座に再実行して赤なら非ゼロ終了で
ブロックする即時フィードバック機構は無いと裏取り済み。

現状は CI (`harness-check`) や `ut-tdd doctor` の明示実行時にのみ検出されるため、設計 doc の破壊的編集
から検出までにタイムラグがある。

## 1. 設計スコープ

1. 対象ファイル種別 (`docs/design/`, `docs/plans/` 等) への Edit/Write 直後に、doctor の関連サブセット
   (影響範囲が狭い軽量チェックのみ、CI フルスキャンとは別) を即時実行する契約を設計する。
2. fail-close (赤なら非ゼロ終了でユーザーに即通知) の範囲と、既存の CI フルスキャンとの二重負荷を
   避ける粒度を設計する。
3. Claude hook (`.claude/settings.json` PostToolUse) だけでなく **Codex hook parity**
   (`.codex/hooks.json` 相当、`apply_patch` ヘッダ解析など Codex 固有のツール呼び出し形式) を
   同一スコープで設計する。対象 tool 名の差分・timeout/debounce・再帰防止・fail-close 対象の
   最小集合を、両ランタイムで非対称にならない形で定める。

## 2. 受け入れ条件 (design freeze 時)

- 即時再検証の対象範囲・粒度が L6 function-spec として固定され、L7 実装 PLAN へ橋渡しされる。
- Claude/Codex 両 hook surface で対称な即時検証範囲が定義される (片方のみ実装されるという
  非対称を残さない)。
- 既存 `hook post-tool-use` のログ記録機能を破壊しない非破壊拡張であることが明記される。
