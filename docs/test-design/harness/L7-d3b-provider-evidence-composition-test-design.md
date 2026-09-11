---
title: "L7 D3b provider evidence composition test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
plan_id: PLAN-L7-534-d3b-provider-evidence-composition
updated: 2026-09-11
---

# PLAN-L7-534 test design

## 1. 位置付け

`PLAN-L7-534-d3b-provider-evidence-composition` と `PLAN-REVERSE-534-d3b-provider-evidence-composition-backfill`
専用の pair artifact である。`PLAN-L7-562` の pair artifact (共有 `L7-unit-test-design.md` の `CANDIDATE-D3B-*`)、
`PLAN-L7-493` / `L7-503` の custody oracle を変更せず、composition (入力導出 → envelope → producer → 再読込) と
runner の bytes 再計算だけを検証する差分 oracle を定義する。

この pair-freeze では候補だけを宣言する。production source と test code を追加せず、共有 `L7-unit-test-design.md` への
`U-*` 登録は実装 PR まで行わない。

## 2. fixture

- temp directory 内の fixture checkout (tracked `ut-tdd.project.json` を HEAD に commit)。`.ut-tdd/review/requests` /
  `receipts` / `evidence` / `judgments` と `.git/ut-tdd-runtime/review-custody/review-custody.jsonl` を fixture が用意する。
  実 repository・開発 worktree・実 PR を対象にしない。
- request file は `issueReviewRequest` (strict) で作り、receipt は `projectReviewVerdict` 相当の fixture で作る。
  `attempt_completed` は実装後の `delegation.ts` 経路、または同形式の fixture append で作る。
- producer は PR #569 の実装をそのまま使い、fake port は 009 (artifact 改変) にだけ注入する。
- 各 stimulus の後、evidence / judgments / receipts / draft 出力の byte digest を前後比較し write 0 を数える。

## 3. Candidate oracle matrix

