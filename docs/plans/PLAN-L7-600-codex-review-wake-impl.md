---
plan_id: PLAN-L7-600-codex-review-wake-impl
title: "PLAN-L7-600 (add-impl): Codex review wake 実装"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-17
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
  - artifact_path: src/runtime/codex-review-wake.ts
    artifact_type: source_module
  - artifact_path: tests/codex-review-wake.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-600-codex-review-wake-contract.md
  requires:
    - docs/plans/PLAN-REVERSE-602-codex-review-wake-backfill.md
  blocks: []
  references:
    - docs/plans/PLAN-L6-600-codex-review-wake-contract.md
    - docs/plans/PLAN-REVERSE-602-codex-review-wake-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/runtime/codex-review-wake.ts
    - src/feedback/review-attestation.ts
    - src/cli/delegation.ts
    - tests/codex-review-wake.test.ts
    - tests/cli-delegation.test.ts
    - .codex/hooks.json
    - src/cli/review-live.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/600
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/640
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: 2026-09-17T17:04:37+09:00
    tests_green_at: 2026-09-17T17:04:37+09:00
    verdict: advisory
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    scope: 実装対象の targeted wake test、typecheck、Biome を同一draft HEADで確認。cross-agent
      closing review待ち
    green_commands:
      - kind: unit_test
        command: node scripts/run-vitest-snapshot.ts tests/codex-review-wake.test.ts
        runner: node
        scope: targeted
        exit_code: 0
        evidence_path: tests/codex-review-wake.test.ts
        output_digest: sha256:1b0f930272bf6e2a86df13fa3630bfe391bfceb32c01def77fd2339c11489faa
        completed_at: 2026-09-17T17:04:37+09:00
        anchor_commit: 8bcd0c796f787edd59eb82c3f00dc7e37798e32b
      - kind: typecheck
        command: npm run typecheck
        runner: node
        scope: targeted
        exit_code: 0
        evidence_path: tsconfig.json
        output_digest: sha256:da3803fb5e8090f8bf4e48607a8b033c35a574705d52e558245935d2f164cd0c
        completed_at: 2026-09-17T17:04:37+09:00
        anchor_commit: 8bcd0c796f787edd59eb82c3f00dc7e37798e32b
      - kind: lint
        command: npm exec -- biome check src/runtime/codex-review-wake.ts
          tests/codex-review-wake.test.ts
        runner: node
        scope: targeted
        exit_code: 0
        evidence_path: biome.json
        output_digest: sha256:b70d2d1403c671399680ca5c783e86591fde85e10dc57c45be2c8806f0549cf7
        completed_at: 2026-09-17T17:04:37+09:00
        anchor_commit: 8bcd0c796f787edd59eb82c3f00dc7e37798e32b
backprop_decision: not_required
backprop_decision_reason: 実装は既存L6契約の具体化に限定し、上流要件の追加を行わない
status: draft
github_issue_id: 600
admission_receipt:
  schema_version: v2
  receipt_id: certificate:9148c6c1228df37d848959853a83dcab
  command_id: plan-revise:issue-600:codex-review-wake-impl:r3-bounded:8bcd0c796f78
  admitted_at: 2026-09-17T17:06:00+09:00
  source_digest: sha256:7b6ddf2a9a440966a10e2b7fddd99868248ac0bd5f8f24de3d3c745288a9e70c
  decision_digest: sha256:cb0099724fc183d41f1a376e71ba06bcf3e93ff123b9d7bec912dfaadb2c26b8
  receipt_digest: sha256:fa1ca25aa3f2d1e864f9e5c1d568fbd3039092e8f990e390f41e40ac437a3e1b
  binding:
    path: docs/plans/PLAN-L7-600-codex-review-wake-impl.md
    plan_id: PLAN-L7-600-codex-review-wake-impl
    asset_id: plan:c00b91ac72bc4447dcd79d9332c2da04
    revision: 15
    content_digest: sha256:7b6ddf2a9a440966a10e2b7fddd99868248ac0bd5f8f24de3d3c745288a9e70c
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
- src/feedback/review-attestation.ts / src/cli/delegation.ts: conflict retry では
  `requestedAt` を可変メタデータとして扱い、`invocationNonce` が一致する既存の
  canonical request だけを再利用する。
