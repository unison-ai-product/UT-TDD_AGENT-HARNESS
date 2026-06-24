---
plan_id: PLAN-L7-91-hollow-deliverable-detection
title: "PLAN-L7-91 (troubleshoot): 中身空っぽ (hollow) deliverable 検出 — plan-artifact-existence を phantom (不在) に加え hollow (空) も fail-close"
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
    scope: "PO 質問『中身空っぽを見つけたときの対処法 / DB 上の取り扱い』(2026-06-22) を受け、現状の hollow 扱いをコード確認 (DB は db-projection-ingestion が derived 14=空なら fail-close / evidence-gated 12=cold-start 空は正常、と provenance で分類済) のうえ、残る穴 = plan-artifact-existence が existsSync のみ見るため『declare 済で実在するが中身が空 (hollow)』を素通りさせていた点を根治。修正: 完了 status PLAN の generates artifact が実在するが非空白 0 (= hollow) なら violation に追加 (phantom と distinct に報告)。.gitkeep は意図的空 placeholder ゆえ除外、読めない/バイナリは hollow 断定しない (fail-open、phantom 側が拾う)。blast radius: 全 tracked 空ファイル (.gitkeep 除く) = 0 / 空本文 PLAN = 0 を scan で確認済 → repo green 維持。test 6 ケース追加 (analyze hollow / phantom+hollow distinct / draft 非 flag / loader hollow + .gitkeep 除外)。typecheck/Biome/Vitest/doctor green。prose 真偽や DB row の field-null substance は範囲外 (§4)。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - hollow (empty) deliverable detection in plan-artifact-existence"
generates:
  - artifact_path: docs/plans/PLAN-L7-91-hollow-deliverable-detection.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/plan-artifact-existence.ts
    artifact_type: source_module
  - artifact_path: tests/plan-artifact-existence.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-55-plan-artifact-existence-gate.md
  requires: []
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-91 (troubleshoot): hollow (中身空っぽ) deliverable detection

## 0. Objective

「中身空っぽ (hollow)」= declare 済で実在するが中身が空、の deliverable を機械検出する。
PO 質問「中身空っぽを見つけたときの対処法 / DB 上の取り扱い」(2026-06-22) への実装回答。

## 1. 現状の hollow 扱い (調査結果)

「空」は一律でなく **provenance で分類** されている (fail-open vs fail-close と同型):

- **DB (db-projection-ingestion)**: derived 14 表 (graph_nodes / trace_edges / test_cases 等、既存
  input から導出) は空 = **fail-close** (実欠陥)。evidence-gated 12 表 (test_runs / tool_runs /
  model_evaluations 等、実行証跡が出るまで空) は **正常 (cold-start)** で advisory のみ。
- **phantom (declare したが不在)**: plan-artifact-existence が fail-close。
- **orphan span / placeholder_deps / merged-plan-status**: それぞれ別 gate。

## 2. Problem (残っていた穴)

`plan-artifact-existence` は完了 status PLAN の generates を **existsSync のみ**で検査していた。
ゆえに declare したファイルを**空のまま commit**すると existsSync=true で phantom 検査を素通りし、
「完了宣言の deliverable が中身空っぽ」= substance 不在の false-completion を見逃していた
(coverage ≠ substance の deliverable 版)。

## 3. Fix

`src/lint/plan-artifact-existence.ts`:

- `PlanArtifactRow.hollowArtifacts` を追加 (実在するが非空白 0 の generates path)。
- violation を `{missing, hollow}` の 2 クラスに分け、完了 status PLAN で `missing>0 || hollow>0`
  なら fail-close。message は phantom (不在) と hollow (空) を distinct に表示。
- `isHollowFile`: 実在ファイルを utf8 で読み `\S` を含まなければ hollow。`.gitkeep` は意図的空
  placeholder ゆえ除外。読めない/バイナリは hollow 断定しない (fail-open、phantom 側が拾う)。
- draft 等 未完了 status は対象外 (WIP stub は完了まで許容)。

## 4. Acceptance Criteria — met

- [x] 完了 status PLAN の generates が実在するが空 (hollow) なら fail-close。
- [x] phantom (不在) と hollow (空) を distinct に報告。
- [x] `.gitkeep` は除外 (意図的空 placeholder)。draft の hollow stub は非 flag。
- [x] blast radius 0 (全 tracked 空ファイル 0 / 空本文 PLAN 0 を scan で確認、repo green 維持)。
- [x] test 6 ケース追加。typecheck / Biome / Vitest / doctor green。

## 5. 対処法 (中身空っぽを見つけたときの手順、ドメイン規律)

1. **分類**: cold-start / evidence-gated / 明示 placeholder (`.gitkeep` / placeholder_deps /
   explicit_l7_defer) か、それとも substance があるべきか。
2. **意図的に空**ならマーカーを必須化 (silent 空にしない = absence-blindness を作らない)。
3. **欠陥なら fail-close**: hollow を充填するか declare を消すか PLAN を draft へ戻す。DB へ hollow
   行を substantive として投影しない (derived=fail-close / evidence-gated=ゲート)。

## 6. Out of scope

- **PLAN 本文の空 (AP-13「本文 0 行・declare のみは無効」) の機械強制**: blast radius 0 だが本 PLAN は
  deliverable substance に限定。必要なら別 PLAN で plan body の非空チェックを追加可 (低リスク)。
- **DB row の field-null substance / prose 真偽**: 一段下の substance で、本 gate の範囲外
  (prose 真偽は機械化不能、[[PLAN-L7-89]])。
