---
plan_id: PLAN-L6-43-typed-spec-trace-closure
title: "PLAN-L6-43 (add-design): typed spec trace closure contract"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:46:58+09:00"
    tests_green_at: "2026-07-08T14:46:58+09:00"
    verdict: approve
    scope: "U9a add-design slice。typed spec の traces_from / traces_to / tests を閉包不変条件として定義し、doctor hard gate が fail-close できる契約にした。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T14:46:58+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:11d54389adc016ab9b3f608af57b1f7f34fe96f6bb5aedd8d0240bd3308a1e8f"
agent_slots:
  - role: tl
    slot_label: "TL - typed spec trace closure design"
  - role: qa
    slot_label: "QA - typed spec closure oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-43-typed-spec-trace-closure.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
  requires:
    - docs/plans/PLAN-L7-386-typed-spec-declaration-projection.md
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-43: typed spec trace closure contract

## 0. 役割

本 PLAN は U9a として、U8 で DB projection へ接続した `spec.defines` 宣言を
閉包検査の正本にする。検出系は relation を推測で補完せず、設計宣言が片肺なら
finding として fail-close できる形にする。

## 1. 設計内容

1. typed spec の `traces_to` は、相手側 `traces_from` と双方向に閉じる。
2. typed spec の `traces_from` は、相手側 `traces_to` または上位 spec の `tests` と閉じる。
3. `tests` は test spec 側の `traces_from` と閉じる。
4. test を要求する kind に `tests` edge が無い場合は missing-test finding にする。
5. `unit-oracle` / `integration-oracle` / `projection-oracle` は検証 leaf として扱い、oracle 自体へ追加 test を要求しない。

## 2. 不変条件

- `typed-spec-trace-reverse-missing` は trace の片側欠落を表す。
- `typed-spec-test-backlink-missing` は `tests` と test spec `traces_from` の片側欠落を表す。
- `typed-spec-test-missing` は test 必須 kind の test edge 欠落を表す。
- DB projection は正本ではない。doctor は source docs から rebuild して判定する。

## 3. 受け入れ条件

- L6 function-spec に `analyzeTypedSpecTraceClosure` と `checkTypedSpecTraceClosure` 契約がある。
- L7 unit-test-design に U-TYPED-SPEC-C1..C5 oracle がある。
- typed spec 正本に oracle kind の扱いが明記されている。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
