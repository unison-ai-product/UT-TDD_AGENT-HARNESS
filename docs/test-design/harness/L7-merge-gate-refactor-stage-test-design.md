---
title: "L7 merge gate refactor stage test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/merge-gate-refactor-stage.md
created: 2026-10-23
issue: 1300
---

# merge gate の Refactor 判定欄 テスト設計 (Issue #1300)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/merge-gate-refactor-stage.md` である。本書はその §3 判定欄の形と抽出、§4 receipt と dispatch entry への写し、§5 対象の判定、§6 gate の判定と reason、§7 fail-close、§8 `runPrMerge` への組み込みを検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-REFACTORGATE-*`) だけを宣言する。実装は設計書保護 gate (`design-protection-diff-gate.md` §10.2 / §10.3) の順序で入れる: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、(2) 正式 ID `U-REFACTORGATE-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にし、Refactor の commit を続ける。L6 §9 の分け方に合わせ、§3.1〜§3.2 (判定欄の抽出と写し) と §3.3〜§3.5 (gate と組み込み) は別の実装 PR にする。

### 1.1 撤回した候補

`CANDIDATE-U-REFACTORGATE-001`〜`047` は撤回する。これらは旧案 (L6 §11 の案 A: gate が PR 本文の「Refactor なし」宣言を parse し、`refactor:` commit と Refactor commit の `tests/` 差分を機械で見る) の oracle だった。方針 D では gate は本文も commit も読まないので、対応する規則が無い。撤回した番号は再利用しない。

| 撤回した範囲 | 旧案での内容 | 方針 D での扱い |
|---|---|---|
| 001〜008 | 対象の判定 (path と Green commit の type) | 対象は path だけで決める (L6 §5)。新番号 `062`〜`063` |
| 009〜013 | `refactor:` commit の検出 | reviewer が見て判定欄に書く (`commit-ok`) |
| 014〜022 | 本文の「Refactor なし」宣言の parse | reviewer が見て判定欄に書く (`none-ok` / `none-rejected`)。条件の正本は `coding-rules.md` |
| 023〜029 | Refactor commit の `tests/` 差分 | reviewer が見て判定欄に書く (`commit-ok` / `commit-tests-changed`) |
| 030〜035 | commits / files の取得と fail-close | 取得は PR の files だけになる。新番号 `064`〜`066`、`076` |
| 036〜041 | `runPrMerge` への組み込み | 新番号 `073`〜`077` |
| 042〜047 | 実在 PR の本文と commit の再生 | 本文と commit を読まないので撤回 |

## 2. fixture

- `extractVerdict` と `evaluateRefactorJudgementGate` は純粋関数なので、verdict の文字列と `PlanChange[]` / `ReviewDispatchEntry[]` を直接組んで渡す。実 repo も GitHub も使わない。
- `projectReviewVerdict` の行は、既存の `tests/review-attestation.test.ts` と同じ isolated fixture (一時 repo root、strict custody の request と verdict file) を使う。
- `validateReceipt` と entry への写しの行は、既存の `tests/review-dispatch.test.ts` と同じく `analyzeReviewDispatch` に request / receipt / observation を渡して観測する。
- adapter (`readPullRequestChanges`) は `execFileSync` を fake にして `gh api` の応答 (JSON 文字列) と例外を返させ、呼ばれた引数も記録する。
- `runPrMerge` の行は、既存の `tests/review-merge-gate.test.ts` と同じ isolated fixture を使い、fake の `GhPrMergePorts` に `getPullRequestChanges` を足す。merge port が呼ばれた回数と、`.ut-tdd/logs/review-merge-gate.jsonl` の receipt を観測する。
- 既定値: `changes` = `[{ kind: "modified", path: "src/a.ts" }]` (対象)、exact HEAD の verdict entry は 1 件で `verdict: "PASS"`、`refactorJudgement: "commit-ok"`。行ごとに 1 点だけ変える。

## 3. Candidate oracle matrix

「落とす mutation」は、その行の規則を 1 本だけ壊した変異である。行の oracle はその mutation で fail する。

