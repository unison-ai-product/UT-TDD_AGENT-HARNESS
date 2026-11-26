---
title: "L7 review verdict rejection recovery test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/review-verdict-rejection-recovery.md
status: confirmed
updated: 2026-11-26
issue: 1986
---

# verdict 拒否の表示と同一 request での再試行 テスト設計 (issue #1986)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/review-verdict-rejection-recovery.md` の §4 方式、§5 不変条件、§6 単体契約である。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書は候補の oracle `CANDIDATE-U-RVREJ-001`〜`010` を記録する。

昇格の手順: src を含まない昇格 PR で、候補を正式 ID `U-RVREJ-*` に改め、各ケースを `it.fails` として `tests/` に入れる (Red の実測を同じ PR に束縛する)。実装 PR は `it.fails` を `it` に戻す最小実装 (Green) を入れ、そのあとに Refactor の commit を足す。ID の接頭辞 `RVREJ` は、既存の `RVATT` / `RVMG` / `RVADM` が verdict 拒否の表示と再試行を対象にしていないため新設した。

## 2. fixture

- 一時ディレクトリに git repo を作り、実 repo・実ネットワーク・実 provider CLI は使わない。provider の起動は `spawnSync` の差し替え (既存の `tests/cli-delegation.test.ts` と同じ形) で観測する。
- strict request (`rv1-`) は `issueReviewRequest` で作り、attempt は `beginReviewAttempt` で割り当てる。reviewer の verdict.txt は stub が書く (封筒の鍵を欠く版・正しい 9 鍵の版の両方を用意する)。
- stderr は `process.stderr.write` の差し替えで捕捉し、JSON の戻り値 (`review.reason`) と分けて検査する。
- merge gate は `evaluateMergeGate` (`src/feedback/review-merge-gate.ts`) を、一時 repo の request / receipt から組んだ入力で呼ぶ。
- 「残る」「変わらない」の観測は `.ut-tdd/review/` 配下 (requests / verdicts / receipts / audit) の file の bytes と一覧の比較で行う。

## 3. oracle

