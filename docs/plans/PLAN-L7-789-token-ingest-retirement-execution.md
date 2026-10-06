---
plan_id: PLAN-L7-789-token-ingest-retirement-execution
title: "PLAN-L7-789 (impl): 常時 token 取り込みと model_evaluations 生成の退役の実行"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
created: 2026-10-06
updated: 2026-10-06
owner: Claude (author) · Codex gpt-6.1-sol (非著者 closing review)
parent_design: docs/plans/PLAN-L6-789-token-ingest-retirement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
backprop_decision: not_required
backprop_decision_reason: 純退役・新契約なし。PLAN-L6-789 が退役契約の正本であり、本 PLAN はその §4 PR-1 を実行するだけで上位契約を変えない。
agent_slots:
  - role: se
    slot_label: "Claude author - #840 を forward branch で再構成し token projection と
      model_evaluations 生成を撤去する"
  - role: qa
    slot_label: QA - U-TOKRET-001..005 が旧実装を戻すと RED になることと plan-artifact-existence を検証する
  - role: tl
    slot_label: Codex gpt-6.1-sol - exact HEAD を非著者 frontier tier で closing review する
generates:
  - artifact_path: docs/plans/PLAN-L7-789-token-ingest-retirement-execution.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-789-token-ingest-retirement.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-789-token-ingest-retirement.md
    - docs/plans/PLAN-L7-57-token-telemetry-tracker.md
    - docs/plans/PLAN-L7-58-telemetry-cost-enrichment.md
    - docs/plans/PLAN-L7-423-engine-swap-domain-objects-ports.md
    - docs/plans/PLAN-L7-53-learning-engine.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/789
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/840
review_evidence:
  - reviewer: gpt-6.1-sol
    review_kind: cross_agent
    reviewed_at: 2026-10-06T07:51:53.775Z
    tests_green_at: 2026-10-06T07:46:31Z
    verdict: PASS
    worker_model: claude-opus-5-5
    reviewer_model: gpt-6.1-sol
    subject_head: 1efba92f232a6b5846abaf20fc16ce6d364f6aeb
    scope: PR 847 非著者 closing preflight review。token projection / model_evaluations
      生成の撤去、telemetry scan の表示専用化、PLAN-L7-423 / PLAN-L7-53 の部分退役
      revision、U-TOKRET-001..005 の宣言と RED 証跡 (旧 src 復元で 001/002/003/004 が
      RED)、l6-fr-coverage の退役行分岐 (U-FRCOV-007..009、Issue 848) を exact head
      で確認した。review receipt
      sha256:cf6fbbc7d380e110f1bbed2e8176314eca467638f7437d3fdbfe1915bc54109b。
    green_commands:
      - kind: unit_test
        command: node scripts/run-vitest-snapshot.ts (harness-check-linux /
          harness-check-windows full 回帰、CI run 37429292978)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T07:46:31Z
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: sha256:05d48011553a6b7726ecb35ba8aa27e6c86802ea115964781c33b7f719059bec
        anchor_commit: 1efba92f232a6b5846abaf20fc16ce6d364f6aeb
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/847
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/37429292978
status: confirmed
admission_receipt:
  schema_version: v2
  receipt_id: certificate:0a40e66c226f345a150285b8185b8794
  command_id: plan-revise:issue-789:l7-789:confirm:r3
  admitted_at: 2026-10-06T08:05:06.404Z
  source_digest: sha256:23a01566d02e0b44e8a1ae6d2289823458257190b406329e265fc34ddbd785b1
  decision_digest: sha256:fd6b38b0a5a64ae1ac3dcdc01e0a60c069cb5f4b0f3824b9bfc14dc5c264529d
  receipt_digest: sha256:e1080f099c3437e1e1657a508d2a81b16516725dd6b544f0aa3aa0433bd9c598
  binding:
    path: docs/plans/PLAN-L7-789-token-ingest-retirement-execution.md
    plan_id: PLAN-L7-789-token-ingest-retirement-execution
    asset_id: plan:51dac684967736f29c5b89a3b2b6cb09
    revision: 3
    content_digest: sha256:23a01566d02e0b44e8a1ae6d2289823458257190b406329e265fc34ddbd785b1
  route:
    signal: forward
    mode: forward
