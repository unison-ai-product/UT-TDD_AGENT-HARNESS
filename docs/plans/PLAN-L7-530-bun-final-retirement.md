---
plan_id: PLAN-L7-530-bun-final-retirement
title: "PLAN-L7-530 (add-impl): Bun 最終撤去の tuple-bound 実装契約"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-04
updated: 2026-09-04
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
backprop_decision: required
backprop_decision_reason: 最終撤去の実測結果と残存Bun到達面をL6契約へ戻し、Forwardのrelease gateへ再合流させる。
agent_slots:
  - role: se
    slot_label: SE - tuple admission と reachable Bun surface の最終撤去を実装する
  - role: qa
    slot_label: QA - 4要素tuple、片側receipt、各Bun到達面の独立Red oracleを検証する
generates:
  - artifact_path: docs/plans/PLAN-L7-530-bun-final-retirement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
    - docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/487
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/473
review_evidence: []
status: draft
github_issue_id: 487
admission_receipt:
  schema_version: v2
  receipt_id: certificate:bc9250c9a7c873dcb9f18956677371f7
  command_id: plan-draft:issue-487:forward:1
  admitted_at: 2026-09-04T00:00:00.000Z
  source_digest: sha256:11316ccad8122064fe93207fe743ad89cc051a9ea6c72f46293fbaffa0791b71
  decision_digest: sha256:91b9533f00fc1f130eb049b28e10b57fae432059eb1b207ba39bfa30d7c3856a
  receipt_digest: sha256:d06ea2c0c0d12e577fb1fe9d7f54dda0f06f4e662992c6e9188b37e3767cd533
  binding:
    path: docs/plans/PLAN-L7-530-bun-final-retirement.md
    plan_id: PLAN-L7-530-bun-final-retirement
    asset_id: plan:bc9250c9a7c873dcb9f18956677371f7
    revision: 1
    content_digest: sha256:11316ccad8122064fe93207fe743ad89cc051a9ea6c72f46293fbaffa0791b71
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 487
    episode_id: E4-487-bun-final-retirement
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
    revision: 30
    digest: sha256:e09246c801c266de2784d6a900661e51a80d7281007be986691e983a535791e1
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-530-bun-final-retirement
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #487 final Bun retirement after Q0 prerequisite receipts"
---

# PLAN-L7-530: Bun 最終撤去の tuple-bound 実装契約

## 1. 目的と開始ゲート

Issue #487 の責務は、Node self-host の前段を再実装することではなく、F0b sealed build、F0c
aggregate、Q0 parity が同じ chain で成立した後に、到達可能な Bun build/fallback surface を
物理撤去することである。F0b/F0c/Q0 の receipt が未成立の間は、本 PLAN の実装・削除を開始
しない。開始条件は次の全てを満たすこととし、欠落・失敗・別revisionは fail-close する。

- `PLAN-L6-93-node-bootstrap-contract` の L6/D0 admission が対象 chain に束縛されている。
- sealed build receipt と Node parity receipt が同じ `subject_revision`、`generation_id`、
  `artifact_digest` を持つ。
- F0c の Linux/Windows/aggregate receipt が同じ F0b predecessor を指す。
- Q0 の Node-only detector/parity receipt が F0c aggregate の canonical merge commitを
  ancestor として指す。

これは準備用の削除ではない。開始ゲートを満たさない場合、productionのBun経路、
`package.json` の `build`、`bunAuthority`、`bun.lock` を変更しない。

## 2. 4要素 tuple の admission

最終撤去の唯一の受理条件を、次の4要素 tuple として固定する。

| 要素 | 意味 |
|---|---|
| `subject_revision` | build/parityの対象とする algorithm-prefixed Git object ID |
| `generation_id` | sealed Node generation の immutable ID |
| `artifact_digest` | sealed build artifact の content digest |
| `retirement_subject` | `build` script等を撤去するこのcommitの subject revision |

sealed build receipt と Node parity receipt の双方が存在し、各tupleが完全一致し、かつ
`retirement_subject` が実際の撤去commitに一致する場合だけ、最終撤去を受理する。次を全て
独立した拒否軸として実装する。

- receipt片側欠落、unknown schema、失敗・cancelled・skipped receipt
- stale `subject_revision`、2 receipt間の `subject_revision` 不一致
- 同revision別 `generation_id`、同generation別 `artifact_digest`
- 3要素だけ一致し `retirement_subject` が撤去commitと不一致
- predecessorがcandidate HEADのancestorでない、履歴がshallow/promisorで完全性不明
- 同一target/同一HEADの二重admission、別edge/別producerのreceipt流用

拒否時は production write、build script変更、runtime activation、receiptの推測生成を全て0
とし、理由は既存のtyped reason集合へ変換する。存在チェックだけの恒真oracleは採用しない。

## 3. 撤去対象と残置fixtureの分離

