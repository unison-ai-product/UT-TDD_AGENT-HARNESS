---
plan_id: PLAN-REVERSE-44-roadmap-definition-design
title: "PLAN-REVERSE-44 (reverse/design): 工程表メタモデルの設計書 back-fill — 人間向け全プログラム台帳 + human/AI plane を L4/L6 へ"
kind: reverse
layer: cross
drive: fullstack
status: draft
created: 2026-06-11
updated: 2026-06-11
workflow_phase: R4
confirmed_reverse_type: design
forward_routing: L4
promotion_strategy: reuse-with-hardening
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 工程表メタモデル設計 (全プログラム被覆 / program rollup / schema 拡張) の妥当性・既存 roadmap 機構非破壊の確認 (別 runtime)"
  - role: po
    slot_label: "PO — R3 intent 検証 + 設計書 (L4/L6) の被覆方針承認 + forward_routing=L4 合流承認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-44-roadmap-definition-design.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/roadmap-registry.ts
    artifact_type: source
  - artifact_path: tests/roadmap.test.ts
    artifact_type: test
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: codex-chat
    reviewer_model: claude-sonnet-4-6
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: approve
    scope: "Step3 park 配線 + program rollup 実装 (worker=チャット Codex)。5 軸レビュー Critical 0、Important 2 (U-ROADMAP-019 実 fs 依存 / covered+park エッジ未テスト) を PM が本コミットで解消。凍結契約 §3 と差異なし、非破壊・444 green。cross-agent (Codex worker ≠ Claude reviewer)。"
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-RECOVERY-04-roadmap-definition.md
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/design/harness/L4-basic-design/architecture.md
    - src/schema/roadmap.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-REVERSE-44 (reverse/design): 工程表メタモデルの設計書 back-fill

> **駆動モデル = Reverse (type=design)**。PLAN-RECOVERY-04 で製本化した工程表の定義 (人間向け全プログラム台帳 / 機能群=結合テスト grain / human-AI plane / フロント返却) を、**設計書 (L4 基本設計 / L6 機能設計) へ back-fill** する。実装済の roadmap 機構 (schema/registry/doctor、PLAN-DISCOVERY-05) は **reuse-with-hardening** で非破壊拡張する。reverse_type=design のため R1 (observed-contracts) skip、R0→R2→R3→R4。`requires` = RECOVERY-04 (製本化が先、定義確定が前提)。

## §0 背景 (なぜ Reverse か)

- 工程表の機構は **DISCOVERY-05 の PoC spike として L7 だけに実装**され、設計書 (L4/L6) が薄いまま source が先行している (bottom-up 実装先行 → 上位設計へ back-fill が常態、[[feedback_addfeature_bottomup_reverse_backfill]])。
- RECOVERY-04 で定義を「全プログラム被覆の人間向け台帳」へ拡張・製本化したので、その定義に整合する **設計書を Reverse で書き起こす**。「実装したが設計書に戻していない」を残さない ([[feedback_impl_must_backfill_to_design]])。

## §1 工程表 (Steps)

### Step 1: R0 Evidence — 実装済 roadmap 機構の証拠収集 [直列]
- `src/schema/roadmap.ts` / `src/lint/roadmap-registry.ts` / `src/doctor` checkRoadmap / 既存テストの一覧と現契約を収集 (`has_existing_tests=true`)。
- 直列理由 = **downstream_dependency** (後続 Step が本収集結果に依存)。

### Step 2: R2 As-Is Design — 現状設計の説明可能化 + as-is テスト設計逆復元 [直列]
- 現状 = 「layer 単一の工程表 1 大層分解」を as-is design として記述。既存テストから観測テスト設計を逆復元。
- 直列理由 = **downstream_dependency** (Step 1 evidence に依存)。

> **進捗 (2026-06-11)**: §3 凍結契約 = 確定。Step3 impl (park 配線 + program rollup) = **landed** (commit 3956f95、worker=Codex + PM substance 修正)。Step5 review = **code-reviewer APPROVE** (Critical 0)。残 = Step4 R3 intent 検証 (PO) + Step6 R4 forward routing (実体は RECOVERY-04 のバンド登録で実現済 = 形式 close 待ち) + 形式 L6/L14 設計 doc の製本 (現状は §3 凍結契約が機能設計の実体)。

### Step 3: 設計書 back-fill — L4 基本設計 + L6 機能設計の起草 [直列]
- **L4 基本設計** (`docs/design/harness/L4-basic-design/`): 工程表メタモデルの外部設計 = 全プログラム被覆台帳 / 機能群=結合テスト grain / human(工程表)–AI(PLAN) plane 分離 / harness.db projection 経由のフロント返却 / program rollup。
- **L6 機能設計** (`docs/design/harness/L6-function-design/`): roadmap schema 拡張 (program 横断 rollup)・全プログラム被覆判定関数 (各バンド↔工程表登録の突合) の型 body + pseudocode。対の単体テスト設計 (V-pair) を `docs/test-design/` に置く (pair-freeze 整合)。
- 直列理由 = **downstream_dependency** (Step 2 as-is に積層)。

### Step 4: R3 Intent Hypotheses (PO 検証必須) [直列]
- Forward へ渡す仮説・gap・routing を作成し **PO 検証**。直列理由 = **downstream_dependency**。

