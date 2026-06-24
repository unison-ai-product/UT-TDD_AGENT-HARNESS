---
plan_id: PLAN-L7-88-handover-summary-injection-cap
title: "PLAN-L7-88 (troubleshoot): handover §1/§2 の per-entry PLAN 件数を上限化 — scope fallback の全 registry ダンプによる context 肥大を抑える注入コントロール"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO 指摘『handover がコンテキストを増やしまくってないか + 注入コントロール/圧縮を組み込め』(2026-06-22) に対応。実測で handover doc の肥大を確認 (session-handover-2026-06-15.md = 2036 行 / 174KB / 同日 11 entries、2026-06-17 = 1713 行 / 132KB)。根因 = collectScope が session/active-family 解決に失敗すると空 handover 回避のため全 digest へ fallback し、renderHandoverScaffold の §1 PLAN サマリ + §2 成果物が **全 PLAN registry をダンプ** (1 anchor entry ~295 行)。既存 slimSummary (同日2件目+) と boundSameDayEntries (4 entry cap) は anchor の全 registry ダンプを縮約しなかった。修正: capWithBreadcrumb 純関数 + MAX_SUMMARY_PLANS=12 で §1/§2 を先頭 N + 『+M more — ut-tdd status/harness.db 参照』breadcrumb へ畳む (no silent cap)。session-scope が効いた通常時は doc.plans が小さく cap 不発 = 退行なし。注入経路の確認: SessionStart hook (runSessionStartSideEffects) は context 注入せず lifecycle 保守のみ = handover は自動注入されず session 再開時に latest_doc を読むことで context へ入る → latest_doc を bound すれば注入が bound する。U-HOVER-016 (capWithBreadcrumb 上限/breadcrumb/escape-hatch + render cap 発火/不発火) 5 ケース追加。typecheck / Biome / Vitest / doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - handover summary injection cap (deliverable-driven context budget)"
generates:
  - artifact_path: docs/plans/PLAN-L7-88-handover-summary-injection-cap.md
    artifact_type: markdown_doc
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-83-handover-drift-and-accumulation.md
  requires:
    - docs/plans/PLAN-L6-06-handover-mechanism.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-88 (troubleshoot): handover summary injection cap

## 0. Objective

handover が session 再開時に context へ運ぶ情報量を **per-entry で上限化** し、
「handover がコンテキストを増やしまくる」(PO 2026-06-22) を機械で防ぐ。

## 1. Problem (実測されたギャップ)

`docs/handover/` の実測:

| doc | lines | bytes | 同日 entries |
|---|---|---|---|
| session-handover-2026-06-15.md | 2036 | 174KB | 11 |
| session-handover-2026-06-17.md | 1713 | 132KB | — |
| session-handover-2026-06-11.md | 1227 | 100KB | — |
| session-handover-2026-06-10.md | 1130 | 110KB | — |

根因の弁別:

- **既存の対策**: `slimSummary` (A-138 ITEM-4) は同日 2 件目以降の §1/§2 を参照 stub へ縮約。
  `boundSameDayEntries` (PLAN-L7-83、`MAX_SAME_DAY_ENTRIES=4`) は同日 entry 数を 4 へ cap。
  → 2026-06-19 以降の doc は 4 entries で効いている。だが歴史的 doc (cap 前生成) は未剪定。
- **残る穴 (本 PLAN)**: `collectScope` (U-HOVER-001) は session_id / active-family が digest に
  マッチしないと、空 handover を避けるため **全 digest へ fallback** する。すると
  `renderHandoverScaffold` の §1 PLAN サマリ (~57 行) + §2 成果物 (~238 行) が **全 PLAN
  registry をダンプ**し、1 anchor entry が ~295 行に膨らむ。registry は PLAN が増えるほど
  (現在 199 本) 無制限に伸びる。**この anchor の全 registry ダンプは slim/bound のどちらにも
  縮約されない** (slim は 2 件目以降のみ、bound は entry 数のみ)。

## 2. 注入経路の確認 (context へどう入るか)

- `SessionStart` hook = `ut-tdd session start` → `runSessionStartSideEffects` は
  `scanDanglingStops` / `sweepStaleGuardSlots` の lifecycle 保守のみで **context 注入をしない**。
- ゆえに handover は自動注入されず、**session 再開時にエージェントが `CURRENT.json.latest_doc`
  を読む**ことで context に入る。`latest_doc` は常に最新日の doc = 本 cap で bound 済になる。
- → **latest_doc を per-entry で bound すれば、注入される handover が bound する** (injection control)。

## 3. Fix

`src/handover/index.ts`:

- `MAX_SUMMARY_PLANS = 12` (per-entry の §1/§2 PLAN 件数上限)。
- `capWithBreadcrumb<T>(items, max, renderItem, breadcrumb)` 純関数 — 先頭 `max` 件を残し、
  超過分を breadcrumb 1 行 (`+ M more PLAN — ut-tdd status / harness.db を参照`) へ畳む。
  `max<=0` は無制限 (escape hatch)、breadcrumb は超過時のみ (no silent cap、剪定分は status/db 参照可)。
- `HandoverRenderOpts.maxSummaryPlans?` を追加し、`renderHandoverScaffold` の §1/§2 (非 slim 経路) を
  `capWithBreadcrumb` で描画。default = `MAX_SUMMARY_PLANS` ゆえ `runHandover` は無改修で cap 適用。

## 4. Acceptance Criteria — met

- [x] §1/§2 の PLAN 件数が上限超 (= scope fallback で全 registry) なら先頭 N + breadcrumb へ畳む。
- [x] breadcrumb は残数を明示し `ut-tdd status` を案内する (no silent cap)。
- [x] session-scope が効いた通常時 (PLAN 少) は cap 不発・全件・breadcrumb なし (退行なし)。
- [x] `maxSummaryPlans=0` は cap 無効 (後方互換 escape hatch)。
- [x] 既存 slimSummary / boundSameDayEntries / countHandoverEntries (bypass 検知) と直交・不変。
- [x] U-HOVER-016 5 ケース追加。typecheck / Biome / Vitest / doctor green。

## 5. Out of scope

- **歴史的 oversized doc の retroactive 圧縮**: `boundSameDayEntries` は既存 doc に適用すれば
  anchor + 直近 + breadcrumb へ畳めるが、25+ の tracked handover を一括書換えるのは大きな差分かつ
  本 session の射程外 (git 履歴に全保全されており、latest_doc は本 cap で前進的に bound する)。
  必要時に `boundSameDayEntries` を歴史 doc へ適用する one-time compaction を別途実施可。
- `status --json` / harness.db 側の「未了の正の集計 surface」(IMP-139) とは独立。
