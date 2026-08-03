---
plan_id: PLAN-L7-472-claude-memory-async-wake
title: "PLAN-L7-472 (add-impl): Claude宛てHARNESS memoryの即時async wake"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-03
updated: 2026-08-03
owner: Codex / TL
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - Git共通dir inboxとatomic deliveryを実装"
  - role: qa
    slot_label: "QA - 重複、別worktree、data fence、hook配線を検証"
  - role: tl
    slot_label: "TL - 通知と信頼根を混同しない境界を独立レビュー"
generates:
  - artifact_path: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/claude-memory-wake.ts
    artifact_type: source_module
  - artifact_path: tests/claude-memory-wake.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-465-cross-review-author-binding.md
    - docs/plans/PLAN-REVERSE-472-claude-memory-async-wake-backfill.md
    - docs/design/harness/L6-function-design/memory.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/RetryYN/HELIX-HARNESS
review_evidence:
  - reviewer: claude-opus-5-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-08-03T11:19:43Z"
    tests_green_at: "2026-08-03T11:19:00Z"
    verdict: pass
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    lane: claim-blind
    subject_head: f8bcfb3a004978516f9294fb341b7b4d260c364a
    scope: "PR #220 exact HEAD f8bcfb3a。先行FLAGのN-1を実VS Code環境で22/22 greenにより解錠し、公式asyncRewake契約、empty-inbox production default非block、workspace宛先束縛、L6/L7/Reverse同期を再判定した。後続GitHub Actions run 30808894193もLinux/Windows/aggregate 3/3 SUCCESS。"
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165446977
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165586153
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165635509
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165655786
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/30808894193
    green_commands:
      - kind: integration_test
        command: "bunx vitest run tests/claude-memory-wake.test.ts tests/runtime-hook-entrypoints.test.ts tests/cli-delegation.test.ts（Claude reviewerが実VS Code session環境で22/22 passを実走）"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-03T11:19:00Z"
        evidence_path: tests/runtime-hook-entrypoints.test.ts
        output_digest: "sha256:d3554d7686ffc50454c91bade40427786c2b1cfe9466f2564e4fcb889a51f3dc"
        anchor_commit: f8bcfb3a004978516f9294fb341b7b4d260c364a
      - kind: smoke
        command: "VS Code Claude 2.1.220 + project Stop hook + production default empty inbox（marker 4.103s、Claude alive、background hook PID観測）"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-03T11:11:52Z"
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: "sha256:1d370f5034e2eeda10616638c8eae08d9fca8c57c285602b1be64959b358f6da"
        anchor_commit: 09cf615062214d280913c5c82cadbdea2a31e1a9
      - kind: smoke
        command: "PR worktree publish -> main workspace hook exit 0 -> target workspace hook exit 2（WORKSPACE_ISOLATION_E2E）"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-03T11:17:26Z"
        evidence_path: tests/claude-memory-wake.test.ts
        output_digest: "sha256:7c10d01754b46fffca35836986aa6cc7f8d96e323a0e92875cd353def5fb634b"
        anchor_commit: f8bcfb3a004978516f9294fb341b7b4d260c364a
---

# PLAN-L7-472: Claude宛てHARNESS memoryの即時async wake

## 目的

Codexが共有HARNESSメモリへClaude宛て要求を書いたとき、15分巡回を待たず、稼働中の
Claude Code sessionを同じ通知で即時再開する。`.ut-tdd/memory/*.md`は永続知識の正本、
Git共通dir inboxは配送専用runtime stateとし、通知本文をreview verdictや署名の信頼根にしない。

## 契約

1. `ut-tdd memory add --notify-claude` は正規`writeMemory`成功後だけ、memory IDと安定operation IDを
   Git共通dirへexclusive createする。
2. Claude Stop hookは`asyncRewake=true`でinboxを待ち、同一IDをatomic claimして一度だけ配送する。
3. 別worktreeでも同じgit common dirを読む。旧watcherはgeneration更新で`superseded`終了する。
4. 通知本文はJSON data fenceへ閉じ、閉じmarkerや`<`をescapeする。
5. inbox conflict、破損entry、claim競合はfail-safeに扱い、通常session summaryを妨げない。
6. PR/HEAD/API/署名の正当性はD3cが再取得・検証する。memory通知だけでmerge可にしない。
7. Git共通dirを解決できないpublishと不正な待機値はfail-closeし、配送済みinboxを除去する。
8. `asyncRewake=true`をproject-hookで強制し、待機上限15分、claim/generation保持7日とする。
9. VS Code拡張が設定する`CLAUDE_CODE_ENTRYPOINT=claude-vscode`だけをpositiveなwake対象とし、
   未知・欠落entrypointとUT-TDDの有限Claude委譲はpoll前に即時終了させる。
10. inbox v2をauthoring worktreeのSHA-256 identityへ束縛し、別worktree sessionのclaimを拒否する。

## 設計と検証の対

| 設計境界 | oracle |
| --- | --- |
| Git共通dir・一度だけ配送 | `U-MEMWAKE-001` |
| 冪等retry・異内容競合 | `U-MEMWAKE-002` |
| data fence escape | `U-MEMWAKE-003` |
| Git root fail-close | `U-MEMWAKE-004` |
| 待機値fail-close | `U-MEMWAKE-005` |
| interactive sessionと有限委譲の分離 | `U-MEMWAKE-006` |
| workspace宛先とCLI exit 2配送 | `U-MEMWAKE-007` |
| Stop hook `asyncRewake` 配線と機械検査 | `tests/runtime-hook-entrypoints.test.ts` / `tests/project-hook.test.ts` |
| consumer template配線 | `tests/setup.test.ts` |

## Schedule

1. [並列] 配送domainとU-MEMWAKE oracleを追加する。
2. [直列] CLI `memory add --notify-claude`とStop hookへ接続する。
3. [並列] source/consumer settings、project-hook、setup templateを同期する。
4. [直列] targeted test、typecheck、cross-family review、実通知E2Eを完了する。

## 完了条件

- [x] U-MEMWAKEとhook/setup対象テストがgreen。
- [x] typecheck/Biome/plan lintがgreen。
- [x] 実HARNESSメモリ通知でClaude sessionが即時再開する。
- [x] non-author familyのclosing reviewで未解決FLAGがない。
