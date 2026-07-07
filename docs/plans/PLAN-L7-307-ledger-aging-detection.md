---
plan_id: PLAN-L7-307-ledger-aging-detection
title: "PLAN-L7-307 (impl): 滞留 aging 検出 — backlog / draft-debt / parked の silent 放置を一元検出"
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
    slot_label: "PO - aging 閾値 (既定 90/120/180 日) の承認と v2 活性化時期"
  - role: tl
    slot_label: "TL - aging 対象台帳の分類レビュー (意図的恒久免除を誤検出しない)"
  - role: se
    slot_label: "SE - aging check 実装"
generates:
  - artifact_path: docs/plans/PLAN-L7-307-ledger-aging-detection.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-181-performance-sustainability-audit-2026-07-03.md
    - docs/governance/harness-v2-update-strategy.md
    - docs/governance/route-mode-kind-debt-audit-2026-07-02.md
    - docs/improvement-backlog.md
---

# PLAN-L7-307 (impl): 滞留 aging 検出

## Status

**version-up parked (v2)**。A-181 DV-6/DV-7 (+DV-9 の age 面、DP-2 の運用面)。

## 背景 (実測 2026-07-03)

このハーネスの繰延機構は「登録時は fail-close、放置は silent」という共通の穴を持つ:

- improvement backlog: 146 entries / open 135。lint (`src/lint/improvement-backlog.ts`) は書式のみ検査し、エントリの年齢や消化速度は見ない。
- draft debt 33 本 (`ROUTE_MODE_KIND_DRAFT_DEBT_PLAN_IDS`): 着手時の昇格は L7-263 が fail-close するが、**永久に draft のまま放置**しても何も鳴らない。
- version-up parked (5 本 + 本起票群): 活性化判断が永久に来なくても何も鳴らない。
- evidence-gated 0 行テーブル 11 個: doctor `db-projection-ingestion` が一括容認し、「いつまで 0 で良いのか」を誰も問わない。

いずれも「不在は違反ではない」という absence-blindness の時間軸版。滞留の検出には登録時刻という共通データが必要であり、対象ごとの個別実装より一元の aging framework が保守に強い。

## スコープ (1 要件: 繰延台帳の滞留を登録時刻起点で一元検出し advisory する)

1. **aging framework** (`src/lint/ledger-aging.ts` 新規): 入力 = `{ ledger名, entry_id, registered_at, age閾値 }` のリスト、出力 = 超過エントリ。純関数 (I/O 注入) で対象台帳から独立。
2. **対象 adapter** (それぞれ registered_at を供給):
   - improvement backlog: エントリの date 列 (observed 90 日 / triaged 180 日で advisory)
   - draft debt: `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` の起票日 (全数 2026-07-02、120 日で advisory)
   - version-up parked: PLAN frontmatter `created` (180 日で「PO 活性化判断待ちの再提示」advisory)
   - evidence-gated 0 行テーブル: 宣言日を台帳化 (`src/state-db/` の evidence-gated 宣言箇所に日付を追加) し 180 日で advisory
3. **doctor check `ledger-aging`**: 超過を advisory (warning) として一覧表示。**hard 化はしない** — 滞留の解消は PO の優先順判断であり、機械は「見えなくなること」だけを防ぐ。
4. 閾値は `src/plan/lint-policy.ts` ではなく `src/lint/ledger-aging.ts` 内の定数表に集約 (台帳ごとに個別値)。

## Steps (活性化時)

| Step | 内容 | mode |
|---|---|---|
| 1 | 対象台帳の分類 + 閾値の承認 (TL/PO。恒久免除 DV-8 は対象外と明記) | 直列 |
| 2 | aging framework (純関数) + test | 直列 |
| 3 | 4 adapter 実装 | Step 2 後、相互に並列 |
| 4 | doctor check 配線 + regression test | 直列 |

## DoD

- [ ] 閾値超過エントリが doctor `ledger-aging` に台帳名 + entry_id + 経過日数で列挙される (test 固定)
- [ ] 閾値内エントリと恒久免除台帳 (LEGACY_LANDED 5 本) が検出されない (test 固定)
- [ ] doctor 全体の exit code に影響しない (advisory、test 固定)

## 実装ノート (後続モデル向け)

- 触るファイル: `src/lint/ledger-aging.ts` (新規)、doctor 配線 (分割後の配置に従う)、`src/lint/improvement-backlog.ts` (date 抽出の再利用)、`docs/governance/route-mode-kind-debt-audit-2026-07-02.md` (起票日列の追記が必要なら)。
- 日付は frontmatter/台帳の記録値のみ使う。`Date.now()` との差分計算は 1 箇所に集約し、テストでは now を注入 (既存 lint の I/O 注入パターンに従う)。
- 「advisory が毎回大量に出て無視される」のが最大の失敗モード。閾値は「本当に異常な滞留」だけが鳴る値に置き、初回導入時に既に超過しているものは A-18x 監査で棚卸ししてから有効化する。