| Candidate | Stimulus / mutation | 独立 oracle |
| --- | --- | --- |
| `CANDIDATE-U-D3BCOMP-001` | `composeProviderJudgment` に digest / ref / provider / model / family を引数・env・stdin で渡す | 型で受理されない (入力 key は `repoRoot` / `requestDigest` / `attempt` のみ)。余分 key は `identity_mismatch`、write 0 |
| `CANDIDATE-U-D3BCOMP-002` | request file の欠落、JSON 不正、file 名と `reviewRequestDigest` 再計算の不一致 | `request_unavailable`。write 0 |
| `CANDIDATE-U-D3BCOMP-003` | receipt の `head` / `reviewRevision` / `pr` を request と 1 軸ずつ不一致にする | `identity_mismatch`。write 0 |
| `CANDIDATE-U-D3BCOMP-004` | receipt は正常、`attempt_completed` event 無し | `invocation_fact_unavailable`。receipt の `reviewerFamily` から provider を補完したら Red。write 0 |
| `CANDIDATE-U-D3BCOMP-005` | 同一 (requestDigest, attempt) の `attempt_completed` を provider 違いで 2 件 | `invocation_fact_ambiguous`。最後の event を採用したら Red。write 0 |
| `CANDIDATE-U-D3BCOMP-006` | (a) `attempt_completed` の後に同 attempt の `superseded_attempt`、(b) event の `receiptFileDigest` が receipt file bytes の sha256 と不一致 | (a) `evidence_superseded`、(b) `receipt_mutated`。write 0 |
| `CANDIDATE-U-D3BCOMP-007` | receipt `blockingFindings` に重複文字列 | `evidence_schema_invalid`。dedup して通したら Red。write 0 |
| `CANDIDATE-U-D3BCOMP-008` | receipt が FLAG で findings 空、または PASS で findings 非空 | producer の `judgment_schema_invalid` を透過 (別 reason へ丸めたら Red)。artifact 0 |
| `CANDIDATE-U-D3BCOMP-009` | fake port が `written` を返した直後に artifact bytes を 1 byte 改変 | `artifact_verification_failed`。artifact を残さない (0 件)。producer 戻り値だけで成功にしたら Red |
| `CANDIDATE-U-D3BCOMP-010` | 正常系を 2 回 compose | 1 回目 `replay: false`、2 回目 `replay: true`、envelope / artifact の bytes 不変、`d3b:<digest>` 一致 |
| `CANDIDATE-U-D3BCOMP-011` | runner env に `UT_TDD_CUSTODY_JUDGMENT_DIGEST` または `UT_TDD_CUSTODY_PROVIDER_EVIDENCE_REF` を設定 (値が正しくても) | `operator_supplied_judgment_forbidden`、exit 非 0、draft 生成 0。警告付きで受理したら Red |
| `CANDIDATE-U-D3BCOMP-012` | `UT_TDD_CUSTODY_JUDGMENT_ARTIFACT` の bytes を 1 byte 改変 | 再計算 digest と payload の整合検証で deny、draft 0。改変前は draft の `judgmentDigest` / `providerEvidenceRef` が再計算値と一致 |
| `CANDIDATE-U-D3BCOMP-013` | 別 PR / 別 head / 別 request digest / 別 attempt で生成した正当な artifact bytes を渡す | `judgment_identity_mismatch`、draft 0 |
| `CANDIDATE-U-D3BCOMP-014` | CLI `review compose-judgment` の stdout に payload / findings / nonce を含める実装へ変異 | stdout は artifact path と `d3b:<digest>` のみ。それ以外の行があれば Red |
| `CANDIDATE-U-D3BCOMP-015` | 正常な receipt file の 1 byte を改変してから compose | `receipt_mutated` (`attempt_completed.receiptFileDigest` と再計算 sha256 の不一致)。write 0。request digest で照合して通したら Red |
| `CANDIDATE-U-D3BCOMP-016` | audit append を fault injection で失敗させ、review を完了させる | receipt file 不在、temp 残置 0、`attempt_execution_failed` が記録され、`beginReviewAttempt` が次 attempt を開始できる。receipt が残ったら Red |
| `CANDIDATE-U-D3BCOMP-017` | temp → receipt の rename を失敗させる (EACCES / crash window) | `attempt_completed` 有り・receipt 無し。`beginReviewAttempt` は非終端として次 attempt を開始でき、compose は `receipt_unavailable`。既存 receipt を上書きしたら Red |
| `CANDIDATE-U-D3BCOMP-018` | temp file を残置したまま次 attempt を開始する | temp は無視して消され、新 attempt の event と receipt が一致する (receipt 1 個・一致する event 1 件 = exactly once)。temp を receipt として採用したら Red |
| `CANDIDATE-U-D3BCOMP-019` | (a) `attempt_completed` に `receiptDigest` field を足す、(b) `receiptFileDigest` を request digest と同値にする、(c) receipt file を CRLF 化 / key 並び替え / 末尾 LF 除去する | (a)(b) は `invocation_fact_schema_invalid`、(c) は `receipt_mutated`。write 0。JSON を再 parse して同値なら通す実装は Red |
| `CANDIDATE-U-D3BCOMP-020` | 一致する `attempt_completed` が無い orphan receipt を置いて次 attempt を開始する。(a) 次 attempt の bytes が同一、(b) 異なる、(c) 一致 event 有りの receipt | (a) 開始可、receipt 1 個のまま冪等完了、event 1 件が bytes と一致。(b) 開始可、上書きせず `attempt_outcome_conflict`、既存 bytes 不変。(c) `review_receipt_already_exists`。orphan を削除・上書きしたら Red |

`001..010` と `015..020` は PR-1 (composition module + `attempt_completed` + custody 順序化)、`011..014` は PR-2 (runner / CLI) が所有する。実装 PR で
Red→Green を観測した行だけを同番号の `U-D3BCOMP-*` へ 1:1 で昇格し、共有 `L7-unit-test-design.md` へ登録する。

## 4. Gate and scope fence

- composition の入力は request / receipt / `attempt_completed` / tracked identity の 4 つだけ (001..006)。
- event は receipt 確定より前に append し、どの失敗点も retry 可能な非終端に落ちる。receipt 改変は bytes digest で deny (015..018)。
- digest は writer が書いた bytes そのものを対象にし、旧 request digest 値や `receiptDigest` field を黙って受理しない (019)。
- receipt の存在は一致 event がある場合だけ終端。orphan は上書きなしで冪等回復か typed conflict (020)。
- evidence document は receipt を写すだけで、dedup・補完・推定をしない (007、008)。
- producer の戻り値を信用せず artifact を再読込する (009)。replay は write 0 (010)。
- runner は operator 文字列を presence で拒否し、bytes から再計算し、identity を照合する (011..013)。
- `PLAN-L7-562` の payload / canonicalization、`PLAN-L7-465` §D3c の authority 政策、#541 seal を本 artifact の oracle にしない。
- candidate の存在だけを Green 証跡、#570 / #541 の完了根拠にしない。

## 5. Required evidence

実装 PR は、fixture の構成 (request / receipt / event の件数)、各 stimulus 前後の write 0 計測、targeted command の exit code、
typecheck / Biome、Linux / Windows / aggregate CI run ID、exact HEAD、非著者 closing receipt digest を残す。
