---
title: "L7 review receipt supersession test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-520-review-receipt-supersession-contract
updated: 2026-08-28
---

# Review receipt supersession test design

対になる契約は `docs/plans/PLAN-L7-520-review-receipt-supersession-contract.md`。
本PRではcandidateのfreezeだけを行い、実装とRed実測を同一commitへ束縛するまで正式oracleへ昇格しない。

## `CANDIDATE-U-RVATT-040` independent mutation matrix

| Candidate | Stimulus / mutation | 独立oracle |
| --- | --- | --- |
| case A | non-zero attemptで `attempt_execution_failed` appendを削除 | audit現物が0件となりRed。project関数の戻り値はoracleに使わない |
| case B | 既存canonical receiptを置いた後、成功retryのwriteをcreate-exclusiveからoverwriteへ変更 | 既存bytes/digest不変とtyped conflictを直接検査しRed。audit検査に依存しない |
| case C | 成功retry後に旧attempt fileまたはfailed/superseded eventを削除 | 各path/event identityの残存検査がRed。canonical receipt件数だけでは通らない |
| case D | failed attemptのoutcome appendを失敗/欠落させたまま次attemptを開始可能にする | `attempt_outcome_indeterminate` と新attempt write 0の検査がRed。成功receipt生成には到達させない |

## composition fixture

1. attempt-1へidentity-bound verdictを書き、provider exit 7を入力する。
2. canonical receiptが0、failed outcome eventが1、attempt-1 fileが残ることを現物で検査する。
3. terminal outcomeを照合してattempt-2を開始し、`superseded_attempt` eventを1件生成する。
4. attempt-2をexit 0で成功させ、canonical receiptをcreate-exclusiveで1件生成する。
5. receipt後cleanupを実行し、過去のattempt-1 file、failed outcome、superseded eventは残る一方、
   成功attempt-2のscratch directoryだけが削除され、canonical receiptが成功内容から不変であることを再読する。

040-A〜Dは別fixtureまたはmutation対象を限定したtable testとして実装する。一つのfixture初期化失敗で
全caseが同時にRedになる構造、戻り値だけのassertion、実装関数をoracleとして再利用する構造は禁止する。

## negative boundaries

| Candidate | Stimulus | Oracle |
| --- | --- | --- |
| `CANDIDATE-U-RVATT-045` | canonical receipt存在後に同一/次attemptを開始 | `review_receipt_already_exists`、attempt/audit delta 0 |
| `CANDIDATE-U-RVATT-043` | canonical receipt pathへ異payloadを再投影 | `verdict_identity_conflict`、既存bytes/digest不変 |
| `CANDIDATE-U-RVATT-044` | audit event重複、順序逆転、request/attempt digest改竄 | typed deny、次attempt/receipt write 0 |
