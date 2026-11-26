---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_review_verdict_rejection_recovery
pair_artifact: docs/test-design/harness/L7-review-verdict-rejection-recovery-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-26
issue: 1986
---

> **L6 contract marker**: `surfaceVerdictRejection(result, request, attempt) => RejectionNotice` と `recordStrictVerdictRejection(input) => VerdictRejectionRecord` は unit-test-granularity contract である (未実装の目標契約。関数名は実装で変えてよい)。本書は、reviewer の verdict が拒否されたときに (a) 理由を実行した側へ出す規則と (b) 同じ request の次の attempt で取り直せる条件を凍結する。oracle は `docs/test-design/harness/L7-review-verdict-rejection-recovery-test-design.md` の `CANDIDATE-U-RVREJ-001`〜`010` が固定する (L7 pair は本書と同時に起票する)。行番号は 2026-11-26 の `origin/main` (`b7d5ca65f`) で測った。

# verdict 拒否の表示と同一 request での再試行 - 機能設計 (Issue #1986)

## 1. 目的と範囲

verdict が封筒の形の違いで拒否されても、(1) 実行した側が理由を知れず、(2) その head の merge が止まったままになる、という欠陥を直す。**custody の判定は緩めない。** 拒否された verdict を PASS として扱う道は作らない。

範囲外:

- 実行側が封筒を自動で付ける方式 (Issue 項目 3)。今回は採らない (§4.4)。
- request の取り下げ CLI (`review-request-admission.md` §6 と同じ理由で作らない)。
- merge gate の判定規則 (pending を数える規則) の変更。
- 新しい source_module、設定項目、環境変数。

## 2. 事象 (2026-11-25、PR #1977 再検 r2、Issue #1986)

reviewer の verdict.txt は `VERDICT: PASS` を含んだが、封筒の先頭が `review_pr: 1977` で、`schema_version`・`request_digest`・`attempt`・`pr` が無かった。receipt は作られず、review の log に拒否理由が 1 行も出なかった。後から出した別の再検 (PASS、receipt あり) でも `ut-tdd pr merge` が `pending_request_for_head,state:requested,verdict_missing` で拒否し、head を更新して review をやり直した。

## 3. 原因 (origin/main で実測)

### 3.1 拒否の理由と記録の結果が、人にも呼び出し側にも届かない

`executeAdapterPlanForCli` (`src/cli/delegation.ts:179`) は `projectReviewVerdict` の結果を `reviewResult` に持ち (`:223`)、`ok === false` なら終了コードを 1 にする (`:288`)。理由 (`reviewResult.reason`) は戻り値の `review` に入るだけで、stderr へは書かれない (`:259` 以降に書く箇所が無い)。`--json` 以外の呼び出しでは、呼び出し側は「exit 1」しか分からない。

`projectReviewVerdict` (`src/feedback/review-attestation.ts:449`) の拒否は `rejectedVerdict` (`:367`) を通り、`recordStrictVerdictRejection` (`:329`) が `recordReviewAttemptVerdictRejection` (`review-verdict-custody.ts:383`) を呼んで `attempt_verdict_rejected` を書く。**この戻り値 (`ReviewAttemptOutcomeResult`) は捨てられ、関数は常に `undefined` を返す** (`:350` 付近の呼び出しのあと `return undefined`)。書き込みが失敗しても (`attempt_outcome_indeterminate`、`verdict_path_identity_mismatch`、`invalid_attempt_outcome` 等) 呼び出し側は検知できず、元の拒否理由だけが返る。

### 3.2 再試行の機構はすでにある

`beginReviewAttempt` (`review-verdict-custody.ts:522`) は、前 attempt の outcome が 1 件で `isRetryableAttemptEvent` を満たすとき (`attempt_verdict_rejected` は `isAttemptFailureEvent`、`:296` 以降、で `exitCode === 0` かつ `digestFile(verdictPath) === verdictDigest` を要求)、`superseded_attempt` (`reason: "retry"`、`oldAttemptDigest` つき) を追記して attempt 番号を 1 進める。旧 attempt の verdict.txt は消さない。terminal receipt (valid な `attempt_completed` つき) があれば `review_receipt_already_exists` で拒否する。

つまり新しい状態は要らない。足りないのは (a) 拒否の outcome が確実に残ったかの確認 (§3.1)、(b) 再試行できる条件と手順の明文化である。

### 3.3 別 request の PASS では pending は閉じない

request の identity digest は `schemaVersion / memoryId / pr / exactHead / authorFamily` で決まり (`reviewIdentityObject`、`review-verdict-custody.ts:62`)、`reviewRevision` はその digest から導く `rv1-<digest>` である (`canonicalReviewRevision`、`:84`。`issueReviewRequest` は `review-attestation.ts:399`)。merge gate は exact HEAD の entry に verdict の無いものが 1 件でもあると `pending_request_for_head` を積む (`review-merge-gate.ts:237`)。memoryId が違う request は別の entry であり、その PASS は古い pending を閉じない。事象 (§2) で後続の PASS が効かなかった理由の候補はこれである。

