---
plan_id: PLAN-L6-79-plan-number-allocation-uniqueness
title: "PLAN-L6-79 (add-design): PLAN 番号採番の一意性契約 — 番号 prefix 重複 lint + 採番 SSoT (runtime 間衝突の再発防止)"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-13
updated: 2026-07-13
owner: PO / TL
parent_design: docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - 採番 SSoT 方式 (予約台帳 vs 検出のみ) と既存衝突 5 組の扱いの設計判断"
  - role: qa
    slot_label: "QA - 重複 prefix 検出の負系 fixture と allowlist 凍結 oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-79-plan-number-allocation-uniqueness.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
  requires: []
  blocks: []
  references:
    - .ut-tdd/audit/A-187-vmodel-checked-zip-divergence-audit-2026-07-13.md
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
review_evidence: []
---

# PLAN-L6-79 (add-design): PLAN 番号採番の一意性契約

## 1. 問題 (A-187 §8)

Claude / Codex の両ランタイムが独立採番した結果、origin/main に同一番号・別 slug の PLAN が
5 組存在する (L6-70 / L7-417 / L7-419 / L7-424 / L7-425、各 2 ファイル)。本監査中にも新規起票
PLAN-L6-71 が Codex 版と衝突し L6-78 へ改番した。plan_id (full slug) の一意性は保たれているが、
短縮表記「PLAN-L7-424」等は既に曖昧で、schedule・references・chat・handover の短縮参照が誤読リスクを
持つ。現行 lint (`duplicate_plan_id`) は full slug 単位のため番号 prefix 衝突を検出しない。

## 2. 設計範囲

1. 番号 prefix (`PLAN-<layer>-<number>`) の一意性を lint 検出対象にする契約を定義する
   (finding 型・severity・fail-close 境界)。
2. 既存衝突 5 組は declared errata allowlist として凍結し、新規衝突のみ fail させる
   (既存組の改番は wave2 進行中の Codex 作業と衝突するため、本 PLAN では行わず、
   両ランタイムの合流が落ち着いた時点で PO gate の別 slice として判断する)。
3. 採番 SSoT: 次番号の取得規約 (起票前に `git ls-tree origin/main` + 進行中 branch の最大番号確認、
   または予約台帳) を workflow 契約として明文化する。hybrid 運用では「origin/main と相手 branch の
   両方を確認してから採番する」を必須手順とする。
4. 短縮参照の規律: 衝突番号については full slug 表記を必須とする記述規約。

## 3. 受入条件

- 新規の番号 prefix 衝突が lint で fail-close する契約が固定される。
- 既存 5 組の allowlist が本 PLAN と lint 側で双方向に一致する (silent 追加不可)。
- 採番手順が workflow 文書 (CLAUDE.md / AGENTS.md いずれかの正本) へ降下する境界が定義される。
- `ut-tdd plan lint` / doctor green。

## 4. 降下先

L7 実装 (lint 追加 + allowlist oracle + 負系 fixture) は契約 freeze 後に後続起票する。
