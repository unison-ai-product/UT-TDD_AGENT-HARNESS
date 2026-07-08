---
plan_id: PLAN-L7-392-memory-promotion-handover-digest
title: "PLAN-L7-392 (add-impl): HARNESS メモリ昇格 nudge と handover digest 化"
kind: add-impl
layer: L7
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - memory 昇格 nudge / digest 設計整合レビュー"
  - role: se
    slot_label: "SE - Stop hook warn + SessionStart digest 実装"
  - role: qa
    slot_label: "QA - digest 固定フォーマットと telemetry 締め出しの回帰"
generates:
  - artifact_path: docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  requires:
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
  references:
    - docs/plans/PLAN-L7-110-takeover-feedback-surface.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
review_evidence: []
---

# PLAN-L7-392: HARNESS メモリ昇格 nudge と handover digest 化

## 0. 背景 (PO 決定 2026-07-08)

共有 HARNESS メモリ (PLAN-L7-189) は実装済みだが書き込みがゼロ件のまま滞留していた。
handover は「DB 導出 digest (状態) + HARNESS メモリ (知識) + HEAD (事実)」の 3 点セットへ
収束させ、stale 化する prose 層を廃止方向とする。運用ルール行は `CLAUDE.md` / `AGENTS.md`
(rule-drift マーカー圏近傍) へ 2026-07-08 に追記済み。本 PLAN はその機械面。

エンジン載せ替え (V モデル設計 doc ZIP 起点、Codex 対応中) の handover/workflow 改修へ
合流させて実装する。二重作業を避けるため、載せ替え側で同等機構が設計された場合は
本 PLAN を supersede してよい (supersedes 宣言と相互参照を残すこと)。

## 1. 実装内容

1. **memory 昇格 nudge (Stop hook)**: `session summary` が「本セッションで commit または
   PLAN 状態遷移があり、かつ `.ut-tdd/memory/` への書き込みが 0 件」を検出したとき、
   warn telemetry (`memory_promotion_missed`) を feedback_events へ記録し、summary 出力に
   1 行 nudge を出す。block しない (false positive 許容、fail-open)。
2. **SessionStart digest 化**: takeover surface を固定 4 段フォーマットへ投影する:
   ① gate 全件 ② HEAD 直近確定成果 (git log 由来 N 件) ③ 未閉 actionable 上位 5 件
   ④ `memory recall` 上位。telemetry 系イベントは本文から締め出し、集計 1 行に畳む。
3. **telemetry lifecycle**: telemetry kind の feedback_events に TTL / 自動 ack を導入し、
   open 件数がシグナルを埋没させない状態を維持する (PLAN-L7-246 の lifecycle に接続)。

## 2. 不変条件

- digest は DB / HEAD からの導出のみで構成し、prose スナップショットを正本にしない。
- nudge / digest は fail-open: DB 不在・lock・破損でセッション起動や Stop を止めない。
- memory への書き込み内容は永続知識に限る。エピソード状態 (進捗・次の一手) を
  memory に書く経路を作らない。

## 3. 受け入れ条件 (実装時に green_commands で裏取りすること)

- commit ありかつ memory 書き込み 0 のセッションで `memory_promotion_missed` warn が
  feedback_events に記録される (real-repo regression test)。
- SessionStart surface が固定 4 段で出力され、telemetry 生イベントが本文に現れない。
- open feedback の telemetry が TTL/auto-ack で減衰する。