実際の事象の旧 request に、有効な `attempt_verdict_rejected` が残っていたか (上の書き込みが成功していたか) は**未確認**である。旧 request の audit は #1977 の checkout を読まないと確かめられない。確認は実装 PR の前に行い、結果を Issue #1986 へ記録する。成功していなければ、本書の §4.2 (記録の確認) が直接の修正になる。

## 4. 方式

### 4.1 表示: 拒否を stderr へ出す

`executeAdapterPlanForCli` は `reviewResult.ok === false` のとき、次の 1 行を stderr へ書く。`--json` でも stderr へ書き (`--json` は stdout の JSON を汚さない)、JSON の `review.reason` と非 0 の終了コードは変えない。

```
review verdict rejected: reason=<typed reason> request=<requestDigest 先頭12桁> attempt=<n>
```

- `reason` は `projectReviewVerdict` が返した typed reason をそのまま出す。足りない鍵・知らない鍵の名前は、`parseReviewVerdictEnvelope` (`review-attestation.ts:583` 付近) が判定した箇所に限り、`reason` と別の `detail` として出す (値は出さない)。新しい reason は足さない。
- 再試行できる拒否 (§4.3 の条件) のときは、同じ識別子 (`--review-memory-id` / `--review-pr` / `--review-revision` / `--review-author-family`) で再実行する旨を 1 行足す。
- `projectReviewVerdict` は表示の I/O を持たない。表示は呼び出し側 (`executeAdapterPlanForCli`) の責務である。

### 4.2 記録: 拒否の outcome が残ったことを確かめる

`recordStrictVerdictRejection` (`review-attestation.ts:329`) は `recordReviewAttemptVerdictRejection` の戻り値を捨てず、次を返す。

- primary rejection reason (元の typed reason。**常にこれが優先**で、監査の失敗に置き換えない)
- `auditRecorded: true | false` と、false のときの audit 側 reason

`rejectedVerdict` はこれを `ReviewVerdictProjectionResult` へ載せ (`ok: false` に `reason` と、追加の任意項目 `auditFailure`)、§4.1 の表示が両方を出す。audit の書き込みに失敗したとき、次回の `beginReviewAttempt` は outcome 0 件で再試行不能 (`attempt_outcome_indeterminate`) になる。これは fail-close のままにする。失敗を表示で見せることだけが変わる。

### 4.3 再試行: 同じ request の次の attempt

再試行は、**同じ identity (memoryId / pr / exactHead / authorFamily。reviewRevision は導出値) で `ut-tdd claude|codex --role <reviewer role> --review-*` をもう一度呼ぶ**ことで行う。`issueReviewRequest` は同 digest → 同 path の冪等な上書き (`requestedAt` のみ更新、receipt があれば拒否) で、`beginReviewAttempt` が下表の状態遷移で次の attempt を割り当てる。

状態遷移 (既存):

| 前 attempt の状態 | 次の呼び出し |
|---|---|
| `attempt_verdict_rejected` が 1 件、valid、verdict.txt の digest が記録と一致 | `superseded_attempt` を追記して attempt+1 |
| outcome 無し、receipt も valid な `attempt_completed` も無い | `attempt_outcome_indeterminate` (fail-close) |
| `attempt_outcome_conflict`、または outcome 2 件以上 | `attempt_outcome_indeterminate` |
| valid な `attempt_completed` と receipt がある | `review_receipt_already_exists` |

request の projection は、valid な receipt が出るまで `requested` (pending) のままである。再試行の開始は pending を解かない。

### 4.4 採らない方式: 実行側で封筒を付ける

reviewer に封筒を書かせず実行側が付ける方式は、run ごとの verdict 本文の捕捉・封緘・再利用の拒否を要し、新しい信頼境界を作る。今回は採らず、必要なら別 Issue と別契約で扱う (PR スコープ規律 2)。

## 5. 不変条件

1. **拒否は承認にならない**: 拒否された verdict に receipt は作られず、理由は stderr に出て、終了コードは非 0 である。
2. **再試行は同じ request の中だけ**: 根拠は検証可能な拒否の outcome (`attempt_verdict_rejected`) と、改変されていない旧 verdict 本文 (digest 一致) である。audit の欠落・改ざん・競合は fail-close (`attempt_outcome_indeterminate`) とする。
3. **再試行の開始は pending を解かない**: attempt が完了して receipt ができるまで、merge は `pending_request_for_head` で拒否される。
4. **別 request の PASS は古い pending を置き換えない**: memoryId が違えば別 entry であり、古い pending は残る。
5. **成功は終端**: receipt と `attempt_completed` が揃ったあと、さらなる再試行や metadata 更新は `review_receipt_already_exists` で拒否される。
6. **履歴を消さない**: 拒否された verdict 本文と audit 履歴は保持する。supersede や取り下げで FLAG を消さない。
7. 新しい source_module、設定項目、環境変数、reason の種類を足さない (§4.1 の `detail` と `auditFailure` は既存 reason の補足であり、判定に使わない)。

