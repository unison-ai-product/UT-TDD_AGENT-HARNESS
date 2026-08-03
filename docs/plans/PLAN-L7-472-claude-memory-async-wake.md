---
plan_id: PLAN-L7-472-claude-memory-async-wake
title: "PLAN-L7-472 (add-impl): Claude宛てHARNESS memoryの即時async wake"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: draft
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
review_evidence: []
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

## 設計と検証の対

| 設計境界 | oracle |
| --- | --- |
| Git共通dir・一度だけ配送 | `U-MEMWAKE-001` |
| 冪等retry・異内容競合 | `U-MEMWAKE-002` |
| data fence escape | `U-MEMWAKE-003` |
| Git root fail-close | `U-MEMWAKE-004` |
| 待機値fail-close | `U-MEMWAKE-005` |
| interactive sessionと有限委譲の分離 | `U-MEMWAKE-006` |
| Stop hook `asyncRewake` 配線と機械検査 | `tests/runtime-hook-entrypoints.test.ts` / `tests/project-hook.test.ts` |
| consumer template配線 | `tests/setup.test.ts` |

## Schedule

1. [並列] 配送domainとU-MEMWAKE oracleを追加する。
2. [直列] CLI `memory add --notify-claude`とStop hookへ接続する。
3. [並列] source/consumer settings、project-hook、setup templateを同期する。
4. [直列] targeted test、typecheck、cross-family review、実通知E2Eを完了する。

## 完了条件

- [ ] U-MEMWAKEとhook/setup対象テストがgreen。
- [ ] typecheck/Biome/plan lintがgreen。
- [ ] 実HARNESSメモリ通知でClaude sessionが即時再開する。
- [ ] non-author familyのclosing reviewで未解決FLAGがない。
