---
plan_id: PLAN-REVERSE-473-staged-release-backfill
title: "PLAN-REVERSE-473: 段階リリース管理 設計backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: fullback
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-04
updated: 2026-08-05
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 既存sync-pack/buildPackSyncPlanとの責務境界をbackfill"
  - role: qa
    slot_label: "QA - L6/L7対とrollback非破壊契約を検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
  requires:
    - PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
  blocks: []
  references:
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
    - docs/plans/PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/247
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/248
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/249
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/250
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/251
review_evidence: []
---

# PLAN-REVERSE-473: 段階リリース管理 設計backfill

本 PLAN は `PLAN-L7-473-staged-release-channel-manifest` (add-impl) の Reverse 対である
(`kind=add-impl` は Reverse 対必須)。R0の既存実装観測を完了し、PR #244 prototypeのclosing FLAGを
受けてR1の責務分割・pair-freeze訂正へ進んだ。R1は本docs-only訂正がcross-review PASSかつmainへ
mergeされた時点で完了する。実装をR1完了証拠の代替にしない。

## R0-R4 と状態遷移

- R0: 既存 `sync-pack` / `buildPackSyncPlan` (`src/setup/distribution.ts`,
  `src/cli/distribution.ts`) が既に持つ非破壊 copy-plan/staging・rollback managed paths・
  human-approved command list を観測し、新設する release channel manifest 契約との
  重複領域と境界を確定する。`PLAN-L6-63-pack-staged-release-rollback` が扱う「Pack repo 側
  tag/revert runbook」との責務差分もここで確定する。2026-08-05 の実装観測では、clean Packの
  `CLEAN_ALLOW_PREFIXES` / `CLEAN_ALLOW_FILES` に `release/` は無く、`artifactPaths`はallowlist
  通過物だけ、`sync-pack`はその集合だけをcopyする。従ってS2はsource repo manifestを唯一の
  正本としてallowlistとcopy testを同時追加し、Pack copyを派生artifactに固定する。また現行
  `sync-pack` は現在の source tree から単一 artifact set を単一 checkout へ materialize するだけで、
  過去 revision の artifact locator を持たない。S2 では現在のcontrol manifestからchannel pointerと
  immutable release recordを解決し、recordの`artifactSourceCommit`をlocal Git object databaseから
  isolated tree/archiveへmaterializeする。現在checkoutとのSHA一致は要求せず、object不在時はnetwork
  fetchも現在treeからの再構成も行わない。manifestをartifact digestから除外して自己参照を避ける。
- R1 (現在): manifest正本、pure domain、versioned materializer、isolated Git resolver、
  `sync-pack --channel` adapter、aggregate acceptance、Pack repo側tag/revert runbookの責務を分離する。
  AC-6のmanifest SSoT + allowlist + selected-revision copyはPF-5までpublishせず、exact HEAD final treeを
  読む単一admission transactionで全predicate成立時だけsealed planをapplyする。
- R2: Forward test-designの`CANDIDATE-RELMAN-001`〜`017`を、#247→#248→#249→#250→#251の
  直列順にGreen化する。PF-4の実装PLANは
  `PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze` とし、各PFは「当該docs-only pair-freeze merge → implementation+test citation同一commit
  → exact-HEAD CI/review → merge」を1遷移とする。候補IDは所有PF以外で昇格しない。
- R3: PF-5 aggregate acceptance後、cross-family reviewで正本選択、control/artifact分離、digest、
  非破壊性、AC-6原子性を再導出する。単体Greenの合算をaggregate PASSの代替にしない。
- R4: R3 PASS後に`docs/design/harness/L6-function-design/`へrelease channel manifest契約を合流し、
  `forward_routing` / `promotion_strategy`を確定してForwardへ戻す。S3 promotion/rollbackは
  `003/004/005/008/010`をRED入力として別pair-freezeから開始する。

| from | transition guard | to | FLAG / failure |
| --- | --- | --- | --- |
| R0 | 本docs-only訂正がexact-HEAD CI + cross-review PASSでmainへmerge | R1 complete / PF-1 pair-freeze | R0/R1へ留まり実装禁止 |
| R1 / PF-1 #247 | pure domain pair-freeze merge後、`001/002/007/009/013`のpure実装Green・review・merge。`015/016/017`はRED | R2 / PF-2 #248 | PF-1へ戻し、候補はRED維持 |
| R2 / PF-2 #248 | `011` materializer Green・review・merge | R2 / PF-3 #249 | PF-2へ戻る |
| R2 / PF-3 #249 | `012` resolver Green・review・merge | R2 / PF-4 #250 | PF-3へ戻る |
| R2 / PF-4 #250 | `006` adapter内部Green・review・merge、外部結線0 | R2 / PF-5 #251 | PF-4へ戻る |
| R2 / PF-5 #251 | `014/015/016/017` aggregate Green。**3 predicate全成立後の staging write/copy および destination commit/apply の各境界へ1..N faultを総当たり注入する。rollbackが成功するfaultではstagingを破棄し、destination/control manifest/allowlist/copy inputのprior bytes/mode/pathを不変に保ち、partial publish 0とする。restore失敗時は`rollback_failed`/`applied=indeterminate`へfail-closeし、未公開と誤報しない。成功時のみcommit/apply exactly 1とする。** full CI PASS | R3 | PF-5へ戻りstagingを破棄、partial stateをpublishしない |
| R3 | cross-family review PASS + backprop先確定 | R4 | finding所有PFへ戻る |
| R4 | L6合流・Forward routing確定・closing gate PASS | Forward merge | R4未完了のまま保持 |

PR #244のprototype commitは上表のR1 guard前に実装を置いたため、証拠として再利用しない。履歴は
force rewriteせずclosed PRとして保持し、各candidateは新しい正規sliceでREDから再実測する。

## backprop_scope (仮、R4 で確定)

設計降下前のため本節は仮置きとする。現時点で予想される影響範囲:

- requirements: 既存の配布要件を変更しない見込み (Pack 配布契約の粒度追加に閉じる想定)。
- L4-basic-design: 外部機能境界・component 責務は変更しない見込み。
- L5/L6: release channel manifest の詳細契約を新規追加する見込み
  (`docs/design/harness/L6-function-design/` 配下、対象ファイルは R1 で確定)。

上記は R0 時点の見立てであり、R4 で実測に基づき確定する (仮置きを完了条件の代替にしない)。

## 完了条件 (R1 pair-freeze)

- [x] R0: `sync-pack` / `buildPackSyncPlan` / `PLAN-L6-63` との責務境界がPLAN-L7-473の
  設計判断節と矛盾なく記録される。
- [x] R1: PF-0〜PF-5の責務、所有oracle、AC-6 aggregate原子性、implementation-first禁止が定義される。
- [ ] R1 closing: 本docs-only訂正がcross-review PASSかつmainへmergeされる。
- [ ] R2〜R4: 上表のguardを順に満たすまで未着手。後続phaseの実装を先行しない。