- tests/codex-review-wake.test.ts: L6 candidate のうち現実装が検証する target session、
  FIFO/invalid保持、claim expiry、terminal retention、canonical conflict、production composition
  を命名テストへ束縛する。
- tests/cli-delegation.test.ts: `review_request_conflict` の同一 nonce 再利用と異なる
  nonce 拒否を、実際の delegation conflict recovery helper へ束縛する。
- #640 で変更済みの .codex/hooks.json、review-live composition、request projection は、
  本 PLAN の source/test の最小配線を支える既存差分として参照する。別 consumer や新 CLI surface は
  追加しない。

## 2. 契約から実装への trace

| L6 candidate | 実装の観測点 | L7 test |
| --- | --- | --- |
| CANDIDATE-CODEXWAKE-001 | canonical request conflict は request identity を上書きしない | CANDIDATE-CODEXWAKE-001 |
| CANDIDATE-CODEXWAKE-004 | receipt 永続化後の派生表示失敗でも terminalize する bounded variant | CANDIDATE-CODEXWAKE-004 |
| CANDIDATE-CODEXWAKE-006 | production composition と hook registration を canonical request 後に検証 | CANDIDATE-CODEXWAKE-006 |
| CANDIDATE-CODEXWAKE-007 | review 前の backlog は pending のまま保持する bounded safety variant | CANDIDATE-CODEXWAKE-007 |
| CANDIDATE-CODEXWAKE-008 | terminal marker の7日 retention/prune | CANDIDATE-CODEXWAKE-008 |
| CANDIDATE-CODEXWAKE-009 | target session 欠落時の producer fail-close と通常 hook exit 0 | CANDIDATE-CODEXWAKE-009 |
| CANDIDATE-CODEXWAKE-010 | 期限切れ claim の同一 bytes restore | CANDIDATE-CODEXWAKE-010 |
| CANDIDATE-CODEXWAKE-011 | valid entry を surface し invalid bytes を保持する bounded variant | CANDIDATE-CODEXWAKE-011 |

CANDIDATE-CODEXWAKE-002/003/005 はこの実装で未測定のため、実測なしに昇格しない。
004/007/011 は候補全体ではなく、上表に記載した bounded variant のみを実測する。
将来の bounded follow-up で不足する軸の test を追加するまで候補のまま保持する。

## 3. 工程と検証

1. [直列] L6 contract、共有 L7 test-design、専用 Reverse の pair を確認する。
2. [直列] ut-tdd plan lint と doctor の plan-governance / backfill / source-trace を実行する。
3. [直列] targeted wake test、typecheck、Biome を実行し、実装の exact HEAD を evidence に束縛する。
4. [直列] 非著者 closing review と CI harness-check 5 系統を取得する。

## 4. scope boundary

この PLAN が所有する source/test は上記の generates に列挙した bounded source/test とする。
L6 contract、Claude wake、Issue close、merge authority、別の consumer surface は含めない。

## §6 用語更新

- Codex review wake: canonical request を project-scoped Codex inbox へ typed envelope として配送するL7実装。
- expired claim restore: lease期限後に同一bytesを inbox へ戻し再取得可能にする処理。

## 5. 成否

- 本 PLAN の generates に列挙した source/test が、conflict retry と Codex wake の
  bounded実装へ束縛され、impl-plan-trace / deliverable-plan-trace がそれぞれ該当 orphan 0 を返す。
- 上表の実測済み候補が targeted test で pass し、未実装候補は候補のまま残る。
- 後段 PLAN-REVERSE-602-codex-review-wake-backfill で L6/L3 の forward 合流判断を行う。
