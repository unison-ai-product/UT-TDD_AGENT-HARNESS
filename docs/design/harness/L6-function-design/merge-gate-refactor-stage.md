---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_merge_gate_refactor_stage
pair_artifact: docs/test-design/harness/L7-merge-gate-refactor-stage-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-10-23
issue: 1300
---

> **L6 contract marker**: `evaluateRefactorStage(facts: RefactorStageFacts) => RefactorStageDecision` と `parseRefactorNoneDeclaration(body: string) => RefactorNoneDeclaration` は unit-test 粒度の contract である。DbC は §10 にまとめる。oracle の詳細 (CANDIDATE-U-REFACTORGATE-001〜) は `docs/test-design/harness/L7-merge-gate-refactor-stage-test-design.md` が固定する。本書は契約だけであり、実装は Codex lane の実装チケット (Red → 昇格 → Green → Refactor) で別に入れる。

# merge gate の Refactor 工程確認 - 機能設計 (Issue #1300)

## 1. 目的と範囲

root `CLAUDE.md` §PR スコープ規律 5 は、実装 PR の commit を Green (`feat:` / `fix:`) → Refactor (`refactor:`) の順にし、直す余地が無ければ PR 本文に「Refactor なし (理由)」を書くことを求めている。規則だけでは守られないため (#968、#1300)、`ut-tdd pr merge` が merge の前にこれを確かめる。

対象は `src/cli/pr-merge.ts` → `runPrMerge` (`src/feedback/review-merge-gate.ts`) の経路である。既存の review gate (`evaluateMergeGate`、exact HEAD 束縛、第二観測、check run 選択 `merge-gate-check-run-selection.md`) の規則は変えない。本書の gate は、それと並ぶ 2 つ目の判定として足す。

範囲外:

- 遡及はしない。gate は `ut-tdd pr merge` を通る PR だけを判定し、merge 済みの PR の履歴は走査しない。merge 済みの PR は Refactor チケット (#1296 / #1297 / #1298) で個別に扱う。
- commit の順序 (Refactor が最後の Green より後にあるか) は機械で見ない (§11 の案 R3)。非著者 reviewer が見る。
- commit type の付け間違い (Green の commit を `chore:` で出すなど) は gate の外であり、review の FINDING として扱う (§11 の案 R1 と §4 の理由)。

## 2. 実測 (2026-10-23、GitHub REST の pulls / commits / files)

| PR | 変更 path に `src/` / `scripts/` | merge でない commit の type | `refactor:` | PR 本文の記載 (行頭) |
|---|---|---|---|---|
| #1250 | なし (`tests/` 1 件だけ) | fix ×3 | 0 | `Refactorなし（既存helperの契約適合だけ）。…` |
| #1245 | あり | test, fix, style | 0 | 行頭には無い (`- worker_model=… Refactorなし（…）` の行の途中) |
| #1241 | あり | fix ×2 | 0 | `Refactorなし。契約で指定された3つの判定面と…` |
| #1229 | あり | test ×2, fix | 0 | `Refactorなし。初回migrationの境界と…` |
| #1106 | あり | feat, fix ×6, style, test | 0 | `独立 Refactor はありません。…` (形が違う) |
| #1270 | あり | refactor ×2 | 2 | なし |
| #1236 | なし (docs だけ) | docs | 0 | なし |

Issue #1300 の背景は #1241 / #1229 / #1250 を「記載なし」としていたが、実際には空白なしの `Refactorなし` で書かれていた。§5 の受理形はこの実態に合わせる。merge commit (親 2 つ) は #1241 / #1229 / #1106 / #1250 / #1270 に含まれ、その subject はすべて `chore:` である。

## 3. 判定の入力 (facts) と取得

```ts
interface RefactorStageFacts {
  pr: number;
  headSha: string;                 // review gate が評価した evaluatedHeadSha
  body: string;                    // PR 本文。null は "" とする
  changedPaths: string[];          // PR の変更ファイルの filename と previous_filename (rename 元) の和
  commits: Array<{
    sha: string;
    parents: string[];
    subject: string;               // commit message の 1 行目
    files?: Array<{ filename: string; previousFilename?: string; status: string; changes: number }>;
  }>;
}
```

adapter (`GhPrMergePorts.getRefactorStageFacts(pr, headSha)`) は `gh api` で次を読む。

| 項目 | 取得元 | 上限と扱い |
|---|---|---|
| `body` | `GET /repos/{owner}/{repo}/pulls/{pr}` の `body` | — |
| `commits` | `GET /repos/{owner}/{repo}/pulls/{pr}/commits` (`--paginate`) | GitHub は 250 件で打ち切る。250 件以上なら `commit_list_truncated` |
| `changedPaths` | `GET /repos/{owner}/{repo}/pulls/{pr}/files` (`--paginate`) | GitHub は 3000 件で打ち切る。3000 件以上なら `file_list_truncated` |
| `commits[].files` | `GET /repos/{owner}/{repo}/commits/{sha}` (`--paginate`)。**対象 PR (§4) の、merge でない `refactor` commit についてだけ**読む | 3000 件以上なら `commit_files_truncated:<sha>` |

`files` を読む commit を refactor に限るのは、API の呼び出しを Refactor commit の数に抑えるためである。adapter は、対象かどうかの判定 (§4) を pure 関数と同じ規則で先に行い、対象でなければ `files` を読まない。

## 4. 対象 (実装 PR) の判定

次の 2 つを**両方**満たす PR を対象とする。対象でない PR は、この gate では何も言わない (reason を足さない)。

- (P) 変更 path: `changedPaths` のどれかが `src/` か `scripts/` で始まる。rename 元 (`previous_filename`) も数える。
- (G) Green の commit: merge でない commit (親が 1 つ以下) のうち 1 つ以上の type が `feat` か `fix` である。

commit type は subject の 1 行目に `^([a-z]+)(\([^()\r\n]*\))?!?: \S` を当てた 1 番目のグループとする (大文字・小文字を区別する。`Refactor:` や `refactoring:` は refactor ではない)。当たらない subject は type なしとする。merge commit (親 2 つ以上) は、subject が何であっても type を数えない。

(P) と (G) の両方を要る理由:

- (P) は #968 の実測と設計書保護 gate §10.2 の「実装 PR = src/ か scripts/ を含む PR」と同じ線引きである。docs だけの PR (#1236) と、`tests/` だけの `fix:` (#1250) を外す。`tests/` だけの修理では、Refactor commit が `tests/` を変えられない (§6) ので、Refactor の段がそもそも無い。
- (G) は、Green を持たない PR を外す。Red の PR (`test:`。§10.3 の「登録 + Red」は src/ に登録行を含む) と、退役・構造変更の PR (#1270 のように `refactor:` が主) は、それ自体が Green の段ではないので、Refactor の段を求めない。退役の PR は Refactor commit で `tests/` を消すのが正当であり (#1270 の `58dbdbab1` は `tests/` を 2 件削除・1 件変更)、§6 を当てると誤って止まる。

## 5. 合格の条件と「Refactor なし」の形

対象の PR は、次のどちらかを満たせば合格とする。

- (R) merge でない commit のうち 1 つ以上の type が `refactor` である。
- (N) PR 本文に有効な「Refactor なし」宣言が 1 行以上ある。

(R) と (N) の両方があっても合格とする (矛盾として扱わない)。どちらを満たしても、§6 の違反があれば不合格である (宣言で Refactor commit の違反は消えない)。

### 5.1 宣言の形

書く形の正本は次の 1 行である。

```text
Refactor なし (理由)
```

`parseRefactorNoneDeclaration(body)` は、本文を行に分け、次の規則で各行を読む。

1. ` ``` ` か `~~~` で始まる行で囲まれた範囲 (fenced code block) の行は読まない。規則の引用で通らないようにするためである。
2. 行頭の空白と、任意の箇条書き記号 1 つ (`- ` か `* `) を除いたあと、`Refactor` + 空白 0〜1 個 (半角か全角) + `なし` で始まる行を宣言行とする。行の途中の `Refactor なし` は宣言ではない (#1245 の形)。引用 (`> `) や HTML コメント (`<!-- `) で始まる行も宣言ではない。
3. 宣言行の `なし` の後ろ (空白を除く) から理由を取る。
   - `(` か `（` で始まるとき: 最初の `)` か `）` までの中身。閉じ括弧が無ければ理由は空。閉じ括弧の後ろに文が続いてもよい (#1250 の形)。
   - `。` / `:` / `：` で始まるとき: その後ろの行末まで (#1241 / #1229 の形)。
   - それ以外 (行末を含む): 理由は空。
4. 理由の前後の空白 (半角・全角・タブ) を除き、空、または文字列 `理由` (規則文の写しの残り) なら空とする。
5. 理由が空でない宣言行が 1 行でもあれば `valid`。宣言行はあるが全部空なら `empty`。宣言行が無ければ `absent`。

### 5.2 受理例と拒否例

| 本文の行 | 結果 |
|---|---|
| `Refactor なし (既存関数の 7 行の分岐だけで構造追加なし)` | valid |
| `Refactorなし（既存helperの契約適合だけ）。…` | valid |
| `- Refactor なし: 退役で消すだけ` | valid |
| `Refactorなし。初回migrationの境界と…` | valid |
| `Refactor なし ()` / `Refactor なし（　）` / `Refactorなし。` / `Refactor なし` / `Refactor なし (理由)` | empty |
| `- worker_model=… Refactorなし（…）` (行の途中) | absent |
| `独立 Refactor はありません。` | absent |
| fenced code block の中の `Refactor なし (x)` | absent |

## 6. Refactor commit のテスト資産差分 (同じ gate で見る)

対象の PR では、merge でない `refactor` commit のそれぞれについて、`files` のうち `filename` か `previousFilename` が `tests/` か `docs/test-design/` で始まるものを調べる。次のときだけ許し、それ以外は違反とする。

- `status === "renamed"` かつ `changes === 0` かつ `filename` と `previousFilename` の両方が同じ保護先頭 (`tests/` 同士か `docs/test-design/` 同士) で始まる (内容を変えない rename / move だけ)。

`docs/test-design/` を含めるのは、§PR スコープ規律 5 が「テスト設計にも触れない」と書いているためである。同じ gate で見る理由: これを見ないと、Green の commit の type を `refactor:` に書き換えるだけで (R) を満たせてしまう。対象を §4 の (G) を満たす PR に限っているので、退役の PR は止めない。

違反 1 件ごとに `refactor_commit_changes_test_asset:<sha>:<path>` を出す (`<sha>` は 40 桁、`<path>` は `filename`。rename で保護先頭から出たときは `previousFilename`)。

## 7. DENY の reason

既存の出力 `pr merge — DENY pr=#<n> head=<sha> reason=<reasons>` に合わせ、reason は snake_case のトークンを `,` で繋ぐ。本 gate が足すトークンは次の 4 種である。

| トークン | 出す条件 |
|---|---|
| `refactor_stage_missing` | 対象の PR で、(R) が無く、宣言が `absent` |
| `refactor_none_reason_empty` | 対象の PR で、(R) が無く、宣言が `empty` |
| `refactor_commit_changes_test_asset:<sha>:<path>` | §6 の違反 (違反ごとに 1 個) |
| `refactor_facts_unavailable:<detail>` | §8 で facts が確かめられない |

`<detail>` は `gh_failed:<message>` / `invalid_response` / `commit_list_truncated` / `file_list_truncated` / `commit_files_truncated:<sha>` / `head_not_tip` のどれかとする。

例:

```text
pr merge — DENY pr=#1245 head=a0251b246b8275469dd0e8b4c79a82f4a94b5ac0 reason=refactor_stage_missing
pr merge — DENY pr=#2001 head=… reason=refactor_commit_changes_test_asset:<sha>:tests/foo.test.ts
pr merge — DENY pr=#2002 head=… reason=refactor_facts_unavailable:gh_failed:HTTP 502
```

## 8. fail-close

確かめられないときは merge しない (deny)。

- adapter が例外を投げた (gh の失敗、JSON の parse 失敗): `refactor_facts_unavailable:gh_failed:<message>`。
- 応答の型が §3 と合わない (配列でない、`sha` / `parents` / `subject` が文字列でない など): `invalid_response`。
- §3 の件数上限に当たった: `commit_list_truncated` / `file_list_truncated` / `commit_files_truncated:<sha>`。打ち切られた一覧で「Refactor が無い」「tests を変えていない」を言えないためである。
- HEAD 束縛: commit 一覧の中で、一覧の他のどの commit の親でもない commit (tip) がちょうど 1 つで、それが `headSha` (review gate の `evaluatedHeadSha`) と一致しなければ `head_not_tip`。観測の間に push された場合に、古い一覧で判定しないためである。最終的な merge は既存どおり `--match-head-commit` で HEAD に束縛する。
- 対象の判定 (§4) より前に facts が欠けたときも deny とする。「対象かどうか分からない」は対象でない扱いにしない。

PR 本文は HEAD に束縛されない (本文の編集で HEAD は変わらない)。宣言は merge 時点の本文で判定する。本文を直しても再 review は要らない。exact-head review の束縛は commit の内容に対するものだからである。

## 9. `runPrMerge` への組み込み

1. 既存どおり `getPullRequest` で facts を取る。失敗したら既存の `gh_fetch_failed:<message>` で終わる (本 gate は動かさない)。
2. 既存どおり `evaluateMergeGate` で review を判定する。
3. review の結果に関わらず、`getRefactorStageFacts(pr, facts.evaluatedHeadSha)` を呼び、`evaluateRefactorStage` で判定する。adapter の例外は §8 のトークンに変える。両方を流すのは、1 回の `pr merge` で直すべきことを全部見せるためである。
4. どちらかが deny なら、reason = 両方のトークンの和集合を重複除去・昇順に並べて `,` で繋いだもの。merge port は呼ばず、`merge_intent` receipt は書かない。`merge_result` receipt (`decision: "deny"`) に reason を記録する (既存の記録経路のまま)。
5. 両方が ok のときだけ、既存どおり `merge_intent` receipt → merge → `merge_result` receipt に進む。

## 10. DbC

| 関数 | 区分 | 内容 |
|---|---|---|
| `parseRefactorNoneDeclaration(body)` | pre | `body` は文字列 (adapter が null を `""` にする)。 |
| | post | §5.1 の規則で `"valid" \| "empty" \| "absent"` を返す。行の途中・fenced code block の中・引用の宣言は数えない。理由は trim 後に空でなく `理由` でもないときだけ有効。 |
| | invariant | 純粋関数 (I/O なし)。行の順序で結果が変わらない (有効な行が 1 つでもあれば valid)。 |
| `evaluateRefactorStage(facts)` | pre | facts は §3 の型を満たし、§8 の HEAD 束縛と件数上限の検査を通っている (adapter が保証。通らなければ adapter が throw し、`runPrMerge` が `refactor_facts_unavailable:*` にする)。対象の PR の merge でない `refactor` commit には `files` がある。 |
| | post-1 | §4 の (P) と (G) を両方満たさなければ `{ target: false, ok: true, reasons: [] }`。 |
| | post-2 | 対象で、(R) も (N=valid) も無ければ `ok: false`、reasons に `refactor_stage_missing` (宣言が absent) か `refactor_none_reason_empty` (宣言が empty) のどちらか 1 つ。 |
| | post-3 | 対象で、§6 の違反があれば `ok: false`、違反ごとに `refactor_commit_changes_test_asset:<sha>:<path>`。(N) があっても消えない。 |
| | post-4 | 対象で post-2 と post-3 のどちらにも当たらなければ `{ target: true, ok: true, reasons: [] }`。 |
| | invariant | merge commit は type も `files` も数えない。reasons は重複なしの昇順。純粋関数。review gate の入力 (requests / receipts) を読まない。 |
| `runPrMerge` (変更分) | post | review gate と本 gate の両方が ok のときだけ merge port を呼ぶ。どちらかが deny なら reason は両方のトークンの和集合 (昇順)。`getRefactorStageFacts` の例外・型不一致・上限・HEAD 不一致はすべて deny。 |
| | invariant | 既存の review gate の判定と reason (U-RVMG-*) は変えない。`getPullRequest` 失敗時の挙動 (`gh_fetch_failed:*`) も変えない。 |

## 11. 採らなかった案

| 案 | 内容 | 採らない理由 |
|---|---|---|
| R1 | 対象を commit type だけ (`feat:` / `fix:` があれば実装 PR) で決める | docs や `tests/` だけの `fix:` (#1250) を止める。`tests/` だけの修理には Refactor の段が無い |
| R2 | 対象を path だけ (`src/` / `scripts/` を含めば実装 PR) で決める | §10.3 の「登録 + Red」(src/ に登録行) と退役の PR (#1270) を止めるか、§6 を退役の PR だけ外す特例が要る。commit type を付け間違えて (G) を外す抜け道は残るが、それは review が commit 順と一緒に見る |
| R3 | Refactor commit が最後の Green commit より後にあることを見る | FLAG 後の是正 commit (`fix:`) は Refactor の後に積まれるのが正規の手順である (§FLAG 後の限定是正と merge)。見ると正当な PR を止める |
| R4 | 宣言の形を `Refactor なし (理由)` の 1 形だけにする | 実在の記載 (#1241 / #1229 / #1250) が `Refactorなし。…` / `Refactorなし（…）` で、運用中の PR を止める。行頭に限ることで、規則の引用での通過は防げる |
| R5 | `tests/` の差分を見ない | Green の commit の type を `refactor:` に書き換えるだけで (R) を満たせる |

## 12. 実在 PR に当てたときの期待判定 (本 gate だけ、2026-10-23 の facts)

| PR | 対象 (P / G) | (R) | 宣言 | 本 gate の判定 |
|---|---|---|---|---|
| #1250 | 対象外 (P なし / G あり) | 0 | valid | 通す (reason なし) |
| #1245 | 対象 | 0 | absent (行の途中) | DENY `refactor_stage_missing` |
| #1241 | 対象 | 0 | valid (`Refactorなし。…`) | 通す |
| #1229 | 対象 | 0 | valid (`Refactorなし。…`) | 通す |
| #1106 | 対象 | 0 | absent (`独立 Refactor はありません。`) | DENY `refactor_stage_missing` |
| #1270 | 対象外 (P あり / G なし) | 2 | absent | 通す (§6 も当てない) |
| #1236 | 対象外 (P なし / G なし) | 0 | absent | 通す |

いずれの PR も、commit 一覧の tip は 1 つで head と一致した (`head_not_tip` にならない)。#1245 と #1106 は、本文の宣言を行頭に書き直せば (または `Refactor なし (理由)` の形に直せば) 通る。

## 13. 関数 signature (実装が置く場所)

新しい source module `src/feedback/refactor-stage-gate.ts` に置く。

```ts
export type RefactorNoneDeclaration = "valid" | "empty" | "absent";
export function parseRefactorNoneDeclaration(body: string): RefactorNoneDeclaration;

export interface RefactorStageDecision { target: boolean; ok: boolean; reasons: string[] }
export function evaluateRefactorStage(facts: RefactorStageFacts): RefactorStageDecision;
```

`GhPrMergePorts` (`src/feedback/review-merge-gate.ts`) に `getRefactorStageFacts: (pr: number, headSha: string) => RefactorStageFacts` を足し、`createGhPrMergePorts` が §3 の gh 呼び出しと §8 の検査を行う。`runPrMerge` は §9 の順に呼ぶ。

## 14. oracle 対応

`CANDIDATE-U-REFACTORGATE-001`〜 を `docs/test-design/harness/L7-merge-gate-refactor-stage-test-design.md` に置く。実テストは `tests/refactor-stage-gate.test.ts` (純粋関数と adapter) と `tests/review-merge-gate.test.ts` (`runPrMerge` への組み込み) に置く。