Q0 detectorのfixtureや禁止語テストは、検出能力を検証するための**到達不能な retained
fixture**として残せる。ただしfixtureは専用fixture root/registryに隔離し、productionの
package script、runtime wrapper、CI、setup、Pack template、consumer generated treeから
参照可能であってはならない。fixtureを残したことを「Bunが残っている」と数えるかどうかを
曖昧にせず、scannerに `fixture` と `reachable_production` の区別を持たせる。

実装PRで `reachable_production` を0にする対象面は次の通りである。

- `package.json` の `build` script と package scriptからの Bun起動
- `bunAuthority`、`bun.lock`、Bun専用 setup/readiness/CI 導線
- source wrapper、Pack/consumer template、generated consumer treeのBun launcher
- `bun`/`bunx`/`tsx`/TypeScript直実行/shell helperへの runtime fallback
- Pack/consumer acceptance が暗黙に実行・導入・downloadするBun

テスト名称、Red fixture、migration debt台帳の履歴記録は、実行時にproductionへ到達しない
限り retained として許可する。allowlistへ混ぜてGreen化したり、検出対象から削除して
coverageを下げたりしてはならない。

## 4. TDD・実装範囲

実装PRは、test-designで予約した `CAND-NODEBOOT-208`、`023`、`027`、`028` をそれぞれ
Redで再現してから、同一commitでGreenへ昇格する。候補とoracleは次の対応を保つ。

| candidate | Red | Green oracle |
|---|---|---|
| `CAND-NODEBOOT-208` | reachableなBun build/fallback面を1つ残したまま撤去を成功扱いにする | production到達面を全件列挙し、1件でも残れば typed noncompliant/indeterminate で撤去0 |
| `CAND-NODEBOOT-023` | sealed/parity receiptの片側だけを与えて撤去する | 2 receiptの論理積を満たさない場合は撤去・write・activation 0 |
| `CAND-NODEBOOT-027` | stale/wrong-revision/wrong-generation/wrong-artifactを混ぜる | 4変異を各々拒否し、tuple完全一致だけを受理 |
| `CAND-NODEBOOT-028` | 過去receiptを別の撤去commitへ流用する | `retirement_subject`不一致を拒否し、現撤去commitだけを受理 |

TDD順序は、(1) admission schema/typed reason、(2) tuple verifier、(3) reachable-surface
inventory、(4) production削除、(5) retained fixture隔離、(6) Linux/Windows/aggregate
回帰とする。実装は既存の短い detector/receipt object と port を再利用し、新しい global
state、別のreceipt trust root、別のBun allowlistを作らない。

実装PRの変更対象は次の境界に限る。具体的な既存pathの所有は、実装PRで現行mainを再調査
してから `generates` と同一revisionへ追加する。

- Bun final retirement admission/verifier とその schema/test
- production reachable-surface inventory と typed report
- `package.json` / lock / wrapper / setup / CI / Pack・consumer templateの物理撤去
- retained Q0 fixture の隔離と detector coverage
- PLAN/Reverse/test-designの同一revision trace

consumer runtime identity (#463)、Node producer (#484/#515)、Pack publication、Memory/
notification (#424)、worktree lifecycle (#391) はこのPRへ混ぜない。

## 5. 完了・Reverse再合流

完了には、同じ implementation revisionへ以下を束縛する。

- 4 candidate の Red実測とGreen oracle、fixture/production分類の全件inventory
- sealed/parity/F0c/Q0 receiptと4要素 tupleの実値
- `bun` executable/install/download/invocation/fallback のLinux/Windows実測0
- source/Pack/consumerのproduction reachable-surface 0
- `package.json` build、`bunAuthority`、`bun.lock`の撤去結果
- required CI（Linux/Windows/aggregate）と非著者closing review receipt

Reverse pairは `PLAN-REVERSE-530-bun-final-retirement-backfill.md` とし、実装から得た
残存面・fixture境界・tuple証跡だけをL6/L5へgap-onlyで戻す。4要素tupleが成立したことや
CIがGreenであることだけから、consumerの複数product隔離やPack正式配布を完了扱いしない。

## 6. Scope boundary

本PLANは pair-freeze であり、現時点でBun撤去済み、Q0完了、Node self-host完了、Pack canary
公開済みとは主張しない。`status: draft` の間はこの文書以外のproduction artifactを
`generates`へ追加しない。非著者preflightが候補・ownership・開始ゲートを確認した後に、
実装PRが必要なpathとGreen evidenceを同一revisionで確定する。

上位の `PLAN-L6-93-node-bootstrap-contract` は `CAND-NODEBOOT-023` / `027` / `028` の
撤去条件を定義し、`PLAN-L7-458-node-self-hosted-bun-ban-foundation` は Q0 から最終撤去へ
進む順序を定義する。本PLANはその契約を参照して実装責務を一意に引き受ける後継PLANであり、
上位PLANのartifact所有を重複して取得しない。本pair-freeze PRでは上位PLANを直接改訂せず、
実装後のgap-onlyな上位改訂は `PLAN-REVERSE-530-bun-final-retirement-backfill` のR3/R4で
正規revisionとして行う。
