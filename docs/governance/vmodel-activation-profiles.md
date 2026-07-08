---
title: "Vモデル activation profile 正本"
status: confirmed
owner: PO / TL
updated: 2026-07-08
typed_spec_phase_owner: L6
---

# Vモデル activation profile 正本

## 0. 役割

本書は `Vモデル設計ドキュメント.zip` の `profiles.yaml` / `99_型付きスペック・自動検出設計書` /
`97_スペック駆動開発・トレース閉包設計書` / `107_Vモデル・レベル定義` から HARNESS 向けに抽出した、
version-up wave の activation profile 正本である。

DB は正本ではない。本書を `activation_entries` へ投影し、工程管理表 (`schedule_entries`) と join した
`activation_schedule_reviews` を検索・検出用 read-model として使う。検出系は profile の対象/除外/延期理由を
読む側であり、profile や工程表を暗黙更新してはいけない。

## 1. 活性化プロファイル

| `profile_id` | `target_kind` | `target_id` | `plan_id` | `scope_status` | `target_version` | `defer_reason` | `enabled` |
|---|---|---|---|---|---|---|---|
| `vmodel-clean-core` | `plan` | `PLAN-L0-01-vmodel-harness-upgrade-charter` | `PLAN-L0-01-vmodel-harness-upgrade-charter` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L3-04-upstream-schedule-reconciliation` | `PLAN-L3-04-upstream-schedule-reconciliation` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L4-18-roadmap-drive-selection-hardening` | `PLAN-L4-18-roadmap-drive-selection-hardening` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L4-19-vmodel-spec-ir-data` | `PLAN-L4-19-vmodel-spec-ir-data` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L5-13-vmodel-spec-ir-physical-data` | `PLAN-L5-13-vmodel-spec-ir-physical-data` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L6-39-vmodel-spec-ir-function-contracts` | `PLAN-L6-39-vmodel-spec-ir-function-contracts` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L7-381-vmodel-spec-ir-projection` | `PLAN-L7-381-vmodel-spec-ir-projection` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L7-382-detector-route-candidate-feedback` | `PLAN-L7-382-detector-route-candidate-feedback` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L7-383-vmodel-schedule-authoring-source` | `PLAN-L7-383-vmodel-schedule-authoring-source` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L6-40-route-filing-review-surface` | `PLAN-L6-40-route-filing-review-surface` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L7-384-route-filing-review-surface` | `PLAN-L7-384-route-filing-review-surface` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-core` | `plan` | `PLAN-L7-385-vmodel-activation-profile-join` | `PLAN-L7-385-vmodel-activation-profile-join` | `in_scope` | `vmodel-clean-2026-07-08` |  | `true` |
| `vmodel-clean-next` | `plan` | `PLAN-L6-42-typed-spec-declaration-source` | `PLAN-L6-42-typed-spec-declaration-source` | `deferred` | `vmodel-clean-2026-07-08` | U7で工程表とprofile joinを固定後、ZIP 99のspec.defines正本化へ進む | `false` |
| `vmodel-clean-next` | `plan` | `PLAN-L7-386-typed-spec-declaration-projection` | `PLAN-L7-386-typed-spec-declaration-projection` | `deferred` | `vmodel-clean-2026-07-08` | L6-42の型宣言契約確定後に実装する | `false` |

## 2. 解釈規則

- `scope_status=in_scope` は当該 version-up wave の対象である。
- `scope_status=deferred` は延期対象であり、`defer_reason` を必須とする。
- `scope_status=out_of_scope` は適用除外であり、`defer_reason` を必須とする。
- `enabled=false` の行は自動起票・自動適用の対象ではない。検索と検出には残し、人間が延期理由を確認できるようにする。
- 本書の `plan_id` は工程管理表の `plan_id` と join される。工程表に存在しない行は `activation-schedule-missing` finding にする。

## 3. 不変条件

- profile は Workflow 集約の authoring source であり、PLAN frontmatter を暗黙更新しない。
- 検出系は本書と工程管理表の join を読む。検出系の都合で `scope_status`、`target_version`、延期理由を創作しない。
- `target_version` は ZIP 由来の wave 識別子であり、ファイル hash や外部 release 番号の代替ではない。
- `activation_schedule_reviews` は read-model であり、正本ではない。

## U11 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: VMS-003
      kind: activation-profile
      traces_from: [VMS-001]
      traces_to: [VMS-005]
      tests: [TVMS-003]
```

VMS-003 は activation profile の所有 artifact で宣言される typed spec である。
