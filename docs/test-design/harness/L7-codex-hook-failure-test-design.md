---
title: "L7 Codex hook failure test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/session-log.md
status: draft
updated: 2026-11-05
issue: 1538
---

# Codex hook の失敗時の扱いテスト設計 (issue #1538)

## 1. 対象と上位の契約

対象は、Codex の guard hook が失敗したときの扱いについて、lint の型と文書が実測と食い違わないことである。上位の契約は
`docs/design/harness/L6-function-design/session-log.md` の「2026-11-05 Codex hook の失敗時の扱い (Issue #1538)」節。
Codex の hooks.json に未対応 field を足すことの拒否は、既存の `U-CXHOOKCMD-002`
(`docs/test-design/harness/L7-codex-hook-command-schema-test-design.md`) が持ち、本書では再定義しない。
Claude の hook (`.claude/settings.json`) の `onFailure` は `docs/test-design/harness/L7-claude-hook-onfailure-test-design.md` が持つ。

## 2. fixture の作り方

- 015 は `src/lint/codex-hook-adapter-policy.ts` の export (`CODEX_REQUIRED`) を import して調べる。実 repo の設定ファイルは読まない。
- 016 は repository の `AGENTS.md` と `src/lint/codex-hook-adapter.ts` の本文を読む。書き込みはしない。
- 017 は自動テストではなく、Pack の実機受け入れの手動確認である。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-HOOKEXEC-015` | `CODEX_REQUIRED` の失敗時 field | 入力: `CODEX_REQUIRED` の全 entry。期待: どの entry も `blockOnFailure` という property を持たない (値が `true` でも `false` でも不可)。agent-guard と work-guard の entry は従来どおり存在する。反例: guard の entry だけ `blockOnFailure: true` を残す実装。property を消す代わりに `false` を入れる実装。guard の entry ごと消して検査を空で通す実装。 |
| `CANDIDATE-U-HOOKEXEC-016` | Codex guard の fail-close の記述 | 入力: `AGENTS.md` の Codex hook の節と、`src/lint/codex-hook-adapter.ts` の冒頭注釈。期待: (a) Codex の guard (`.codex/hooks.json`) が `blockOnFailure` を持つ・使うと読める記述が無い。(b) Codex guard の fail-close を、確定 deny の場合に限ると書いている。(c) 起動失敗・timeout・exit 1・不正出力を「未実測」と書いている。反例: `with \`blockOnFailure\`` のような記述が 1 箇所でも残る。(b) を満たしても (c) を書かず、失敗時も止まると読める。`AGENTS.md` だけ直して lint の注釈を残す。 |
| `CANDIDATE-U-HOOKEXEC-017` | 実機での失敗時の挙動 (手動) | 入力: L6 節の「実測の経路」1〜6。期待: 起動失敗・timeout・exit 1・不正 JSON の 4 種について、対照 (正常 hook の marker 成功と deny hook の阻止) が成立した状態で、fail-open / 阻止 / 判定不能のどれかを記録する。fail-open が 1 種でもあれば、緩和策の別 Issue を起こす。反例: 対照をとらずに marker 不在を阻止と読む。sandbox の拒否を阻止と読む。trust を迂回するフラグで測る。 |

## 4. 段の扱い

- 015・016 は設計書保護の三段階に従う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID
  (`U-HOOKEXEC-015`・`016`) に改め、実装 PR が `it` に戻す。016 は開発 repo の `AGENTS.md` を読むため、
  `test-repository-isolation` への登録が要る (登録行は登録と Red の PR に入れる)。
- 017 は自動テストの oracle ではない。Pack の実機受け入れの記録として残し、結果が出たら本書と L6 節の「未実測」を実測値に書き換える。
