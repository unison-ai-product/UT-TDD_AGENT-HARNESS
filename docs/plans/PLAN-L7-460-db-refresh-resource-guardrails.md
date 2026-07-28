---
plan_id: PLAN-L7-460-db-refresh-resource-guardrails
title: "PLAN-L7-460 (troubleshoot): session db-refresh の資源ガードレール (Node 経路固定 + 上限 fail-close)"
kind: troubleshoot
layer: L7
drive: db
route_signal: incident
route_mode: incident
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: draft
created: 2026-07-27
updated: 2026-07-28
owner: PM / PO
agent_slots:
  - role: aim
    slot_label: "AIM - 資源上限値 (size/time/memory) と検出方式の設計判断"
  - role: tl
    slot_label: "TL - 資源上限とプロセス系統 (Bun/Node) 固定の設計レビュー"
  - role: se
    slot_label: "SE - single-flight / 上限 / rollback / fail-close 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-460-db-refresh-resource-guardrails.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  requires:
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  references:
    - .ut-tdd/memory/project-incident-bun-session-db-refresh-runaway-on-2026-07-27.md
    - src/state-db/stop-refresh-coordinator.ts
    - src/state-db/projection-writer.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
---

# PLAN-L7-460: session db-refresh の資源ガードレール

## Status

draft (起票 2026-07-27)。

## 背景 (incident 2026-07-27)

2026-07-27 12:47 JST 頃、Bun で起動された session db-refresh (PID 12016) が
harness.db を排他し続け、約 7 分で working set 4.55GB / harness.db 4.57GB まで
増大した (incident メモリ
`.ut-tdd/memory/project-incident-bun-session-db-refresh-runaway-on-2026-07-27.md`)。
PLAN-L7-365 で導入した Stop hook 駆動 detached refresh には
「暴走時に自壊する上限」が存在しない。

追記 (2026-07-28 実測): incident の肥大が **rebuild されずに残置**されていた —
本体 repo harness.db 4,435MB に対しクリーン rebuild 後は 62MB (71 倍差)。上限
fail-close (本 PLAN スコープ 3) が入っていれば残置も即日 doctor red で発見できた。
DB に触る全ゲート (SessionStart feedback surface / status / doctor / currency 判定)
が肥大 DB への IO を払い続けるため、検査速度の観点でも本 PLAN は高優先。

注: 実装 deliverable (src/state-db/stop-refresh.ts / tests/db-currency.test.ts 等) は
既存ファイルのため draft 段階の generates には載せない (merged-plan-status /
duplicate-artifact-ownership 対策)。実装 PR で本 PLAN の generates を更新し confirm
と同時に宣言する。

## 目的 / スコープ

incident メモリが要求する再発防止 5 点を機械強制する:

1. **Node 経路固定**: session db-refresh の実行系統を Node runner に固定し、
   Bun 起動は fail-close (起動自体を拒否し finding を残す)。
2. **single-flight**: 同時に 1 refresh のみ (既存 coordinator の coalesce を
   排他ロックで強化し、二重起動は即終了)。
3. **上限 fail-close**: size (harness.db 増分) + time (wall clock) +
   memory (working set) の 3 上限を超えたら refresh 自身が transaction を
   rollback して終了する。
4. **transaction rollback**: 途中終了時に harness.db が partial write に
   ならないことをテストで保証。
5. **観測可能性**: 上限発火は `.ut-tdd/logs/` に監査行を残し、doctor で
   surface する。
6. **SQLite pragma チューニング**: state-db アダプタに journal_mode=WAL /
   synchronous=NORMAL 等の明示 pragma を導入する (現状 0 件、grep 実測
   2026-07-28)。Windows の書き込み遅延・handle 解放遅延の緩和を狙う。挙動
   等価性 (projection 決定性) は既存回帰で固定する。

## スコープ外

- Stop hook の currency 判定そのもの (PLAN-L7-365 の責務)。
- 現在 in-flight の `windowsHide` 修正 (別作業、本 PLAN は上に積む)。

## Schedule

- step 1 (serial): 上限値と検出方式の設計メモ + テスト設計 (L7 oracle 宣言)
- step 2 (serial): 実装 + 実 repo regression (upper-bound 発火の real oracle)
- step 3 (serial): blind review (非 author provider) → confirm

## AC

- AC-1: Bun 系統で refresh を起動しようとすると fail-close する回帰テストが green。
- AC-2: size/time/memory いずれかの上限超過で rollback 終了する oracle テストが green
  (上限は fixture で人工的に小さくして実発火させる。prose 主張ではなくテストで裏取る)。
- AC-3: 二重起動が single-flight で 1 本に収束するテストが green。
