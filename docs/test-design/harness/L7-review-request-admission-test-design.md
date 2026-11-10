---
title: "L7 review request admission test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/review-request-admission.md
status: draft
updated: 2026-11-10
issue: 1600
---

# review request の受理順序 テスト設計 (issue #1600)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/review-request-admission.md` の §4 方式、§5 失敗の扱い、§8 不変条件である。共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書は候補の oracle `CANDIDATE-U-RVADM-001`〜`012` を記録する。

昇格の手順: src を含まない昇格 PR で、候補を正式 ID `U-RVADM-*` に改め、各ケースを `it.fails` として `tests/` に入れる (Red の実測を同じ PR に束縛する)。実装 PR は `it.fails` を `it` に戻す最小実装 (Green) を入れ、そのあとに Refactor の commit を足す。ID の接頭辞 `RVADM` は、既存の `RVATT` (attestation)・`RVMG` (merge gate) が委譲 CLI の入口を対象にしていないため新設した。

## 2. fixture

- 一時ディレクトリに git repo を作り、実 repo・実ネットワーク・実 provider CLI は使わない。provider の起動は `spawnSync` の差し替え (既存の `tests/cli-delegation.test.ts` と同じ形) で観測する。
- 「何も書かない」の観測は、一時 repo の `.ut-tdd/review/` 配下 (requests / verdicts / receipts / audit) の file 一覧が呼び出しの前後で一致することで行う。
- merge gate は `evaluateMergeGate` (`src/feedback/review-merge-gate.ts`) を、一時 repo の request / receipt から組んだ入力で呼ぶ。
- 実行環境の runtime は `CLAUDECODE=1` (currentRuntime が `claude`) にして、推定の値が明示の値と食い違う状況を作る。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・テストレベル |
|---|---|---|
| `CANDIDATE-U-RVADM-001` | 族分離の拒否は request を残さない | 入力: `CLAUDECODE=1`、`ut-tdd claude --role blind-reviewer --execute --review-pr N --review-head <sha> --review-revision r1 --review-author-family claude` (provider と author family が同族)。期待: `same_family_reviewer_denied` で exit 非 0、provider は起動されない、`.ut-tdd/review/` の file 一覧が前後で一致する (request・attempt・audit が 0 件)。反例: request を書いてから拒否する実装。レベル: unit (CLI を in-process で実行、`spawnSync` を差し替え)。 |
| `CANDIDATE-U-RVADM-002` | model の下限の拒否は request を残さない | 入力: review lane の role に、下限を下回る `--model` を明示する。期待: `reviewer_model_below_floor` で exit 非 0、`.ut-tdd/review/` に何も書かれない。反例: 下限の検査を `beginReviewAttempt` だけに置く実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-003` | 空の revision は採番せず拒否 | 入力: `--review-revision ""` (空文字) と、空白だけの `--review-revision "  "`。期待: どちらも `review_head_required` で exit 非 0、request が 0 件。反例: 空を採番する実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-004` | option の取り違え (値が option 名) は拒否 | 入力: argv `--review-revision --review-author-family codex` (変数の展開が空で引数が消えた形。commander は次の token を値にする)。期待: `review_revision_invalid` で exit 非 0、request が 0 件。反例: option 名の文字列を revision として採番する実装 (記録された request の `reviewRevision` が `rv1-` 始まりで、`memoryId` に option 名を含む)。レベル: unit。 |
| `CANDIDATE-U-RVADM-005` | 余分な位置引数は拒否 | 入力: 004 の argv (位置引数 `codex` が余る)、および正しい option に加えて余分な位置引数 1 つを渡す呼び出し。期待: `review_unexpected_argument` で exit 非 0、request が 0 件。反例: 余分な引数を黙って捨てる実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-006` | 明示した author family がそのまま記録される | 入力 (a): `CLAUDECODE=1` のまま `--review-author-family codex`、provider `claude`、reviewer の起動は成功する stub。期待: 書かれた request の `authorFamily` が `codex`。入力 (b): `CODEX_SANDBOX` を設定し (currentRuntime が `codex`) `--review-author-family claude` を渡し、provider `codex`。期待: `authorFamily` が `claude`。入力 (c): `--review-author-family foo`。期待: `review_author_family_required` で request が 0 件。反例: 明示の値を currentRuntime で上書きする実装、無効な値を推定へ落とす実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-007` | 実例の再現 (拒否のあとも正しい request の PASS で通る) | 入力: 同じ PR・同じ exact HEAD に対し、(1) 事象の呼び出し (argv `--review-revision --review-author-family codex`、`CLAUDECODE=1`) を実行する、(2) 正しい呼び出し (`--review-revision r1 --review-author-family codex`、provider `claude`) を実行して PASS の verdict を出す stub を通す。期待: (1) は拒否され request が 0 件。(2) のあと、`evaluateMergeGate` が `pending_request_for_head` と `verdict_missing` を含まずに通る (そのほかの gate の入力は PASS の条件を満たす)。反例: (1) が request を残して (2) の PASS があっても gate が拒否する実装 (事象の再現)。レベル: integration (委譲 CLI + merge gate)。 |
| `CANDIDATE-U-RVADM-008` | 受理のあとに reviewer の起動が失敗したら request が残り merge を止める | 入力: 受理の検査を通る呼び出しで、`spawnSync` の差し替えが launch 失敗 (`error` を返す) または非 0 終了を返す。期待: request が 1 件残り、`evaluateMergeGate` が `pending_request_for_head` と `verdict_missing` で拒否する (gate を弱めない)。同じ identity の再実行が attempt を追加して閉じられる。反例: 起動失敗で request を巻き戻す実装、取り下げの経路を設ける実装。レベル: integration。 |
| `CANDIDATE-U-RVADM-009` | verdict 待ちの正規の request は従来どおり merge を止める | 入力: 受理を通った request があり、verdict (receipt) が無い exact HEAD。期待: `evaluateMergeGate` が `pending_request_for_head` で拒否する。本書の変更前後で同じ (既存の `tests/review-merge-gate.test.ts` の pending の case と同じ入力で退行しない)。反例: pending の数え方を変えて gate を緩める実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-010` | 二重防御と述語の共有 | 入力 (a): `beginReviewAttempt` を直接、同族の provider で呼ぶ。期待: 従来どおり `same_family_reviewer_denied`。入力 (b): 族分離の述語を受理の検査側だけ変える mutation。期待: 001 と 010 (a) のどちらかが赤くなる (判定が分岐しない)。反例: 受理の検査と `beginReviewAttempt` に別々の判定を書く実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-011` | dry-run も同じ受理の検査を通り、何も書かない | 入力: `--execute` なしで、001・004 の呼び出しを実行する。期待: execute 時と同じ reason で exit 非 0。正しい呼び出しの dry-run は計画を出して成功し、`.ut-tdd/review/` に何も書かない。反例: dry-run だけ受理の検査を飛ばす実装。レベル: unit。 |
| `CANDIDATE-U-RVADM-012` | すでに残っている request は変えない | 入力: verdict の無い request が既に 1 件残っている状態で、別の HEAD に対する正しい呼び出しを実行する。期待: 既存の request の file は bytes が不変で、元の HEAD の gate は `pending_request_for_head` のまま。新しい HEAD の request は別に書かれる。反例: 受理の変更が既存の request を消す・書き換える実装。レベル: integration。 |

## 4. 既存テストとの関係

| 既存 | 関係 |
|---|---|
| `tests/review-attestation.test.ts` (`U-RVATT-005` の `review_head_required`、`review_author_family_required` の case) | 受理の検査の既存の reason。退行しないことを確認する (本書は reason を足すだけで変えない) |
| `tests/review-merge-gate.test.ts` (`pending_request_for_head`、589・770 行付近) | 009 と同じ入力。gate の判定規則は変えない |
| `tests/review-verdict-custody.test.ts` | `beginReviewAttempt` の二重防御 (010 (a)) |
| `tests/cli-delegation.test.ts` | 委譲 CLI の呼び出しと `spawnSync` の差し替えの fixture を流用する |
