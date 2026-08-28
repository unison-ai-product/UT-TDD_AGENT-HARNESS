---
plan_id: PLAN-L7-519-pack-publication-adapter
title: "PLAN-L7-519 (add-impl): Pack canary publication adapter implementation contract"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
status: confirmed
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
  - artifact_path: src/setup/pack-publication-adapter.ts
    artifact_type: source_module
  - artifact_path: tests/pack-publication-adapter.test.ts
    artifact_type: test_code
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
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: "2026-08-28T03:42:30.729Z"
    tests_green_at: "2026-08-28T03:38:26.536Z"
    verdict: "PASS-WEAK / blocking 0"
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-5
    effort: low
    plan_revision: b1fa5c2a6690187bc95fe2ebb317786ca9ffdb85
    subject_head: b1fa5c2a6690187bc95fe2ebb317786ca9ffdb85
    scope: >-
      PR #464のdocs-only pair-freezeを非著者review。上位003-A..S2全23行の
      ID非変更・1対1実装束縛と、旧519別registryの撤去を確認した。
      production実装、remote mutation、R2-R4、Pack canary実行は証明しない。
    citations:
      - ".ut-tdd/review/receipts/e52da9af2215884b700b5ed1937c893594ab401452d55ecaca8bf488609b0e42.json"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/464#issuecomment-5448119489"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/33139471330"
    green_commands:
      - kind: lint
        command: "node --experimental-strip-types src/cli.ts plan lint"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-28T03:38:26.536Z"
        evidence_path: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
        output_digest: "sha256:8aeaa864a263f7920917da8e55309eee7efbe20b03976d0fc7e0aff0eeaaf8f4"
        anchor_commit: b1fa5c2a6690187bc95fe2ebb317786ca9ffdb85
---

# PLAN-L7-519: Pack canary publication adapter 実装契約

## Closure evidence

PR #464 reviewed HEAD `b1fa5c2a6690187bc95fe2ebb317786ca9ffdb85` はcanonical Claude receipt
`e52da9af2215884b700b5ed1937c893594ab401452d55ecaca8bf488609b0e42`で
`PASS-WEAK / blocking 0`。CI run `33139471330` はLinux／Windows／aggregate Greenである。
ここで確定するのは、上位`CANDIDATE-PACKPUB-003-A..S2`を再採番せず後続実装へ束縛する
pair-freezeだけであり、publication adapter実装、remote mutation、Reverse R2-R4、Pack canary完了を
意味しない。

実装sliceは`src/setup/pack-publication-adapter.ts`へ、sealed intent、mutation単位approval、durable
journal、remote mutation count、read-back観測、immutable receiptを閉じ込める。remote portは注入し、
実credentialや実Pack repositoryをtargeted testで操作しない。実装証跡とReverse R2-R4はclosing
reviewとrequired CIが揃うまで未確定とする。

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

実装PRは上位pair artifact
`docs/test-design/harness/L7-pack-publication-remote-test-design.md` §3/§6 が所有する
`CANDIDATE-PACKPUB-003-A..S2`をID変更・再採番・再定義せず、その全行をRedから開始する。
対象集合は `A, B, C, D, E, F, G, H1, H2, I, J, K, L, M1, M-late, M2, N, O, P, Q, R,
S1, S2` の23行であり、成立した行だけを1対1の`U-PACKPUB-REMOTE-*`へ昇格する。専用test-designは
この集合への実装束縛だけを所有し、新しいcandidate registryを作らない。各oracleはtyped reason
だけでなく、該当境界のport call countを直接観測する。特に次を独立に殺す。

- 実write後の結果で`remoteWrites: 0`を返す誤報告。
- mutation単位nonceを複数operationへ再利用するcomposition。
- approval、initial drift、inventory、暗黙補完、branch/merge、tag pre/post、Release、asset、sidecar、
  visibility、pointer initial/late/CAS、cleanup、reconciliation、nonce、protected main、journal、
  linkageのいずれかのregistry行が実テストを持たないover-claim。
- commit/tree/sidecar/release identityの一軸だけを変えたread-back drift。
- response loss、journal persist failure、crash/restart後の盲目的write replay。

## 5. スコープと完了条件

この契約PRはPLAN、Reverse、専用test-designだけを所有し、production source、test code、共有oracle
registryを変更しない。契約の非著者cross-review後に別の実装PRをcurrent mainから作る。

実装PRの完了には、Red→Green、Node/npm targeted test、typecheck、Biome、PLAN lint、Linux/Windows/
aggregate CI、Reverse R1〜R4、exact-head非著者closing receiptを要求する。stable昇格、Product A/B、
consumer upgrade/rollback、Bun永久BAN、実credentialによる公開実行は非Scopeに残す。
