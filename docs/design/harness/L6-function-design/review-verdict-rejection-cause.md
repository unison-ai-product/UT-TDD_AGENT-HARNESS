---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_review_verdict_rejection_cause
pair_artifact: docs/test-design/harness/L7-review-verdict-rejection-recovery-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-26
issue: 1986
---

> 本書は `review-verdict-rejection-recovery.md` (verdict 拒否の表示と同一 request での再試行、Issue #1986) の §3 (原因の実測) を責務ごとに分けた文書である。方式と契約は親文書が持ち、本書は 2026-11-26 の `origin/main` (`b7d5ca65f`) で測った原因だけを持つ。節番号 3.1〜3.5 は親文書からの参照を保つため変えない。

# verdict 拒否の原因 (実測) - 機能設計 (Issue #1986)

## 3. 原因 (origin/main で実測)

### 3.1 拒否理由は JSON にだけ入り、人の目に出ない

`executeAdapterPlanForCli` (`src/cli/delegation.ts:179`) は `projectReviewVerdict` の結果を `reviewResult` に持ち (`:223`)、`ok === false` なら終了コードを 1 にする (`:288`)。理由 (`reviewResult.reason`) は戻り値の `review` に入るだけで、stderr へは書かれない (`:259` 以降に書く箇所が無い)。`--json` 以外の呼び出しでは、呼び出し側は「exit 1」しか分からない。

### 3.2 拒否の記録の結果が捨てられている

`projectReviewVerdict` (`src/feedback/review-attestation.ts:449`) の拒否は `rejectedVerdict` (`:367`) を通り、`recordStrictVerdictRejection` (`:329`) が `recordReviewAttemptVerdictRejection` (`review-verdict-custody.ts:383`) を呼んで `attempt_verdict_rejected` を書く。**この戻り値 (`ReviewAttemptOutcomeResult`) は捨てられ、関数は常に `undefined` を返す** (`:350` 付近の呼び出しのあと `return undefined`)。書き込みが失敗しても (`attempt_outcome_indeterminate`、`verdict_path_identity_mismatch`、`invalid_attempt_outcome` 等) 呼び出し側は検知できず、元の拒否理由だけが返る。

### 3.3 再試行の機構はすでにある

`beginReviewAttempt` (`review-verdict-custody.ts:522`) は、前 attempt の outcome が 1 件で `isRetryableAttemptEvent` を満たすとき (`attempt_verdict_rejected` は `isAttemptFailureEvent`、`:296` 以降、で `exitCode === 0` かつ `digestFile(verdictPath) === verdictDigest` を要求)、`superseded_attempt` (`reason: "retry"`、`oldAttemptDigest` つき) を追記して attempt 番号を 1 進める。旧 attempt の verdict.txt は消さない。terminal receipt (valid な `attempt_completed` つき) があれば `review_receipt_already_exists` で拒否する。

つまり新しい状態は要らない。足りないのは (a) 拒否の outcome が確実に残ったかの確認 (§3.2)、(b) 再試行できる条件と手順の明文化である。

### 3.4 別 request の PASS では pending は閉じない

request の identity digest は `schemaVersion / memoryId / pr / exactHead / authorFamily` で決まり (`reviewIdentityObject`、`review-verdict-custody.ts:62`)、`reviewRevision` はその digest から導く `rv1-<digest>` である (`canonicalReviewRevision`、`:84`。`issueReviewRequest` は `review-attestation.ts:399`)。merge gate は exact HEAD の entry に verdict の無いものが 1 件でもあると `pending_request_for_head` を積む (`review-merge-gate.ts:237`)。memoryId が違う request は別の entry であり、その PASS は古い pending を閉じない。事象 (§2) で後続の PASS が効かなかった理由の候補はこれである。

### 3.5 未確認

実際の事象の旧 request に、有効な `attempt_verdict_rejected` が残っていたか (§3.2 の書き込みが成功していたか) は**未確認**である。旧 request の audit は #1977 の checkout を読まないと確かめられない。確認は実装 PR の前に行い、結果を Issue #1986 へ記録する。成功していなければ、本書の §4.2 (記録の確認) が直接の修正になる。
