---
plan_id: PLAN-L7-439-cross-review-merge-learning-closure
title: "PLAN-L7-439 (add-impl): cross-provider review・merge gate・E15学習closure"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - review receipt・accept reducer・merge outbox・telemetry projector"
  - role: qa
    slot_label: "QA - stale CI/review/HEAD、merge race、E15 rollup Red oracle"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-439-cross-review-merge-learning-closure.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-439-cross-review-merge-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L6-82-universal-pr-trigger-contract.md
    - docs/design/harness/L6-function-design/cross-review-enforcement.md
    - docs/design/harness/L6-function-design/test-before-review.md
    - docs/plans/PLAN-REVERSE-439-cross-review-merge-backfill.md
---

# PLAN-L7-439: cross-provider review・merge gate・E15学習closure

## 1. 実装目的

E12のdraft PRを、別providerによるclaim-blind/spec-blind review、同一HEADのCI、Forward acceptを経て
mainへmergeし、Issue closeと設計学習telemetryまでE15で閉じる。GitHubのMERGEABLE表示、review prose、
過去HEADのgreenのいずれも単独ではmerge許可にしない。

## 2. Cross-provider review実装 (E13)

- author/workerのprovider familyをExecution Episodeから解決し、それと異なるprovider familyを必須化する。
- claim-blind packetはartifact、spec/AC、reviewer自身が取得したCI/testだけを含み、作者の自己評価を根拠にしない。
- spec-blind packetはspecを伏せ、内部矛盾、dead path、境界欠落、権限・副作用を攻撃する。
- review receiptはlane、provider/model、subject HEAD、reviewed_at、attack taxonomy、citation、verdict、digestを保持する。
- `FLAG`未解消を拒否し、`PASS-WEAK`は3件以上のattack trialを要求する。
- CI/test完了前review、同一provider、対象HEAD欠落、review後HEAD更新をE13に昇格させない。

GitHub review commentはprojectionであり、Ledger receiptが正本である。ただしcomment投影とremote review stateの
reconcileが終わるまではmerge不可とする。

## 3. Accept / merge gate

`evaluateMergeReadiness(snapshot)`は一つのDB snapshotでcertificate、E9/E11 evidence、PR binding、
required CI、review receipt、HEAD/base、branch protection、human signoffを再評価する。

次のSHAは完全一致を要求する。

`certificate subject = post-reentry tested commit = PR HEAD = CI head SHA = reviewed SHA = merge candidate SHA`

accept後もmerge直前にremoteを再読込する。force-push、base更新、新しいrequired check、review dismissal、
unresolved outbox/inbox、branch protection変更があればacceptをstale化し、古い証拠を流用しない。

mergeはrepository policyのmethodを使い、auto-merge許可時のみ自動化する。人間signoff対象、production/security/PII、
GitHub policyが自動mergeを許さない場合は`human_required` eventをappendして停止する。
timeout/応答喪失後はPR/merge SHAをqueryし、merge済みなら再送せず`MergeObserved`へ収束させる。

## 4. E15 closure / telemetry

E15はmerge API成功ではなく、次の全観測が揃った時だけappendする。

- main merge SHAとPR binding
- main上のpost-merge required CI結果
- off-Forward Issue close、またはclose不能理由とowner
- certificate consume、outbox/inbox未処理0、unresolved blocker 0
- `layer × escape_type × cause × drive_model × recurrence_id × reentry_outcome` telemetry row

telemetry projectorはeventから再構築可能とし、同じ`recurrence_id`をdelivery/再試行回数で二重計上しない。
集計はForward想定、駆動モデル選択規則、設計判断、evidence policy、工程表branchの改善候補を生成するが、
設計を自動変更・自動承認しない。候補はfeedback/debt/PLAN/ADR routeへ返す。

post-merge main CI失敗はE15成功に丸めず、`PostMergeRegressionDetected`をappendし、新しい
Recovery/Incident Issueとorigin/reentry traceを生成する。

## 5. TDD Red freeze

| oracle | Red条件 / Green契約 |
|---|---|
| `U-PRFLOW-010` | authorとreviewerが同一providerならE13を拒否 |
| `U-PRFLOW-011` | tests-before-review違反、HEAD欠落、review後HEAD更新を拒否 |
| `U-PRFLOW-012` | FLAG残存とtrial 3件未満のPASS-WEAKを拒否 |
| `U-MERGE-001` | certificate/test/PR/CI/review/merge SHAの1箇所mutationでmerge不可 |
| `U-MERGE-002` | force-push/base更新/review dismissal/required check追加でacceptをstale化 |
| `U-MERGE-003` | timeout直後のremote merge成功をqueryし、二重merge commandを送らない |
| `U-MERGE-004` | human signoff・branch protection・escalation不足を自動mergeしない |
| `U-E15-001` | main CI/Issue close/outbox closureのいずれか欠落でE15不可 |
| `U-E15-002` | recurrenceの重複delivery/retryをtelemetryで1回だけcount |
| `U-E15-003` | post-merge regressionをRecovery/Incident routeへ変換 |
| `P-PRFLOW-001` | E12–E15 event列でskip/逆行/古い証拠によるterminal到達不能を証明 |

integration fixtureはGitHub review dismissal、force-push race、merge応答喪失、main CI failure、Issue close失敗、
webhook順序逆転、projection全削除/rebuildを含める。

## 6. AC

- [ ] 別providerのclaim-blind/spec-blind receiptだけがE13を成立させる。
- [ ] certificate/test/CI/review/PR/mergeが同一HEADでなければaccept・mergeできない。
- [ ] merge直前のremote変化を再評価し、stale evidenceを利用しない。
- [ ] GitHub障害・応答喪失・retry後もmerge commandとE15 eventが各1件に収束する。
- [ ] E15がmain CI、Issue closure、Ledger closure、telemetryまでを一体で証明する。
- [ ] escape telemetryからForward想定/設計判断改善候補を再構築し、自動承認はしない。
- [ ] `U/P-PRFLOW-*` / `U-MERGE-*` / `U-E15-*`がRed→Green、mutation survivor 0となる。
- [ ] REVERSE-439で観測事実をL4/L5/L6/test-designへgap-only backfillしてからconfirmed化する。
