---
plan_id: PLAN-RECOVERY-07-design-bottomup-backmerge
title: "PLAN-RECOVERY-07 (recovery): design-bottomup mode 正本 back-merge"
kind: recovery
layer: cross
drive: agent
status: confirmed
route_signal: regression_dev
route_mode: recovery
backprop_decision: not_required
backprop_decision_reason: "route-map に存在する design-bottomup mode の concept / requirements / process catalog back-merge をこの recovery PLAN 自身の generates として実施するため、別の追加 backprop PLAN は不要。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: aim
    slot_label: "AIM - mode catalog back-merge coordination"
  - role: tl
    slot_label: "TL - design-bottomup back-merge"
  - role: po
    slot_label: "PO - mode catalog / concept policy sign-off"
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-07-design-bottomup-backmerge.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/design-bottomup.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/README.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L3-04-upstream-schedule-reconciliation.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/drive-model-passage.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\lint\\drive-model-passage.ts"
        output_digest: "sha256:df821bc7e2492a935a19c5a016ec8f45aa624821df52dd047e72df4ecbe631d8"
  - artifact_path: src/schema/mode-catalog.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\schema\\mode-catalog.ts"
        output_digest: "sha256:417a9174f63d37c3f39736508c1a40ca476a7e97aafc1e2344bba01c929495de"
  - artifact_path: tests/drive-model-passage.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\drive-model-passage.test.ts"
        output_digest: "sha256:9ef3188bb1234a0a95c336ca5075bda23aecd19af58e3f1763dd56355bf9d86a"
  - artifact_path: tests/mode-catalog.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\mode-catalog.test.ts"
        output_digest: "sha256:2c5fd637c9e85d2a238c007170542de3d8cd13e829a98f4524c727ec1929f811"
dependencies:
  parent: docs/plans/PLAN-DISCOVERY-07-design-bottomup-mode.md
  requires:
    - docs/plans/PLAN-DISCOVERY-07-design-bottomup-mode.md
    - docs/plans/PLAN-DISCOVERY-09-version-up-mode.md
  references:
    - docs/process/modes/README.md
    - docs/process/modes/design-bottomup.md
    - src/schema/route-map.ts
    - src/lint/drive-model-passage.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T22:20:00+09:00"
    tests_green_at: "2026-07-02T22:19:00+09:00"
    verdict: approve
    scope: "route-map にある design-bottomup / version-up を process mode catalog と drive-model passage certificate へ最小 back-merge する。歴史的な 9-mode 証跡文は一括置換しない。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: lint
        command: "bunx biome check --write src\\lint\\drive-model-passage.ts src\\schema\\mode-catalog.ts tests\\drive-model-passage.test.ts tests\\mode-catalog.test.ts docs\\plans\\PLAN-RECOVERY-07-design-bottomup-backmerge.md docs\\plans\\PLAN-L3-04-upstream-schedule-reconciliation.md docs\\process\\modes\\README.md docs\\process\\modes\\design-bottomup.md docs\\governance\\ut-tdd-agent-harness-concept_v3.1.md docs\\governance\\ut-tdd-agent-harness-requirements_v1.2.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:19:00+09:00"
        evidence_path: tests\\mode-catalog.test.ts
        output_digest: "sha256:2c5fd637c9e85d2a238c007170542de3d8cd13e829a98f4524c727ec1929f811"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T22:19:00+09:00"
        evidence_path: src\\schema\\mode-catalog.ts
        output_digest: "sha256:417a9174f63d37c3f39736508c1a40ca476a7e97aafc1e2344bba01c929495de"
      - kind: unit_test
        command: "bun run vitest run tests\\drive-model-passage.test.ts tests\\mode-catalog.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T22:19:00+09:00"
        evidence_path: tests\\drive-model-passage.test.ts
        output_digest: "sha256:9ef3188bb1234a0a95c336ca5075bda23aecd19af58e3f1763dd56355bf9d86a"
---

# PLAN-RECOVERY-07: design-bottomup mode 正本 back-merge

## 背景

`src/schema/route-map.ts` には `design-bottomup` signal が存在し、`docs/process/modes/design-bottomup.md` も起票されたが、正本 catalog と doctor gate への back-merge が未完了だった。

この状態では次の不整合が起きる。

- route-map に mode token があるのに `docs/process/modes/README.md` の台帳に載らない。
- `src/lint/drive-model-passage.ts` の `EXPECTED_MODES` を 11 mode に広げると、`PLAN-L3-04` の passage certificate が 9 mode のままで doctor が fail する。
- concept / requirements の signal 表から `design-bottomup` が読めず、汎用 harness 利用時に backend 先行から FE 要件を導出する入口が self-developed knowledge に寄る。

## 変更

- `docs/process/modes/design-bottomup.md` を mode 正本として追加する。
- `docs/process/modes/README.md` と concept / requirements の signal 表に `design-bottomup` を追加する。
- `PLAN-L3-04` の drive-model passage certificate を current entry modes へ緩め、`Design-bottomup` / `Version-up` 行を追加する。
- `src/lint/drive-model-passage.ts` の expected mode 数を 11 mode とし、message の expected 表示を定数由来にする。
- `src/schema/mode-catalog.ts` に route-map token から catalog doc が欠けた mode を検出する helper を追加し、test で fail-close する。

## DoD

- [x] route-map に存在する非 Forward mode が mode catalog doc を持つ。
- [x] drive-model-passage lint が current entry modes を要求して green になる。
- [x] concept / requirements / process mode catalog が `design-bottomup` signal を説明する。
- [x] 歴史的な 9-mode 表現は legacy framing として残し、現在の operational catalog だけを更新する。
