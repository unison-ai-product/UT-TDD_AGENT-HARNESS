---
plan_id: PLAN-L7-83-handover-drift-and-accumulation
title: "PLAN-L7-83 (troubleshoot): handover pointer-drift 恒久解消 (marker reconcile) + 同日 markdown の累積上限化 (bounded entries)"
kind: troubleshoot
layer: L7
drive: db
parent_design: docs/design/harness/L4-basic-design/architecture.md
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: tl
    review_kind: cross_agent
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5.5
    tests_green_at: "2026-06-19"
    reviewed_at: "2026-06-19"
    verdict: pass
    scope: "handover 機構の 2 defect 修正: (1) runHandover marker reconcile (complete→clear / --plan→sync / plain in_progress 無変更 / dryRun 非破壊) で CURRENT.json⇔current-plan marker の drift を構造的に解消、(2) boundSameDayEntries で同日 entry を MAX_SAME_DAY_ENTRIES=4 へ上限化 (anchor+直近保持・中間 breadcrumb・git 履歴保全)。cross_agent TL(codex-gpt-5.5) 初回 verdict=fail で Important 1件 = boundSameDayEntries が既存 breadcrumb を再 prune 時に anchor slice へ吸収し線形累積する点を指摘。remediate = strip-then-reprune (既存 breadcrumb + 直前 separator を regex 除去後に再 prune) + 決定論 oracle U-HOVER-014 idempotency ケース (2 prune cycle で breadcrumb 1 個・header=MAX-1) で再発防止。clear-on-complete coherence / 保持算術 / breadcrumb header 非該当 / dryRun 非破壊 / 空 marker は No-Finding と評価。再 dispatch 確認は wrapper 出力が grounding trace で途切れたため決定論 test で代替検証。typecheck/biome(175)/全 Vitest 763/doctor EXIT=0 green。evidence=.ut-tdd/audit/A-142、review task=.ut-tdd/codex-tasks/l783-review.md (+r2)。"
agent_slots:
  - role: tl
    slot_label: "TL - handover drift reconcile + accumulation bound 設計 + 配線 + cross_agent review"
generates:
  - artifact_path: docs/plans/PLAN-L7-83-handover-drift-and-accumulation.md
    artifact_type: markdown_doc
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-04-handover-mechanism.md
  requires:
    - docs/design/harness/L6-function-design/handover-mechanism.md
    - docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-83: handover pointer-drift reconcile + 同日累積の上限化 (troubleshoot)

## Objective

handover 機構 (PLAN-L7-04 / L6-06) を実運用したところ 2 件の defect を検出 (PO 直接指摘):

1. **pointer drift が解消されない**: `CURRENT.json` (機械ポインタ) と `.ut-tdd/state/current-plan`
   marker が乖離しても `checkHandoverDiscipline` は **warn するだけ**で reconcile しない。実例
   (2026-06-19): marker = `PLAN-L7-83` (PLAN file 不在の phantom)、`CURRENT.json` =
   `PLAN-L7-82-...` (completed) → doctor が drift を毎 session 再報告。前 session が
   `ut-tdd plan use PLAN-L7-83` で marker を立てたが PLAN を作らず、別 PLAN を完了しても
   marker を移さなかったのが根因。**2 つの「今どこ」source が無秩序に乖離できる**のが defect。

2. **同日 markdown が無制限に累積**: `runHandover` は同日 doc へ `---` 区切りで追記する。
   A-138 ITEM-4 の slim 化で §1/§2 は 2 件目以降縮約されるが、§3-§6 + entry 自体は積み増し
   続け、`session-handover-2026-06-19.md` は 1 日 6 entries / 1004 行へ肥大した。

設計の柱3 (自動 state/feedback) + 柱6 (機械品質担保) に照らし、**機構自身が coherence と上限を
保証する**ように増分する。

## 動機 / 設計判断

- **drift reconcile**: handover は「今どこ」の単一 writer であるべき (§6.8.6 役割直交)。よって
  `runHandover` が pointer を書くと同時に marker を pointer へ合わせる。`complete=true` →
  marker を **clear** (完了 = active plan 無し → resolveActivePlan→null → drift 判定対象外、
  既存 I-2 の「null=完了正常形」と整合)。`--plan` 明示の in_progress → marker を **その plan へ
  同期** (override 由来の drift を防ぐ)。plain in_progress (--plan 無し) は marker=scope source
  なので無変更 (無駄書き回避)。これで drift は handover 後に構造的に発生し得ない。
