---
plan_id: PLAN-REVERSE-473-staged-release-backfill
title: "PLAN-REVERSE-473: 段階リリース管理 設計backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R4
confirmed_reverse_type: fullback
route_signal: reverse
route_mode: reverse
status: confirmed
created: 2026-08-04
updated: 2026-08-19
owner: PO / Claude
forward_routing: L5
promotion_strategy: reuse-with-hardening
parent_design: docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: requirements
    decision: not_impacted
    reason: "段階リリースの既存要求は変更せず、実装境界を詳細化した。"
  - layer: L4-basic-design
    decision: not_impacted
    reason: "外部機能境界とcomponent責務は既存のまま維持する。"
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "既存の配置・実行境界を変更せず、L6契約へ具体化した。"
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/release-channel-manifest.md
    reason: "R3で再導出したrelease channel manifestの関数契約をL6へbackfillした。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "既存U-RELMAN対応とPF5 advisoryの再検証責務をL7へ束ねた。"
agent_slots:
  - role: se
    slot_label: "SE - 既存sync-pack/buildPackSyncPlanとの責務境界をbackfill"
  - role: qa
    slot_label: "QA - L6/L7対とrollback非破壊契約を検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-473-staged-release-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/release-channel-manifest.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
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
    - docs/design/harness/L6-function-design/release-channel-manifest.md
    - src/setup/distribution.ts
    - src/cli/distribution.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/247
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/248
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/249
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/250
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/251
review_evidence:
  - reviewer: Claude
    review_kind: cross_agent
    reviewed_at: "2026-08-19T09:35:53+09:00"
    tests_green_at: "2026-08-19T09:35:00+09:00"
    verdict: approve
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-5
    scope: "R3 aggregate再検収、PF1-PF5の正本選択・digest・原子性・rollback境界"
    green_commands:
      - kind: lint
        command: "node src/cli.ts plan lint"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-19T09:35:00+09:00"
        evidence_path: docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
        output_digest: "sha256:b935b237f83b9887fef591468c0bf60f3739f910e3e92722cdacd4ad81661e55"
  - reviewer: Claude
    review_kind: cross_agent
    reviewed_at: "2026-08-19T19:28:31+09:00"
    tests_green_at: "2026-08-19T19:26:02+09:00"
    verdict: approve
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-5
    scope: "PR #341 R4 backfill (L6 release-channel-manifest 関数契約 / L7 backfill 節 / REVERSE-473 R4 confirm) の non-author closing review。exact HEAD 7fbe432a50941e1d1786d089712b50bc5c42d817、CI run 32241648580 (headSha 照合済、linux/windows/aggregate SUCCESS)。R3で挙げたL6合流単位5件の着地とadvisory A-1〜A-3の未完保持を再導出して確認。"
    green_commands:
      - kind: integration_test
        command: "harness-check (linux / windows / aggregate)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-19T19:26:02+09:00"
        evidence_path: docs/design/harness/L6-function-design/release-channel-manifest.md
        output_digest: "sha256:46aec5a9a366db1e9b139784138e108ff868f444cb25fa7be26900a1e40b0b96"
---

# PLAN-REVERSE-473: 段階リリース管理 設計backfill

本 PLAN は `PLAN-L7-473-staged-release-channel-manifest` (add-impl) の Reverse 対である
(`kind=add-impl` は Reverse 対必須)。R0の既存実装観測とR1の責務分割・pair-freeze訂正を経て、
PF-1〜PF-5の実装・CI・cross-reviewをR3で再検収した。R4ではその結果をL6/L7へbackfillし、
Forward routingを確定する。R4のconfirmedはS2実装完了を意味せず、PF5 advisoryは次の実装sliceで
閉じる。

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
  2026-08-19、main `427e07be`に対するClaude non-author reviewがPASS（blocking 0）となった。
- R4: R3 PASS後に`docs/design/harness/L6-function-design/release-channel-manifest.md`へrelease channel manifest契約を合流し、
  `forward_routing=L5` / `promotion_strategy=reuse-with-hardening`を確定してForwardへ戻す。
  S3 promotion/rollbackは`003/004/005/008/010`をRED入力として別pair-freezeから開始する。

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

## backprop_scope (R4確定)

requirements、L4-basic-design、L5-detailed-designは変更なしと判定した。R3で再導出した
release channel manifestの関数契約をL6へ追加し、既存U-RELMAN oracleとPF5 advisoryの責務を
L7 test-designへ明示した。実装コード、S3 promotion/rollback、Pack repositoryのtag/revertは
このR4の生成物ではなく、対応する次のForward/Reverse sliceで扱う。

## 完了条件 (R4 backfill)

- [x] R0: `sync-pack` / `buildPackSyncPlan` / `PLAN-L6-63` との責務境界がPLAN-L7-473の
  設計判断節と矛盾なく記録される。
- [x] R1: PF-0〜PF-5の責務、所有oracle、AC-6 aggregate原子性、implementation-first禁止が定義される。
- [x] R1 closing: PF-1〜PF-5のpair-freezeと実装が直列にmainへ到達している。
- [x] R2: `U-RELMAN-001`〜`018`の所有sliceがmainへ到達し、PF5 aggregateまで完了している。
- [x] R3: exact main `427e07beb39700fc590097e7688b3231f3fe999a`に対するClaude non-author PASS、blocking 0。
- [x] R4: L6契約、L7対、`forward_routing=L5`、`promotion_strategy=reuse-with-hardening`を本PRで確定した。
- [ ] PF5 advisory A-1〜A-3: S2実装の追加mutationと実測が未完了。これをR4完了の証拠へ水増ししない。
