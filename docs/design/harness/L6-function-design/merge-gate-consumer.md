---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_merge_gate_consumer
pair_artifact: docs/test-design/harness/L7-merge-gate-consumer-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-04
issue: 1526
---

# merge gate の consumer 対応 - 機能設計 (Issue #1526)

check run の選択規則 (同じ check の古い run の扱い) は `merge-gate-check-run-selection.md` §4、baseline を持つ gate の並行 PR 競合は同 §6 が正本である。本書はそれらを変えず、consumer 向けの追加規則だけを定める。

## §0 Scope (範囲)

## §1 事象

consumer の実運用で、`ut-tdd pr merge` を使えず自作の merge script に流れる事例を観測した。原因のうち、本節は 4 件を扱う。(a) CI の状態が green か否かの 1 ビットで、拒否の理由が区別できない (`PrObservation.checksGreen: boolean`)。(b) ラベル駆動の CI で rollup が空、または `SKIPPED` が混じると常に拒否される。(c) draft と競合 (`CONFLICTING`) を gate が見ず、最後の `gh pr merge` が失敗して初めて分かる。(d) baseline conflict の判定が `origin/main` 固定で、既定ブランチ名が違うと `baseline_conflict_unknown` になり、baseline の対象を持たない repo でも判定が走る。