- **bounded entries**: 同日 doc の `# Session Handover` entry 数を上限 `MAX_SAME_DAY_ENTRIES`
  に抑える。A-138 の「1 ファイル 1 registry anchor」を尊重し、**最古 anchor (entry[0]、full §1) +
  直近 (MAX-2) entry を残し、中間を 1 行 breadcrumb へ畳む**。breadcrumb は `# Session Handover`
  に一致しないので `countHandoverEntries`/`doc_entry_count` の bypass 検知契約は不変。剪定は
  silent でなく breadcrumb で件数明示 + git 履歴に全保全 (no silent cap)。

## WBS

| WBS ID | Work | Source target | Test target | Gate | 並直 |
|---|---|---|---|---|---|
| WBS-L7-83-01 | `runHandover` の marker reconcile (complete→clear / --plan→sync、dryRun 非破壊)。`written` に marker path を計上 (透明性)。 | `src/handover/index.ts` | `tests/handover.test.ts` | `vitest tests/handover.test.ts` | [直列] |
| WBS-L7-83-02 | `boundSameDayEntries` 純関数 + `MAX_SAME_DAY_ENTRIES` const + runHandover で append 前に呼ぶ。anchor + 直近保持 / 中間 breadcrumb / header 数契約不変。 | `src/handover/index.ts` | `tests/handover.test.ts` | `vitest tests/handover.test.ts` | [直列] |
| WBS-L7-83-03 | 設計 back-fill (handover-mechanism.md §2.6/§2.7 + trace) + test-design U-HOVER-014/015 row。live 状態 reconcile (phantom marker clear + 既存肥大 doc compact)。 | (docs) | A-142 | `ut-tdd doctor` | [直列] |
| WBS-L7-83-04 | cross_agent review (tl=codex) → nit 反映 → confirmed。 | (review) | A-142 | `ut-tdd doctor` | [直列] (03 後) |

## Acceptance Criteria

- [x] `runHandover(complete=true)` 後 marker が clear され、再度 `checkHandoverDiscipline` が drift を出さない。
- [x] `runHandover(--plan X, in_progress)` 後 marker = X (override drift 解消)。plain in_progress は marker 無変更。
- [x] `dryRun=true` は marker を書かない (非破壊不変)。
- [x] `boundSameDayEntries`: entry 数 ≤ MAX-1 は無変更 / 超過時 anchor(entry[0]) + 直近(MAX-2) 保持・中間を breadcrumb へ畳む / `countHandoverEntries` は剪定後も正確 / **再 prune でも breadcrumb 1 個 (idempotent、cross_agent 指摘の remediate)**。
- [x] `runHandover` 反復で同日 doc の entry 数が `MAX_SAME_DAY_ENTRIES` を超えない。
- [x] live: `PLAN-L7-83` 実体化で marker は phantom 解消。完了 handover で marker clear + drift OK + 既存肥大 doc を上限へ compact (本 session 末で実施)。
- [x] typecheck / biome / 全 Vitest (U-HOVER-014/015 含む) / doctor green。
- [x] review 前置: cross_agent (tl=codex-gpt-5.5) 初回 fail → idempotency remediate → 決定論 oracle で再発防止。Critical 0 / Important 1 (remediated)。

## 壊さない / 再発させない

- **handover は marker と CURRENT.json の単一 writer**。complete で marker を clear し in_progress+--plan で
  同期する契約を緩めると 2 source が再び無秩序に乖離し drift が常態化する。
- **bounded entries の anchor (entry[0]) を剪定対象にしない**。A-138 の「1 ファイル 1 registry」を壊すと
  slim stub の参照先が消える。breadcrumb は header に一致させない (`countHandoverEntries` 契約破壊回避)。
- **剪定は git 履歴前提の lossy compaction**。手書き重要メモは §6 do-not-break として直近 entry に
  carry-forward する (中間 entry は剪定され得る)。breadcrumb で件数を明示し silent cap にしない。
