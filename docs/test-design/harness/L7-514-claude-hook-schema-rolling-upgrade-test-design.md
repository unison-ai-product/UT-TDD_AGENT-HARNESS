---
title: "L7 Claude hook generation schema rolling upgrade test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-514-claude-hook-schema-rolling-upgrade
pair_artifact: docs/plans/PLAN-L7-514-claude-hook-schema-rolling-upgrade.md
parent_doc: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
created: 2026-08-27
updated: 2026-08-27
---

# Claude hook generation schema rolling upgrade — L7 test design

このtest-designは、#416/#422の既存routing資産を呼び出す後続実装PRの専用oracleである。現在はpair-freeze
だけを行い、テストコードやsourceを生成しない。全oracleは同一PLAN revision・exact HEADへ束縛し、文章上の
「Green」主張だけでは完了としない。

| Candidate | Red stimulus | Expected Green invariant | 実行境界 |
| --- | --- | --- | --- |
| `CANDIDATE-U-CHSCHEMA-001` | 現行v1 markerからruntimeSourceRevisionを単独変更 | upgrade supervisorがsource revision driftを`restart_required`として記録し、claim/consume 0 | supervisor / claim gate |
| `CANDIDATE-U-CHSCHEMA-002` | generationSchemaまたはinboxSchemaを単独変更 | schema mismatchをtyped denyし、legacy/v1を未出荷schemaへ昇格しない | supervisor / marker parser |
| `CANDIDATE-U-CHSCHEMA-003` | workspaceIdを別projectまたは別worktreeの値へ変更 | foreign workspaceをfail-closeし、既存entryを消費済みにしない | canonical workspace resolver |
| `CANDIDATE-U-CHSCHEMA-004` | 旧text、能力不足の旧v1 JSON、fake JSON、欠落/追加/不正型フィールド | `legacy_generation_marker`等の`restart_required`、wake/claim 0 | supervisor / marker reader |
| `CANDIDATE-U-CHSCHEMA-005` | stale generation、期限切れmarker、旧source revisionの遅着claim | stale/old generationをactiveとせず、handoffまたはtyped deny | supervisor / generation lease |
| `CANDIDATE-U-CHSCHEMA-006` | 同一workspaceにactive markerを2件置く | `multiple_active_generations`でfail-closeし、推測選択 0 | activation projection |
| `CANDIDATE-U-CHSCHEMA-007` | updated supervisor/bootstrapが正当な旧generationを明示supersedeして起動 | CAS成功時だけ旧markerをsuperseded、新activeはexactly one | upgrade authority / activation CAS |
| `CANDIDATE-U-CHSCHEMA-008` | foreign/stale/未知generationをsupersede対象に指定 | supersessionを拒否し、旧markerと新markerをactive成功扱いしない | activation CAS |
| `CANDIDATE-U-CHSCHEMA-009` | marker/handoff書込み中のkill、再起動、同一handoff replay | activation journalと現物digestが一致する場合だけ再開し、二重claim 0 | recovery/replay |
| `CANDIDATE-U-CHSCHEMA-010` | 旧hookが`pid:timestamp`を書き続け、将来source/schema driftを自力検出・更新しようとする | 旧hookは自動upgradeできず、upgrade supervisorがauthorityを失効して`restart_required`、claim 0 | old-hook/supervisor boundary |
| `CANDIDATE-U-CHSCHEMA-011` | #423の既存envelopeを再発行せず、supervisorによる旧hook終了/再起動後にconsume | envelope ID、operation、HEAD、revision、digest不変のままlive-consume成功 | existing #423 envelope E2E |
| `CANDIDATE-U-CHSCHEMA-012` | #410の既存requestを再発行せず、supervisorによる旧hook終了/再起動後にredispatch | request ID、operation、HEAD、PLAN revision、digest不変のままredispatch成功 | existing #410 request E2E |
| `CANDIDATE-P-CHSCHEMA-001` | Windows/Linuxでprocess crash→restart→replayを実行 | OS差なくexact-one active、handoff replay fence、既存identity保全 | cross-platform integration |

## TDD順序

1. 旧text、能力不足の旧v1、drift、foreign、stale、multipleをRedとして固定する。
2. 現行v1 markerの全必須bindingとupgrade supervisorによるtyped `restart_required` handoffを実装してGreenにする。
3. activation CASとexact-one active projectionを追加し、crash/restart/replayをGreenにする。
4. #423/#410の既存identity E2Eを追加し、request/envelope再mintがないことを独立検査する。
5. typecheck、Biome、targeted snapshot、PLAN lint、Linux/Windows/aggregate CIへ昇格する。

## 証跡要件

- source revision、generation schema（現行v1）、inbox schema（v3）、workspace ID、generation IDを各Red/Green結果へ記録する。
- 旧hookの`pid:timestamp`継続書込みを観測し、旧hook自身の自動upgradeではなくsupervisorの失効・再起動要求で
  Greenになることを記録する。
- `restart_required` handoffはold marker digest、reason、target workspace、required schemaを含むことを検証する。
- superseded markerを監査面に残し、active projectionが一件になることを実物inventoryで検証する。
- #423/#410の既存request identityを実行前後で比較し、変更があればRedとする。
- Windows/Linux各run、process crash位置、再起動回数、replay回数、exit reasonを記録する。

## 非対象

verdict内容、manual receipt、merge bypass、request identityの再mint、Pack publication、#416/#422のrouting
resolverそのものの再実装は対象外とする。
