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
        output_digest: "sha256:02914649b2b7efb0b8ee9abce683a67f16b830f200dcd71e517af677ca0e430c"
        anchor_commit: 6eabc34913cd75f4fa56a6e6135e191863c55df3
      - kind: typecheck
        command: "node node_modules/typescript/bin/tsc --noEmit"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T03:20:00Z"
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: "sha256:a090dcbd405e35216c0c57b6e978ea225ab839dae3c3675d006add083310fe60"
        anchor_commit: 6eabc34913cd75f4fa56a6e6135e191863c55df3
      - kind: lint
        command: "node node_modules/@biomejs/biome/bin/biome check src/runtime/claude-memory-wake.ts src/handover/session-start-digest.ts tests/claude-memory-backlog.test.ts"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T03:20:00Z"
        evidence_path: tests/claude-memory-backlog.test.ts
        output_digest: "sha256:02914649b2b7efb0b8ee9abce683a67f16b830f200dcd71e517af677ca0e430c"
        anchor_commit: 6eabc34913cd75f4fa56a6e6135e191863c55df3
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-21T05:58:24Z"
    tests_green_at: "2026-08-21T05:55:50Z"
    verdict: pass
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    subject_head: 6eabc34913cd75f4fa56a6e6135e191863c55df3
    scope: "PR #370 exact HEAD 6eabc349。Claude Opus 5 非著者 closing review。required CI run 32451588021 は Linux/Windows/aggregate 3/3 SUCCESS、mergeState CLEAN。B-1 workspace-bound generation marker、foreign/legacy/破損 marker の unknown fail-close、U-MEMBACKLOG-003 mutation probe を確認し blocking 0。"
    green_commands:
      - kind: unit_test
        command: "PR #370 CI run 32451588021: vitest backlog/wake/session targeted regression"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T05:55:50Z"
        evidence_path: tests/claude-memory-backlog.test.ts
        output_digest: "sha256:02914649b2b7efb0b8ee9abce683a67f16b830f200dcd71e517af677ca0e430c"
        anchor_commit: 6eabc34913cd75f4fa56a6e6135e191863c55df3
      - kind: typecheck
        command: "PR #370 CI run 32451588021: tsc --noEmit (Windows/Linux)"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T05:55:50Z"
        evidence_path: src/runtime/claude-memory-wake.ts
        output_digest: "sha256:a090dcbd405e35216c0c57b6e978ea225ab839dae3c3675d006add083310fe60"
        anchor_commit: 6eabc34913cd75f4fa56a6e6135e191863c55df3
      - kind: lint
        command: "PR #370 CI run 32451588021: Biome/doctor aggregate"
        runner: ci
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T05:55:50Z"
        evidence_path: tests/claude-memory-backlog.test.ts
        output_digest: "sha256:02914649b2b7efb0b8ee9abce683a67f16b830f200dcd71e517af677ca0e430c"
        anchor_commit: 6eabc34913cd75f4fa56a6e6135e191863c55df3
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
3. `.generation` markerは`workspaceId`を含むv1 JSON markerとして発行し、fresh markerの
   うちcurrent workspaceと一致するものだけをactiveとする。fresh markerが0件でpendingが
   ある場合は`session_absent`、legacy/foreign/破損markerだけが残る場合は`session_unknown`
   として警告し、target workspaceの存在を推測しない。
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
- [x] production generation markerのcurrent/foreign/legacyをactiveと誤認しない。
- [x] pair-freeze契約、範囲外、既存PLANとの責務境界を本PLANへ記録する。

## PR着地条件

- [ ] exact HEADのrequired CIをGreenにする。
- [ ] 非著者Claude closing reviewで未解決FLAGがないことを記録する。
- [ ] Reverse traceとHARNESS Memory通知を新HEADへ結線する。
