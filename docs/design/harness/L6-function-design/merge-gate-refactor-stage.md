---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_merge_gate_refactor_stage
pair_artifact: docs/test-design/harness/L7-merge-gate-refactor-stage-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-10-23
issue: 1300
---

> **L6 contract marker**: `extractVerdict(logText: string) => Outcome<VerdictExtraction>` (`refactorJudgement` を足す)、`evaluateRefactorJudgementGate(changes: PlanChange[], entries: ReviewDispatchEntry[]) => RefactorJudgementGateDecision`、`readPullRequestChanges(pr: number, runGh: ExecFileSync) => PlanChange[]` は unit-test 粒度の contract である。DbC は §10 にまとめる。oracle は `docs/test-design/harness/L7-merge-gate-refactor-stage-test-design.md` の `CANDIDATE-U-REFACTORGATE-048`〜`078` が固定する (正式 ID `U-REFACTORGATE-*` への昇格は設計書保護 gate の順序で入れる)。本書は契約だけであり、実装は Codex lane の実装チケット (Red → 昇格 → Green → Refactor) で別に入れる。

# merge gate の Refactor 判定欄 - 機能設計 (Issue #1300)

## 1. 目的と範囲

root `CLAUDE.md` §PR スコープ規律 5 は、実装 PR の commit を Green (`feat:` / `fix:`) → Refactor (`refactor:`) の順にし、直す余地が無ければ PR 本文に「Refactor なし (理由)」を書くことを求めている。規則だけでは守られないため (#968、#1300)、`ut-tdd pr merge` が merge の前に確かめる。

**gate が見るのは作者の宣言ではなく、非著者 reviewer の verdict に Refactor 判定の欄があるかである。** Refactor が要るか、「なし」の理由が成り立つかは判断であって機械では決められない。そこで判断は非著者 reviewer に置き、gate は「判断した記録が exact HEAD の verdict にあり、その値が合格の値か」だけを見る。

対象の経路は `src/cli/pr-merge.ts` → `runPrMerge` (`src/feedback/review-merge-gate.ts`) と、verdict を receipt にする `projectReviewVerdict` (`src/feedback/review-attestation.ts`) → `extractVerdict` (`src/feedback/review-verdict-contract.ts`) である。既存の review gate (`evaluateMergeGate`、exact HEAD 束縛、第二観測、check run 選択 `merge-gate-check-run-selection.md`) の判定と reason (`U-RVMG-*`) は変えない。

範囲外:

- **PR をまたぐ重複**: この gate は 1 PR の中の Refactor 工程だけを扱う。複数の PR に分かれて積もった重複や、既存コードとの重複は、計測で発火する Refactor チケット (ラベル `refactor`、#1304 / #1310 の計測) に回す。
- **遡及**: gate は `ut-tdd pr merge` を通る PR だけを判定する。merge 済みの PR は Refactor チケット (#1296 / #1297 / #1298) で個別に扱う。
- **PR 本文と commit の機械読取**: gate は PR 本文の「Refactor なし」宣言も、commit の type も、Refactor commit の `tests/` 差分も読まない。これらは reviewer が見て、結果を判定欄に書く (§3)。
- **commit の順序**: Refactor が最後の Green より後にあるかは reviewer が見る。FLAG 後の是正 commit (`fix:`) は Refactor の後に積まれるのが正規の手順である (§FLAG 後の限定是正と merge) ため、機械では見ない。

## 2. 実測 (2026-10-23)

直近の実装 PR 7 本 (#1250 / #1245 / #1241 / #1229 / #1106 / #1173 / #1102) は、どれも PR 本文に「Refactor なし」に当たる記載を持っていたが、`refactor:` の commit を持つものは 0 本だった。「なし」は作者の自己申告だけであり、非著者がそれを確かめた記録は 0 件だった。#1301 / #1302 では control (非著者) が事後に点検し、理由は成り立っていた。

記載の形もそろっていなかった。#1245 は行の途中 (`- worker_model=… Refactorなし（…）`)、#1106 は `独立 Refactor はありません。`、#1241 / #1229 は空白なしの `Refactorなし。…` だった。本文の書式を gate が parse する案 (§11 の案 A) は、この揺れに合わせて受理形を広げ続けることになり、しかも宣言の真偽は誰も見ないままになる。

足りないのは書式の検査ではなく、非著者が判断した記録である。

## 3. Refactor 判定欄の形 (verdict file)

reviewer は verdict file の `VERDICT:` 行より後に、行頭の `REFACTOR:` 行を 1 件書く。値は次の 5 種の ASCII token のどれか 1 つである (`docs/governance/coding-rules.md` §機械 surface の言語)。

| 値 | 意味 | merge gate |
|---|---|---|
| `commit-ok` | Refactor commit (`refactor:`) があり、各 Refactor commit が `tests/` と `docs/test-design/` の内容を変えていない (内容を変えない rename だけ) ことを確かめた | 合格 |
| `none-ok` | Refactor commit は無く、PR 本文の「Refactor なし (理由)」が `coding-rules.md` §量・分割・Refactor の目安 の「Refactor なし」でよい条件を満たすと認めた | 合格 |
| `not-applicable` | Refactor の段が適用されない。実装 PR では Green の commit (`feat:` / `fix:`) を持たない PR (登録 + Red、退役や構造変更が主の PR) に限る。実装 PR でない PR では常にこの値を書く | 合格 |
| `commit-tests-changed` | Refactor commit があるが、`tests/` か `docs/test-design/` の内容を変えている | 不合格 |
| `none-rejected` | Refactor commit が無く、「Refactor なし」の宣言が無いか、条件を満たさない | 不合格 |

例 (PASS):

```text
VERDICT: PASS
REFACTOR: none-ok
```

例 (FLAG。不合格の値を書いたときは、理由を `FINDING:` に書く):

```text
VERDICT: FLAG
FINDING: Green で足した parseX が 96 行あり coding-rules の関数行数の上限 80 を超えるのに Refactor commit が無い
REFACTOR: none-rejected
```

### 3.1 抽出の規則 (`extractVerdict`)

1. 候補は、最後の `VERDICT:` 行より後の行で、行頭が `REFACTOR:` の行だけとする (`FINDING:` と同じ扱い)。`VERDICT:` 行より前の行と、字下げされた行は候補にしない。委譲した task text が log に行頭のまま echo される問題 (`EXAMPLE_INDENT` の注記) を同じ方法で避けるためである。
2. 値は `REFACTOR:` の後ろを trim したものとする。大文字・小文字を区別する。
3. 候補が 0 件なら `refactorJudgement` を持たない (verdict は従来どおり受理する。対象でない PR に欄を強制しないため)。
4. 候補の値が §3 の 5 種のどれでもなければ `refactor_judgement_unknown` で失敗する。
5. 候補の値が 2 種以上なら `refactor_judgement_ambiguous` で失敗する。同じ値の再掲は 1 件として扱う。
6. 4 と 5 の失敗は、既存の `extractVerdict` の失敗と同じ経路 (`projectReviewVerdict` の `rejectedVerdict`) で verdict を拒否する。receipt は書かれない。

`VERDICT` と `REFACTOR` の組み合わせ (PASS に `none-rejected` など) は抽出では拒否しない。gate が不合格の値を拒否するので、PASS に不合格の値を付けても merge されない (§6)。

### 3.2 reviewer への指示 (`reviewOutputContract`)

`reviewOutputContract` が返す出力契約に、次の指示を足す。模範出力ブロック (`EXAMPLE_START`〜`EXAMPLE_END`) は変えない (U-RVCON-017 / 019 の round-trip を保つ)。

- `VERDICT:` 行の後に、行頭の `REFACTOR:` 行を 1 件出力する。値は §3 の 5 種だけ。
- `src/` か `scripts/` を変える PR では、Refactor commit の有無、「なし」の理由を認めるか、Refactor commit の `tests/` と `docs/test-design/` の内容差分が 0 か、を確かめてから値を選ぶ。それ以外の PR では `not-applicable` を書く。
- 「なし」を認める条件は `docs/governance/coding-rules.md` §量・分割・Refactor の目安 の「Refactor なし」でよい条件と判定者 に従う。

## 4. receipt と dispatch entry への写し

- `VerdictExtraction` に `refactorJudgement?: RefactorJudgement` を足す (`RefactorJudgement` は §3 の 5 種の union)。
- `projectReviewVerdict` は、抽出結果が `refactorJudgement` を持つときだけ、verdict receipt (`ReviewReceipt`) に同名の key を書く。持たないときは key を書かない。
- `validateReceipt` (`src/feedback/review-dispatch.ts`): `refactorJudgement` は `kind === "verdict"` の receipt にだけ許す (それ以外は既存の `unexpected_verdict_fields`)。値が 5 種のどれでもなければ `invalid_refactor_judgement` を reason に足す (entry は `merge_ready` にならない)。
- `receiptContentKey` と receipt の並べ替えの比較に `refactorJudgement` を含める。同じ identity で判定欄だけが違う receipt を同じ内容として潰さないためである。
- `ReviewDispatchEntry` に `refactorJudgement?: RefactorJudgement` を足し、`verdictReceipt` の値を写す。
- `MergeGateDecision` に `entriesForHead: ReviewDispatchEntry[]` を足す (exact HEAD の entry の一覧。`pr_mismatch` / `head_mismatch` で早く返すときは空)。既存の `ok` / `reasons` / `verdict` / `authorizedEntry` の決め方は変えない。

## 5. 対象 (実装 PR) の判定

`classifyPullRequestChanges(changes)` (`src/github/design-protection.ts`) が `"implementation"` を返す PR を対象とする。すなわち、変更 path (rename 元を含む) のどれかが `src/` か `scripts/` で始まる PR である (設計書保護 gate `design-protection-diff-gate.md` §10.2 と同じ線引き。定義を 2 か所に持たない)。

`changes` は adapter `readPullRequestChanges(pr, runGh)` が次で読む。

- `gh api repos/{owner}/{repo}/pulls/<pr>/files --paginate` の各要素の `filename` / `previous_filename` / `status` を `PlanChange` に写す。`status === "renamed"` なら `{ kind: "renamed", from: previous_filename, path }`、`removed` は `deleted`、`added` は `added`、それ以外は `modified` とする。`renamed` の `previous_filename` が無い・文字列でない・空文字のときは `invalid_response` で throw する (rename 元を確かめられないまま `modified` に落とすと、`src/` からの移動が対象から漏れる)。
- 要素数が 3000 以上なら `file_list_truncated` で throw する (GitHub はこの件数で打ち切る。打ち切られた一覧で「対象でない」とは言えない)。
- 応答が配列でない、要素の `filename` が文字列でない、`status` が文字列でない: `invalid_response` で throw する。

`changes` は exact HEAD に束縛されない (API は呼んだ時点の PR を返す)。観測の後に push されたときは、既存どおり `gh pr merge --match-head-commit <evaluatedHeadSha>` が merge を失敗させる。

## 6. gate の判定と DENY の reason

`evaluateRefactorJudgementGate(changes, entries)`:

1. 対象でなければ `{ target: false, ok: true, reasons: [] }`。判定欄の値は見ない。
2. 対象なら、`entries` のうち `verdict` を持つ entry のそれぞれについて (verdict の無い entry は review gate の `verdict_missing` が扱う):
   - `refactorJudgement` が無い: `refactor_judgement_missing`
   - `commit-tests-changed` か `none-rejected`: `refactor_judgement_rejected:<値>`
   - `commit-ok` / `none-ok` / `not-applicable`: reason なし
3. reasons は重複を除いて昇順に並べる。`ok` は reasons が空のときだけ true。

既存の出力 `pr merge — DENY pr=#<n> head=<sha> reason=<reasons>` に合わせ、reason は snake_case の token を `,` で繋ぐ。本 gate が足す token は次の 3 種である。

| token | 出す条件 |
|---|---|
| `refactor_judgement_missing` | 対象の PR で、exact HEAD の verdict に判定欄が無い (判定欄の導入より前に作られた receipt を含む) |
| `refactor_judgement_rejected:<値>` | 対象の PR で、判定欄の値が不合格 (`commit-tests-changed` / `none-rejected`) |
| `refactor_target_unavailable:<detail>` | `readPullRequestChanges` が throw した。`<detail>` は `gh_failed:<message>` / `invalid_response` / `file_list_truncated` |

例:

```text
pr merge — DENY pr=#2001 head=… reason=refactor_judgement_missing
pr merge — DENY pr=#2002 head=… reason=refactor_judgement_rejected:none-rejected
pr merge — DENY pr=#2003 head=… reason=refactor_target_unavailable:gh_failed:HTTP 502
```

判定欄の導入より前に verdict を受けた open な実装 PR は `refactor_judgement_missing` で止まる。猶予は設けない (例外を作ると、記録の無い merge が残る)。

回復は **HEAD を進めて再レビューする** 経路だけとする。同じ exact HEAD での再レビューは取らない: 同じ identity の terminal receipt がある間は `issueReviewRequest` / `beginReviewAttempt` が `review_receipt_already_exists` で拒否し、別 identity で足しても本 gate は exact HEAD の verdict entry を全部見るので、旧 entry の `refactor_judgement_missing` が残るためである。手順は次のとおり。

1. author family が PR に新しい commit を積む (変更が無ければ `git commit --allow-empty` で、理由を commit message に書く。amend / force push はしない)。
2. control lane が新 HEAD に review request を 1 本出し、判定欄を持つ verdict を受ける。
3. `entriesForHead` は新 HEAD の entry だけなので、旧 HEAD の判定欄の無い receipt は判定に入らない。旧 receipt は custody にそのまま残る (書き換え・削除をしない)。

## 7. 失敗時の拒否 (fail-close)

- `readPullRequestChanges` が throw したら deny (`refactor_target_unavailable:*`)。「対象かどうか分からない」を対象でない扱いにしない。
- 判定欄の値が 5 種以外の receipt は、`validateReceipt` が `invalid_refactor_judgement` にして entry を `merge_ready` にしない (§4)。review gate の既存経路で deny になる。
- 判定欄の抽出の失敗 (§3.1 の 4・5) は receipt を書かない。exact HEAD に verdict が無いので review gate が deny する。

## 8. `runPrMerge` への組み込み

1. 既存どおり `getPullRequest` で facts を取る。失敗したら既存の `gh_fetch_failed:<message>` で終わる (本 gate は動かさず、`getPullRequestChanges` も呼ばない)。
2. `GhPrMergePorts` に足す `getPullRequestChanges(pr)` (`createGhPrMergePorts` では `readPullRequestChanges`) を呼ぶ。throw したら `refactor_target_unavailable:<detail>` を本 gate の reason とする。
3. 既存どおり `evaluateMergeGate` で review を判定する。
4. 2 が成功していれば、`evaluateRefactorJudgementGate(changes, decision.entriesForHead)` を呼ぶ。review の結果に関わらず呼ぶ (1 回の `pr merge` で直すべきことを全部見せるため)。
5. どちらかが deny なら、reason = 両方の token の和集合を重複除去・昇順に並べて `,` で繋いだもの。merge port は呼ばず、`merge_intent` receipt は書かない。`merge_result` receipt (`decision: "deny"`) に reason を記録する (既存の記録経路のまま)。
6. 両方が ok のときだけ、既存どおり `merge_intent` receipt → merge → `merge_result` receipt に進む。

## 9. 関数 signature (実装が置く場所)

```ts
// src/feedback/review-verdict-contract.ts (既存に足す)
export type RefactorJudgement =
  | "commit-ok" | "none-ok" | "not-applicable" | "commit-tests-changed" | "none-rejected";
export interface VerdictExtraction {
  verdict: ReviewVerdictName;
  blockingFindings: string[];
  refactorJudgement?: RefactorJudgement;
}

// src/feedback/refactor-judgement-gate.ts (新しい source module)
export interface RefactorJudgementGateDecision { target: boolean; ok: boolean; reasons: string[] }
export function evaluateRefactorJudgementGate(
  changes: readonly PlanChange[],
  entries: readonly ReviewDispatchEntry[],
): RefactorJudgementGateDecision;
export function readPullRequestChanges(pr: number, runGh: ExecFileSync): PlanChange[];
```

実装の分け方 (§PR スコープ規律 3。1 PR = 1 論点):

1. 判定欄の抽出と写し: `extractVerdict`、`reviewOutputContract`、`projectReviewVerdict`、`validateReceipt` / `receiptContentKey` / `ReviewDispatchEntry` (§3・§4)。merge gate はまだ見ないので、既存の merge の挙動は変わらない。
2. gate: `refactor-judgement-gate.ts`、`GhPrMergePorts.getPullRequestChanges`、`MergeGateDecision.entriesForHead`、`runPrMerge` の組み込み (§5〜§8)。1 が merge されてから入れる (1 より先に入れると、すべての実装 PR が `refactor_judgement_missing` で止まる)。

## 10. DbC

| 関数 | 区分 | 内容 |
|---|---|---|
| `extractVerdict(logText)` | pre | `logText` は文字列。 |
| | post | 既存の verdict / findings の規則は変えない。§3.1 の規則で `refactorJudgement` を足す。候補 0 件なら key を持たない。5 種以外は `refactor_judgement_unknown`、2 種以上は `refactor_judgement_ambiguous` で失敗する。 |
| | invariant | 最後の `VERDICT:` 行より前の行と字下げされた行は判定欄の候補にしない。純粋関数。 |
| `evaluateRefactorJudgementGate(changes, entries)` | pre | `changes` は §5 の adapter が返した一覧 (打ち切りなし)。`entries` は exact HEAD の entry (`MergeGateDecision.entriesForHead`)。 |
| | post-1 | `classifyPullRequestChanges(changes) !== "implementation"` なら `{ target: false, ok: true, reasons: [] }`。 |
| | post-2 | 対象で、verdict を持つ entry に判定欄が無いものがあれば `refactor_judgement_missing`。 |
| | post-3 | 対象で、判定欄が `commit-tests-changed` か `none-rejected` の entry があれば `refactor_judgement_rejected:<値>`。 |
| | post-4 | 対象で post-2・post-3 のどちらにも当たらなければ `{ target: true, ok: true, reasons: [] }`。 |
| | invariant | verdict を持たない entry は見ない。PR 本文・commit・review の requests / receipts を読まない。reasons は重複なしの昇順。純粋関数。 |
| `readPullRequestChanges(pr, runGh)` | pre | `pr` は正の整数。 |
| | post | `--paginate` 付きの `gh api .../pulls/<pr>/files` を 1 回呼び、§5 の写しで `PlanChange[]` を返す。3000 件以上・型不一致は throw する。 |
| `runPrMerge` (変更分) | post | review gate と本 gate の両方が ok のときだけ merge port を呼ぶ。どちらかが deny なら reason は両方の token の和集合 (昇順)。`getPullRequestChanges` の throw は deny。 |
| | invariant | 既存の review gate の判定と reason (`U-RVMG-*`) は変えない。`getPullRequest` 失敗時の挙動 (`gh_fetch_failed:*`) も変えない。 |

## 11. 採らなかった案

| 案 | 内容 | 採らない理由 |
|---|---|---|
| A | gate が PR 本文の「Refactor なし」宣言を parse し、宣言か `refactor:` commit があれば通す (本書の旧版、`CANDIDATE-U-REFACTORGATE-001`〜`047`) | 見るのが作者の自己申告のままで、理由が成り立つかを誰も確かめない (§2 の実測)。書式の揺れに合わせて受理形を広げ続けることになる |
| B | gate が Refactor commit の `tests/` 差分と commit の順序を機械で見る | Refactor が要るかは判断であり機械で決められない。commit の type を付け替えれば通る。順序は FLAG 後の是正で正当に崩れる。差分 0 の確認は reviewer が判定欄に書く |
| C | PR をまたぐ重複も、この gate で見る | 1 PR の review で見える範囲を超える。計測で発火する Refactor チケット (#1304 / #1310) の守備範囲 |
| D (採択) | 非著者 reviewer の verdict に判定欄を必須にし、gate は欄の有無と値だけを見る | 判断を非著者に置き (§FLAG 後の限定是正と merge の族分離をそのまま使う)、gate は記録の有無という機械で確かめられることだけを見る。Fable advisor の推奨 |

## 12. oracle 対応

`CANDIDATE-U-REFACTORGATE-048`〜`078` を `docs/test-design/harness/L7-merge-gate-refactor-stage-test-design.md` に置く (`001`〜`047` は案 A とともに撤回し、番号は再利用しない)。実テストは `tests/review-verdict-contract.test.ts` (抽出と出力契約)、`tests/review-attestation.test.ts` (receipt への写し)、`tests/review-dispatch.test.ts` (receipt の検証と entry への写し)、`tests/refactor-judgement-gate.test.ts` (gate と adapter)、`tests/review-merge-gate.test.ts` (`runPrMerge` への組み込み) に置く。
