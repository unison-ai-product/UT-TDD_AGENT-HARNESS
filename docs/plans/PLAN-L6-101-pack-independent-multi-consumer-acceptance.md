---
plan_id: PLAN-L6-101-pack-independent-multi-consumer-acceptance
title: "PLAN-L6-101 (add-design): Pack単独・2 consumer隔離受入契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-20
updated: 2026-08-20
owner: PM / Codex
parent_design: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - source非依存とconsumer境界を既存Pack運用と分離してfreezeする"
  - role: se
    slot_label: "SE - product runtime root・version pin・状態所有の最小portを設計する"
  - role: qa
    slot_label: "QA - 二consumer隔離、片系upgrade/rollback、source不在の受入oracleを固定する"
generates:
  - artifact_path: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
  requires:
    - PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
  blocks: []
  references:
    - docs/plans/PLAN-L7-473-staged-release-channel-manifest.md
    - docs/design/harness/L6-function-design/setup-solo-team.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/224
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/357
github_issue_id: 357
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-20T09:09:53Z"
    tests_green_at: "2026-08-20T09:15:54Z"
    verdict: pass
    scope: >-
      PR #358 exact HEAD 040a9f85955db39286b46f093db2627dba4513f5 の
      PLAN-L6-101 pair-freeze delta closing review。B-1/B-2/F-1/F-2、consumer
      isolation、source非依存、異version、片系upgrade/rollback、digest再計算を確認。
    worker_model: codex
    reviewer_model: claude-opus-5
    plan_revision: 040a9f85955db39286b46f093db2627dba4513f5
    subject_head: 040a9f85955db39286b46f093db2627dba4513f5
    evidence_path: "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/358#issuecomment-5353821558"
    anchor_commit: 040a9f85955db39286b46f093db2627dba4513f5
    citations:
      - "Claude Opus PASS comment: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/358#issuecomment-5353821558"
      - "GitHub Actions run 32352029860 (Linux/Windows/aggregate success): https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/32352029860"
---

# PLAN-L6-101: Pack単独・2 consumer隔離受入契約

## 0. 位置づけと責務境界

Issue #224 の S4 を、Pack artifact だけから二つの下流productを同時に運用できる受入契約として
bounded 化する。PF-1〜PF-5 は source 側でrelease artifactを決定・検証・原子的にadmitする内部配布
coreであり、本PLANはその成果をconsumerへ導入した後のruntime隔離を所有する。

`PLAN-L6-63` が所有するPack repository側のtag/release/revert runbook、PF-5が所有するsource側の
aggregate admission、D1/D2/D3が所有するreview/merge authorityは変更しない。本PLANはPack publish、
`sync-pack` copy、promotion engine、rollback engineを実装しない。これらを一PRへ混ぜず、L6 freeze後に
独立したL7 implementation子Issueへ分ける。

## 1. 正本とruntime境界

1. consumerの正本は各product repository内のPack artifact、product-local configuration、および
   product runtime rootである。source development repository、source worktree、source `.ut-tdd`、
   source harness DB、source PLAN/test-design/evidence、ローカルPack checkoutはruntime discovery入力に
   してはならない。
2. `consumerRoot` は各productのcanonical repository root、`runtimeRoot` はそのproductだけが所有する
   runtime state rootとする。DB、Memory、PLAN projection、lock、hook state、review receipt、evidenceは
   `runtimeRoot` 外を参照・列挙・再利用しない。A/Bが同一OS userであってもroot identityが異なれば
   state identityは異なる。
3. Pack versionはconsumerごとのimmutable artifact identity（version、artifact digest、source revision）
   に束縛する。一方のconsumerがupgrade/rollbackしても、他方の設定、version pin、state、history、
   filesystem、process、receiptを書き換えない。
