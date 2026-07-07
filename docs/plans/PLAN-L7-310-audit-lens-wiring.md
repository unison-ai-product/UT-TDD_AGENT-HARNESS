---
plan_id: PLAN-L7-310-audit-lens-wiring
title: "PLAN-L7-310 (impl): 監査レンズカタログの機械配線 — ut-tdd audit コマンド + skill 推奨接続"
kind: impl
layer: L7
drive: agent
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
    slot_label: "PO - v2 活性化時期 (カタログ自体は手動運用で即機能する)"
  - role: tl
    slot_label: "TL - カタログの機械可読化書式とプロンプト生成のレビュー"
  - role: se
    slot_label: "SE - audit コマンド + skill 推奨接続の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-310-audit-lens-wiring.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - docs/governance/audit-lens-catalog.md
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-251-observation-next-selector.md
---

# PLAN-L7-310 (impl): 監査レンズカタログの機械配線

## Status

**version-up parked (v2)**。PO 指示 (2026-07-03)「監査ポイントと解釈観点をシステム内に組み込む — 最高 ROI」への対応。**中身 (レンズ 6 種の実測プローブ・解釈観点・委譲プロンプト雛形) は `docs/governance/audit-lens-catalog.md` として既に着地済み**であり、本 PLAN はその機械配線のみを扱う。カタログは配線前でも手動運用で完全に機能する。

## 背景

A-172〜A-181 の監査品質は、オーケストレータが subagent へ渡した監査プロンプト (見る場所 + 読み方) に依存していた。この知識はプロンプトの中にしか存在せず、セッション/モデル交代で消える。カタログ化 (済) に加えて、**呼び出し動線が無ければ使われない** (死蔵) — skill 実発火 0 問題 (A-180) と同じ轍を踏まないための配線が本 PLAN。

## スコープ (1 要件: カタログのレンズを機械的に選択・実行可能にする)

1. **`ut-tdd audit lens list / show <lens-id>`**: カタログを parse してレンズ一覧と各レンズの詳細 (プローブ / 雛形) を表示。カタログ md が正本、コードへの複製はしない (drift 防止 — parse は §見出し規約に依存し、規約は本 PLAN でカタログ側にも明記)。
2. **`ut-tdd audit delegate --lens <lens-id> --context "..."`**: 委譲プロンプト雛形の `{{}}` を context 引数で埋め、既存 delegation 経路 (`ut-tdd claude/codex --role reviewer` 系) へ渡せる完成プロンプトを生成 (dry-run 既定、実行は既存 adapter に委ねる)。
3. **skill 推奨接続**: task classify が監査系 signal (`audit` / `監査` / drift / gap 系) を検出した際、skill suggest がカタログ該当レンズを推奨候補として返す (`src/skill-engine/` の推奨経路にカタログ源を追加)。
4. **A-18x scaffold**: `ut-tdd audit report --new <slug>` が §1 共通規律準拠のレポート骨子 (.ut-tdd/audit/A-<次番号>-<slug>-<date>.md) を生成 (採番は既存 A-* の最大 + 1)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | カタログ parse 規約の確定 (TL) + カタログ側への規約明記 | 直列 |
| 2 | lens list/show + delegate 生成 | 直列 |
| 3 | skill 推奨接続 | Step 2 と並列 |
| 4 | report scaffold + regression test | 直列 |

## DoD

- [ ] `audit lens list` がカタログの全レンズ (現 6 種) を返し、カタログへのレンズ追加が再実装なしで反映される (test 固定)
- [ ] `audit delegate` が {{}} を埋めた完成プロンプトを生成する (test 固定)
- [ ] 監査系タスク分類で該当レンズが skill suggest に現れる (test 固定)
- [ ] scaffold が共通規律 §構成を持ち、採番が既存と衝突しない (test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/cli.ts` (audit サブコマンド)、`src/skill-engine/` の推奨源、カタログ parser (新規 `src/audit/lens-catalog.ts`)。
- カタログの md 見出し (`## §N LENS-XX:`) を parse キーにする。見出し規約を変えるとき はカタログと parser を同時に更新 (rule-drift と同様の考え方だが、まず parser 側の test でカタログ実ファイルを読む real-repo test にして drift を検出する)。
- 死蔵防止: 発火記録 (audit delegate の実行) を drive_runs か専用テーブルに記録し、LENS-DE (検出器の実効性) の監査対象に自身を含める。
