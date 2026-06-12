---
plan_id: PLAN-L6-35-descent-obligation
title: "PLAN-L6-35 (add-design): descent-obligation ledger の機能設計 — 上流 FR + 層隣接 matrix から下流/pair artifact を生成し不在を fail-close (FR-L1-03 抜け漏れ検出の absence-blind 是正、A-136 後 skill 片肺発見)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-12
updated: 2026-06-12
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 上流駆動 obligation 生成の純関数仕様 / 層隣接 matrix SSoT / defer ledger + impl-ahead ガード / 既存 pair-freeze・impl-plan-trace・l6-fr-coverage・relation-graph との非重複境界のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/descent-obligation.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - PLAN-L6-10-vmodel-pair-lint
    - PLAN-L6-31-cross-artifact-relation-graph
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude:opus-4-8
    reviewer_model: claude:sonnet
    tests_green_at: "2026-06-12T16:28:18+09:00"
    reviewed_at: "2026-06-12T16:29:00+09:00"
    verdict: approve
    scope: "descent-obligation 機能設計降下 (L3 AC-FR-03-04 / L4 §1.2 / L5 A.3 / L6 descent-obligation.md / L7 §1.22 U-DESC / glossary §10.3 / Red 骨格) の 5 軸クロスレビュー。初回 REQUEST_CHANGES (I-1 park satisfied 詐称 / I-2 untraceable 混入 / I-3 impl-ahead 二重登録 / I-4 invalid-defer dead code / M-1 from:* 型 / M-2 doctor 関数配置 / M-3 hard 昇格機械化) を全件 in-cycle 是正 → 再レビュー APPROVE。claude-only のため cross-runtime 不在、intra_runtime_subagent (code-reviewer) で代替。lint/typecheck/vitest 484 pass+8 todo/doctor exit 0 green を確認後に確定。"
---

# PLAN-L6-35 (add-design): descent-obligation ledger の機能設計

## §0 位置づけ

A-136 (Cycle P4) 完了後のクロスレビューで **skill subsystem の片肺 V-pair** を発見した: 実装 (`src/skills/recommend.ts`) とテストコードは着地済だが、**L6 単体テスト設計が不在**で、かつ skill pack content (W10 curate) も未着手。これが `impl-plan-trace` / `oracle-test-trace` / `pair-freeze` を全て素通りした。

根本原因 = **absence-blindness**: 既存の降下系チェックは「**宣言された link が解決するか**」しか見ず、「上流ノードから降りるべき下流ノードの必須集合」を生成しないため、**不在を違反として認識できない**。例えば `pair-freeze` (`vmodel-pair-freeze.md §2`) は **存在する design sub-doc を駆動**して各 doc の `pair_artifact` を検証する document-driven 方式であり、宣言の無い・`explicit_l7_defer` のホップは edge も孤児も出さず「ただ不在」になる。

本 add-design は **既存 FR-L1-03 (V字双方向 trace、設計⇔テスト設計ペア確認、抜け漏れ検出, P0) の降下不足**を埋める。新 FR は採番しない (L1 functional §7 の「既存 FR 拡張、新採番しない」方針に従う)。検査の向きを反転する: 「宣言された link を検証」→「**上流 (要件 FR registry) + 層隣接 obligation matrix から “存在すべき下流/pair 成果物” を生成し、不在を fail-close**」+ **impl-ahead ガード** (src 着地済なのに設計/テスト設計 defer 未 discharge = red)。これが skill 片肺を確実に捕まえる唯一の形 (`document-system-map.md §重要(4)` の「pair 未充足を DB 側で fail-close 検知する」意図の実体化)。

設計本体 = `docs/design/harness/L6-function-design/descent-obligation.md`、③ ペア = `L7-unit-test-design.md` の U-DESC。**本 PLAN のスコープは機能設計 (L6) + ③ テスト設計 (L6↔L7 V-pair) まで**。lint 実装 (`src/lint/descent-obligation.ts`) + harness.db `descent_obligations` projection + doctor 配線は **L7 実装 (別 add-impl PLAN、Codex 委譲)** であり本 PLAN 外。