### Step 5: review (intra_runtime_subagent) [直列]
- `code-reviewer` で設計書の妥当性・既存機構非破壊・pair 整合をレビュー (review 前置 MUST)。直列理由 = **downstream_dependency** (定量 green 後に定性レビュー、IMP-077)。

### Step 6: R4 Gap & Routing — Forward 合流 [直列]
- gap を `forward_routing=L4` で Forward へ閉塞 (全プログラム工程表登録の Forward 着手点)。`missing_pair_artifacts` 記録。直列理由 = **shared_state** (handover / forward routing 更新)。

## §3 凍結設計契約 (Step 3 L6 機能設計 — Codex 実装入力、2026-06-11 凍結)

> RECOVERY-04 fullback で descended バンド登録 + future バンド明示 defer まで完了。残 impl = **park 配線 + program rollup**。本節で型契約・挙動・不変条件・テスト oracle を凍結し、チャット側 Codex が `src/lint/roadmap-registry.ts` + `tests/roadmap.test.ts` を実装する入力とする。**非破壊** (既存 `analyzeProgramCoverage` / `PROGRAM_BANDS` / 既存 4 工程表は据え置き、加算拡張のみ)。

### A. park 配線 (明示 defer band の単一正本化 + doctor 連動)

- **`PARKED_BANDS: Map<string,string>`** を `roadmap-registry.ts` に新設 (bandId → reason、単一正本 + 根拠コメント、CLAUDE.md ハードコード規約)。初期値 = `verification` / `cutover` (RECOVERY-04 §5 の正規 defer 文言)。
- **`ProgramCoverageResult` に `parked: BandCoverage[]` を追加**。`analyzeProgramCoverage` は parkedBandIds に属す band を `parked` に分類し `uncovered` から除外する (既存の `parkedBandIds` 引数を活用、シグネチャ変更なし)。
- **doctor 呼び出し変更**: `src/doctor/index.ts` の `analyzeProgramCoverage(records)` → `analyzeProgramCoverage(records, new Set(PARKED_BANDS.keys()))`。
- **`programCoverageMessages` 拡張**: parked band を **reason 付きで明示 surface** (silent truncation 禁止、[[feedback_coverage_not_substance]])。uncovered=0 でも parked を列挙し「全 park で偽 OK」を防ぐ。

### B. program rollup (複数工程表の横断集計 = 中央 UI projection 源)

- **`computeProgramRollup(records, statusOf, parkedBandIds): ProgramRollup`** を新設。
- **`ProgramRollup`** 形:
  ```ts
  interface ProgramRollup {
    totalBands: number; coveredBands: number; parkedBands: number; uncoveredBands: number;
    totalGates: number; reachedGates: number; totalSpans: number; confirmedSpans: number;
    frontier: string[];   // uncovered band id + pending gate を持つ工程表 planId (「実装どこまで?」の残り)
    perBand: Array<{ bandId: string; name: string; status: "covered" | "parked" | "uncovered"; roadmaps: string[] }>;
  }
  ```
- gate/span 集計は既存 `computeGateProgress` を全 records へ適用して合算。`frontier` = uncovered band id ∪ (reached=false の gate を持つ工程表 planId)。

### C. 不変条件 (invariant)

- parked band は uncovered に**現れない**が、必ず reason 付きで surface される (隠蔽しない)。
- rollup の `coveredBands + parkedBands + uncoveredBands === totalBands` (= `PROGRAM_BANDS.length`)。
- 既存 4 工程表の gate 到達計数・既存テストは不変 (回帰 0)。

### D. テスト oracle (V-pair、`tests/roadmap.test.ts` U-ROADMAP-019〜)

- U-ROADMAP-019: PARKED_BANDS の band は `analyzeProgramCoverage` の `uncovered` に出ず `parked` に入る。
- U-ROADMAP-020: `programCoverageMessages` が parked band を reason 付きで含む (空でも掲出)。
- U-ROADMAP-021: park 非対象の未登録 band は引き続き `uncovered` に残る (verification/cutover 以外を仮に未登録にした fixture)。
- U-ROADMAP-022: `computeProgramRollup` の band 分類合算 = totalBands、frontier が uncovered + pending gate を列挙。

## §2 実装計画 (情報源明記)

- **L4 設計書**: 情報源 = RECOVERY-04 §4 製本化 (確定定義) + 既存 architecture.md §3.1 (roadmap mechanism は将来 module として) + `src/schema/roadmap.ts` (as-is)。
- **L6 機能設計**: 情報源 = `src/lint/roadmap-registry.ts` (computeGateProgress as-is) + RECOVERY-04 §5 再発防止 (全プログラム被覆チェックの設計) + harness-db.ts projection registry (フロント返却の口)。
- **全プログラム被覆チェック**: RECOVERY-04 §5 で root cause/仕組みを確定済 → 本 PLAN で L6 設計に落とし、実装は後続 Forward/Add-impl PLAN へ trace。
- **非破壊**: 既存 roadmap schema/registry/doctor は reuse、program rollup は加算拡張 (既存 L7 2 工程表は据え置き)。

## §6 用語更新 (§G.9)

- **全プログラム被覆 (program coverage)**: 工程表が forward 全バンド (L0-L3 / L4-L6 / L7 / L8-L14 + cutover) を登録被覆している状態。doctor が未登録 forward work を surface。
- **program rollup**: 複数工程表を横断集計し全体進捗・フロンティアを 1 ビューで返す projection。
- → concept §10 用語集へ back-merge (RECOVERY-04 製本化と pairing)。
