---
plan_id: PLAN-RECOVERY-14-db-orphan-debt-closure
title: "PLAN-RECOVERY-14 (recovery): harness.db orphan データ負債の収束 — workflow_orphans / orphan_gate_run 各 17 件 + 誤配置 runtime state 清掃 (issue #87)"
kind: recovery
layer: cross
drive: agent
status: draft
route_signal: regression_dev
route_mode: recovery
created: 2026-07-17
updated: 2026-07-17
owner: PM / PO
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
backprop_decision: not_required
backprop_decision_reason: "検出 gate (drive-db-registration / gate-run-coverage / runtime-state-location) は PLAN-L7-363/365/369/409 系で設計・実装済み。本 PLAN は gate が検出し続けている残存データ負債の帰属確定・退役・清掃であり、新規 L0/L1 要件ではない。"
agent_slots:
  - role: aim
    slot_label: "AIM — orphan の帰属確定基準と退役手続きの設計判断 (correction vs allowlist、証跡保全)"
  - role: se
    slot_label: "SE — orphan 17+17 件の由来調査と正規手続きでの解消、誤配置 state の退避/削除"
  - role: qa
    slot_label: "QA — 解消後 doctor green の実証 + orphan 再流入の負例 regression"
  - role: tl
    slot_label: "TL — 完了済み成果の誤退役防止レビュー (foreign 成果デグレ禁止原則)"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-14-db-orphan-debt-closure.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
    - docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
review_evidence: []
---

# PLAN-RECOVERY-14 (recovery): harness.db orphan データ負債の収束

GitHub issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/87

## 背景 (2026-07-17 監査、db rebuild 後の doctor 実測)

`ut-tdd db rebuild` で db-currency (stale_plan_registry) は解消したが、以下の
violation はデータ負債として残存し、doctor が恒久 Red を出し続けている。検出系
gate 自体は confirmed 済み PLAN 群で正しく機能しており、**欠けているのは検出後の
是正を閉じる受け皿**である。恒久 violation は警報疲れ (alarm fatigue) を生み、
新規 violation の発見性を下げる。

- `drive-db-registration - violation 1 (workflow_orphans=17)`
- `gate-run-coverage - violation 1 (orphan_gate_run=17)`
  (例: `finding:unresolved-join:gate_runs:gate-run:G10:4868985cd9bb`。
  unresolved-join feedback 262 件との関係整理を含む)
- `runtime-state-location - violation: misplaced:downloads/design-template-hunt/originals/.ut-tdd`
  (session log 実体を含む誤配置 runtime state)

## 是正方針 (Step 案)

### Step 1: [直列] orphan の由来調査と帰属基準の確定
- 直列理由 = **downstream_dependency** (帰属基準が後続の解消手続きを決める)。
- workflow_runs / gate_runs の orphan 各 17 件について、由来 (どのセッション・
  どの PLAN 期の活動か) を projection 元 artifact から特定し、
  (a) 実 PLAN へ紐付け可能 → join 修復、(b) 由来不明・歴史的残留 → 正規の
  correction/退役手続き、の分類基準を確定して本 PLAN に記録する。
- 他ランタイムの完了済み成果を誤って退役しない (foreign 成果デグレ禁止)。
  判断が付かない row は退役せず PO 確認へ回す。

### Step 2: [並列] orphan 解消の実施
- Step 1 の分類に従い join 修復 / 退役を実施。silent delete は禁止し、退役は
  証跡 (audit note or correction record) を残す。

### Step 3: [並列] 誤配置 runtime state の清掃
- `downloads/design-template-hunt/originals/.ut-tdd` は session log 実体を含む
  ため、削除前に `.ut-tdd/audit/` 側へ退避するか破棄してよいかを PO 確認の上で
  清掃する (破壊的操作のため確認必須)。

### Step 4: [直列] 回帰確認と再流入防止
- 直列理由 = **verification_gate**。doctor で当該 3 violation が green になること、
  および orphan が再流入した場合に gate が再度 fail-close することの負例
  regression を確認 (「0 件」主張は doctor 実走 evidence で substantiate、
  prose 禁止)。

## AC

- [ ] doctor `drive-db-registration` / `gate-run-coverage` /
      `runtime-state-location` が violation 0 で green (doctor 実走 evidence 引用)。
- [ ] 退役した row 全件に証跡 (由来・判断理由) が残る (silent delete 0)。
- [ ] 誤配置 runtime state の処置 (退避 or 削除) が PO 確認記録付きで完了。
- [ ] doctor / lint / vitest / plan lint green。review evidence を confirmed 前に記録。
