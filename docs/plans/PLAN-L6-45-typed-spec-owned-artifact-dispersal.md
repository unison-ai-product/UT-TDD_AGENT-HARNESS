---
plan_id: PLAN-L6-45-typed-spec-owned-artifact-dispersal
title: "PLAN-L6-45 (add-design): typed spec owned artifact dispersal contract"
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
parent_design: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T15:45:00+09:00"
    tests_green_at: "2026-07-08T15:45:00+09:00"
    verdict: approve
    scope: "U11a add-design slice。typed spec 宣言を central bootstrap から owned artifact へ分散し、台帳の ledger_sources と source_path を一致させる契約を追加した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T15:45:00+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:341423047ed5449a05f2f77507888d56989887cc5303bc2658a7f62087c1fcd8"
        anchor_commit: 779c2869be0065dbe7a4fe09550f80466eb75d32
agent_slots:
  - role: tl
    slot_label: "TL - typed spec owned artifact dispersal design"
  - role: qa
    slot_label: "QA - ownership oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-45-typed-spec-owned-artifact-dispersal.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
  requires:
    - docs/plans/PLAN-L7-388-typed-spec-ledger-body-sync-gate.md
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-45: typed spec owned artifact dispersal contract

## 0. 役割

本 PLAN は U11a として、U8 で central bootstrap に置いた typed spec 宣言を、
各 ID の owned artifact 本文へ戻す契約を固定する。

## 1. 設計内容

1. `spec.defines` の `source_path` は `typed_spec_ledger.ledger_sources` のいずれかに一致する。
2. central bootstrap doc は移行足場であり、所有外 ID の宣言元として残さない。
3. 宣言元と本文実体は同じ source に置く。
4. 不一致は `typed-spec-owned-source-mismatch` finding にする。

## 2. 不変条件

- DB projection は source docs を補完しない。
- `tests/*.ts` は現行 `loadSpecIrSources` の対象ではないため、TVMS 宣言は test-design に置く。
- 台帳 row は U11 では central ledger として残せるが、宣言所有元は各 artifact に分散する。

## 3. 受け入れ条件

- L4/L5/L6/L7 に owned artifact 分散契約がある。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## 4. 修正版 ZIP からの追加根拠

修正版 `Vモデル設計ドキュメント_checked.zip` は、typed spec の所有位置を文書ローカル契約へ寄せる方向を強めている。
各 doc の `agent.read_first` / `agent.done_when` と `python tools/build.py detect` green 条件は、
宣言・本文・検出結果を同じ owned artifact に閉じる根拠である。
U11 ではこのうち `spec.defines` の owned artifact 分散だけを完了条件に含め、
agent 契約、detect profile、QA/Refactor gate は後続 U12 以降で別 PLAN 化する。
