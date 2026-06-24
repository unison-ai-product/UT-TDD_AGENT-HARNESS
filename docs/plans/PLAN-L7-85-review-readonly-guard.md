---
plan_id: PLAN-L7-85-review-readonly-guard
title: "PLAN-L7-85 (troubleshoot): 委譲レビューの read-only 強制 + commit 前 staged-diff 確認の機械化 (IMP-137 再発防止)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-code-reviewer (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "IMP-137 (full-access 委譲 Codex が DESK REVIEW 中に off-task で共有ファイルを編集し commit に混入 → doctor 後追い赤化) の再発防止を機械化。① read-only 期待ロール (相談/検証 archetype = tl/qa/uiux + review エイリアス) の委譲 session が working tree を変更したら検知 (assessReviewSession violation)、② commit 前に staged 集合を doctor と共に確認し混入を弾く (ut-tdd review --staged)。src/runtime/review-guard.ts は純関数のみ (git/fs 端点なし、before/after porcelain 配列を受け取る) で module-boundary (runtime↛lint) を保ち、I/O は cli の loadChangedFiles/loadStagedFiles が担う。ut-tdd <provider> --role <read-only> --execute は spawn 前後を assess し warning surface (exit 不変=fail-open、レビュー成果は殺さず混入を staged 前に弾く規律へ繋ぐ)。worker/未知ロールは対象外で誤検知回避。U-RGUARD-001..012 が role 分類・mutation 検知・assessment・message・staged summary を被覆。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - review read-only guard + staged-diff mechanization"
generates:
  - artifact_path: docs/plans/PLAN-L7-85-review-readonly-guard.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/review-guard.ts
    artifact_type: source_module
  - artifact_path: src/lint/change-impact.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/review-guard.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-85 (troubleshoot): review read-only guard + staged-diff mechanization

## 0. Objective

IMP-137: full-access の委譲 Codex が DESK REVIEW (「実装代行しない」明示) 中に
off-task で共有ファイルを直接編集し、その混入が `git add` 経由で commit に紛れ込み、
impl だけ revert された不整合で doctor が後追い赤化した (IMP-125 同型の agent
overstep)。再発防止を 2 機構で機械化する:

1. **read-only 委譲の非破壊性検知** — 相談/検証 archetype (read-only 期待) の委譲
   session が working tree を変更したら検知し warning で surface する。
2. **commit 前 staged-diff 確認の機械化** — staged 集合を doctor と共に確認し、
   意図しない混入 (off-task review 編集の staged) を弾く。

## 1. Scope

In scope:

- **`src/runtime/review-guard.ts`** (新規) — 純関数群:
  `isReadOnlyDelegationRole` (相談/検証 archetype + review エイリアス) /
  `detectWorkingTreeMutation` (after∖before) / `assessReviewSession` (violation 判定) /
  `reviewGuardMessages` (warning builder) / `summarizeStagedReview` (staged ∩ mutated)。
  git/fs 端点を持たず before/after path 配列を受け取る (module-boundary: runtime↛lint)。
- **`src/lint/change-impact.ts`** — `loadStagedFiles` (`git diff --cached --name-only`) +
  `parseStagedNames` を loadChangedFiles と対称に追加 (I/O 端点)。
- **`src/cli.ts`**:
  - `ut-tdd <provider> --role <read-only> --execute` が spawn 前後の `loadChangedFiles`
    を assess し、violation を warning で surface (fail-open: exit 不変)。
  - `ut-tdd review --staged` が staged 集合 + doctor を確認し、混入/赤化を fail-close。

Out of scope:

- review session を OS レベルで read-only sandbox 化すること (full-access 委譲を物理的に
  制限する手段は本 PLAN の対象外。本 PLAN は検知 + 隔離規律の機械化)。
- review-mutated パスのセッション跨ぎ永続化と staged との自動 cross-reference
  (`summarizeStagedReview` は cross-reference 関数を提供するが、永続 state 配線は future)。

## 2. Acceptance Criteria

- 相談/検証ロール (tl/qa/uiux + review エイリアス) は read-only=true、worker/未知は false。
- read-only 委譲が working tree を変更 → `violation=true` + 変更パス surface。worker /
  clean は無音。
- `ut-tdd <provider> --role qa --execute` 等の read-only delegation が tree を変更した
  場合に warning を stderr へ出す (exit は child のまま=fail-open、委譲成果を殺さない)。
- `ut-tdd review --staged` が staged 集合を列挙し doctor を回す。doctor 失敗 / suspect
  検出で exit=1 (fail-close)。
- review-guard は純関数で git/fs 端点を持たない (module-boundary 順守、dependency-drift
  cycles 0 を壊さない)。
- typecheck / Biome / 全 Vitest / `ut-tdd doctor` green。

## 3. Test Design Pairing

Unit test design: `docs/test-design/harness/L7-unit-test-design.md`
(U-RGUARD-001..012、PLAN-L7-85 Review Read-Only Guard Addendum)。
`tests/review-guard.test.ts` が role 分類・mutation 検知・assessment・message・staged
summary を被覆。

## 4. Status

Confirmed. Implemented and verified 2026-06-19.
