---
plan_id: PLAN-REVERSE-465-cross-review-author-binding-backfill
title: "PLAN-REVERSE-465: cross-review author binding 実装事実の上流合流 (L6 契約への
  gap-only backfill)"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-07-28
updated: 2026-10-09
owner: PM / PO
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: TL - 実装で確定した照合規則と unverified 判定式の L6 契約への合流判定
  - role: qa
    slot_label: QA - 上流記述と実装挙動 (provider 族導出・回避条項) の照合
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-465-cross-review-author-binding-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    - docs/plans/PLAN-L6-13-cross-review-enforcement.md
    - src/lint/review-evidence.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 926
admission_receipt:
  schema_version: v2
  receipt_id: certificate:817b6f0bf094c9aabcdd08133353984d
  command_id: plan-revise:issue-926:b-custody-contract:reverse:r2
  admitted_at: 2026-10-09T04:22:25.406Z
  source_digest: sha256:12bf68f62db033f8fe2f33fd1fa128e4f1ed37997933ce1692faafa136a35ac1
  decision_digest: sha256:c49ffb2c0166f33fad2ac8fa0fe6d34cb41aa6c29d246b0ecae7f100cfe495e8
  receipt_digest: sha256:a3b228121d5fea96acfaf6f647b69ec6a1e55871a136f92c82e0bc27f35189be
  binding:
    path: docs/plans/PLAN-REVERSE-465-cross-review-author-binding-backfill.md
    plan_id: PLAN-REVERSE-465-cross-review-author-binding-backfill
    asset_id: plan:legacy:39cf6458a39e9c20e1e650240726fddfe605a90d4a49c98b71c4c082b79b6419
    revision: 2
    content_digest: sha256:12bf68f62db033f8fe2f33fd1fa128e4f1ed37997933ce1692faafa136a35ac1
  route:
    signal: drift
    mode: reverse
  issue:
    provider: github
    issue_id: 926
    episode_id: issue-926
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-465-cross-review-author-binding
    revision: 2
    digest: sha256:895c5796a635ea99bc4e7133b37c5946d5165c74989998058d50429b28815600
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-REVERSE-465-cross-review-author-binding-backfill
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #926 reverse backfill: align L6 cross-review contracts and
    reverse ACs with PLAN-L7-465's frozen B-wrapper cutoff and terminal-custody
    integrity requirement."
---

# PLAN-REVERSE-465: cross-review author binding の上流合流

PLAN-L7-465 は PLAN-L6-94 契約の L7 実装であり、既存 cross-review 契約 (PLAN-L6-13 / IMP-076) に
**新しい判定面** を足す:
申告 `worker_model` と実 author の provider 族の照合、`unverified` の扱い、利用上限に
よる回避条項。これらは実装だけが知る条件になってはならないため、gap-only で L6 契約へ
合流させる。

## スコープ (gap-only)

1. provider 族と author の導出規則 (commit trailer + wrapper session log) を L6 契約へ記述
   (L6-94 §2 の provider-direction-coherence が要求する「著者が誰か」の導出元)。
2. `unverified` (照合不能) を green に混ぜないという判定規則を契約化。
3. 利用上限による `intra_runtime_subagent` 格下げ条項を契約へ明記
   (marker + 理由 + one-shot + audit)。
4. **D2-D backstop 契約** (Forward §D2-D 実装契約 freeze 2026-08-13) の上流合流:
   `bypass_merge` / `merged_without_verdict` の 2 検知類型、cutoff baseline
   (tracked source 唯一の定数 = D 実装 PR HEAD commit の committer date)、merged PR 一覧の
   pagination 終端まで全走査、途中失敗・partial/malformed・終端不能を「検知不能」へ倒す
   fail-close 表示。これらが実装だけが知る条件にならないよう gap-only で L6 契約へ記述する。
5. **Issue #926 B-wrapper custody-integrity follow-up**: cutoff より厳密に前の既存 receipt は terminal event 要求だけを grandfather し、cutoff と等しい時刻または以後の receipt は nonce / canonical request identity / parsed receipt bytes and digest / verdict bytes and digest / unique exact attempt and canonical path / supersession-conflict 状態の完全 chain を B consumer が独立して検証する。これは family-authority authorization の代替ではない。GUI producer・PR comment の custody 取込・cross-clone distribution は Issue #907 側で別途扱う。

## Schedule

- R0 (serial): L7-465 実装の観測 (確定した導出規則・判定式・回避条項の採取)
- R1 (serial): L6-13 との gap 判定 (影響なし面は「影響なし」と明記して閉じる)
- R2 (serial): 上流への gap-only 追記
- R3 (serial): pair_artifact と実装の照合 (QA slot)
- R4 (serial): Forward 再合流判定 → confirm

## AC

- AC-1: L6-94 / L6-13 に provider 族と author の導出規則と `unverified` の扱いが記載され、実装挙動と
  一致することを照合済み。
- AC-2: 利用上限による回避条項が契約に明記され、`cross_agent` 僭称が契約上も禁じられて
  いること。
- AC-3: L4 / L5 への影響有無が明示的に判定され、未判定の面が残っていない。
- AC-4: D2-D backstop の検知 2 類型 / cutoff baseline の確定手続 / pagination 全走査と検知不能
  表示 (Forward oracle 対 1〜9) が L6 契約に記載され、実装挙動と一致することを照合済み。
  Forward §D2-D の宣言と本 Reverse の scope/AC が二読みなく一致していること。
- AC-5: Issue #926 の strict cutoff (2026-09-16T09:51:00Z) と pre-cutoff grandfather scope、post-cutoff B-consumer full-chain predicate が L7 と同じ境界で L6 の B-wrapper merge contract に gap-only backfill されている。nonce / request / receipt / verdict / attempt の各 identity mismatch は独立した negative oracle で deny、GUI/comment/cross-clone producer work は #907 に残す。
