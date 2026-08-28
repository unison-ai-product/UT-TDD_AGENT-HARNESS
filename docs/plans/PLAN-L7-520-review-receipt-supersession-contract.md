---
plan_id: PLAN-L7-520-review-receipt-supersession-contract
title: "PLAN-L7-520 (add-impl): review receipt supersession を append-only attempt custody へ限定する"
kind: add-impl
layer: L7
drive: be
route_signal: feature_addition
route_mode: add-feature
status: confirmed
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Codex
github_issue_id: 386
parent_design: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
pair_artifact: docs/test-design/harness/L7-review-receipt-supersession-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - canonical receipt immutability と retry custody の独立検収"
  - role: se
    slot_label: "SE - append-only attempt outcome と create-exclusive receipt の最小降下"
  - role: qa
    slot_label: "QA - audit、receipt write、history preservation を独立変異で検証"
generates:
  - artifact_path: docs/plans/PLAN-L7-520-review-receipt-supersession-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-review-receipt-supersession-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
  requires:
    - PLAN-L7-493-d3a-repo-local-verdict-custody
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-493-d3a-repo-local-verdict-custody-backfill.md
    - docs/plans/PLAN-L7-518-review-request-retraction.md
    - docs/plans/PLAN-REVERSE-520-review-receipt-supersession-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/feedback/review-attestation.ts
    - src/feedback/review-verdict-custody.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/386
review_evidence:
  - reviewer: claude
    review_kind: cross_agent
    reviewed_at: "2026-08-28T03:49:55.518Z"
    tests_green_at: "2026-08-28T03:43:45.336Z"
    verdict: "PASS / blocking 0"
    worker_model: gpt-5.6-sol
    reviewer_model: claude-opus-5
    effort: low
    plan_revision: 0f5a5e4448adf6072e1020489b8fc82f0cef4a72
    subject_head: 0f5a5e4448adf6072e1020489b8fc82f0cef4a72
    scope: >-
      PR #458のdocs-only pair-freezeを非著者review。append-only attempt custody、
      create-exclusive canonical receipt、retry terminal vocabulary、candidate ID非衝突を確認した。
      production実装、canonical receipt retryの実走、Reverse R2-R4は証明しない。
    citations:
      - ".ut-tdd/review/receipts/f207341d75a9dc20c33634a14437c7383f51c2541fcc5ac9a42fcc96ed4ccc6e.json"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/458#issuecomment-5448165567"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/33139729035"
    green_commands:
      - kind: lint
        command: "node --experimental-strip-types src/cli.ts plan lint"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-28T03:43:45.336Z"
        evidence_path: docs/test-design/harness/L7-review-receipt-supersession-test-design.md
        output_digest: "sha256:6e7ec8ce403a263ab68ee70b465ab9931201b2e44a6a1f272390bb361ddb370c"
        anchor_commit: 0f5a5e4448adf6072e1020489b8fc82f0cef4a72
backprop_decision: required
backprop_decision_reason: "canonical receipt の不変性と retry 終端を変更するため、D3a custody と merge gate へ Reverse 検証を戻す。"
---

# PLAN-L7-520: review receipt supersession contract

## Closure evidence

PR #458 reviewed HEAD `0f5a5e4448adf6072e1020489b8fc82f0cef4a72` はcanonical Claude receipt
`f207341d75a9dc20c33634a14437c7383f51c2541fcc5ac9a42fcc96ed4ccc6e`で
`PASS / blocking 0`。CI run `33139729035` はLinux／Windows／aggregate Greenである。
ここで確定するのはappend-only attempt custodyのpair-freezeだけであり、production実装、retry実走、
canonical receiptの新規発行、Reverse R2-R4完了を意味しない。

## 1. Outcome

同じ canonical review request の試行が実行失敗した後でも、失敗証跡を消さずに次 attempt へ進み、
正常終了したreview executionだけを（verdictがPASS系かFLAGかを問わず）canonical receiptとして
一度だけ確定できるようにする。

本契約では **canonical receipt の supersession、置換、in-place 更新を禁止する**。supersede できるのは
attempt の選択状態だけであり、過去 attempt とその outcome は append-only custody に残る。この区別により、
merge gate が信頼する receipt root の fail-close を retry 都合で緩めない。

## 2. 起点と訂正

PR #448 exact HEAD `db2712ddf62bc88060eb0ae55028816b44ceb8df` は、実行失敗付き receipt を
`receipts/<requestDigest>.json` へ書いた後、成功 retry で同じ path を `writeFileSync` により置換する
方式を実装した。Claude closing review receipt `c526f3ab…` は、次を blocking とした。

1. canonical receipt の上書きという方式判断が、既存 `PLAN-L7-493` の契約 freeze 無しに実装された。
2. 旧PRが正規登録したoracle 040は戻り値だけを検査し、receipt writeと
   `superseded_receipt` auditの削除を検出しない。

PR #448 は merge せず close し、branch を監査用に保存した。本 PLAN は同実装を追認しない。

## 3. 設計判断

### 3.1 採択: canonical receipt は create-exclusive、失敗は append-only attempt outcome

| 案 | 内容 | 判定 |
| --- | --- | --- |
| A（採択） | 実行失敗は attempt outcome audit として追記し、成功時だけ canonical receipt を create-exclusive で1件生成する | receipt root の不変性と retry を両立する |
| B | failed receipt を canonical path に書き、成功時に in-place 置換する | audit sink が唯一の過去証拠となり、receipt custody の上書きを許すため不採択 |
| C | attempt ごとに複数 canonical receipt を置き、gate が winner を選ぶ | winner selection と重複終端を新設し、既存 single receipt 契約を壊すため不採択 |