---

# PLAN-L7-789: 常時 token 取り込みと model_evaluations 生成の退役の実行

## 1. 目的

`PLAN-L6-789-token-ingest-retirement` (Issue #789、PO 承認 2026-09-30) の `implementation_target` として、
同 PLAN §4 の PR-1 を実行する。#840 (`work/fix-issue789-token-pr2-20261005`) の内容を、本 PLAN の
forward route に合う `work/forward-issue789-token-retire-exec-20261006` branch で作り直す。

本 PLAN は新しい契約を作らない。退役の範囲、継承するもの、退役 oracle はすべて `PLAN-L6-789` §2 / §4 / §5 を正本とする。

## 2. 実施内容 (PLAN-L6-789 §4 PR-1)

- `projectTokenUsage` / `projectRepoScopedTokenUsage` による token 行の生成を撤去する。
- `projectModelEvaluations` と `src/projection` の model-evaluations domain / application / adapter / port、
  store の `readModelEvaluationFacts` を撤去する。
- `src/lint/db-projection-ingestion.ts` の evidence-gated 一覧と provenance 要求から該当 table を外す。
- `telemetry scan` を `loadRepoScopedRuntimeSessionUsage` による表示専用にする (DB 書き込みなし)。
- `PLAN-L7-423` / `PLAN-L7-53` の `generates` から削除 artifact 5 件を `plan revise --manifest` で外し、部分退役注記を入れる。
- FR-L1-38 (L1)、function-spec の `projectModelEvaluations` 行、fr-unit-coverage、L7 unit test design
  (U-FR-L1-38 と model evaluation domain oracle の撤回、退役 oracle U-TOKRET-001..005 の宣言)、
  L14 OT-18 を退役に合わせる。

## 3. 退役 oracle

`docs/test-design/harness/L7-unit-test-design.md` の「Issue #789 退役 oracle (PLAN-L6-789 §5)」節に宣言する。

| ID | 実装テスト |
| --- | --- |
| U-TOKRET-001 / 002 / 005 | `tests/projection-writer.test.ts` |
| U-TOKRET-003 / 004 | `tests/cli-surface.test.ts` |

旧実装を戻したときの RED は、closing review の証跡に残す (PLAN-L6-789 §5 反証条件)。

## 4. 所有の宣言

`generates` は起票時点では本 PLAN 自身だけとする。成果物の所有は confirm と同時に宣言する
(draft PLAN の `generates` に既存ファイルを書かない規律)。

## 5. Schedule (serial)

1. [直列] #840 の src / tests 変更を取り込む (直列理由 = downstream_dependency)。
2. [直列] PLAN-L7-423 / PLAN-L7-53 の部分退役 revision と文書更新、退役 oracle の宣言 (直列理由 = downstream_dependency)。
3. [直列] 非著者 frontier tier (Codex gpt-6.1-sol) の closing review と、本 PLAN の confirm (直列理由 = verification_gate)。
4. [直列] merge 後に `ut-tdd db rebuild` を実行し、`model_runs` 行数と harness.db のサイズを Issue #789 に記録する (PLAN-L6-789 §6)。

## 是正記録 (2026-10-06、#847 F1)

PLAN-L6-789 §4 は「PLAN-L7-789 を起票し、confirm と同時に所有を宣言する」と書いている。ただし本 PR で残る変更 artifact (src 13 件、tests 7 件、docs 5 件) はすべて既存 PLAN の generates が所有している。所有者が 2 PLAN 以上になった path は `deliverable-trace-debt-audit.md` の baseline に無い限り `duplicate-artifact-ownership` (`src/lint/artifact-ownership.ts`) で fail-close するため、本 PLAN が重ねて所有を宣言すると新規違反になる。よって confirm 時点の generates は本 PLAN 自身だけとし、成果物は既存所有者のもとに残す。撤去した 5 artifact の所有は PLAN-L7-423 rev 2 / PLAN-L7-53 rev 2 で外した。
