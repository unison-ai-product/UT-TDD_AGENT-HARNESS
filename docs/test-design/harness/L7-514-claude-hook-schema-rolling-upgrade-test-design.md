---
title: "L7 Claude hook generation schema rolling upgrade test design"
layer: L7
executed_at_layer: L7
status: confirmed
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
| `CANDIDATE-U-CHSCHEMA-001` | closed v1 markerへ未知fieldを一つ追加、または必須fieldを一つ欠落 | unknown/missing fieldをtyped denyし、v1拡張として黙認しない | marker parser |
| `CANDIDATE-U-CHSCHEMA-002` | wire schema、inbox schema、capability profile schemaを各単独変更 | 変更した軸のschema mismatch、wake/claim 0 | supervisor / profile parser |
| `CANDIDATE-U-CHSCHEMA-003` | workspaceIdを別projectまたは別worktreeの値へ変更 | foreign workspaceをfail-closeし、既存entryを消費済みにしない | canonical workspace resolver |
| `CANDIDATE-U-CHSCHEMA-004` | 旧text、fake JSON、marker/profile digest不一致 | `legacy_generation_marker`等の`restart_required`、wake/claim 0 | supervisor / marker reader |
| `CANDIDATE-U-CHSCHEMA-005` | subject/liveが別Git commitだが同じpolicy digestかつminimum compatible revision以上 | exact commit不一致だけでは拒否せずcompatible。policy digestまたはminimum revisionの単独変異はtyped deny | compatibility resolver |
| `CANDIDATE-U-CHSCHEMA-006` | 同一workspaceにactive markerを2件置く | `multiple_active_generations`でfail-closeし、推測選択 0 | activation projection |
| `CANDIDATE-U-CHSCHEMA-007` | updated supervisor/bootstrapが正当な旧generationを明示supersedeして起動 | CAS成功時だけ旧markerをsuperseded、新activeはexactly one | upgrade authority / activation CAS |
| `CANDIDATE-U-CHSCHEMA-008` | foreign/stale/未知generationをsupersede対象に指定 | supersessionを拒否し、旧markerと新markerをactive成功扱いしない | activation CAS |
| `CANDIDATE-U-CHSCHEMA-009` | marker/handoff書込み中のkill、再起動、同一handoff replay | activation journalと現物digestが一致する場合だけ再開し、二重claim 0 | recovery/replay |
| `CANDIDATE-U-CHSCHEMA-010` | 旧hookが`pid:timestamp`を書き続け、将来source/schema driftを自力検出・更新しようとする | 旧hookは自動upgradeできず、upgrade supervisorがauthorityを失効して`restart_required`、claim 0 | old-hook/supervisor boundary |
| `CANDIDATE-U-CHSCHEMA-011` | claimが旧epoch/tokenを検証後、commit直前にsupervisorがauthorityを失効 | claim CASが負け、claim write 0、envelope保持 | claim transaction / TOCTOU |
| `CANDIDATE-U-CHSCHEMA-012` | PLAN §4.1の#423 claimを保持したまま同じidentity/claimed operationを再配送 | new inbox/claim/delivery 0、既存claim bytes/digest/session不変 | gitignored production idempotency |
| `CANDIDATE-U-CHSCHEMA-013` | PLAN §4.1の#410 claimを保持したまま同じidentity/operationを再配送 | 対応inboxを再生成せずnew delivery 0、既存claim不変 | gitignored production idempotency |
| `CANDIDATE-U-CHSCHEMA-014` | 新規synthetic fixture固有未claim pairのproject、Memory ID、operation、producer/consumer provider、session、HEAD、revisionを一軸ずつ独立変異 | 各軸固有のtyped deny、claim/consume write 0 | immutable fixture identity |
| `CANDIDATE-U-CHSCHEMA-015` | fixture固有synthetic未claim envelopeをisolated runtimeへ一度配送し、同じ入力をreplay | 初回claim exactly once、replay delivery 0 | isolated consume fixture |
| `CANDIDATE-U-CHSCHEMA-016` | inventoryへpayload不在の#423 old `7afb…`を`pr-423-envelope.json`として追加 | `historical_payload_unavailable`でfixture admission deny、復元/偽capture 0 | captured observation inventory |
| `CANDIDATE-P-CHSCHEMA-001` | fixture固有synthetic未claim pairをWindows/Linuxでcrash→restart→replay | OS差なくexact-one active、handoff replay fence、fixture identity保全 | cross-platform fixture integration |

## TDD順序

1. closed v1、capability profile、policy/minimum resolver、legacy、foreign、stale、multipleをRedとして固定する。
2. upgrade supervisorによるtyped `restart_required` handoffと互換性resolverを実装してGreenにする。
3. authority epoch/lease token付きclaim CASとexact-one active projectionを追加し、TOCTOUとcrash/replayをGreenにする。
4. PLAN §4.1のclaim済みproduction idempotencyとfixture固有synthetic未claim consumeを別々に実行し、production
   identity再発行0、各fixture identity軸の独立mutation、old unavailable observationのfixture除外を検査する。
5. typecheck、Biome、targeted snapshot、PLAN lint、Linux/Windows/aggregate CIへ昇格する。

## 証跡要件

- wire schema（v1）、inbox schema（v3）、profile schema、policy digest、minimum/published capability revision、
  workspace ID、generation ID、authority epoch、lease token digestを各Red/Green結果へ記録する。
- 旧hookの`pid:timestamp`継続書込みを観測し、旧hook自身の自動upgradeではなくsupervisorの失効・再起動要求で
  Greenになることを記録する。
- `restart_required` handoffはold marker digest、reason、target workspace、required schemaを含むことを検証する。
- superseded markerを監査面に残し、active projectionが一件になることを実物inventoryで検証する。
- revocation前後のbarrierで旧epoch/tokenのclaimを意図的に遅延させ、CAS loserのwrite 0を検証する。
- PLAN §4.1の#423/#410 claim identityとsource artifact SHA-256を再配送前後で比較し、変更またはnew deliveryが
  あればRedとする。fixture一覧には現存bytes由来の`pr-423-claim.json`を必ず含める。
- #423 old `7afb…`はfilename/hash-onlyのunavailable historical observationとして記録し、fixture一覧へ
  `pr-423-envelope.json`を作らない。new `a499…` claimとの対応関係も主張しない。
- operational idempotencyのhost-local path/session、production capture、fixture固有synthetic unclaimed pairを別evidenceとして
  記録し、fixtureだけでlive restart成功を主張しない。
- Windows/Linux各run、process crash位置、再起動回数、replay回数、exit reasonを記録する。

## 非対象

verdict内容、manual receipt、merge bypass、request identityの再mint、Pack publication、#416/#422のrouting
resolverそのものの再実装は対象外とする。
