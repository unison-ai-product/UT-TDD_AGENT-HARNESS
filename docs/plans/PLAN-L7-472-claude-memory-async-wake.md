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
updated: 2026-08-26
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
    scope: "PR #220 exact HEAD f8bcfb3a。claude-fable-5 orchestratorが先行FLAGのN-1を実VS Code環境で22/22 greenにより解錠し、claude-opus-5 blind-reviewerが公式asyncRewake契約、empty-inbox production default非block、workspace宛先束縛、L6/L7/Reverse同期を再判定した。後続GitHub Actions run 30808894193もLinux/Windows/aggregate 3/3 SUCCESS。"
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165446977
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165586153
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165635509
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165655786
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/30808894193
    green_commands:
      - kind: integration_test
        command: "./node_modules/.bin/vitest run tests/claude-memory-wake.test.ts tests/runtime-hook-entrypoints.test.ts tests/cli-delegation.test.ts（UT_TDD_TEST_EXECUTION_ROOT等3環境変数をworktreeへ固定し、claude-fable-5 orchestratorが22/22 passを実走）"
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
        output_digest: "sha256:57d3890076450b07509091e3e588347c2eaf2a5ed5c219d077337dfd71094f64"
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
10. memory/reviewのsubject worktreeと通知先を分離する。git common dirのfresh generation markerから
    inbox schema互換な生存Claude VS Code workspaceがexact 1件だけ得られた場合、そのSHA-256 identityへ
    wakeを束縛する。別worktreeから発行してもcanonical request digest/path/HEAD/revisionを変更しない。
11. 生存target 0件、複数workspace、schema非互換、破損markerはtyped denyとする。denyでも canonical request は
    先に永続化して backlog として保持し、0にするのは live wake / inbox publish / deferred queue の downstream
    write だけである。schema-compatible targetが新しい route composition 上で logical workspace としてexact 1件、
    全 marker が stale の場合だけ、canonical request永続化後に **同じworkspace ID**のtyped `deferred` queueを一度だけ
    作る。authoring worktree宛てのfalse `published`、推測配送、wildcard/global broadcast、request再発行を禁止する。
12. `waitForClaudeMemory`のheartbeatはgeneration identity（closed schema、generation、canonical workspace ID、
    session identity）を検証した後だけmarkerをrenewする。未検証・別generation・別workspace・破損markerをtouchして
    stale判定を延命してはならない。heartbeatは注入可能なfake/monotonic clockで検証する。

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

## Issue #454 liveness / deferred routing pair-freeze delta (2026-08-31)

> **Correction note (2026-08-31)**: 初版のこの delta が routing deny 時の canonical request まで write 0 と
> 記載していた点、および既存 `U-MEMWAKE-007` と stale の意味を混在させていた点を訂正する。親 PLAN の
> 既存 request backlog 契約と U-MEMWAKE-007 は維持し、訂正の正本は
> `PLAN-L6-103-claude-wake-liveness-deferred-routing` §1.2〜§1.2.2 とする。

Issue #454 は既存の Issue #416 workspace identity 契約の下に、stale marker の扱いと heartbeat の検証境界を追加する。
この delta は後続実装の方式を発明せず、L6 `memory.md` と L7 unit-test design の candidate oracle を同時に更新する。
正本は `PLAN-L6-103-claude-wake-liveness-deferred-routing` であり、source/test code、hook、CLI、#424 root migration、
#493/#494 は本 PLAN の変更対象外である。

| 境界 | 凍結値 |
| --- | --- |
| routing type | `live | deferred` の typed result。fresh exact-one は `live`、stale exact-one は同じ `workspaceId` の `deferred` |
| deny | 0件、複数件、incompatible、corrupt は typed deny。canonical request は先に保持し、live wake/inbox/deferred queue の downstream write は0 |
| ordering | canonical request の exclusive-create 成功 → identity/schema/freshness 検証 → live publish または deferred queue |
| retry | 同一 operation/content は exclusive-create idempotent。異内容は conflict、既存 bytes 不変 |
| heartbeat | generation identity 検証後だけ renew。fake/monotonic clock の 15分超 heartbeat を fresh として反証可能にする |

この delta は既存 `U-MEMWAKE-007` を再定義しない。現行 `resolveLiveClaudeWorkspace` は
`no_live_claude_workspace`、`ambiguous_live_claude_workspace`、`stale_claude_workspace`、
`incompatible_claude_workspace_schema` の4値を返す互換APIとして維持し、stale deny はそのまま残す。
staleを`deferred`へ写像するのは PLAN-L6-103 が新設する明示的な route composition の責務であり、
実装PRで既存 U-* の期待値を無宣言で反転させてはならない。

deferred queue の正本は `<git-common-dir>/ut-tdd-runtime/claude-memory-wake/deferred/<idempotencyKey>.json`、
昇格監査は同階層の`promoted/<idempotencyKey>.json`とする。schema、key、producer/consumer、retention/GC、
replay/duplicate、marker計数と混在状態は `PLAN-L6-103 §1.2.1〜1.2.2` および
`docs/design/harness/L6-function-design/memory.md` の同名節を参照し、実装PRで再発明しない。
queueの時刻は初回durable `createdAt`とそこから固定`PT0S`で導出する`eligibleAfter`を正本とし、後刻retryは
既存bytesから両値を再利用する。promotionの`promotedAt`は最初のdurable inbox entryの`createdAt`と同値に固定し、
inbox-first recoveryも既存inboxから再利用する。wall clockをretryごとに再mintして同一keyをconflictさせてはならない。

## Issue #416 workspace routing追補 (2026-08-26)

PR専用worktreeからのreview wakeが、実在しないsubject workspace IDへ固定され、main workspaceの
Claude VS Code sessionに消費されない実測を受け、U-MEMWAKE-007の同一git-common-dir契約を
producer側target resolutionまで拡張した。generation markerはconsumerのworkspace IDと対応inbox schemaを
公開し、producerはfresh・compatible・exact-oneだけを選ぶ。失敗時もcanonical requestは永続化済みのまま
保持し、配送成功とは報告しない。通知は引き続きreview verdictまたはmerge authorityではない。

- Red `38310b9b`: active main / no target / stale / incompatible / ambiguous targetを追加し6件Red。
- Green実装 `d070b586`: `resolveLiveClaudeWorkspace`とtyped backlog outcomeをCLI compositionへ結線。
