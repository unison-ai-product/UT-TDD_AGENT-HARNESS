---
title: "L7 merge gate refactor stage test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L6-function-design/merge-gate-refactor-stage.md
created: 2026-10-23
issue: 1300
---

# merge gate の Refactor 工程確認 テスト設計 (Issue #1300)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/merge-gate-refactor-stage.md` である。本書はその §4 対象の判定、§5 合格の条件と宣言の形、§6 Refactor commit のテスト資産差分、§7 reason、§8 fail-close、§9 `runPrMerge` への組み込みを検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-REFACTORGATE-*`) だけを宣言する。実装は設計書保護 gate (`design-protection-diff-gate.md` §10.2 / §10.3) の順序で入れる: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、(2) 正式 ID `U-REFACTORGATE-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にし、Refactor の commit を続ける (または本文に `Refactor なし (理由)` を書く)。

## 2. fixture

- `parseRefactorNoneDeclaration` と `evaluateRefactorStage` は純粋関数なので、`RefactorStageFacts` を直接組んで渡す。実 repo も GitHub も使わない。
- adapter (`createGhPrMergePorts` の `getRefactorStageFacts`) は、`execFileSync` を fake にして `gh api` の応答 (JSON 文字列) と例外を返させる。呼ばれた引数 (path と `--paginate`) も記録する。
- `runPrMerge` の行は、既存の `tests/review-merge-gate.test.ts` と同じ isolated fixture (一時 repo root、request / receipt を置いた review 入力、fake の `GhPrMergePorts`) を使い、`getRefactorStageFacts` を fake にする。merge port が呼ばれた回数と、`.ut-tdd/logs/review-merge-gate.jsonl` の receipt を観測する。
- 実在 PR の行 (§3.7) は、2026-10-23 に GitHub REST から取った facts (pulls の `body` と head、commits の `sha` / `parents` / subject、files の `filename` / `previous_filename` / `status` / `changes`) を JSON fixture として固定して使う。テストの実行時に GitHub を読まない。
- 以下の facts の既定値: `headSha` = tip の commit、commit は親 1 つ、`changedPaths` = `["src/a.ts"]`、Green の commit = `fix: x` が 1 つ。行ごとに 1 点だけ変える。

## 3. Candidate oracle matrix

「落とす mutation」は、その行の規則を 1 本だけ壊した変異である。行の oracle はその mutation で fail する。

