---
plan_id: PLAN-L7-490-memory-write-collision-safety
title: "PLAN-L7-490 (add-impl): shared memory write collision safety"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-18
updated: 2026-08-18
owner: Codex
parent_design: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: aim
    slot_label: "AIM - shared memory の無音上書き経路を閉じる"
  - role: tl
    slot_label: "TL - title identity と既存memory互換の境界を判断する"
  - role: se
    slot_label: "SE - MemoryServiceの単一write入口へ衝突防護を結線する"
  - role: qa
    slot_label: "QA - 日本語/句読点衝突と再試行のfail-close oracleを固定する"
generates:
  - artifact_path: docs/plans/PLAN-L7-490-memory-write-collision-safety.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-490-memory-write-collision-safety-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/325
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/236
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/242
github_issue_id: 325
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-18T03:41:48Z"
    tests_green_at: "2026-08-18T03:41:48Z"
    verdict: pass
    scope: "U-MEMORY-020/021、legacy無suffix path再利用、collision fail-close/idempotent retry。非著者closing reviewのblocking 1件を除くコード論点は解消済み。"
    worker_model: codex
    reviewer_model: claude-opus-5
    plan_revision: bd2760a09d72e78fb0c916ee53b6a753f8eeea0d
    subject_head: bd2760a09d72e78fb0c916ee53b6a753f8eeea0d
    lane: claim-blind
    citations:
      - "PR #332 exact HEAD bd2760a0 non-author delta review (2026-08-18T03:41:48Z)"
      - "GitHub Actions run 32092053010 (Linux/Windows/aggregate success)"
    green_commands:
      - kind: unit_test
        command: "GitHub Actions run 32092053010: memory-service suite / Linux+Windows+aggregate"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-18T03:41:48Z"
        evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/32092053010"
        output_digest: "sha256:2c71e57d0cf1b6be773945526e1cbbcf697ec64419987d32a924ed9896c0a12"
        anchor_commit: bd2760a09d72e78fb0c916ee53b6a753f8eeea0d
---

# PLAN-L7-490: shared memory write collision safety

## 0. 位置づけ

Issue #325 は、共有 HARNESS memory の唯一の書き込み経路がタイトルを非単射なslugへ
縮退させ、存在確認なしの `writeFileSync` で既存の正本を無音上書きする欠陥を扱う。
これは #236/#242 の配送・可視性問題とは別レイヤであり、MemoryService の write 境界だけを
修正する。

## 1. 凍結する契約

- ASCIIで安全な既存slugは後方互換に保つ。正規化で情報を失うタイトル（日本語、句読点など）は
  安定したsha256短縮suffixを付け、異なるタイトルを異なるsource pathへ写像する。
- suffix付きidentityが新規で、旧来の無suffix `<kind>-<slug>.md` が同じkind/titleで存在する場合は、
  旧ファイルを正本として再利用し、既存corpusに新旧2件を増やさない。既存memoryの一括renameは行わない。
- 同じsource pathが既に存在する場合、既存ファイルを正本として先に読み、kind/title/body/tags/
  memory_idが同一の完全再試行だけを冪等に受理する。
- 既存ファイルのidentityまたは内容が異なる場合、明示的な上書き契約がない限り副作用前に
  fail-closeする。既存bytesは変更しない。regular file以外と壊れたfrontmatterも同様に拒否する。
- CLI、DB projection、通知、MemoryService外のstorage accessは変更しない。

## 2. 対応oracle

`U-MEMORY-020`（日本語/句読点の安定suffixとASCII互換）と
`U-MEMORY-021`（collision fail-close / idempotent retry）を、実装テストと1:1で固定する。

## 3. 工程と出口

1. 本文契約とReverse pairingを先に固定する。
2. テストをRedで追加し、`memoryIdFor`と`MemoryService.writeMemory`の最小実装でGreen化する。
3. typecheck、対象Vitest、Biome、plan lint、doctorの関連gateを実行し、exact HEADでCIと
   non-author closing reviewを通す。#330のPF4 laneには依存しない。

## 4. スコープ境界

既存ファイルの復旧、過去memoryの一括rename、DB write-through、`--force` CLI追加、#236/#242の
共有配送判定は本PLANへ混ぜない。legacy無suffix pathの再利用は互換防護として本PLANに含める。
Issue #325は同一PRの実装・検証・レビューが完了するまでcloseしない。