非目標: GUI lane の review を custody へ封印する経路 (#907)。単一 family 環境の扱い (別に判断する)。branch protection の設定。review verdict、exact HEAD 束縛、第二観測、check-run-selection §4 の check run 選択規則は変えない。

## §2 CI 状態の enum (D-A)

`evaluateChecksGreen(rollup) => boolean` を `evaluateCiState(rollup, requiredChecks?) => CiState` に置き換える。`CiState = "green" | "failed" | "pending" | "not_run" | "skipped"`。`PrObservation.checksGreen` は `ciState: CiState` になり、`merge_ready` の条件は `ciState === "green"` である。

| 状態 | 条件 (対象エントリは check-run-selection §4 post-2 で最新 run だけが残った後のもの) | deny reason |
|---|---|---|
| `not_run` | 対象エントリが 0 件 (空の rollup を含む) | `ci_not_run` |
| `failed` | 対象に `conclusion` が `FAILURE` / `ERROR` / `CANCELLED` / `TIMED_OUT` / `ACTION_REQUIRED` / `STARTUP_FAILURE`、または他の行に無い値のものがある。object でないエントリと、check-run-selection §4 post-3 / post-4 で順序を決められない重複もここに含める (従来の fail-close を保つ) | `ci_failed` |
| `pending` | failed が無く、`conclusion` が空・欠落のものがある | `ci_pending` |
| `skipped` | failed / pending が無く、`SKIPPED` または `NEUTRAL` がある | `ci_skipped` |
| `green` | 対象の全件が `SUCCESS` | (なし) |

判定は `conclusion` だけで行い、`status` は読まない。現行の `evaluateChecksGreen` も `status` を見ず、`conclusion` が `SUCCESS` なら `status` が `IN_PROGRESS` でも欠落でも green にするため、green になる入力の集合を現行と同一に保つ (GitHub は完了前の run の `conclusion` を空で返すので、未完了は pending 行で捕まる)。

優先順は `failed` > `pending` > `skipped` > `green`。複数に当たるときは最も強い 1 つを返す。`green` 以外はすべて deny で、reason は上表の 1 つを `state:<dispatch state>` に並べて出す。skipped を pass として扱わない。

## §3 必須 check の設定 (D-B)

consumer が任意で置く設定ファイルは `ut-tdd.merge-gate.json` (repo root、tracked) とする。`ut-tdd.project.json` は key が 2 個ちょうどの strict v1 decoder (`src/kernel/project-identity.ts`) が読むため、key を足せない (`team-multi-pc-multi-repo.md` と同じ理由)。形は次の 1 key だけにする。

```json
{ "requiredChecks": ["build", "test"] }
```

- ファイルが無い: §2 を全エントリに適用する。green / deny の結論は現行と同一で、本体 repo (このファイルを持たない) は変わらない。
- ファイルがある: `requiredChecks` の名前ごとに、check 名 (`name`、StatusContext は `context`。`workflowName` は見ない) が一致するエントリが rollup にあるかを確かめる。1 つでも一致するエントリが無い名前があれば `not_run` で deny する (他の名前が green でも同じ。一部の欠落を無視しない)。全名前にエントリがあるときは、一致したエントリだけを §2 の対象にする。どの名前にも一致しないエントリと名前の無いエントリは無視する。最新 run が `SKIPPED` なら `skipped` (deny)。同名の重複には check-run-selection §4 の規則をそのまま使う。
- ファイルがあるが、JSON として読めない・`requiredChecks` が空配列または空でない string の配列でない・他の key がある、のいずれか: `merge_gate_config_invalid` で deny する (fail-close。設定を無視して緩めない)。
- 読む場所は、既定ブランチの remote の先端である。PR のブランチからも、実行する checkout の作業ツリーからも、fetch 前の古い `origin/<既定ブランチ>` からも読まない。PR が自分で required を緩められないようにし、手元の checkout が古いことにも左右されないようにするためである。`git show` は remote の先端を取りに行かないので、読む前に必ず fetch する。手順は次の順とする。
  1. 既定ブランチ名を §5 と同じく `gh repo view --json defaultBranchRef` で取り、`git check-ref-format --branch` で検査する。
  2. `git fetch origin +refs/heads/<既定ブランチ>:refs/remotes/origin/<既定ブランチ>` を実行する (§5 の fetch と同じ refspec。同じ実行内で 1 回に兼ねてよい)。
  3. `git ls-tree --name-only origin/<既定ブランチ> -- ut-tdd.merge-gate.json` で有無を確かめる。exit 0 で出力が空なら「ファイルが無い」(設定なし) とする。
  4. 出力に名前があれば `git show origin/<既定ブランチ>:ut-tdd.merge-gate.json` で読む。
- 1〜4 のどれかが失敗した (gh / git が非 0 で終わる、名前が取れない・不正) ときは `merge_gate_config_invalid` で deny する (fail-close)。取得の失敗を「設定なし」として扱わない。「設定なし」になるのは 3 で不存在を確かめたときだけである。reader は注入可能にし、テストは実 repo を読まない。

## §4 draft と競合 (D-C)

`readGhView` の `--json` に `isDraft,mergeable` を足す (呼び出し回数は変えない。第二観測の view も同じ項目を持つ)。`PrObservation` と `MergeGateFacts` に `isDraft: boolean` と `mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN"` を持たせる。欠落・未知の値は応答不正として従来の `gh PR facts invalid` にする。

| 観測 | deny reason |
|---|---|
| `isDraft === true` | `draft` |
| `mergeable === "CONFLICTING"` | `conflicting` |
| `mergeable === "UNKNOWN"` | `mergeable_unknown` (GitHub の計算待ち。再試行すれば通りうる。通さない) |

これらは review の判定とは独立に評価し、他の deny reason と並べて出す。

## §5 baseline conflict の既定ブランチと適用外 (D-D)

- 既定ブランチは `gh repo view --json defaultBranchRef` の `defaultBranchRef.name` から取る (remote は `origin` 固定)。`+refs/heads/<name>:refs/remotes/origin/<name>` を fetch し、merge-base と差分の比較先も `origin/<name>` にする。`gh` の失敗、名前が取れない、`git check-ref-format --branch` に通らない名前は `baseline_conflict_unknown` で deny する (従来の fail-close)。
- gate のうち `baselinePath` のファイルが checkout に存在するものだけを判定する。1 つも無いときは判定を行わず、結果に `baseline: "not_applicable"` を出す。pass (競合なしの確認) とは区別し、「競合なし」と書かない。
- 本体 repo は doc-split と code-size の baseline を両方持ち、既定ブランチは `main` なので、対象 gate・比較先・fetch refspec は現行と同一になり挙動は変わらない (check-run-selection §6 の規則はそのまま)。

## §6 oracle 対応

`CANDIDATE-U-MGCONS-001`〜`014` を `docs/test-design/harness/L7-merge-gate-consumer-test-design.md` に置く。fixture は注入した gh / git の reader だけを使い、実ネットワークと実 repo は読まない。