### 3.1 判定欄の抽出と出力契約 (L6 §3)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-048` | `VERDICT: PASS` の次行に `REFACTOR: commit-ok` | ok、`refactorJudgement: "commit-ok"`、`blockingFindings: []` | 判定欄の抽出を削除する |
| `CANDIDATE-U-REFACTORGATE-049` | `REFACTOR:` の値を `none-ok` / `not-applicable` / `commit-tests-changed` / `none-rejected` にする (別ケース)。`none-rejected` は `VERDICT: FLAG` と `FINDING:` 1 件を伴う | 各ケースで同じ値を返す | 5 種のどれかを受理しない |
| `CANDIDATE-U-REFACTORGATE-050` | `VERDICT: PASS` だけで `REFACTOR:` 行なし | ok、`refactorJudgement` の key を持たない | 欄なしを失敗にする / 既定値を入れる |
| `CANDIDATE-U-REFACTORGATE-051` | `REFACTOR: ok` / `REFACTOR: Commit-OK` / `REFACTOR:` (空) (別ケース) | 各ケース失敗、reason `refactor_judgement_unknown` | 値の検査を削除する / 大文字・小文字を無視する |
| `CANDIDATE-U-REFACTORGATE-052` | `REFACTOR: commit-ok` と `REFACTOR: none-ok` の 2 行 / `REFACTOR: none-ok` の 2 行 (別ケース) | 前者は `refactor_judgement_ambiguous`、後者は ok で `none-ok` | 最初の行だけを採る / 同じ値の再掲も ambiguous にする |
| `CANDIDATE-U-REFACTORGATE-053` | `REFACTOR: none-rejected` が `VERDICT: PASS` 行より前にだけある (task text の echo の形) | ok、`refactorJudgement` の key を持たない | 全行を候補にする |
| `CANDIDATE-U-REFACTORGATE-054` | `VERDICT: PASS` の後に字下げした `    REFACTOR: none-ok` だけ | ok、key を持たない | 行頭の anchor を外す (trim してから照合する) |
| `CANDIDATE-U-REFACTORGATE-055` | `reviewOutputContract()` の戻り値 | `REFACTOR:` の指示と 5 種の値、`docs/governance/coding-rules.md` への参照を含む。`reviewOutputContractExample()` は従来どおり `extractVerdict` で受理される | 指示を足さない / 模範出力ブロックを変えて round-trip を壊す |

### 3.2 receipt と dispatch entry への写し (L6 §4)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-056` | strict custody の verdict file に `VERDICT: PASS` と `REFACTOR: none-ok` | `projectReviewVerdict` が ok、receipt に `refactorJudgement: "none-ok"` | receipt に写さない |
| `CANDIDATE-U-REFACTORGATE-057` | 同じ fixture で `REFACTOR:` 行なし | receipt に `refactorJudgement` の key が無い | `undefined` や既定値を key として書く |
| `CANDIDATE-U-REFACTORGATE-058` | verdict file に `REFACTOR: maybe` | `rejectedVerdict` の reason `refactor_judgement_unknown`、receipt を書かない | 抽出の失敗を無視して receipt を書く |
| `CANDIDATE-U-REFACTORGATE-059` | `kind: "verdict"` の receipt の `refactorJudgement` が `"maybe"` / `kind: "in_review"` の receipt が `refactorJudgement` を持つ (別ケース) | 前者は entry の reasons に `invalid_refactor_judgement` で `merge_ready` にならない。後者は `unexpected_verdict_fields` | `validateReceipt` の値検査を削除する / verdict 以外での key を許す |
| `CANDIDATE-U-REFACTORGATE-060` | 判定欄だけが違う (`none-ok` と `none-rejected`) 同じ identity の verdict receipt 2 件 | 2 件を別内容として扱う (同じ内容として 1 件に潰さない) | `receiptContentKey` に `refactorJudgement` を含めない |
| `CANDIDATE-U-REFACTORGATE-061` | `refactorJudgement: "commit-ok"` の verdict receipt | `analyzeReviewDispatch` の entry に `refactorJudgement: "commit-ok"` | entry に写さない |

### 3.3 対象の判定と adapter (L6 §5)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-062` | `changes` が `docs/` だけ / `tests/` と `docs/test-design/` だけ (別ケース)、entry は `refactorJudgement` なし | 各ケース `{ target: false, ok: true, reasons: [] }` | 対象を全 PR にする / `tests/` を対象 path に入れる |
| `CANDIDATE-U-REFACTORGATE-063` | `changes` が `scripts/b.mjs` の `modified` / `src/old.ts` → `lib/new.ts` の `renamed` (別ケース)、entry は判定欄なし | 各ケース `target: true`、`refactor_judgement_missing` | `scripts/` を外す / rename 元を数えない (`classifyPullRequestChanges` を使わず独自に判定する) |
| `CANDIDATE-U-REFACTORGATE-064` | fake `gh api` が `filename` / `previous_filename` / `status` の 4 要素 (`added` / `removed` / `renamed` / `modified`) を返す | 呼び出し引数に `pulls/<pr>/files` と `--paginate`。戻り値は `added` / `deleted` / `renamed` (`from` 付き) / `modified` | `--paginate` を付けない / `previous_filename` を捨てる |
| `CANDIDATE-U-REFACTORGATE-065` | 応答の要素数が 3000 / 2999 (別ケース) | 3000 は `file_list_truncated` で throw、2999 は成功 | 上限の検査を削除する / 境界を `>` にする |
| `CANDIDATE-U-REFACTORGATE-066` | 応答が配列でない / 要素の `filename` が数値 / `status` が無い (別ケース) | 各ケース `invalid_response` で throw | 型検査を削除する |