## 6. 単体契約 (unit contract)

署名 (未実装の目標契約):

- `surfaceVerdictRejection(result, request, attempt) => RejectionNotice`: `ReviewVerdictProjectionResult` が `ok: false` のとき、stderr へ書く 1〜2 行 (§4.1) を返す。I/O は呼び出し側が行う。`ok: true` なら空。
- `recordStrictVerdictRejection(input) => VerdictRejectionRecord`: `{ reason, auditRecorded, auditFailure? }` を返す。`reason` は入力の理由そのもの。
- `beginReviewAttempt(input) => ReviewAttemptResult`: 既存。振る舞いは変えず、§4.3 の表を oracle で固定する。

### DbC

| 対象 | 事前条件 (pre) | 事後条件 (post) | 不変条件 (invariant) |
|---|---|---|---|
| `surfaceVerdictRejection` | `result.ok === false`、`request` と `attempt` が有効 | `reason` と requestDigest 先頭12桁と attempt を含む。値 (verdict 本文・鍵の値) を含まない | `result.reason` を書き換えない。`ok: true` では何も出さない |
| `recordStrictVerdictRejection` | strict request (`rv1-`) と canonical な attempt path | audit 書き込みの成否を `auditRecorded` に反映し、primary `reason` は入力のまま返す | 書き込み失敗を成功に見せない。失敗で primary reason を置き換えない |
| `beginReviewAttempt` (再試行) | 同一 request、前 attempt の rejected outcome が 1 件で digest 一致 | `superseded_attempt` を 1 件追記し attempt+1 を割り当てる。旧 verdict.txt は残る | outcome 0 件・conflict・2 件以上は `attempt_outcome_indeterminate`。receipt 後は常に拒否。pending は解かない |
| `executeAdapterPlanForCli` (表示) | `review` 指定あり | `reviewResult.ok === false` なら stderr に 1 行、exit は非 0、JSON の `review.reason` は不変 | 成功時は stderr に拒否行を出さない |

### oracle (L7 pair で固定する。正式 ID への昇格は src を含まない PR で行う)

| ID | 検査 |
|---|---|
| CANDIDATE-U-RVREJ-001 | `ok: false` の拒否で stderr に reason と requestDigest 先頭12桁と attempt が出る。JSON の `review.reason` と exit 1 は不変 |
| CANDIDATE-U-RVREJ-002 | `ok: true` では拒否行が出ない |
| CANDIDATE-U-RVREJ-003 | 封筒の鍵が足りない / 知らない鍵がある verdict で `verdict_identity_mismatch` が返り、`detail` に鍵の名前だけが出る (値は出ない) |
| CANDIDATE-U-RVREJ-004 | audit 書き込みが失敗したとき `auditRecorded=false` で、primary reason は元のまま |
| CANDIDATE-U-RVREJ-005 | `attempt_verdict_rejected` の後、同じ request で再実行すると `superseded_attempt` が追記され attempt+1 になる。旧 verdict.txt は残る |
| CANDIDATE-U-RVREJ-006 | 再試行の開始直後、request の projection は `requested` のままで、merge gate は `pending_request_for_head` で拒否する |
| CANDIDATE-U-RVREJ-007 | 旧 verdict.txt を改変すると (digest 不一致) 再試行は `attempt_outcome_indeterminate` |
| CANDIDATE-U-RVREJ-008 | memoryId が違う request の PASS (receipt あり) は、古い pending を閉じず、merge は拒否される |
| CANDIDATE-U-RVREJ-009 | receipt と `attempt_completed` の後の再実行は `review_receipt_already_exists`。`requestedAt` も変わらない |
| CANDIDATE-U-RVREJ-010 | 再試行を経ても、拒否された verdict の本文と `attempt_verdict_rejected` event が audit に残る |

## 7. 実装順序 (別 PR、1 PR = 1 論点)

1. §3.1 の未確認事項の確認 (旧 request の audit)。Issue へ記録。
2. L7 oracle の Red (`it.fails`)。
3. §4.2 (`recordStrictVerdictRejection` の戻り値) と §4.1 (表示)。既存の source_module 内の最小変更で、新しいファイルは作らない。
4. §4.3 は既存機構であり、oracle 005〜010 が既存の振る舞いを固定できなければ、その差分だけを別 PR とする。
