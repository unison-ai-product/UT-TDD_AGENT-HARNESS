---
plan_id: PLAN-L7-484-doctor-result-envelope-measurement
title: "PLAN-L7-484 (impl): doctor result envelope の実測面投影"
kind: impl
layer: L7
sub_doc: function-spec
drive: agent
route_signal: forward
route_mode: forward
status: draft
created: 2026-08-13
updated: 2026-08-13
owner: PO / TL
parent_design: docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - measured doctor execution と envelope writer を実装する"
  - role: qa
    slot_label: "QA - setup-smoke/profile/strict option の偽申告を mutation 検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-484-doctor-result-envelope-measurement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
  requires: []
  blocks: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/193
    - docs/plans/PLAN-L6-99-doctor-result-envelope-measurement-contract.md
    - docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md
    - docs/test-design/harness/L7-unit-test-design.md
github_issue_id: 193
backprop_decision: not_required
backprop_decision_reason: >-
  既存 envelope producer の実測値投影を修正する内部 fail-close 強化であり、L0-L6 の要求・
  外部CLI機能は変更しない。L6 契約は本実装の pair として同じ PR で固定する。
review_evidence: []
---

# PLAN-L7-484: doctor result envelope の実測面投影

## V-model 対

| 層 | 正本 | 検証対 |
|---|---|---|
| L6 | `doctor-result-envelope-measurement.md` | 実測面の pre/post/invariant |
| L7 | `runDoctorMeasured` と envelope writer | `U-DOCTORENV-012..016` |
| L8 | CLI `doctor --result-file` 配線 | `U-DOCTORENV-016` の実発火CLI回帰 |

## 工程

1. [直列] 縮小実行が full を偽申告する既存挙動を Red で固定する。
2. [直列] doctor result と実行 check IDs / resolved profile を同じ measured object で返す。
3. [直列] writer は measured surface だけを直列化し、schema と consumer 照合へ strict telemetry を追加する。
4. [直列] exact-head CI と非author closing review を取得する。

回帰防止として、CLIの `--result-file` 投影式を実プロセスで起動する `U-DOCTORENV-016` を
実装と同じPRに含める。手組み envelope の consumer 判定だけではCLI投影の旧実装復帰を検出できないためである。

## 完了条件

- [ ] setup-smoke / named profile / toolchain の envelope が full consumer に拒否される。
- [ ] default full 実行だけが実測 check IDs と全 strict options を持つ再利用候補になる。
- [ ] 既存 CI の doctor single-run envelope 消費を維持する。
- [ ] Linux / Windows / aggregate CI と非author review が揃うまで merge しない。