| ID | 対象 | 入力・期待・テストレベル |
|---|---|---|
| `CANDIDATE-U-RVREJ-001` | 拒否は stderr に理由を出す | 入力: strict request に対し、封筒の鍵を欠く verdict.txt (`VERDICT: PASS` を含む) を出す stub で `executeAdapterPlanForCli` を実行する (`--json` あり・なしの両方)。期待: stderr に `review verdict rejected: reason=verdict_identity_mismatch request=<requestDigest 先頭12桁> attempt=<n>` の 1 行が出る。JSON の `review.reason` と exit 1 は不変。反例: 理由を JSON にだけ入れる実装 (現状)、`--json` のとき stderr を黙らせる実装、stdout の JSON を汚す実装。レベル: unit。 |
| `CANDIDATE-U-RVREJ-002` | 成功では拒否行を出さない | 入力: 正しい 9 鍵の封筒を出す stub で同じ呼び出しを実行する。期待: `ok: true`、stderr に `review verdict rejected` を含む行が無い、receipt が作られる。反例: 常に拒否行を出す実装。レベル: unit。 |
| `CANDIDATE-U-RVREJ-003` | 鍵の名前だけを出す | 入力: (a) 先頭が `review_pr: 1977` で `schema_version`・`request_digest`・`attempt`・`pr` を欠く verdict。(b) 知らない鍵 `foo: secret-value` を含む verdict。期待: どちらも reason は `verdict_identity_mismatch`、stderr の `detail` に足りない / 知らない鍵の名前が出て、値 (`secret-value`・verdict 本文) は出ない。新しい reason の種類は増えない。反例: 値を出す実装、`detail` を判定に使う実装、reason を新設する実装。レベル: unit。 |
| `CANDIDATE-U-RVREJ-004` | audit の失敗を見せるが primary reason は置き換えない | 入力: 拒否の verdict に対し `recordReviewAttemptVerdictRejection` が失敗を返す (例: `verdict_path_identity_mismatch`) よう fixture を作る。期待: `recordStrictVerdictRejection` が `auditRecorded=false` と audit 側 reason を返し、primary `reason` は入力のまま (`verdict_identity_mismatch`)。stderr に両方が出る。反例: 戻り値を捨てて常に成功に見せる実装 (現状)、audit の失敗で primary reason を置き換える実装。レベル: unit。 |
| `CANDIDATE-U-RVREJ-005` | 同じ request の次の attempt で取り直せる | 入力: `attempt_verdict_rejected` が 1 件記録された後、同じ identity (memoryId / pr / exactHead / authorFamily) で `ut-tdd claude\|codex --role <reviewer role> --review-*` を再実行する。期待: `superseded_attempt` (`reason: "retry"`、`oldAttemptDigest` つき) が追記され、attempt が 1 進む。旧 attempt の verdict.txt は残る。反例: 新しい request を別の digest で作る実装、旧 verdict.txt を消す実装。レベル: integration (委譲 CLI + custody)。 |
| `CANDIDATE-U-RVREJ-006` | 再試行の開始は pending を解かない | 入力: 005 の再実行の直後 (新 attempt の verdict はまだ無い)。期待: request の projection は `requested` のまま。`evaluateMergeGate` が `pending_request_for_head` で拒否する (gate を弱めない)。反例: 再試行の開始で request を完了扱いにする実装。レベル: integration。 |
| `CANDIDATE-U-RVREJ-007` | 旧 verdict の改変は再試行を止める | 入力: `attempt_verdict_rejected` の後、旧 attempt の verdict.txt を 1 byte 変えてから再実行する (digest 不一致)。加えて、outcome 0 件・outcome 2 件以上・`attempt_outcome_conflict` の 3 状態。期待: すべて `attempt_outcome_indeterminate` (fail-close) で、`superseded_attempt` は追記されない。反例: digest を検証せず再試行を許す実装。レベル: unit。 |
| `CANDIDATE-U-RVREJ-008` | 別 request の PASS は古い pending を閉じない | 入力: 同じ PR・同じ exactHead で memoryId が違う request B を作り、PASS と receipt まで通す。request A (verdict 無し) は残す。期待: A と B は別 digest の別 entry。`evaluateMergeGate` は A のために `pending_request_for_head` で拒否する。反例: 同じ head の PASS で A を閉じる実装。レベル: integration。 |
| `CANDIDATE-U-RVREJ-009` | receipt の後は再試行も metadata 更新も拒否 | 入力: valid な `attempt_completed` と receipt が揃った request に対し、同じ identity で再実行する。期待: `review_receipt_already_exists` で拒否し、request の `requestedAt` と file の bytes が変わらない。反例: 成功後の再実行で request を更新する実装。レベル: unit。 |
| `CANDIDATE-U-RVREJ-010` | 再試行を経ても履歴が残る | 入力: 拒否 → 再試行 → 成功の流れを通す。期待: 拒否された verdict の本文 (attempt-1 の verdict.txt) と `attempt_verdict_rejected` event が audit に残り、`superseded_attempt` と並ぶ。最終の receipt は最後の attempt の verdict に束縛される。反例: 再試行で旧履歴を消す・書き換える実装。レベル: integration。 |

## 4. 既存テストとの関係

| 既存 | 関係 |
|---|---|
| `tests/review-attestation.test.ts` (`projectReviewVerdict` の拒否 reason) | reason の種類を足さない。退行しないことを確認する |
| `tests/review-verdict-custody.test.ts` | `beginReviewAttempt` の状態遷移 (005〜007、009) は既存機構。既存 case と重なる分は、oracle を既存 test への参照で満たしてよい |
| `tests/review-merge-gate.test.ts` (`pending_request_for_head`) | 006・008 と同じ判定。gate の判定規則は変えない |
| `tests/cli-delegation.test.ts` | 委譲 CLI と `spawnSync` の差し替えの fixture を流用する |
