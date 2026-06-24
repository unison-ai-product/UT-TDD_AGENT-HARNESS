---
plan_id: PLAN-L7-86-merged-plan-status-deliverable-scope
title: "PLAN-L7-86 (troubleshoot): merged-plan-status の merged-artifact 検出を src/*.ts から出荷物ルート全体へ拡張 (L7-71 drift 見逃しの根治)"
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
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "merged-plan-status gate (PLAN-L7-54) の検出穴を根治。gate は『generated artifact が merged なのに owning PLAN が draft 放置』を捕まえる設計だが、generatesSrcPaths が `src/*.ts` のみ filter していたため、L7-71 (draft のまま 7 個の .claude/commands/*.md を merge 済) を素通りさせた = PO が手で PLAN を読むまで埋もれた検出不備。修正: DELIVERABLE_ROOTS=[src/,tests/,scripts/,.claude/] で『出荷物』を判定し、docs/ (V-model 設計成果物) と .ut-tdd/ (生成ランタイム状態) を除外 (CLAUDE.md architecture boundary 準拠)。kind filter (impl/add-impl/refactor) は既存ゆえ design/poc/reverse の false-positive は出ない。blast radius 確認: 現存 draft 5 本 (DISCOVERY-03/05=poc, L3-04/05=add-design, RECOVERY-02=recovery) は全て非 artifact-kind ゆえ 0 件 = repo は green 維持。regression test 2 本 (draft impl + merged .claude → flag / PLAN 自身の docs/ artifact は非計上) + design PLAN は docs/ 出荷でも非 flag を追加。typecheck/Biome/Vitest/doctor green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - merged-plan-status deliverable-scope expansion"
generates:
  - artifact_path: docs/plans/PLAN-L7-86-merged-plan-status-deliverable-scope.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/merged-plan-status.ts
    artifact_type: source_module
  - artifact_path: tests/merged-plan-status.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-54-merged-plan-status-gate.md
  requires:
    - docs/improvement-backlog.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-86 (troubleshoot): merged-plan-status deliverable-scope expansion

> **訂正 / 一部 supersede (PLAN-L7-87、2026-06-22)**: 本 PLAN の review_evidence と §3 AC が
> 「kind filter (impl/add-impl/refactor) は既存ゆえ design/poc/reverse の false-positive は
> 出ない」「現存 draft 5 本は全て非 artifact-kind ゆえ blast radius 0」と記したのは **誤記**。
> これは false-positive の不在ではなく **false-negative (本物の drift の見逃し) を「問題なし」と
> 誤って framing** したもの。実際には DISCOVERY-05 (poc) / L3-04 / L3-05 (add-design) が出荷物
> (src) を merge 済のまま draft 放置されており、kind filter がそれを盲点として隠していた。
> PLAN-L7-87 が kind filter を撤去 (deliverable-driven 化) してこの盲点を根治し、3 件の drift を
> confirmed 化した。本 PLAN の path-scope 拡張 (src/*.ts → 出荷物ルート) 自体は有効・不変。

## 0. Objective

`merged-plan-status` gate (PLAN-L7-54) が捕まえるべき「merged したのに draft 放置」
drift を、`src/*.ts` 以外の出荷物 (特に `.claude/` runtime asset) でも検出できるよう
にする。L7-71 の status drift がこの gate を素通りした根因を根治する。

## 1. Problem (実証されたギャップ)

PLAN-L7-71 (kind=impl) は Phase-1 slash command 7 本 (`.claude/commands/*.md`) を
`7305fe7` で merge 済だったが、PLAN は `draft` のまま放置されていた。

- `merged-plan-status` gate のヘッダは「generated artifact が merged なのに owning
  PLAN が draft」を検出すると謳う。
- しかし実装 `generatesSrcPaths` は `generates` の `src/` で終わる `.ts` のみを
  merged-artifact 候補にしていた。
- L7-71 の出荷物は `.claude/commands/*.md` (markdown) ゆえ候補 0 → 未検出。
- 結果、doctor は EXIT=0 のまま L7-71 drift を surface できず、**PO が「L7 未実装は
  ないか」と問い、人手で PLAN を読むまで埋もれた**。これは「機械が gap を surface
  する (設計の柱3)」の不履行であり、当 gate 自身の absence-blindness。

## 2. Fix

`src/lint/merged-plan-status.ts`:

- `generatesSrcPaths` → `generatesMergedDeliverablePaths` に改名。
- merged-artifact 候補を `DELIVERABLE_ROOTS = [src/, tests/, scripts/, .claude/]`
  配下の `generates` artifact に拡張 (CLAUDE.md architecture boundary の出荷物)。
- `docs/` (PLAN 本体・設計・テスト設計 = confirm 前に実在するのが正常) と `.ut-tdd/`
  (生成ランタイム状態) は除外。
- 既存 `ARTIFACT_KINDS = {impl, add-impl, refactor}` の kind filter は据え置き
  ゆえ design/poc/reverse の docs 出荷は false-positive しない。
- violation message / 型コメント / docstring を deliverable 表現へ整合 (誤誘導コメント
  残債を残さない)。

## 3. Acceptance Criteria — met

- [x] draft の impl PLAN が merged `.claude/` deliverable を持つと violation になる。
- [x] その PLAN 自身の `docs/` artifact は merged-deliverable に計上しない。
- [x] deliverable が未 merge の draft impl PLAN は violation にならない (真に作業中)。
- [x] design/poc/reverse kind は docs 出荷でも violation にならない (kind + docs 除外)。
- [x] 現存 draft 5 本は全て非 artifact-kind ゆえ blast radius 0、repo は green 維持。
- [x] typecheck / Biome / Vitest / doctor green。

## 4. Out of scope (→ IMP-139)

status / handover / harness.db が「層内の非終端 PLAN 数 / open explicit-defer 数 /
PLAN 完了 ≠ 層完了」を **正の集計シグナル**として surface する機構は本 PLAN の範囲外。
本 PLAN は drift の **fail-close 検出** (draft なのに merged) を直す。残る「何が未了か
を一覧で見せる」surface は IMP-139 として起票 (status/handover contract 変更を伴う)。
