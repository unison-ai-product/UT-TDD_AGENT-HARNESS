---
plan_id: PLAN-L7-495-memory-delivery-backlog-visibility
title: "PLAN-L7-495 (troubleshoot): Claude memory配送backlogの可視化とfail-close警告"
kind: troubleshoot
layer: L7
drive: be
route_signal: incident
route_mode: incident
status: confirmed
created: 2026-08-21
updated: 2026-08-21
owner: Codex / TL
parent_design: docs/design/harness/L6-function-design/memory.md
pair_artifact: docs/test-design/harness/L7-memory-delivery-backlog-test-design.md
backprop_decision: not_required
backprop_decision_reason: "既存のClaude memory配送契約に観測と警告を追加する内部可視性修正であり、L0-L6要件の意味は変更しない。"
agent_slots:
  - role: aim
    slot_label: "AIM — publish成功とdelivery成立を分離する観測境界を固定する"
  - role: se
    slot_label: "SE — inbox backlog集計、session/hook状態、既存SessionStartへの最小結線"
  - role: qa
    slot_label: "QA — target mismatch、session不在、hook欠落、閾値警告のRed/Green検証"
  - role: tl
    slot_label: "TL — PLAN-L7-472/422との責務重複とfail-close境界を監査する"
generates:
  - artifact_path: docs/plans/PLAN-L7-495-memory-delivery-backlog-visibility.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-memory-delivery-backlog-test-design.md
    artifact_type: test_design
  - artifact_path: tests/claude-memory-backlog.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires:
    - docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  blocks: []
  references:
    - docs/plans/PLAN-L7-422-feedback-saturation-visibility.md
    - docs/plans/PLAN-REVERSE-472-claude-memory-async-wake-backfill.md
    - docs/design/harness/L6-function-design/memory.md
    - docs/test-design/harness/L7-memory-delivery-backlog-test-design.md
    - src/runtime/claude-memory-wake.ts
    - src/handover/session-start-digest.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/227
github_issue_id: 227
review_evidence:
  - reviewer: codex-primary
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T03:23:00Z"
    tests_green_at: "2026-08-21T03:23:00Z"
    verdict: preflight-pass
    worker_model: gpt-5.6-luna
    reviewer_model: codex-primary
    scope: "#227 pair-freezeと実装preflight。既存のinbox FIFO/claim/auditとSessionStart summaryを再利用し、backlog件数・最古age・target mismatch・共有runtime session不在・hook欠落を観測する。publishのpath成功はdelivery成功を意味しない。"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/claude-memory-backlog.test.ts tests/claude-memory-wake.test.ts tests/session-start-digest.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T03:17:51Z"
        evidence_path: tests/claude-memory-backlog.test.ts
        output_digest: "sha256:c10872bf58774cdccff89194e97273ae8ef5f06e94d33cf7c576762bf690d1b9"
      - kind: typecheck
        command: "node node_modules/typescript/bin/tsc --noEmit"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T03:20:00Z"
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: "sha256:02ebea1748131d8bcd3c3a0cd98b2f0da2253ba17bb492fe8c640f9304b46528"
      - kind: lint
        command: "node node_modules/@biomejs/biome/bin/biome check src/runtime/claude-memory-wake.ts src/handover/session-start-digest.ts tests/claude-memory-backlog.test.ts"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T03:20:00Z"
        evidence_path: tests/claude-memory-backlog.test.ts
        output_digest: "sha256:c10872bf58774cdccff89194e97273ae8ef5f06e94d33cf7c576762bf690d1b9"
    citations:
      - "PLAN-L7-472 / PLAN-REVERSE-472"
      - "PLAN-L7-422 draft gap audit"
      - "Issue #227 measured backlog evidence (2026-08-20)"
---

# PLAN-L7-495: Claude memory配送backlogの可視化とfail-close警告

## 位置づけ

Issue #227 は、`publishClaudeInboxEntry` がファイル作成を成功させても、受信側の
Claude sessionが存在すること・target workspaceが一致すること・Stop hookが配線されて
いることを証明しないため、通知依頼が無期限にinboxへ滞留する問題を扱う。
既存のPLAN-L7-472の配送、claim、FIFO、監査契約を置き換えず、観測面だけを追加する。
PLAN-L7-422はdraftのまま変更せず、feedback saturationとは別のClaude inbox配送境界を
本PLANへ確定する。

## 凍結契約

1. backlog summaryは、current workspaceの未claim件数と最古entry/ageを必ず返す。
2. 同じGit共通runtimeにある未claim entryのうち、current workspace以外のtargetを
   `target_mismatch`として別集計する。厳格なworkspace filterで黙って捨てない。
3. `.generation` markerの有効freshnessを共有runtime単位で集計し、fresh markerが0件で
   pendingがある場合は`session_absent`警告を出す。target workspace固有のsession存在を
   証明できない場合は`unknown`として扱い、存在を推測しない。
4. `.claude/settings.json`のStop hookに`claude-memory-wake`が無い、壊れている、または
   読めない場合は`hook_missing`警告を出す。
5. publishのreturn pathは「inbox projection created/idempotent」に限定し、delivery成立
   と表現しない。監査jsonlには`delivery_state=pending`と観測警告を記録する。
6. backlog ageが15分以上、target mismatch、session absent、hook missingのいずれかを
   warningとしてSessionStart/statusへ出す。検出不能時はresolved扱いにせず`unknown`/警告へ倒す。

## 設計と検証の対

| 設計境界 | oracle |
| --- | --- |
| current workspace pending + oldest age | `U-MEMBACKLOG-001` |
| foreign targetをsilent dropしない | `U-MEMBACKLOG-002` |
| fresh generation 0件のsession absent警告 | `U-MEMBACKLOG-003` |
| Stop hook欠落/壊れのhook_missing警告 | `U-MEMBACKLOG-004` |
| publish成功とdelivery成立の分離 + audit pending | `U-MEMBACKLOG-005` |
| 15分age閾値とSessionStart warning surface | `U-MEMBACKLOG-006` |

## 範囲外

- #368 promotion gate、#362 consumer E2E、D3a custodyの変更
- inboxの所有権・claim・FIFO・retentionの再設計
- 常駐watcher、外部通知サービス、DB新テーブルの追加

## 完了条件

- [x] 上記U oracleがTDD Red→Greenで1:1に実装される。
- [x] Node/TypeScript targeted tests、typecheck、Biome、plan lintがlocal preflightでgreen。
- [x] SessionStartでpublish成功をdelivery成功と誤認しない警告が実測できる。
- [x] pair-freeze契約、範囲外、既存PLANとの責務境界を本PLANへ記録する。

## PR着地条件

- [ ] exact HEADのrequired CIをGreenにする。
- [ ] 非著者Claude closing reviewで未解決FLAGがないことを記録する。
- [ ] Reverse traceとHARNESS Memory通知を新HEADへ結線する。
