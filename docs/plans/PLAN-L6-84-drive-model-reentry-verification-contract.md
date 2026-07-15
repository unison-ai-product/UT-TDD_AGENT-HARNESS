---
plan_id: PLAN-L6-84-drive-model-reentry-verification-contract
title: "PLAN-L6-84 (add-design/function-spec): 駆動モデル検証・Forward再合流certificate契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - 駆動モデル出口とForward再合流gate"
  - role: se
    slot_label: "SE - reentry certificate aggregate/reducer契約"
  - role: qa
    slot_label: "QA - 中間test・合流後test・stale evidence oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
  requires: []
  references:
    - docs/plans/PLAN-L3-04-upstream-schedule-reconciliation.md
    - docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
    - docs/process/modes/README.md
  blocks:
    - docs/plans/PLAN-L7-438-reentry-internal-ci-auto-pr.md
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
---

# PLAN-L6-84: 駆動モデル検証・Forward再合流certificate契約

## 1. 目的

off-Forward実行を「作業完了」で閉じず、選択した駆動モデル内の仮説・修正を検証してから、
宣言済みForward revisionへ安全に引き込み、合流後の全体文脈でも再検証する。
E9 certificateはE6の駆動モデル検証とE8の中間testを束縛して発行する。E11のForward合流後testは
certificate発行条件ではなく、E12 draft PRへ進む後段条件である。したがってE6/E8/E11の三証拠を
混同せず、E9はE10で一度だけconsumeする。

## 2. ReentryCertificate aggregate

certificateは次をimmutable claimとして保持する。

| claim | 内容 |
|---|---|
| origin | `origin_asset_id`, `origin_revision_id`, `origin_layer`, `origin_state` |
| escape | Issue projection ID、`drive_model`、escape event sequence、実行branch/revision |
| target | `reentry_target_asset_id`, `reentry_target_revision_id`, `reentry_target_layer`, `reentry_target_state` |
| drive verification | E6 駆動モデル検証のoracle判定結果、対象仮説/反証条件、digest、完了時刻 |
| intermediate verification | E8 中間testのprofile、command、runner、exit、digest、tested commit、完了時刻 |
| issuance | 発行policy revision、issuer/reviewer、certificate digest |
| decision | `eligible | rejected | stale | human_required`とrule ID |

certificateのclaimは上記に限る (L4 data.md `ReentryCertificate`束縛、PLAN-L5-23 `reentry_certificates`と同定義)。
impact (dependency graph snapshot、影響artifact、backprop/reverse route)、merge simulation (3-way apply、
conflict、migration、schema compatibility)、post-reentry verification (Forward仮合流後のtest/doctor/contract/trace)
はcertificateのclaimではなく、E10/E11段のLedger evidenceとしてappendし、E12 draft PRの後段条件
(PLAN-L7-438 §2.4) が certificate とは別に参照する (§1 のとおり E11 は発行条件ではない)。

certificateは`drive_run_id`、`workflow_run_id`、Issue、PLAN revisionへjoinできなければeligibleにならない。
別revisionで得たgreen、command文字列だけの自己申告、digestなし、時刻逆転はevidenceとして採用しない。

## 3. 三証拠test契約

### 3.1 駆動モデル検証 (E6)

- drive modelごとの目的に応じたoracleを実行する。PoCなら仮説と反証条件、Recoveryなら再現testと
  guard、Reverseなら観測事実と上流backfill、Refactorなら外部挙動不変と構造指標を固定する。

### 3.2 駆動モデル内の中間test (E8)

- 対象branch/revision、fixture/data、環境、期待exitを固定し、失敗を消さずLedgerへappendする。
- E6 greenとE8 greenは別evidenceとして記録し、単一の「intermediate green」へ融合しない。
- 両greenはForwardへ引き込む資格 (E9発行) の要素であり、merge許可ではない。

### 3.3 Forward仮合流後test (E11)

- target revisionを再読込してstaleならcertificateを無効化し、暗黙rebaseでgreenを流用しない。
- isolated merge candidateを作り、影響graphで展開した設計、test-design、実装、test、DB schema、CLI、
  GitHub workflowを検査する。
- targeted testに加え、変更risk profileが要求するintegration/system/doctor/CIを実行する。
- 合流後testのsubject commitと、後続PRのHEADは同一でなければならない。

## 4. State / gate

`E7 ReentryProposed -> E8 IntermediateVerified -> E9 ReentryCertified -> E10 ForwardReentered ->
E11 PostReentryVerified -> E12 DraftPrProjected`を正規列とする。candidate構成はE7の作業であり、
独立したcertificate発行後stateにしない。`Rejected | Stale | HumanRequired`は理由・owner・next commandを伴う例外stateである。
skip、順序逆転、同一providerによるevidence捏造、対象commit不一致はfail-closeする。

`evaluateReentryCertificate`はpure query、`appendReentryEvidence`はcommandとし、CQSを維持する。
detectorは設計表から必要test profileを読み、現行testに合わせて要件を縮退させない。

## 5. L6↔L7 pair / oracle

`U-REENTRY-*` / `P-REENTRY-*`で次を固定する。

1. 全drive modelがE6駆動検証、E8 intermediate、E11 post-reentryの三証拠を要求する。
2. target revision更新、subject commit不一致、digest欠落、tests-before-decision時刻違反でstale/rejectedになる。
3. E9はE6/E8なしに発行できず、E12はE11なしに進めない。
4. impact graphに未処理artifactが1件でもあればreentryを拒否し、backprop routeを返す。
5. event replayが決定論的で、重複commandと順序入替mutationがstateを不正昇格させない。
6. GitHub不通でもlocal candidate/test/certificateを保持し、外部状態回復後に同一HEADへ再接続できる。

## 6. AC

- [ ] origin/escape/target/evidenceを束ねるReentryCertificate schemaとreducerを固定する。
- [ ] 駆動モデル内中間testとForward仮合流後testを別evidence familyとして必須化する。
- [ ] stale revision、HEAD不一致、影響未処理、evidence欠損をfail-closeする。
- [ ] 全drive modelの出口がForward layer/stateへ結び直され、孤児routeが0になる。
- [ ] GitHub障害と再開を跨いでもcertificate custodyとsubject revisionが変わらない。
- [ ] `U/P-REENTRY-*` Red、別provider review、L7-437/438実装、Reverse backfill後にconfirmed化する。