### 3.4 gate の判定 (L6 §6)

| ID | 入力 (対象の `changes`) | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-067` | entry の判定欄が `commit-ok` / `none-ok` / `not-applicable` (別ケース) | 各ケース `{ target: true, ok: true, reasons: [] }` | 合格の値のどれかを不合格にする |
| `CANDIDATE-U-REFACTORGATE-068` | entry の判定欄なし (判定欄の導入より前の receipt の形) | `refactor_judgement_missing` | 判定欄なしを合格にする (猶予を入れる) |
| `CANDIDATE-U-REFACTORGATE-069` | entry の判定欄が `commit-tests-changed` / `none-rejected` (別ケース)、verdict は `PASS` | 各ケース `refactor_judgement_rejected:<値>` | 不合格の値を見ない / verdict が PASS なら判定欄を見ない |
| `CANDIDATE-U-REFACTORGATE-070` | exact HEAD の verdict entry が 2 件 (`commit-ok` と判定欄なし) | `refactor_judgement_missing` | 最初の entry だけを見る |
| `CANDIDATE-U-REFACTORGATE-071` | verdict の無い entry (判定欄なし) 1 件だけ | `ok: true`、reasons なし (review gate の `verdict_missing` に任せる) | verdict の無い entry も判定欄の検査に入れる |
| `CANDIDATE-U-REFACTORGATE-072` | 2 件の entry が `none-rejected` と `commit-tests-changed` | reasons = `refactor_judgement_rejected:commit-tests-changed`、`refactor_judgement_rejected:none-rejected` (昇順、重複なし) | 並べ替えない / 最初の違反で止める |

### 3.5 `runPrMerge` への組み込み (L6 §7 / §8)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-073` | review は `merge_ready`、対象の PR で判定欄なし | DENY、merge port 0 回、`merge_intent` receipt なし、`merge_result` receipt の reason = `refactor_judgement_missing` | 本 gate の結果を merge の判定に使わない |
| `CANDIDATE-U-REFACTORGATE-074` | review は deny (`FLAG`)、判定欄は `none-rejected` | reason = review の token と `refactor_judgement_rejected:none-rejected` の和集合、昇順、`,` 区切り | review が deny のとき本 gate を呼ばない / 片方だけ出す |
| `CANDIDATE-U-REFACTORGATE-075` | review は `merge_ready`、対象でない PR (docs だけ) で判定欄なし / 対象の PR で `commit-ok` (別ケース) | 各ケース MERGED (既存 `U-RVMG-001` と同じ receipt) | 対象外や合格を deny にする |
| `CANDIDATE-U-REFACTORGATE-076` | `getPullRequestChanges` が `HTTP 502` で throw / `getPullRequest` が throw (別ケース) | 前者は DENY `refactor_target_unavailable:gh_failed:HTTP 502` で merge port 0 回。後者は既存どおり `gh_fetch_failed:*` で、`getPullRequestChanges` 0 回 | 例外を握りつぶして対象外にする / `getPullRequest` 失敗の後に本 gate を呼ぶ |
| `CANDIDATE-U-REFACTORGATE-077` | CLI (`registerPrMergeCommands`) を fake port で実行、判定欄なし | 標準出力が `pr merge — DENY pr=#<n> head=<sha> reason=refactor_judgement_missing`、exit code 1 | 出力形式を変える |

## 4. 既存 oracle との関係

既存の `U-RVMG-*` と `U-RVCON-*` (`docs/test-design/harness/L7-unit-test-design.md`)、`U-RVDISP-*` は変えない。`runPrMerge` の fake port に `getPullRequestChanges` を足す必要があるため、既存テストの fixture は「対象でない `changes`」を返す既定の fake を持つ。これは fixture の追加であって oracle の改訂ではない (既存行の期待は変わらない)。
