---
plan_id: PLAN-L7-317-write-encoding-guard
title: "PLAN-L7-317 (impl): write encoding guard — 書き込み直後の UTF-8 検査を PostToolUse hook で即時化"
kind: impl
layer: L7
drive: be
status: draft
version_target: v2
route_signal: version_deferral
route_mode: version-up
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - v2 活性化時期"
  - role: tl
    slot_label: "TL - 検査対象 (テキスト系拡張子) と fail 時挙動のレビュー"
  - role: se
    slot_label: "SE - post-tool-use hook への encoding 検査追加"
generates:
  - artifact_path: docs/plans/PLAN-L7-317-write-encoding-guard.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-69-encoding-corruption-expanded-guard.md
---

# PLAN-L7-317 (impl): write encoding guard

## Status

**version-up parked (v2)**。PO 質問 (2026-07-03)「書くとき UTF-8 を守っているか。Windows 環境の文字化けを Claude 側に強制できるか」への機械化回答。

## 背景 (実測 2026-07-03)

- 現状の防御は 2 層: ①Claude Code / Codex の Write/Edit ツールは UTF-8 (BOM なし) で書く ②readability gate (mojibake fail-close) が doctor/CI で全 prose doc を走査 (実測 green: 706 docs / marker 0。本日の新規 19 ファイルも strict UTF-8 デコード + U+FFFD/半角カナ/CP932 残渣スキャンで ALL CLEAN を確認済み)。
- **穴は検出の即時性**: readability の検出は「次に doctor が走った時」。shell 経由の書き込み (PowerShell `Out-File`/`Set-Content` は既定 UTF-16 LE、リダイレクトも同様) が混ざると、doctor 実行までの間、化けたファイルを他ランタイム/subagent が読み込み連鎖破損する余地がある (Codex 製 doc の mojibake→git 前版復元の実例あり)。
- なお表示上の文字化け (PowerShell `Get-Content` の既定エンコーディングで UTF-8 ファイルが化けて**見える**) はファイル破損ではない — 判定は必ずバイト列で行う。

## スコープ (1 要件: リポジトリへの書き込み直後にエンコーディング違反を検出し、doctor を待たず即時に警告する)

1. **PostToolUse 検査**: 既存の `PostToolUse(Edit|Write|MultiEdit|Bash)` hook (`src/cli.ts hook post-tool-use`) に、当該ツール呼び出しが触ったテキスト系ファイル (.md/.ts/.json/.yaml 等) の検査を追加 — (a) strict UTF-8 デコード可能 (b) BOM なし (c) U+FFFD / 半角カナ / CP932 誤変換残渣なし (検査ロジックは readability gate の既存実装 `src/lint/readability` 系を**再利用**し二重実装しない)。
2. **fail 時挙動**: hook は警告 message を surface し、違反を `.ut-tdd/logs/encoding-violations.jsonl` に記録。**書き込みの巻き戻しはしない** (hook からの自動 revert は相手ランタイム成果の破壊リスク — 検出と可視化まで。是正は書いた主体)。
3. **shell 書き込みの検出範囲**: Bash/PowerShell 経由は「どのファイルを書いたか」を確実には特定できないため、`git status` の変更ファイル差分から新規/変更テキストファイルを拾うベストエフォート (完全性は doctor readability が引き続き担保 — 二層の役割分担を doc 化)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 検査対象拡張子と fail 時挙動の設計 (TL) | 直列 |
| 2 | post-tool-use への検査追加 (readability 実装の再利用) | 直列 |
| 3 | regression test (UTF-16 ファイル→警告 / UTF-8 →無音 / 表示化けと実化けの区別) | 直列 |

## DoD

- [ ] UTF-16 で書かれた .md が post-tool-use 実行で警告 + jsonl 記録される (test 固定)
- [ ] UTF-8 (BOM なし) の書き込みが無音で通る (test 固定)
- [ ] 検査ロジックが readability gate と同一実装を共有している (import 関係を test で固定 — 二重実装 drift 防止)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/cli.ts` (hook post-tool-use 経路)、`src/lint/readability` 系の検査関数 export、`tests/`。
- hook は fail-open/fail-close の既存設計 (hook 失敗を silent に無視しない) に従う。検査自体の例外は警告として surface し、ツール実行は止めない。
- Codex 側 hook (`.codex/hooks.json`) にも同型の検査を載せるかは L7-139 (hook parity) の枠で判断 — 本 PLAN は Claude 側経路を正とし、parity は references で接続。
