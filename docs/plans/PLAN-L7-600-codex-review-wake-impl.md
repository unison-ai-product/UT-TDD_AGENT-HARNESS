---
plan_id: PLAN-L7-600-codex-review-wake-impl
title: "PLAN-L7-600 (add-impl): Codex review wake 実装"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-16
owner: Codex / TL
parent_design: docs/plans/PLAN-L6-600-codex-review-wake-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: TL - production composition と信頼境界を検証する
  - role: se
    slot_label: SE - project-scoped inbox、claim、terminal、backlog の実装を検証する
  - role: qa
    slot_label: QA - FIFO、orphan、retry、retention の反証可能な oracle を検証する
generates:
  - artifact_path: docs/plans/PLAN-L7-600-codex-review-wake-impl.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-600-codex-review-wake-contract.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-600-codex-review-wake-contract.md
    - docs/plans/PLAN-REVERSE-600-codex-review-wake-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/runtime/codex-review-wake.ts
    - tests/codex-review-wake.test.ts
    - .codex/hooks.json
    - src/cli/review-live.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/600
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/640
review_evidence: []
backprop_decision: not_required
backprop_decision_reason: 実装は既存L6契約の具体化に限定し、上流要件の追加を行わない
status: draft
github_issue_id: 600
admission_receipt:
  schema_version: v2
  receipt_id: certificate:c00b91ac72bc4447dcd79d9332c2da04
  command_id: plan-draft:issue-600:codex-review-wake-impl:1
  admitted_at: 2026-09-16T19:00:00+09:00
  source_digest: sha256:acd8cb34e522504adf3c2ef62ca9af2d6c27d64427df7292f6c78e6f16bcc591
  decision_digest: sha256:cb0099724fc183d41f1a376e71ba06bcf3e93ff123b9d7bec912dfaadb2c26b8
  receipt_digest: sha256:ac80b9b30b13dedf4f78a792bf9f9e8d95002e4477567268e1d690531b25955d
  binding:
    path: docs/plans/PLAN-L7-600-codex-review-wake-impl.md
    plan_id: PLAN-L7-600-codex-review-wake-impl
    asset_id: plan:c00b91ac72bc4447dcd79d9332c2da04
    revision: 1
    content_digest: sha256:acd8cb34e522504adf3c2ef62ca9af2d6c27d64427df7292f6c78e6f16bcc591
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 600
    episode_id: E4-600-codex-review-wake-contract
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L6-600-codex-review-wake-contract
    revision: 1
    digest: sha256:47dc5c35538457e1ad37a0c563079cf2e2a74944af7cc878d36921b5d13897ff
  reentry:
    target_plan_id: PLAN-L7-472-claude-memory-async-wake
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #600 Codex review wake implementation after L6 contract freeze"
---

# PLAN-L7-600: Codex review wake 実装

## 0. 位置付け

PLAN-L6-600-codex-review-wake-contract が freeze した request-before-wake、project-scoped
inbox、typed hook surface、claim/terminal/backlog の境界を、既存の #640 実装へ束縛する
L7 implementation PLAN である。L6 の契約本文や既存の Claude wake 契約を改変せず、実装の
方式を後付けで正当化しない。

## 1. 実装範囲

- src/runtime/codex-review-wake.ts: Codex wake envelope の project-scoped publish、
  FIFO surface、expired claim restore、terminal retention、backlog retry を実装する。
- tests/codex-review-wake.test.ts: L6 candidate のうち現実装が検証する target session、
  FIFO/invalid保持、claim expiry、terminal retention、canonical conflict、production composition
  を命名テストへ束縛する。
- #640 で変更済みの .codex/hooks.json、review-live composition、request projection は、
  本 PLAN の source/test の最小配線を支える既存差分として参照する。別 consumer や新 CLI surface は
  追加しない。

## 2. 契約から実装への trace

| L6 candidate | 実装の観測点 | L7 test |
| --- | --- | --- |
| CANDIDATE-CODEXWAKE-001 | canonical request conflict は request identity を上書きしない | CANDIDATE-CODEXWAKE-001 |
| CANDIDATE-CODEXWAKE-003 | claim lease と expired claim restore | CANDIDATE-CODEXWAKE-003/010 |
| CANDIDATE-CODEXWAKE-004/011 | FIFO surface と invalid bytes 保持 | CANDIDATE-CODEXWAKE-004/011 |
| CANDIDATE-CODEXWAKE-006 | production composition が canonical request 後に publish | CANDIDATE-CODEXWAKE-006 |
| CANDIDATE-CODEXWAKE-008 | terminal marker の7日 retention/prune | CANDIDATE-CODEXWAKE-008 |
| CANDIDATE-CODEXWAKE-009 | target session 欠落時の fail-close / write 0 | CANDIDATE-CODEXWAKE-009 |

CANDIDATE-CODEXWAKE-002/005/007/010 の未実装境界は、実測なしに昇格しない。将来の bounded
follow-up で test を追加するまで候補のまま保持する。

## 3. 工程と検証

1. [直列] L6 contract、共有 L7 test-design、専用 Reverse の pair を確認する。
2. [直列] ut-tdd plan lint と doctor の plan-governance / backfill / source-trace を実行する。
3. [直列] targeted wake test、typecheck、Biome を実行し、実装の exact HEAD を evidence に束縛する。
4. [直列] 非著者 closing review と CI harness-check 5 系統を取得する。

## 4. scope boundary

この PLAN が所有する source/test は上記2ファイルだけである。L6 contract、Claude wake、
review receipt/custody、Issue close、merge authority、別の consumer surface は含めない。

## §6 用語更新

- Codex review wake: canonical request を project-scoped Codex inbox へ typed envelope として配送するL7実装。
- expired claim restore: lease期限後に同一bytesを inbox へ戻し再取得可能にする処理。

## 5. 成否

- src/runtime/codex-review-wake.ts と tests/codex-review-wake.test.ts が本 PLAN の
  generates に束縛され、impl-plan-trace / deliverable-plan-trace がそれぞれ該当 orphan 0 を返す。
- 上表の実測済み候補が targeted test で pass し、未実装候補は候補のまま残る。
- 後段 PLAN-REVERSE-600-codex-review-wake-backfill で L6/L3 の forward 合流判断を行う。