### 3.1 対象の判定 (L6 §4)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-001` | `changedPaths` が `docs/` だけ、commit は `docs: x` | `{ target: false, ok: true, reasons: [] }` | 対象判定を「全 PR」にする (path 条件の削除) |
| `CANDIDATE-U-REFACTORGATE-002` | `changedPaths` が `tests/` と `docs/test-design/` だけ、commit は `fix: x` (#1250 の形) | `target: false` | 対象を commit type だけで決める (L6 §11 の R1) / `tests/` を対象 path に入れる |
| `CANDIDATE-U-REFACTORGATE-003` | `changedPaths` に `scripts/b.mjs`、commit は `feat: x`、本文なし | `target: true`、`refactor_stage_missing` | `scripts/` を対象 path から外す |
| `CANDIDATE-U-REFACTORGATE-004` | `changedPaths` に rename 元の `src/old.ts` だけ (新 path は `lib/new.ts`)、commit は `fix: x`、本文なし | `target: true`、`refactor_stage_missing` | `previous_filename` を数えない |
| `CANDIDATE-U-REFACTORGATE-005` | `changedPaths` に `src/a.ts`、commit は `test: x` と `chore: y` だけ (§10.3 の登録 + Red の形) | `target: false` | Green commit の条件 (G) を削除する (L6 §11 の R2) |
| `CANDIDATE-U-REFACTORGATE-006` | `changedPaths` に `src/a.ts`、commit は `refactor: a` だけで、その `files` に `tests/x.test.ts` の `removed` (#1270 の形) | `target: false`、`ok: true` | (G) を削除する、または対象外にも §6 を当てる |
| `CANDIDATE-U-REFACTORGATE-007` | `changedPaths` に `src/a.ts`、Green は親 2 つの merge commit の subject `fix: merge main` だけ | `target: false` | merge commit の type を数える |
| `CANDIDATE-U-REFACTORGATE-008` | Green の subject が `fix(pack)!: x` | `target: true` | type 正規表現の scope / `!` の受理を削除する |

### 3.2 合格の条件: Refactor commit (L6 §5 の R)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-009` | 対象、`fix: a` の後に `refactor: b` (files は `src/a.ts` の `modified`)、本文なし | `{ target: true, ok: true, reasons: [] }` | refactor commit の検出を削除する |
| `CANDIDATE-U-REFACTORGATE-010` | 対象、`refactor(doctor): b` | ok | scope 付き header を受理しない |
| `CANDIDATE-U-REFACTORGATE-011` | 対象、refactor は親 2 つの merge commit `refactor: merge` だけ、本文なし | `refactor_stage_missing` | merge commit を refactor として数える |
| `CANDIDATE-U-REFACTORGATE-012` | 対象、subject が `Refactor: b` / `refactoring: b` / `refactor b` (それぞれ別ケース)、本文なし | 各ケース `refactor_stage_missing` | 大文字小文字を無視する / 前方一致で判定する / `: ` を要求しない |
| `CANDIDATE-U-REFACTORGATE-013` | 対象、`refactor: b` の後に `fix: c` (FLAG 是正の形) | ok | Refactor が最後の Green より後にあることを要求する (L6 §11 の R3) |

### 3.3 合格の条件: 「Refactor なし」宣言 (L6 §5.1 / §5.2)

対象の facts (`fix: a` だけ、refactor なし) に本文を変えて当てる。`parseRefactorNoneDeclaration` の戻り値と、`evaluateRefactorStage` の reasons の両方を見る。

| ID | 本文 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-014` | `Refactor なし (既存関数の分岐だけ)` | `valid`、ok | 宣言の受理を削除する |
| `CANDIDATE-U-REFACTORGATE-015` | `Refactorなし（既存helperの契約適合だけ）。PLANless trace…` (#1250 の形) | `valid` | 空白 0 個 / 全角括弧 / 閉じ括弧の後ろの文を受理しない |
| `CANDIDATE-U-REFACTORGATE-016` | `Refactorなし。初回migrationの境界と…` (#1229 の形) と `- Refactor なし: 退役で消すだけ` と `* Refactor　なし：x` (別ケース) | 各ケース `valid` | `。` / `:` / `：` 区切り、箇条書き記号、全角空白のどれかを受理しない |
| `CANDIDATE-U-REFACTORGATE-017` | `Refactor なし ()` / `Refactor なし（　）` / `Refactorなし。` / `Refactor なし` / `Refactor なし (理由)` / `Refactor なし (x` (別ケース) | 各ケース `empty`、`refactor_none_reason_empty` | trim の前に空判定する / 全角空白を trim しない / `理由` の除外を削除する / 閉じ括弧なしを有効にする |
| `CANDIDATE-U-REFACTORGATE-018` | `- worker_model=… Refactorなし（7行の分岐だけ）` (#1245 の形) と `独立 Refactor はありません。` (#1106 の形) (別ケース) | 各ケース `absent`、`refactor_stage_missing` | 行頭の anchor を外す / 部分一致で判定する |
| `CANDIDATE-U-REFACTORGATE-019` | fenced code block (```` ``` ```` と `~~~` の 2 ケース) の中にだけ `Refactor なし (x)` | `absent` | fenced code block の除外を削除する |
| `CANDIDATE-U-REFACTORGATE-020` | `> Refactor なし (x)` と `<!-- Refactor なし (x) -->` (別ケース) | 各ケース `absent` | 行頭の判定で `>` や `<!--` を読み飛ばす |
| `CANDIDATE-U-REFACTORGATE-021` | 1 行目 `Refactor なし ()`、2 行目 `Refactor なし (構造変更の余地なし)` | `valid`、ok | 最初の宣言行だけを見る |
| `CANDIDATE-U-REFACTORGATE-022` | `refactor: b` があり、本文に `Refactor なし ()` | ok (reason なし) | (R) と (N) を AND にする / empty の宣言を (R) より優先して deny する |

### 3.4 Refactor commit のテスト資産差分 (L6 §6)

対象の facts (`fix: a` → `refactor: b`) の `refactor: b` の `files` を変えて当てる。`<sha>` は `refactor: b` の 40 桁 sha。

| ID | `refactor: b` の files | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-023` | `tests/x.test.ts` の `modified` (changes 3) | `refactor_commit_changes_test_asset:<sha>:tests/x.test.ts` | §6 の検査を削除する |
| `CANDIDATE-U-REFACTORGATE-024` | `tests/a.test.ts` → `tests/b.test.ts` の `renamed` (changes 0) | ok | `renamed` を一律違反にする |
| `CANDIDATE-U-REFACTORGATE-025` | `tests/a.test.ts` → `tests/b.test.ts` の `renamed` (changes 2) | `…:tests/b.test.ts` | rename の許可で `changes` を見ない |
| `CANDIDATE-U-REFACTORGATE-026` | `tests/a.test.ts` → `src/a.ts` の `renamed` (changes 0) | `…:tests/a.test.ts` (previousFilename で報告) | rename の両側を見ない (新 path だけ見る) |
| `CANDIDATE-U-REFACTORGATE-027` | `docs/test-design/harness/x.md` の `modified` と、`tests/new.test.ts` の `added` (別ケース) | 各ケース 1 トークン | `docs/test-design/` を保護先頭から外す / `added` を違反にしない |
| `CANDIDATE-U-REFACTORGATE-028` | `tests/x.test.ts` の `modified`、本文に有効な `Refactor なし (x)` | `refactor_commit_changes_test_asset:…` が残る | 宣言が valid なら early return する |
| `CANDIDATE-U-REFACTORGATE-029` | 2 つの refactor commit がそれぞれ `tests/y.test.ts` と `tests/x.test.ts` を `modified` | 2 トークン、昇順、重複なし | 最初の違反で止める / 並べ替えない |

### 3.5 fail-close と adapter (L6 §3 / §8)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-030` | fake の `execFileSync` が `HTTP 502` で throw | `runPrMerge` が deny、reason に `refactor_facts_unavailable:gh_failed:HTTP 502`、merge port 0 回 | adapter の例外を握りつぶして対象外にする |
| `CANDIDATE-U-REFACTORGATE-031` | commits の応答が配列でない / commit の `parents` が文字列 (別ケース) | `refactor_facts_unavailable:invalid_response` | 型検査を削除する |
| `CANDIDATE-U-REFACTORGATE-032` | commits が 250 件 / files が 3000 件 / refactor commit の files が 3000 件 (別ケース) | `commit_list_truncated` / `file_list_truncated` / `commit_files_truncated:<sha>` | 上限の検査を削除する / 境界を `>` にする (249 / 2999 件では出ないことも確かめる) |
| `CANDIDATE-U-REFACTORGATE-033` | tip が 2 つ / tip が `headSha` と違う (別ケース) | `refactor_facts_unavailable:head_not_tip` | tip の検査を削除する / 一覧に `headSha` が含まれるかだけを見る |
| `CANDIDATE-U-REFACTORGATE-034` | 対象外の PR (docs だけ) と、対象の PR の `fix:` commit | `commits/{sha}` の呼び出しは対象の PR の merge でない refactor commit だけ (対象外では 0 回、`fix:` には 0 回) | 全 commit の files を読む |
| `CANDIDATE-U-REFACTORGATE-035` | pulls の `body` が `null` | `""` として扱い、宣言は `absent` | null を throw にする / `"null"` 文字列にする |

### 3.6 `runPrMerge` への組み込み (L6 §9)

| ID | 入力 | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-036` | review は `merge_ready`、本 gate は `refactor_stage_missing` | DENY、merge port 0 回、`merge_intent` receipt なし、`merge_result` receipt の reason = `refactor_stage_missing` | 本 gate の結果を merge の判定に使わない |
| `CANDIDATE-U-REFACTORGATE-037` | review は deny (`verdict_missing` など)、本 gate も deny | reason = 両方のトークンの和集合、昇順、`,` 区切り | review が deny のとき本 gate を呼ばない / 片方だけ出す |
| `CANDIDATE-U-REFACTORGATE-038` | review は `merge_ready`、本 gate は対象外 | MERGED (既存 `U-RVMG-001` と同じ receipt) | 対象外を deny にする |
| `CANDIDATE-U-REFACTORGATE-039` | `getPullRequest` が throw | 既存どおり `gh_fetch_failed:*`、`getRefactorStageFacts` 0 回 | `getPullRequest` 失敗の後に本 gate を呼ぶ |
| `CANDIDATE-U-REFACTORGATE-040` | `getRefactorStageFacts` に渡る `headSha` | `facts.evaluatedHeadSha` と一致 | 第一観測の `headSha` を渡す |
| `CANDIDATE-U-REFACTORGATE-041` | CLI (`registerPrMergeCommands`) を fake port で実行、本 gate が `refactor_stage_missing` | 標準出力が `pr merge — DENY pr=#<n> head=<sha> reason=refactor_stage_missing`、exit code 1 | 出力形式を変える |

### 3.7 実在 PR の再生 (L6 §12)

2026-10-23 の facts を固定した fixture を `evaluateRefactorStage` (fixture の facts は §8 の検査を通る) に当てる。

| ID | PR | 期待 | 落とす mutation |
|---|---|---|---|
| `CANDIDATE-U-REFACTORGATE-042` | #1250 | `target: false`、ok | R1 (commit type だけで対象判定) |
| `CANDIDATE-U-REFACTORGATE-043` | #1245 | `target: true`、`refactor_stage_missing` | 行頭 anchor の削除 |
| `CANDIDATE-U-REFACTORGATE-044` | #1241 と #1229 | 各 `target: true`、ok | `。` 区切りの受理の削除 / 空白 0 個の受理の削除 |
| `CANDIDATE-U-REFACTORGATE-045` | #1106 | `target: true`、`refactor_stage_missing` | 部分一致での宣言判定 |
| `CANDIDATE-U-REFACTORGATE-046` | #1270 | `target: false`、ok | (G) の削除 (R2) と §6 の全 PR 適用の組み合わせ |
| `CANDIDATE-U-REFACTORGATE-047` | #1236 | `target: false`、ok | path 条件の削除 |

## 4. 既存 oracle との関係

既存の `U-RVMG-*` (`docs/test-design/harness/L7-unit-test-design.md` の review merge gate の節) は変えない。`runPrMerge` の fake port に `getRefactorStageFacts` を足す必要があるため、既存テストの fixture は「対象外の facts」を返す既定の fake を持つ。これは fixture の追加であって oracle の改訂ではない (既存行の期待は変わらない)。
