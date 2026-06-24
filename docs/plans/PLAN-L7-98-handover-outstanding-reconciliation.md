---
plan_id: PLAN-L7-98-handover-outstanding-reconciliation
title: "PLAN-L7-98 (troubleshoot): handover §5 未了 PO 判断 を outstanding surface で machine-seed + fail-close anchor — 実在しない PO 判断が prose 転記で残る根因を機械で塞ぐ"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: PM (Opus) self-review — intra_runtime_subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "PO『なぜ実在しない判断が残るのか → すべて解決して』を受け、handover §5 を outstanding surface (computeOutstandingWork) で seed + doctor fail-close anchor を実装。latestEntrySection (最後の Session Handover entry の §5 抽出) / checkHandoverOutstandingAnchor (marker 常駐を fail-close、pointer 不在 skip、I/O 失敗 fail-close) / renderHandoverScaffold の outstanding seed (後方互換 = outstanding 未指定で従来 TODO) を U-HOVER-017 6 ケースで被覆。doctor handoverOutstanding.ok を ok 連鎖へ配線。本 session で同 reviewer subagent が別件 overstep を起こしたため (IMP-142)、本 review は再 overstep リスク回避で PM self-review (intra_runtime) とした。typecheck / Biome / doctor (handover-outstanding OK) green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - handover §5 outstanding reconciliation gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-98-handover-outstanding-reconciliation.md
    artifact_type: markdown_doc
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/handover.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-94-outstanding-work-surface.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-98 (troubleshoot): handover §5 outstanding reconciliation

## 0. Objective

handover の §5「未了 PO 判断」を機械事実 (outstanding surface) で seed し、その常駐を doctor が
fail-close で強制する。「実在しない PO 判断」が前任 prose の転記で残り続ける根因を機械で塞ぐ。

## 1. Problem (PO「なぜ実在しない判断が残っているのか」)

§5「未了 PO 判断」は handover で**唯一、機械裏付けが無いセクション**だった:

- `§1/§2` は `ut-tdd handover` が毎回 real state から再生成 = 自己訂正する。`§3-§6` は人手 prose で、
  生成器は §5 を `TODO("escalation")` の空スタブで出すのみ。
- 埋める側 (各 session の AI) は前任 handover の §5 prose を**転記**するため、PLAN が completed に、
  IMP が implemented になっても §5 の「待ち」記述は更新されず残る (実例: DISCOVERY-03/RECOVERY-02
  completed・IMP-139 implemented を「PO 判断待ち」と誤記したまま伝播)。
- 機械は真実 (`outstanding`: non-terminal PLANs / open defers、PLAN-L7-94/IMP-139) を既に知り status /
  CURRENT.json に出していたが、§5 prose をそれと照合する gate が無く、矛盾シグナルが真横にあるのに
  drift が全 gate を素通りした (absence-blindness、[[feedback_coverage_not_substance]] /
  [[feedback_verify_carry_status_against_code]])。

## 2. Fix

### (A) §5 machine-seed (`src/handover/index.ts` renderHandoverScaffold)

`computeOutstandingWork` を 1 回計算し §5 と CURRENT.json で共有。§5 冒頭に機械集計行
(`HANDOVER_OUTSTANDING_MARKER` = `機械集計 (outstanding): non-terminal PLANs=N; open defers=M`) +
「これに反する『待ち/未了』記述は false-state」注記を seed し、その下に human TODO を置く。
outstanding 未指定時は従来の §5 TODO (後方互換)。

### (B) fail-close anchor gate (`checkHandoverOutstandingAnchor` → doctor)

最新 handover entry の §5 に machine marker が常駐するかを fail-close 検証 (`latestEntrySection` で
最後の `# Session Handover` entry の §5 を抽出)。marker 不在 = seed 経路が外された / 手書き bypass =
false-state が機械事実なしに残れる状態ゆえ fail-close。pointer/doc 不在は skip (handover-discipline が担う)。

## 3. Acceptance Criteria

- [x] `ut-tdd handover` が §5 に outstanding marker を seed する (実 repo で確認: non-terminal PLANs=0;
  open defers=1)。
- [x] doctor `handover-outstanding` が最新 §5 の marker 常駐を fail-close (`handoverOutstanding.ok` を
  ok 連鎖へ配線)。
- [x] 後方互換: outstanding 未指定で従来 §5 TODO。pointer 不在 skip。
- [x] test: U-HOVER-017 (seed marker / 後方互換 / pointer skip / marker ok / marker 不在 fail / 複数 entry
  は最後の §5)。
- [x] typecheck / Biome / Vitest / doctor (handover-outstanding OK) / db rebuild green。

## 4. Out of scope

- **explicit §Deferred (owner=PO) の outstanding 集計**: `outstanding.openDefers` は placeholder-deps の
  `specBackfillWaits` を数え、PLAN-L7-48 の §Deferred (auth-gated, owner=PO) は prose 別管理で未集計。
  owner=PO defer を outstanding に含める enrichment は別件 (IMP-139 follow-up)。
- §5 prose の自然言語照合 (stale PLAN/IMP 参照の NLP 検出) = 脆いため不採用。machine marker 常駐 +
  矛盾の可視化で代替。

## 5. 壊さない / 再発させない

- **§5 の machine marker (`機械集計 (outstanding)`) を消すな / seed 経路 (renderHandoverScaffold の
  `outstanding` 渡し) を外すな**。doctor `handover-outstanding` が fail-close。外すと false-state 再発。
- **「open defers=N」を特定 PLAN に紐付けるときは実体を確認** (specBackfillWaits か explicit §Deferred か)。
  本 session で前 session の「open defers=1 = L7-48」誤紐付けを訂正した
  ([[feedback_verify_carry_status_against_code]])。
- **PLAN 追加/status 変更後は `ut-tdd db rebuild`**。