4. 受入入力はPF-5が成功として返したsealed release artifactだけである。manifest/digest/revisionの
   mismatch、artifact unavailable、namespace/path escape、unknown versionは、consumer導入前にtyped failure
   とし、対象consumerを含む全writeを0にする。consumerはmanifestのmaterializer versionに従い、受領した
   artifactのdestination path、mode、content bytesからartifact set digestを独立に再計算する。PF-5 receiptや
   manifestの申告digestを計算入力として信用せず、再計算値がreceipt・manifestの両方と一致した場合だけ受理する。

## 2. 二consumer受入シナリオ

fixtureは互いに別のtemporary rootを持つProduct A/Bとし、source repository、source worktree、
local Pack checkoutをfixtureから除外する。Pack artifact以外の開発元pathを環境変数、current directory、
config、symlink、junctionで注入しても成功へfallbackしない。

| シナリオ | 操作 | 必須観測 | 対応oracle |
| --- | --- | --- | --- |
| 独立導入 | A/Bを同じPack versionから個別に初期化 | 各runtime rootだけにstateが生成され、cross-root read/write 0 | `CANDIDATE-PACKISO-002` |
| 異version共存 | Aをv1、Bをv2 artifactへ束縛 | version/digest/revision・hook/lock/DB/receiptが互いに不変 | `CANDIDATE-PACKISO-003` |
| 片系upgrade | Bを実行したままAだけv1→v2へ進める | Aの切替はatomic、Bの実行と全状態が不変 | `CANDIDATE-PACKISO-004` |
| 片系rollback | Bを実行したままAだけ直前のattested artifactへ戻す | Aは決定論的に旧identityへ戻り、Bの実行・version/historyは不変 | `CANDIDATE-PACKISO-005` |
| 局所障害 | Aのartifact/receipt/lockを不正化する | Aはfail-close、Bはread/write/processを要求されず継続可能 | `CANDIDATE-PACKISO-006` |
| source不在 | development repo/worktree/local Pack checkoutを物理的に存在させない | Pack artifactだけから独立導入を再現する | `CANDIDATE-PACKISO-001` |

## 3. fail-closeと原子性

- 導入、upgrade、rollbackは対象consumerのprivate stagingで完結させ、commit前の失敗ではそのconsumerの
  prior bytes/mode/path/stateを不変にする。復旧証明に失敗した場合は成功・未変更へ丸めず、typed
  `rollback_failed` / `indeterminate`を返す。
- Aの失敗をBへrecovery対象として波及させない。共有グローバルlock、共有DB、共有runtime root、
  source側fallback、version最新化による暗黙upgradeはすべて禁止する。
- evidence/receiptはproduct identityとartifact identityを同時に保持する。artifactだけ、または
  productだけが一致する既存記録を他consumerの成功根拠へ再利用してはならない。

## 4. 後続実装への降下

本PLANの候補oracle `CANDIDATE-PACKISO-001`〜`006` は実装PRで同番号の`U-PACKISO-*`へ昇格する。
実装はconsumer-local runtime adapter、artifact admission port、isolated staging/apply port、acceptance
fixtureの最小範囲に限定する。現時点でsource/Pack repoのcopyやGitHub公開を先行実装しない。

L7 planは、L6 cross-family PASS後に本PLANを`requires`へ束縛し、実装成果物とReverse pairを同時に
宣言する。draftの本PLANは本PLAN自身以外を`generates`へ列挙しない。

## 5. 受入・出口

1. L6 claim-blind/spec-blind reviewで、PF-5との責務重複、source fallback、共有state、片系rollbackの
   他系汚染を攻撃する。
2. 実装PRは各候補oracleを実テストと同じcommitで昇格し、Linux/Windowsでsource/worktree/Pack checkout
   不在のA/B fixtureを実測する。
3. 全candidate Green、cross-family closing PASS、Reverse R1〜R4でL6 backfillを確認した後だけ、
   #224親のS4受入を完了として扱う。PF-1〜PF-5のcloseだけではこの条件を満たさない。
