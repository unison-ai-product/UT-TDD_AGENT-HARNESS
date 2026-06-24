---
plan_id: PLAN-L7-87-merged-plan-status-kind-independent
title: "PLAN-L7-87 (troubleshoot): merged-plan-status の検出を kind 非依存 (deliverable-driven) 化 — L7-86 が温存した kind フィルタ盲点の根治"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-22
updated: 2026-06-22
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
supersedes:
  - PLAN-L7-86-merged-plan-status-deliverable-scope
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "merged-plan-status gate の 2 次的盲点を根治。L7-86 は path フィルタ (src/*.ts → 出荷物ルート) を直したが、kind フィルタ (ARTIFACT_KINDS={impl,add-impl,refactor}) を据え置き、『design/poc/reverse は出荷物を merge しない』前提に依存した。実際には poc dogfood spike (DISCOVERY-05 が src/schema/roadmap.ts ほかを merge) と add-design (L3-04/L3-05 が src/lint/*.ts を merge) が出荷物を merge しており、3 件の draft-with-merged-src が doctor green のまま埋もれた (L7-86 の review が『draft 5 本は非 artifact-kind ゆえ blast radius 0』と書いた、まさにその盲点)。修正: analyzeMergedPlanStatus の filter から ARTIFACT_KINDS を撤去し deliverable-driven (status 非 confirm かつ mergedArtifacts 実在) に。mergedArtifacts は既に出荷物ルートの実在 artifact に filter 済ゆえ kind は冗長かつ有害だった。本修正に先立ち 3 件の drift を実体検証 (merged 239cb32 + doctor load-bearing + Vitest 787 green) のうえ confirmed 化したので、gate を kind 非依存化しても repo は green 維持。test: kind 非依存 flag (poc/add-design/design) + 未 merge は非 flag + add-design×merged-src の integration 回帰を追加、旧『non-artifact kind を flag しない』unit test を反転。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - merged-plan-status kind-independent (deliverable-driven) detection"
generates:
  - artifact_path: docs/plans/PLAN-L7-87-merged-plan-status-kind-independent.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/merged-plan-status.ts
    artifact_type: source_module
  - artifact_path: tests/merged-plan-status.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-86-merged-plan-status-deliverable-scope.md
  requires:
    - docs/plans/PLAN-L7-54-merged-plan-status-gate.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-87 (troubleshoot): merged-plan-status kind-independent detection

## 0. Objective

`merged-plan-status` gate が捕まえるべき「出荷物を merge したのに PLAN が draft 放置」
drift を、**kind を問わず** (poc / add-design / reverse なども含めて) 検出できるように
する。L7-86 が path フィルタを直しても残っていた **kind フィルタの盲点**を根治する。

## 1. Problem (実証されたギャップ)

L7-86 は `generatesSrcPaths` を出荷物ルート全体 (`src/ tests/ scripts/ .claude/`) へ
拡張したが、violation 条件に残った `ARTIFACT_KINDS = {impl, add-impl, refactor}` の
kind フィルタはそのままだった。L7-86 の review evidence は

> 「現存 draft 5 本は全て非 artifact-kind ゆえ blast radius 0、repo は green 維持」

と書いたが、これは **検出できていない** ことを「false-positive が無い」と取り違えた
記述だった。実体を読むと:

- **PLAN-DISCOVERY-05** (kind=poc) は dogfood spike として `src/schema/roadmap.ts` /
  `src/lint/roadmap-registry.ts` / `tests/roadmap.test.ts` を `239cb32` (2026-06-12) で
  merge 済。`roadmap-registry` は doctor `checkRoadmap` (roadmap-rollup / program-coverage)
  として load-bearing 稼働中。だが PLAN は `draft` 放置。
- **PLAN-L3-04 / PLAN-L3-05** (kind=add-design) も `src/lint/*.ts` を `239cb32` で merge
  済・doctor の hard gate として稼働中だが `draft` 放置。

→ kind フィルタが poc / add-design を除外するため、これら 3 件の
**draft-with-merged-src** が doctor EXIT=0 のまま埋もれ、PO が手で PLAN を読むまで
発見できなかった。当 gate 自身の 2 次的 absence-blindness。

## 2. Fix

### 2.1 Drift の先行解消 (本 PLAN の前提)

gate を kind 非依存化すると上記 3 件が即 violation になるため、先に実体検証のうえ
status drift を解消した (各 PLAN の review_evidence に記録):

- 3 件の deliverable は `239cb32` で merge 済 + git 追跡済を確認。
- 7 モジュール全てが doctor / cli に配線され load-bearing (`checkRoadmap` /
  skill-assignment hard gate / Cycle P4 closure hard gate / telemetry-closure 等) を確認。
- Vitest 787/787 green / doctor EXIT=0 を確認。
- DISCOVERY-05 (poc): S4 exit 義務 (concept §2.5/§10 promote) は concept §10 glossary
  行 1134-1138 が当該モジュールを機械登録機構として明記済 = 既に discharge 済を確認し、
  `workflow_phase=S4` / `decision_outcome=confirmed` / `promotion_strategy=reuse-with-hardening`
  で confirmed 化。
- L3-04 / L3-05 (add-design): AC を merged + wired + tested で充足確認し confirmed 化。

### 2.2 Gate の kind 非依存化

`src/lint/merged-plan-status.ts`:

- `analyzeMergedPlanStatus` の filter から `ARTIFACT_KINDS.has(p.kind...)` を撤去。
  条件は `status 非 confirm` かつ `mergedArtifacts.length > 0` のみ (deliverable-driven)。
- `ARTIFACT_KINDS` 定数を削除。`mergedArtifacts` は既に出荷物ルート (`DELIVERABLE_ROOTS`)
  の **実在** artifact に filter 済なので、kind は冗長かつ有害 (過小検出) だった。
- docstring / 型コメント / review-evidence gate との関心分離コメントを deliverable-driven
  表現へ整合 (誤誘導コメント残債を残さない)。`MergedPlanRow.kind` は情報用に温存。

## 3. Acceptance Criteria — met

- [x] draft の PLAN が merged 出荷物 (src/tests/scripts/.claude) を持つと、**kind を問わず**
      violation になる (poc / add-design / design / impl / add-impl / refactor)。
- [x] deliverable が未 merge の draft PLAN は kind を問わず violation にならない (真に作業中)。
- [x] PLAN 自身の `docs/` artifact / `.ut-tdd/` 生成状態は merged-deliverable に計上しない。
- [x] 先行解消した 3 件 (DISCOVERY-05 / L3-04 / L3-05) は confirmed ゆえ violation にならない。
- [x] 残る draft 2 本 (DISCOVERY-03 = src 未 merge poc / RECOVERY-02 = 自身の md のみ) は
      merged 出荷物を持たないので violation にならない (正しく非対象)。
- [x] 旧 unit test「does not flag non-artifact kinds」を反転し、kind 非依存 flag /
      未 merge 非 flag / add-design×merged-src integration の回帰を追加。
- [x] typecheck / Biome / Vitest / doctor green。

## 4. Out of scope (→ IMP-139)

「層内の非終端 PLAN 数 / open explicit-defer 数 / PLAN 完了 ≠ 層完了」を **正の集計
シグナル**として status / handover / harness.db に surface する機構は本 PLAN の範囲外
(L7-86 と同様)。本 PLAN は drift の **fail-close 検出**を kind 非依存に強化する。
「何が未了か」の一覧 surface は IMP-139 (status/handover contract 変更を伴う、owner=PO)。