## §工程表

### Step 1: [直列] 機能設計 doc 起草
- 直列理由 = **file_conflict** (descent-obligation.md を新規作成)。`loadDescentAdjacency` / `loadTraceKeyedArtifacts` / `loadDeferLedger` / `generateObligations` (上流駆動の核) / `analyzeDescentObligations` / `descentObligationMessages` の純関数仕様 + DbC + pseudocode + 層隣接 matrix の data model + edge case (E1-E8) + 既存 lint 非重複境界を記述。

### Step 2: [直列] L7-unit テスト設計 (③ ペア) 追記
- 直列理由 = **downstream_dependency** (Step 1 の関数仕様に対応する U-ID を起こす)。U-DESC-001〜008 を §1 に追記 (各関数 + edge case + impl-ahead ガード + 実 repo の現存 drop = skill 片肺を surface する回帰観点)。
- **U-DESC は本サイクルでは `tests/descent-obligation.test.ts` の Red 骨格 (`it.todo`) = forward-citation のみ** (oracle-test-trace green)。**U-DESC-008 の Phase 0 ベクトル昇格 (実 repo で skill 片肺が unmet/impl-ahead として surface される実アサーション化) は L7 add-impl の出口条件**であり本 add-design の範囲外 (M-5、Codex 委譲)。

### Step 3: [直列] L3/L4/L5 への descent 反映
- 直列理由 = **downstream_dependency**。L3 に AC-FR-03-04 (obligation 生成 / 不在検出) を追記、L4 function.md に module 行、L5 module-decomposition.md に lint module 行 + integration appendix を追記 (この add-design 自体が降下鎖を貫通する dogfood)。

### Step 4: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で設計⇔テスト設計の同粒度 / 上流駆動 obligation 生成の妥当性 / 既存 lint 非重複をレビュー (claude-only の cross-runtime 代替を evidence に残す)。

## §実装計画

- **descent-obligation.md** (情報源: vmodel-pair-freeze.md §1-§7 + relation-graph.ts node/edge + document-system-map.md §1 層×成果物×V-pair + FR-L1-03/L3 FR-03 + placeholder_deps physical-data §7): 上流駆動 obligation 生成 + defer ledger + impl-ahead ガードの純関数仕様。
- **L7-unit U-DESC** (情報源: Step 1 関数仕様): oracle を DbC で記述 + 実 repo で skill 片肺が unmet として surface される回帰観点。
- 設計粒度 = L7 単体テスト設計粒度 (各関数 1+ U-ID + edge case + impl-ahead 1 ベクトル)。

## §6 用語更新

- **descent-obligation (降下義務)**: 上流成果物 + 層隣接 matrix から機械生成される「存在すべき下流/pair 成果物」。下流の自己宣言に依存せず、不在を fail-close で検出する (absence-blind 是正)。→ **concept §10.3 へ back-merge 済 (本サイクル)**。
- **impl-ahead ガード**: trace key の src/test が着地済なのに対応する設計/テスト設計 defer が未 discharge の状態を違反とする規則 (impl→設計 back-fill 未完の機械検出)。→ **concept §10.3 へ back-merge 済 (本サイクル)**。
- **absence-blindness**: 宣言された link のみ検証し不在を違反と扱えない検査様式の欠陥。→ **concept §10.3 へ back-merge 済 (本サイクル)**。

## §7 DoD
- [x] descent-obligation.md 起草 + L7-unit U-DESC-001〜008 (③ ペア)
- [x] L3 AC-FR-03-04 / L4 function.md §1.2 / L5 module-decomposition.md A.3 へ descent 反映
- [x] §6 用語を concept §10.3 へ back-merge (本サイクル、backfill-pairing green)
- [x] U-DESC forward-citation (tests/descent-obligation.test.ts Red 骨格、oracle-test-trace green)
- [x] review 前置 (code-reviewer、claude-only cross-runtime 代替記録)
- [x] L7 実装 (lint + projection + doctor 配線) は別 add-impl PLAN として Codex へ委譲 (本 PLAN 外、handover に明記。PLAN-L7-51-descent-obligation で実装)
