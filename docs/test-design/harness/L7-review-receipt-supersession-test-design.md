---
title: "L7 review receipt supersession test design"
layer: L7
executed_at_layer: L7
status: confirmed
plan_id: PLAN-L7-520-review-receipt-supersession-contract
updated: 2026-08-28
---

# Review receipt supersession test design

対になる契約は `docs/plans/PLAN-L7-520-review-receipt-supersession-contract.md`。
実装PRではcandidateを `tests/review-receipt-supersession.test.ts` の現物検査へ束縛し、
Red/Greenの実測後に正式oracleへ昇格する。

## `CANDIDATE-U-RVATT-040` independent mutation matrix

| Candidate | Stimulus / mutation | 独立oracle |
| --- | --- | --- |
| case A | non-zero attemptで `attempt_execution_failed` appendを削除 | audit現物が0件となりRed。project関数の戻り値はoracleに使わない |
| case B | 既存canonical receiptを置いた後、成功retryのwriteをcreate-exclusiveからoverwriteへ変更 | 既存bytes/digest不変とtyped conflictを直接検査しRed。audit検査に依存しない |
| case C | 成功retry後に旧attempt fileまたはfailed/superseded eventを削除 | 各path/event identityの残存検査がRed。canonical receipt件数だけでは通らない。cleanup後も旧attemptのfailure digestとsuperseded targetを再読する |
| case D | failed attemptのoutcome appendを失敗/欠落させたまま次attemptを開始可能にする | `attempt_outcome_indeterminate` と新attempt write 0の検査がRed。成功receipt生成には到達させない |

複数 retry chain は attempt-1 failure → attempt-2 failure → attempt-3 success を実走し、
attempt-2 が attempt-1 を supersede した履歴を attempt-3 開始時に誤って拒否しないことを検査する。
同一 attempt の異なる exit code を再投影した場合は `attempt_outcome_conflict` をそのまま返し、
次 attempt と receipt の write を 0 件にする。

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

## 実装時の接地

`CANDIDATE-U-RVATT-040` は composition fixture と case A〜D の独立変異を同一の
review custody APIへ接続する。case A/D は audit event の欠落・重複を現物で検査し、
case B は canonical receipt bytes の不変性と conflict を直接検査する。成功後の cleanup
では旧 attempt file と `attempt_execution_failed` / `superseded_attempt` を保持し、
成功 attempt の scratch だけを削除する。戻り値・件数だけを oracle とせず、audit JSONL、
attempt path、receipt bytes を再読する。
