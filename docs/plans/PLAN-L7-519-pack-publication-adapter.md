---
plan_id: PLAN-L7-519-pack-publication-adapter
title: "PLAN-L7-519 (add-impl): Pack canary publication adapter implementation contract"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: Codex / Luna
parent_design: docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
next_pair_freeze: L8
backprop_decision: required
backprop_decision_reason: "PLAN-L7-515が固定したremote publication契約と後続実装の一致をPLAN-REVERSE-519で逆向き検証する。"
github_issue_id: 414
agent_slots:
  - role: se
    slot_label: "Luna worker - pair-freeze済みpublication adapterを実装する"
  - role: qa
    slot_label: "Terra - mutation単位nonceとremote write境界のRed oracleを実装する"
  - role: tl
    slot_label: "Sol - PLAN-L7-515準拠とfail-closeを非著者検収する"
generates:
  - artifact_path: docs/plans/PLAN-L7-519-pack-publication-adapter.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-519-pack-publication-adapter-backfill.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/test-design/harness/L7-pack-publication-remote-test-design.md
    - docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
    - src/setup/pack-publication-staging.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/414
review_evidence: []
---

# PLAN-L7-519: Pack canary publication adapter 実装契約

## 1. 目的と既存正本

Issue #414 の実装を、main 上の `PLAN-L7-515` が pair-freeze した remote canary publication
契約へ機械的に降下する。本PLANは新しいpublication方式を判断せず、`PLAN-L7-515` の正本FSM、
authority、CAS、nonce、durable journal、partial/indeterminate境界を変更しない。

入力は `PLAN-L7-508` の sealed staging resultだけとする。source repository、current worktree、
開発用DB/PLAN/evidence、local Pack checkout、directory walk、glob、環境変数からの補完を行わない。
実装と検証はNode/npmだけを使い、BunまたはBun fallbackを追加しない。実remote credentialを用いる
publicationは本実装PRのテスト範囲外とする。

## 2. 固定する実装境界

実装は注入portを用いた一方向FSM
`planned → pack_commit → release_draft → assets → tag → release_visible → canary`
に限定する。root intentはsealed entries、sidecar、exact two assets、release/source identity、expected
Pack main、before control snapshot、expected tree derivation、operation identityを保持する。remote mutation
後にしか得られないcommit/treeは事前計算せず、read-back attestation後にだけ次transitionへ渡す。

`ApprovalPort`、`DurableExecutionStatePort`、Pack repository、Release、asset、tag、visibility、pointer、
auditor、receiptの各portはtyped observationを返し、例外や観測不能を成功へ丸めない。最初のremote
write前のdenyは全write 0、最初のambiguity後は後続write 0とする。

## 3. nonce cardinality（既存判断の継承）

nonce粒度は新規判断ではない。`PLAN-L7-515` §2〜§4に従い、**remote mutation単位で新しい
approval receiptとsingle-use nonceを発行する**。

- branch commit、PR作成、PR CAS mergeを一つのnonceで共有しない。
- draft Release作成、各asset upload、annotated tag、visibility transition、pointer PR/append/CASは
  それぞれ独立したapproval receipt/nonceを持つ。
- 未使用nonceは対応mutation開始前に一度だけconsumeする。
- consume済みnonceは、同一operation・transition・intent・durable state・idempotency keyのremote
  state再観測にだけ使える。reconciliationは新規writeを発行しない。
- 別mutation、別identity、別state/key、順序飛越への再利用は`nonce_replay`でdenyする。

したがって、旧PR #447のように一個のnonceを複数mutationへ渡すcompositionは不適合とする。

## 4. TDD / oracle 契約

実装PRは専用test-designの `CANDIDATE-PACKPUB-519-*` をRedから開始し、成立したものだけを
`U-PACKPUB-REMOTE-*`へ昇格する。各oracleはtyped reasonだけでなく、該当境界のport call countを
直接観測する。特に次を独立に殺す。

- 実write後の結果で`remoteWrites: 0`を返す誤報告。
- mutation単位nonceを複数operationへ再利用するcomposition。
- draft/asset/tag/visibility/pointerのregistry行が実テストを持たないover-claim。
- commit/tree/sidecar/release identityの一軸だけを変えたread-back drift。
- response loss、journal persist failure、crash/restart後の盲目的write replay。

## 5. スコープと完了条件

この契約PRはPLAN、Reverse、専用test-designだけを所有し、production source、test code、共有oracle
registryを変更しない。契約の非著者cross-review後に別の実装PRをcurrent mainから作る。

実装PRの完了には、Red→Green、Node/npm targeted test、typecheck、Biome、PLAN lint、Linux/Windows/
aggregate CI、Reverse R1〜R4、exact-head非著者closing receiptを要求する。stable昇格、Product A/B、
consumer upgrade/rollback、Bun永久BAN、実credentialによる公開実行は非Scopeに残す。
