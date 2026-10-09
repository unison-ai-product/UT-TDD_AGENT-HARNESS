---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_design_plan_thin_body
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-955-design-plan-thin-body-lint.md
---


> **L6 contract marker**: `analyzeDesignPlanThinBody(input: DesignPlanBodyInput) => DesignPlanBodyFinding[]` は unit-test-granularity contract である。DbC は §8。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§設計系 PLAN 本文 4 項目) に置き、詳細 (CANDIDATE-U-THINPLAN-001〜) は `docs/test-design/harness/L7-design-plan-thin-body-test-design.md` が固定する。

# 設計系 PLAN 本文 4 項目 lint — 関数設計 (issue #955)

## 1. 目的

`CLAUDE.md` §設計系 PLAN の本文 4 項目 (issue #648、2026-10-06 施行) を機械で強制する。
新規の設計系 PLAN (`kind: design` / `add-design`) の本文は「上流の設計 revision digest / 引き渡し物 / 検証の対 / 完了条件」の 4 見出しだけを持ち、設計文書の契約本文を複製しない。
現状は review の FLAG でしか見つからず、FLAG 1 回が CI 1 周 (13〜14 分) + 再 review 1 回に相当する (PR #944 PLAN-L6-935 の FLAG、PR #949 PLAN-L6-833 の自己発見)。
機械で見つけられる形の誤りを lint で止め、review は意味の判定に集中させる。

本 lint は「契約本文の複製」を意味で判定しない。行の形と長さだけで判定する単純な方式とし (issue #955 やること 3)、意味の判定は従来どおり review が持つ。

## 2. 適用範囲

次の全てを満たす PLAN だけを検査する。

1. frontmatter `kind` が `design` または `add-design`。
2. frontmatter `status` が `archived` でない。
3. frontmatter `created` が `DESIGN_PLAN_THIN_BODY_ENFORCEMENT_DATE` (= `"2026-10-06"`) 以上 (文字列比較、ISO 日付)。

### 2.1 施行日の判定方法 (設計判断)

採用: frontmatter `created` と、`src/plan/lint-policy.ts` に置く施行日定数との比較。

- 規則の導入: commit `a256cb9f` (2026-10-06 13:31 +0900)、main への merge は PR #853 (`d05736fa`、2026-10-06 13:59 +0900)。
- 既存の `ROUTE_CERTIFICATE_ENFORCEMENT_DATE` (`created >= "2026-07-01"`) と同じ方式であり、新しい仕組み (registry / schema / git 履歴参照) を足さない。
- 2026-10-06 に `created` を持つ設計系 PLAN は 0 件 (実測、§11)。したがって日付粒度でも merge 時刻との前後関係が曖昧になる PLAN は無い。
- 不採用とした方式と理由は notes.md (§設計判断の比較) に記録する。要点: git の初回追加 commit 日は CI の shallow clone で取れず、さらに PLAN-L6-832 / PLAN-L6-816 (規則 merge 前の 10-06 午前に branch へ追加、`created: 2026-10-05`) を誤って対象に含める。plan-admission-receipts は時刻を持たない。

`created` の書き換えによる逃避は、PLAN 本文の content digest が admission receipt に束縛されることと diff review で見える。本 lint はそれ以上の改ざん検出をしない。

`created` が欠落・非文字列の PLAN は対象外とする (欠落は既存の `invalid_frontmatter` が扱う)。

## 3. 本文の切り出し

- 本文 = frontmatter (`---` ... `---`) の後ろ全体。
- fenced code block (```` ``` ```` / `~~~`) は使用不可 (§4 C1 の preamble 以外の行の形に一致しないため、各節の行規則で fail する)。特別扱いしない。
- 行末の `\r` は除く。

## 4. 検査 (全て fail-close)

各検査は finding を返す。finding の `code` は §5 の表に固定する。

### C1. 見出しの集合と順序

- 本文中の ATX 見出し (`^#{1,6}\s`) を順に集める。
- h1 (`# `) は先頭に 0 個または 1 個だけ許す (タイトル)。
- h2 (`## `) は次の 4 つが、この順で、ちょうど 1 回ずつ現れること (見出し文字列は trim 後の完全一致)。
  1. `上流の設計 revision digest`
  2. `引き渡し物`
  3. `検証の対`
  4. `完了条件`
- h3 以下 (`###`〜) は許さない。
- 最初の h2 より前の行は、空行・HTML コメント行 (`<!--` で始まる行から `-->` を含む行まで)・h1 タイトル 1 行だけを許す。それ以外の行は `preamble_text`。
- 違反時: `heading_set` (集合・順序・重複・番号付き・英語見出しを含む)、`heading_depth` (h3 以下)、`preamble_text`。
  C1 が fail した PLAN では C2〜C5 を実行しない (節の境界が決まらないため)。

### C2. 上流の設計 revision digest の行

- 空行・HTML コメント行を除く全行が、次の正規表現に完全一致すること。

  ```
  ^- `(?<path>[A-Za-z0-9._\-/]+)@(?<commit>[0-9a-f]{40})` sha256:(?<sha>[0-9a-f]{64})$
  ```

- `path` は repo 相対の POSIX path。先頭 `/`、`..` 要素、`\` を含まないこと。
- 1 行以上あること (0 行は `empty_section`)。
- digest の値そのもの (`git cat-file blob <commit>:<path> | sha256sum` との一致) は検査しない (§9)。
- 違反時: `digest_line` (行番号つき)。

### C3. 引き渡し物 / 検証の対 の行

両節に同じ規則を適用する。

- 空行・HTML コメント行を除く全行が list item (`^- `) であること。list 以外の行 (段落) は `item_form`。
- 表の行 (`^\|`) は `table_forbidden`。
- ネストした list (`^\s+- `) は `item_form`。
- 各 list item の **残余文字数** が `DESIGN_PLAN_ITEM_RESIDUAL_MAX` (= 80) 以下であること。
  - 残余 = 行頭の `- ` を除き、backtick span (`` `...` ``) を全て除いた後、前後空白を trim した文字列の Unicode code point 数。
  - path を backtick で囲めば path の長さは数えない。数えるのは path 以外の説明文だけである。
  - 80 の根拠: CLAUDE.md の例のうち最長の `- 設計 ↔ テスト設計: 上記 2 文書の対 (gate / テストレベル / 検証手法はテスト設計側に書く)` の残余は 54 code point。違反実例は PLAN-L6-935 rev4 の 検証の対 段落が 84 / 511 / 278、PLAN-L6-833 の Deliverables 4 行目が 290、Verification pair 段落が 438 (node で計測、test-design §2)。
- `引き渡し物` は 1 item 以上、かつ少なくとも 1 item が backtick の repo path を含むこと (`empty_section`)。`検証の対` は 1 item 以上 (`empty_section`)。
- 違反時: `item_form` / `table_forbidden` / `item_too_long` / `empty_section`。

### C4. 完了条件の行

- 空行・HTML コメント行を除く全行が `^- \[( |x)\] \S` に一致すること。
- 1 item 以上。
- 長さは制限しない (§9)。
- 違反時: `checklist_form` / `empty_section`。

### C5. 参照の実在と見出し literal

対象は `引き渡し物` / `検証の対` / `完了条件` の行。

- **path**: backtick span が `^(docs|src|tests|scripts|skills)/[^\s#]+\.[A-Za-z0-9]+(#.*)?$` に一致する場合、`#` より前の path が `repoRoot` に存在すること。違反は `path_missing`。
- **見出し参照の禁止**: path に `#<fragment>` を付けた参照 (backtick span と markdown link の target)、および path の直後の ` §<token>` は fail とする。違反は `anchor_forbidden`。4 項目の本文は文書を path だけで指し、見出しは指さない。これで「参照する見出し・アンカーが実在する」(issue #955 やること 4) は、見出し参照が 0 件であることで常に成り立ち、slug の再現が要らない。施行後の適合 PLAN (PLAN-L6-834、PLAN-L6-935 rev5) は見出し参照を 1 件も使っていない (実測 2026-10-09)。
- **見出しの literal 埋め込み**: 行の本文 (行頭の見出し記号ではなく、行の途中) に `## ` (`#` 2 個以上 + 空白) を含む行は fail とする (例: `「## FLAG1に対する事後訂正提案 (確認ではない)」`)。違反は `heading_literal`。PLAN 本文は設計文書の見出しを書き写して指さず、path だけで指す。
- `上流の設計 revision digest` の path は過去 revision を指すため、存在検査をしない。

PR #944 rev4 の実害 (存在しない見出しへの参照) は、`heading_literal` と C3 (段落禁止・残余長) で止まる。`#fragment` / `§token` による参照は `anchor_forbidden` で止まるため、見出しの解決は行わない。

## 5. 出力と message

`analyzePlanGovernance` の violation として 1 PLAN 1 件以上を返す。

- `reason`: `design_plan_thin_body` (`PlanGovernanceViolationReason` に 1 値追加)。
- `detail`: `<code>@<節名>:<本文内行番号>` 。複数 finding は `; ` で連結し、先頭 3 件 + `(+N more)` に切る。
  - 例: `item_form@検証の対:L21; heading_literal@検証の対:L23; item_too_long@検証の対:L25(312>80)`
- message は既存 `planGovernanceMessages` の書式に乗る (`plan-governance - violation N item(s) ... design_plan_thin_body=K`、sample に file と detail)。新しい message 関数は作らない。

| code | 意味 |
| --- | --- |
| `heading_set` | h2 が 4 見出しの完全一致・順序・各 1 回でない |
| `heading_depth` | h3 以下の見出しがある / h1 が 2 個以上 |
| `preamble_text` | 最初の h2 より前に h1・空行・コメント以外の行 |
| `digest_line` | digest 節の行が文法に一致しない |
| `item_form` | 引き渡し物 / 検証の対 に list 以外の行・ネスト list |
| `table_forbidden` | 引き渡し物 / 検証の対 に表 |
| `item_too_long` | list item の残余が 80 code point 超 |
| `checklist_form` | 完了条件に checklist 以外の行 |
| `empty_section` | 必須節が空 / 引き渡し物に path が無い |
| `path_missing` | 参照 path が repo に無い |
| `anchor_forbidden` | path に `#fragment` を付けた参照、または path 直後の `§token` がある |
| `heading_literal` | 本文に `## ` の見出し literal を埋め込んでいる |

## 6. 置き場所と配線

- 純関数: `src/lint/design-plan-thin-body.ts` (新規 source_module 1 個)。`analyzeDesignPlanThinBody({ body, repoRoot }) => DesignPlanBodyFinding[]`。I/O は path 存在の確認だけ (注入可能な `pathExists(path) => boolean` を引数で受け、既定は `existsSync`。テストは fake を渡す)。参照先ファイルの内容は読まない。
- 定数: `src/plan/lint-policy.ts` に `DESIGN_PLAN_THIN_BODY_ENFORCEMENT_DATE = "2026-10-06"` と `DESIGN_PLAN_ITEM_RESIDUAL_MAX = 80` を追加。
- 配線: `src/plan/lint.ts` の `analyzePlanGovernance` の PLAN ごとのループに、§2 の適用判定と呼び出しを 1 箇所追加する。
  - これで `ut-tdd plan lint` (既定 = schedule + governance)、`ut-tdd plan lint --gate governance`、doctor の `plan-governance` row (`checkPlanGovernance`) の 3 面に同時に乗る。doctor 側の新 row・新 check 定義は作らない。
  - `ut-tdd plan lint <path>` の単体 lint にも同じ規則が掛かる。
- `src/plan/lint-types.ts` の `PlanGovernanceViolationReason` に `design_plan_thin_body` を追加。
- 新しい registry / schema / CLI option は作らない。

## 7. fail-close / warn

- 全 code を fail-close とする (governance violation = `ok=false` = `plan lint` exit 1、doctor `plan-governance` 失敗)。
- 理由: 対象は施行後起票の PLAN だけで、§11 の実測で現時点の対象は 3 件。warn 段階を置くと FLAG 往復の削減 (本 issue の目的) が得られない。
- 例外の許可リストは設けない。施行後の違反 PLAN は `plan revise` で本文を直す。

## 8. 不変条件 (DbC)

- pre: `body` は frontmatter を除いた文字列。`repoRoot` は存在するディレクトリ。
- post: 適用範囲外 (§2) の PLAN に対して finding は常に 0 件 (施行前 PLAN の結果は本 lint の導入前後で不変)。
- post: finding が 0 件 ⇔ C1〜C5 の全てを満たす。
- inv: 判定は本文と repo の path 存在だけで決まる (参照先ファイルの内容・git 履歴・ネットワーク・時計を読まない)。同じ入力に同じ出力。
- inv: 本 lint は frontmatter の要件 (agent_slots / dependencies / route certificate / review_evidence) を変えない。

## 9. 範囲外

- digest 値の照合 (`git cat-file` による sha256 の再計算)。CI の shallow clone で過去 commit が無い場合があり、別 PLAN で扱う。
- 完了条件 item の長さ制限。
- 「複製」の意味判定 (設計文書との文字列類似度など)。
- 施行前の設計系 PLAN の移行 (#648 の手順で別途行う)。
- 見出しアンカーの解決 (`<path>#<fragment>` の GitHub slug 照合) と `§token` の見出し照合。理由: CJK を含む GitHub slug の再現は壊れやすく、最小実装原則に反する。代わりに C5 の `anchor_forbidden` で見出し参照そのものを禁止する (PR #956 の FLAG 1 への是正、2026-10-09)。

## 10. 実装順序の前提 (control 判断 2026-10-09)

本 lint の実装 PR が main に merge される時点で、適用範囲の PLAN が全て適合していること (§11)。順序は次のとおり。

1. PLAN-L6-935 の是正 (PR #944、rev5) を merge する。
2. PLAN-L6-833 の本文を `plan revise` で 4 項目へ是正し、merge する。
3. その後に本 lint の実装 PR を merge する。

一時的な除外リストも warn 段階も設けない。

## 11. 根拠 (実測、main `da16d7aa`、2026-10-09)

- 規則の導入 commit: `git log -S "設計系 PLAN の本文 4 項目" -- CLAUDE.md` → `a256cb9f` (2026-10-06 13:31)、`dc11bfc6` (同日 19:10、文言是正)。
- merge: `d05736fa` Merge PR #853 (2026-10-06 13:59)。
- 設計系 PLAN 196 件中、`created >= 2026-10-06` は 3 件: PLAN-L6-833 / PLAN-L6-834 / PLAN-L6-935 (node で全 PLAN の frontmatter を走査)。
- PLAN-L6-935: PR #944 の rev4 = `087a1b18` (admission sequence 470)、rev5 = `18db7e51` (sequence 471)。
- `node src/cli.ts plan lint` (本 lint 導入前): `plan-schedule — OK (checked=1007)` / `plan-governance - OK (checked=1007)`、exit 0。
