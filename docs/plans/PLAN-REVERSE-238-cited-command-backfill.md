---
plan_id: PLAN-REVERSE-238-cited-command-backfill
title: "PLAN-REVERSE-238: doc 記載コマンド実在保証の process back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - cited-command 規約 back-fill review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-238-cited-command-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/README.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-238-retrofit-preflight-doc-command.md
  requires: []
review_evidence:
  - reviewer: codex-cli
    review_kind: cross_agent
    reviewed_at: "2026-07-02T22:50:30+09:00"
    tests_green_at: "2026-07-02T22:50:05+09:00"
    verdict: approve
    scope: "PLAN-L7-238 からの process back-fill (README §5 共通原則へ引用コマンド実在保証規約)。retrofit.md の不在コマンド (ut-tdd doctor --preflight upgrade) を §7.8.3 相当読みの実在前段検証 (ut-tdd doctor full pass) へ訂正。再発防止は docs/process 限定の cited-command 実在ガード (CI テスト、top-level command 突合、実装予定 marker 規約)。codex (gpt-5.5) が初回 request-changes (nested subcommand 混入 / PLAN 背景の guard preflight 誤記 / スコープ記述不一致) → 3 件是正 → 追認 approve。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/cited-command-existence.test.ts tests/plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:50:05+09:00"
        evidence_path: tests/cited-command-existence.test.ts
        output_digest: "sha256:52e720551229a5fb4553c8855ff040d0cce1d88c4848be43c901be3bc3609093"
        anchor_commit: 6e7e79e9854df90e589081343282e2878f6e2e8d
---

# PLAN-REVERSE-238: doc 記載コマンド実在保証の process back-fill

## R0 Evidence

PLAN-L7-238 が retrofit.md の不在コマンド引用 (A-173 F-2 [critical]) を訂正し、
docs/process の `ut-tdd <sub>` 引用を CLI surface と突合する CI-gating テスト
(`tests/cited-command-existence.test.ts`) を実装した。process 正本にこの規約
(引用コマンド実在保証 + 未実装 marker 書式) が無い gap を back-fill する。

## R1 Observed Gap

- process doc が存在しないコマンドを必須手順として記載しても機械検出されなかった
  (F-2: retrofit 実行者を確実にブロックする class)。
- 未実装コマンドを意図的に引用する際の書式規約が無かった。

## R2 Alignment

運用手順の正本 (docs/process) は「実行可能」であることを機械保証する。将来面を規定する
仕様書 (concept/requirements) は対象外。ガードは setup/doctor リファクタ進行中のため
doctor 配線でなく CI テストとして実装 (リファクタ着地後の doctor 移設は任意)。

## R3 / R4 Outcome

- docs/process/modes/README.md §5 共通原則へ「doc 記載コマンドの実在保証」規約を追記。
- forward_routing は gap-only (要件レベルの変更なし。運用規約の process 追補のみ)。

## DoD

- [x] process 正本に引用コマンド実在保証の規約が載る。
- [x] 未実装 marker (実装予定/未実装) の書式が規約化される。
- [x] 機械ガード (CI テスト) と規約記述が一致する。