`PLAN-L7-493` §3.3 のうち「receiptがまだ無い間だけ次attemptを許す」「receipt成功後は新attemptと
上書きを拒否する」というretry/custody境界だけを維持する。493全体を本sliceで再freezeする主張ではない。
`PLAN-L7-518` のappend-only terminal / CAS方針とも矛盾しない。

### 3.2 用語の固定

- **canonical receipt**: `.ut-tdd/review/receipts/<requestDigest>.json` にcreate-exclusiveで確定する
  正常終了review executionの終端証拠。verdictはPASS、PASS-WEAK、FLAGを取り得る。生成後は
  内容を問わず変更・削除・置換しない。
- **attempt outcome**: review attempt の実行結果を git-common-dir の review custody audit へ追記した
  非終端証拠。canonical receipt ではなく、単独で merge authority を持たない。
- **attempt supersession**: 次 attempt の開始により旧 attempt が選択対象から外れる論理遷移。
  旧 attempt file と outcome event の物理削除・書換えを意味しない。
- `superseded_receipt` という event 名と canonical receipt replacement は導入しない。

## 4. 凍結する契約

### 4.1 failed attempt の終端

1. provider が non-zero で終了した場合、identity-bound verdict の有無にかかわらず canonical receipt は0件とする。
2. consumer は attempt 番号、request digest、exact HEAD、provider/model、exit code、typed reason、
   verdict file digest（存在する場合。raw本文は保存しない）を `attempt_execution_failed` event として
  既存 git-common-dir review custody audit へ append する。
3. outcome append に失敗した場合は `attempt_outcome_indeterminate` で fail-close し、次 attempt を開始しない。
   次回は現物 audit と attempt file を照合してからだけ再開できる。
4. verdict scratch は既存 attempt path に不変のまま残す。failed outcome の記録や次 attempt 開始を理由に
   削除・上書きしない。

### 4.2 retry と論理 supersession

1. canonical receipt が無く、直前 attempt に対応する terminal outcome event が一意に存在する場合だけ、
   consumer は次の未使用 attempt 番号を割り当てる。
2. 次 attempt の開始前に既存 `superseded_attempt` event を appendする。失敗時は新 attempt write 0。
3. 選択対象は最新の未supersede attempt 1件だけとするが、旧 attempt file、failed outcome、
   `superseded_attempt` event は永久監査証跡として保持する。
4. 同一 attempt の書換え、番号再利用、audit 欠落の黙認、raw verdict からの outcome 補完を禁止する。

### 4.3 successful receipt の確定

1. exit code 0、canonical identity、verdict envelope、選択 attempt を全て検証した場合だけ canonical receipt を生成する。
2. write は create-exclusive とし、既存 path があれば内容が同じ場合だけ冪等 success、異なる場合は
   `verdict_identity_conflict`。既存 file の truncate、rename-overwrite、delete-then-write を禁止する。
3. canonical receipt の生成後は、failed/successを問わず新 attempt を開始しない。receipt 自体へ
   `executionOutcome: failed` を保存する経路を作らない。
4. receipt 後 cleanup は `PLAN-L7-493` §3.3を維持する。ただし過去 attempt と custody audit はcleanup対象外とする。

### 4.4 audit preservation

- `attempt_execution_failed` と `superseded_attempt` は request digest と attempt の一対一関係を持つ。
- 同一 event の replay は同一 canonical payloadへ冪等、同一 identityの異payloadは conflict とする。
- audit reader は欠落、重複、順序逆転、digest不一致を typed deny し、成功 receipt や次 attempt で補完しない。
- audit event を消しても canonical receipt の受理条件が緩まない。未receipt retryでは監査欠落により止まり、
  receipt後は既存 receipt を変更できない。

## 5. candidate 040 の独立 mutation 契約

`CANDIDATE-U-RVATT-040` は単一のhappy-path assertionで閉じない。対になるtest-designのcase A〜Dを
別 fixture / 別 mutation として実装し、各 mutation を単独で Red にする。

- A: failed attempt outcome append を削除する。
- B: canonical receipt write を create-exclusive から overwrite へ変える。
- C: success後に旧 attempt file または audit event を削除する。
- D: unresolved / audit欠落の failed attempt から次 attempt を許可する。

一つのassertion失敗が他の mutation を偶然覆う構造を禁止する。各caseは対象 side effect の現物を読み、
戻り値だけをoracleにしない。

## 6. Scope boundary

本PRはdocs-only pair-freezeであり、source、test、registry、receipt、runtime Memoryを変更しない。
次の実装PRは本PLANが非著者レビューで confirmed になった後に別起票する。

以下は対象外とする。

- `review-live` の typed reason 貫通（#448 §3-3。別の最小修理）。
- envelope parser と nonce 転記（Issue #393 / PLAN-L7-517 の所有境界）。
- request retraction / mint ledger（PLAN-L7-518）。
- 手書きreceipt、旧HEAD verdict再利用、merge bypass。

## 7. 完了条件

- 本PLAN、Reverse、test-designの構造・trace・UTF-8/LFがGreen。
- exact HEADの非著者Claude reviewが、append-only選択とcandidate 040の独立性を検収する。
- PASS後にのみstatusをconfirmedへ更新し、実装sliceを別PRで開始する。
