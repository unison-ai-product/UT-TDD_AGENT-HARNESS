---
plan_id: PLAN-L7-409-runtime-plan-context-join-signal
title: "PLAN-L7-409 (add-impl): runtime PLAN context join signal separation"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - runtime PLAN context join signal separation"
generates:
  - artifact_path: docs/plans/PLAN-L7-409-runtime-plan-context-join-signal.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
  requires:
    - docs/plans/PLAN-L7-144-warn-remediation-parity-and-join.md
    - docs/plans/PLAN-REVERSE-409-runtime-plan-context-join-signal-backfill.md
  references:
    - .ut-tdd/memory/project-2026-07-09-9-codex.md
    - docs/design/harness/L6-function-design/function-spec.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T18:25:00+09:00"
    tests_green_at: "2026-07-09T18:24:00+09:00"
    verdict: approve
    scope: "runtime PLAN context join signal separation。unresolved-join を stale local runtime context から分離し、true missing PLAN は残す。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T18:19:00+09:00"
        evidence_path: src/state-db/projection-writer.ts
        output_digest: "sha256:f8a101c27971ef96125626381fb2bf396880da5363faabf115ecd71299ce1594"
        anchor_commit: 6da19b4756d7cf63a536418d1b14dada24bf5f4e
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T18:23:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:66f8f8f65d44ddf1280d007b1fbcf2af599e7bd172c11ebca80e94b1c13daa41"
        anchor_commit: 6da19b4756d7cf63a536418d1b14dada24bf5f4e
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts -t \"short PLAN|stale bare numeric\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T18:19:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:66f8f8f65d44ddf1280d007b1fbcf2af599e7bd172c11ebca80e94b1c13daa41"
        anchor_commit: 6da19b4756d7cf63a536418d1b14dada24bf5f4e
---

# PLAN-L7-409: runtime PLAN context join signal separation

## 背景

HARNESS メモリ監査後の DB projection で、`findings.kind='unresolved-join'` が 797 件残った。内訳は
`hook_events` / `test_runs` / `trouble_events` / `guardrail_decisions` に偏り、主因は gitignored な
`.ut-tdd/logs/**` と `.ut-tdd/handover/**` に残る `PLAN-L7-39` / `PLAN-L7-40` の bare numeric runtime
context だった。

`PLAN-L7-144` は audit-cycle ID と compound work-context を `unresolved-join` から除外したが、今回の
ケースは古い local runtime state が plan registry に接続できないものである。これは完全なノイズではない。
一方で、source projection table の本物の missing PLAN と同じ `unresolved-join` に混ぜると、DB から
検出系を見つけやすくする戦略に反して重要 signal が埋もれる。

## 実装スコープ

1. `checkResolvablePlanJoin` は一意な短縮 PLAN ID (`PLAN-L7-46` -> `PLAN-L7-46-*` が 1 件) を論理解決済み
   として扱う。
2. `.ut-tdd/logs/**` / `.ut-tdd/handover/**` 由来の bare numeric PLAN context (`PLAN-L7-40` など) は
   `unresolved-join` ではなく `stale-runtime-plan-context` として記録する。
3. source projection table の具体的な missing PLAN は従来どおり `unresolved-join` を発火する。
4. audit-cycle ID / compound work-context の既存除外は維持する。

## DoD

- [x] `tests/projection-writer.test.ts` が一意な短縮 PLAN ID を unresolved join にしないことを固定する。
- [x] `tests/projection-writer.test.ts` が stale runtime context と true unresolved join を分離する。
- [x] `bun run vitest run tests\projection-writer.test.ts` が green。
- [x] `bun run src\cli.ts db rebuild` 後、`unresolved-join=0` / `stale-runtime-plan-context=797` に分離される。
- [x] `bun run src\cli.ts doctor` は DoD 自己未チェック以外の gate が green。DoD 更新後に再実行して green を確認する。

## 残リスク

既存の `.ut-tdd/logs/**` は local runtime state であり、HEAD の正本ではない。今回の変更は local state を
削除せず、DB projection の signal 種別を分離する。`stale-runtime-plan-context` の運用上の扱い
(自動 cleanup / retention / archive) は、必要なら別 PLAN で行う。
