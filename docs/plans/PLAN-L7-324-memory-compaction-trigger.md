---
plan_id: PLAN-L7-324-memory-compaction-trigger
title: "PLAN-L7-324 (impl): memory 圧縮トリガー — 閾値検出 + 発火 + 標準圧縮手順の資産化 (Claude adapter)"
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
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 閾値 (既定: index 40 行 / 本文合計 40KB) の承認と v2 活性化時期"
  - role: tl
    slot_label: "TL - adapter 境界 (Claude 専用機能としての置き場) のレビュー"
  - role: se
    slot_label: "SE - 閾値検出 + surface + 圧縮手順 doc の実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-324-memory-compaction-trigger.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/plans/PLAN-L7-302-context-tiering.md
---

# PLAN-L7-324 (impl): memory 圧縮トリガー

## Status

**version-up parked (v2)**。PO 発案 (2026-07-03)「memory 側に auto 圧縮みたいな機能は作れる? 何行を超えたら圧縮しなさい、みたいな」。

## 背景 (実測 2026-07-03)

- Claude Code の persistent memory (`~/.claude/projects/<project>/memory/`) は index (MEMORY.md) が毎セッション読み込まれる固定コンテキスト。実測: **60 ファイル超 / 本文合計 65KB / index 60 行超**まで無検出で成長し、PO の人手指摘で初めて圧縮が走った (CE-1 の memory 版 — 成長に番人がいない)。
- 設計判断: **完全自動の統合 (機械が memory を書き換える) はしない**。memory は PO 指示の正本であり、silent な意味統合は改変リスク (taxonomy の原理「許容される変更は宣言され、記録され、出口がある」を memory 自身に適用)。作るのは「**閾値検出 → 発火 (advisory) → 標準手順による半自動圧縮**」の 3 点。

## スコープ (1 要件: memory の無検出成長を止め、圧縮を標準手順で発火させる)

1. **閾値検出**: SessionStart hook (`ut-tdd session start` 経路) に memory 計測を追加 — MEMORY.md 行数 / memory ディレクトリの .md 本文合計サイズ。閾値 (既定: **index 40 行 or 本文 40KB**、定数化) 超過で surface に 1 行 advisory: 「memory 圧縮推奨 (index N 行 / M KB) — 手順: <手順 doc パス>」。毎セッション出るので放置すれば毎回見える (これが「圧縮しなさい」の実装形)。
2. **memory ディレクトリの解決**: `CLAUDE_PROJECT_DIR` から Claude 規約のスラグ化パス (`~/.claude/projects/<slug>/memory/`) を導出。**Claude adapter 専用機能**として実装し、ディレクトリ不在 (Codex セッション / 未使用環境) は無音 skip (fail-open、Pack の生の OS には影響しない — LENS-RW: 消費者に Claude memory を前提させない)。
3. **標準圧縮手順の資産化**: 2026-07-03 の実圧縮で使った手順 (テーマ別クラスタ統合 / feedback 実質は不減 / 解決済み歴史ノートの削除基準 / 統合後 index 20 行以内 / [[link]] 書換 / staging → 検収 → 適用) を `.claude/` 配下の手順 doc として保存し、advisory から参照する。圧縮の実行主体はオーケストレータ (人間承認は index の最終形で)。
4. **圧縮履歴**: 圧縮実行時に「いつ / 何本→何本 / 削除したもの」を memory 内の 1 ファイル (compaction-log) に append — 消した記憶を後から追える出口を残す。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 閾値 + adapter 境界の設計 (TL/PO) | 直列 |
| 2 | SessionStart 計測 + advisory surface | 直列 |
| 3 | 圧縮手順 doc の整備 (2026-07-03 実施内容の一般化) | Step 2 と並列 |
| 4 | regression test (閾値超過で advisory / 未満で無音 / dir 不在で無音 skip) | 直列 |

## DoD

- [ ] 閾値超過時に SessionStart surface へ advisory が 1 行出る (test 固定)
- [ ] 閾値未満・dir 不在では何も出ない (test 固定 — advisory の噪音化防止)
- [ ] 手順 doc が存在し advisory から参照される
- [ ] 圧縮実行の記録が compaction-log に残る (手順 doc に記載、初回実績 = 2026-07-03 分を遡及記録)

## 実装ノート (後続モデル向け)

- 触るファイル: SessionStart 経路 (`src/cli.ts` session start / `src/feedback/surface.ts` 周辺 — Codex 抽出後の配置に従う)、`.claude/memory-compaction-guide.md` (新規手順 doc)。
- 計測は行数とバイト数のみ (中身は読まない — 検出は軽く、判断は圧縮実行時に)。
- 「advisory が毎回出て無視される」対策: 閾値は「明確に肥大」の水準に置く (L7-307 と同じ原則)。閾値を下げたくなったら PO 承認で定数変更。
