---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_consumer_doc_split
pair_artifact: docs/test-design/harness/L7-consumer-doc-split-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1531
---

> **L6 contract marker**: 本書は、設計文書の肥大検査 (doc-split gate) を consumer の design root でも動かし、分割の目安と書き方を consumer に届ける契約である (未実装の目標契約。実装は本書の凍結後に別 PR で行う)。測る量・閾値・baseline の規則は `docs/design/harness/L6-function-design/doc-split-gate.md` を正本とし、本書は写さない。分割の書き方は `docs/design/harness/L6-function-design/design-split-family.md` (#1530) を正本とする。oracle (CANDIDATE-U-CDSPLIT-001〜) は `docs/test-design/harness/L7-consumer-doc-split-test-design.md` が固定する。方式判断は #1531 の control 記録による。

# consumer の設計文書分割 — 関数設計 (issue #1531)

## 1. 目的と範囲

doc-split は `docs/design/harness` と `docs/test-design/harness` だけを走査する (`src/lint/doc-split-inputs.ts:23` の `SOURCE_ROOTS`)。種別の判定 `classifyDoc` (`src/lint/doc-split.ts:77`) も同じ harness の path に固定されている。consumer の design root (`docs/design/`) は走査されず、分割の目安も書き方も届かない。consumer の実運用で、1,000 行を超える設計文書が複数あり、分割の規則を各自が作っていることを観測した。

本書は次の 3 点を凍結する。

1. doc-split が読む root を `resolveVModelRoots` に揃える (§2)。
2. 超過時に consumer へ出す是正の文面を、分割ファミリー形式にする (§3)。
3. 分割の目安と書き方を Pack の 1 文書で届ける (§6)。

対象外 (非目標): 閾値の consumer 設定による上書き (§5)、test-design 側の分割ファミリー (#1530 §7 と同じ)、consumer 向けの baseline ファイルの配布。

## 2. 読む root (決定 1)

`resolveVModelRoots(repoRoot)` (`src/shared/design-root.ts:26`) は `{ designRoot, testDesignRoot }` を返す。候補は `docs/design/harness` → `docs/design` の順 (`:4`)、`docs/test-design/harness` → `docs/test-design` の順 (`:5`) で、最初に実在した root を採る (`:12`)。本体では `docs/design/harness` と `docs/test-design/harness` が実在するので、従来の root と同一になる。consumer は `docs/design` と `docs/test-design` になる。

- `loadDocSplitSources` の走査 root を、固定値 `SOURCE_ROOTS` から `resolveVModelRoots(repoRoot)` の 2 つに替える。
- `classifyDoc` は、解決した root を引数に取る形 (`classifyDoc(path, roots)`) に替える。種別の規則は `doc-split-gate.md` §2 のまま、root の接頭辞だけを `roots` から作る。`l6-topic` は `<designRoot>/L6-function-design/` 配下、`l7-topic` は `<testDesignRoot>/` 配下で `L7-` で始まる `.md`、それ以外の対象は `layer-doc` とする。path だけから `docs/design/` 直下を対象にしない (本体で `docs/design/` 直下の `.md` が新たに対象へ入るのを防ぐ)。
- `classifyDoc` の呼び出し元 (`src/lint/doc-split-inputs.ts` の `loadDocSplitSources` と `loadRenamedDocs`、`src/feedback/baseline-conflict.ts:20`) は、同じ `repoRoot` から解決した `roots` を渡す。
- 純粋関数 `analyzeDocSplit` は repo を読まない (`doc-split-gate.md` §9)。解決済みの `roots` を入力として受け取る。
- baseline の path は実際の path (本体は `docs/design/harness/...`、consumer は `docs/design/...`) のままとする。`canonicalizeVModelPath` で正規化して保存しない。

## 3. 超過時の是正の文面 (決定 3)

`doc-split-required` の 2 行目 (`doc-split-gate.md` §6 の「分ける先」) を、解決した root で出し分ける。1 行目の測定値の行は変えない。

- **本体** (`designRoot` が `docs/design/harness`): 従来の文面のまま。
- **consumer** (それ以外): 設計側の文書には、分割ファミリー形式で指示する。

```
<path>:doc-split-required:<reason> lines=<n>/<limit> responsibilities=<m>/<limit>
  責務 <名前1>, <名前2> を、入口 <path> を残したまま <層ディレクトリ>/<topic>/<名前>.md へ分ける。
  子の frontmatter に split_of: <path> を 1 行書く (入口が pair と status を持つ。design-split-family.md, #1530)
```

- 分ける責務の名前の選び方 (出現順の後ろから `max(1, 超過個数)` 個) は `doc-split-gate.md` §6 のまま。
- consumer の test-design 側の文書には、「責務ごとのファイルに分け、`pair_artifact` を dir の集合参照にする」と書く。`design-split-family.md` §4 のとおり、rule 3 は dir 集合参照を既に受け付けるので、子の `split_of` は求めない。
- 子 (`split_of` を持つ文書) は個別に測る。走査は再帰的で (`doc-split-gate.md` §2)、`measureDoc` は 1 文書の本文だけを測る。入口の行数・責務の数に子を足さない。子が上限を超えれば、子が `new-doc-over-limit` になる。
- 分割後の文書が pair と trace の束縛から外れないことは、#1530 の実装が担う。本書は是正の文面でその形を指すだけで、検査を足さない。

## 4. baseline が無い consumer (決定 5)

`docs/governance/doc-split-baseline.json` が作業木に無いとき、`loadCurrentBaseline` (`src/lint/doc-split-inputs.ts:141`) は空の baseline `{}` を返す (`:143`)。これを正規の動作として固定する。

- 全文書は baseline に無い文書として、`DOC_SPLIT_LIMITS` の class の上限で直接判定する (`new-doc-over-limit`)。baseline のファイルは不要で、作らせない。
- baseline のファイルが作業木に無いときは、git の入力 (`previousBaseline`、`mergeBaseMeasures`) の読み取り失敗を `doc-split-baseline-base-unreadable` にしない。`origin/main` や merge-base を持たない consumer の repo で、検査が常に落ちるのを防ぐためである。`previousBaseline = null`、`mergeBaseMeasures = null` を渡す。baseline が空なので、baseline 由来の finding (`doc-split-baseline-grown`・`doc-split-initial-baseline-*`・`doc-split-stale-baseline`) は出ない。
- `renames` (`doc-split-class-changed`) は、merge-base を解決できるときだけ従来どおり読む。解決できないときは空で、finding にしない。
- baseline のファイルが作業木にあるとき (本体、または consumer が自分で置いたとき) は、`doc-split-gate.md` §5 の規則がそのまま働く。読めない・解釈できないときの `doc-split-input-unreadable` も変えない。
- 走査対象が 1 本も無いときの `doc-split-input-unreadable` (`no-sources`) も従来どおり。

## 5. 閾値は上書きできない (決定 2)

閾値の正本は `doc-split-gate.md` §4.2 と `DOC_SPLIT_LIMITS` (`src/lint/doc-split.ts:61`) の 1 組だけである。consumer の設定 (設定ファイル・環境変数・CLI の option) で上書きする仕組みは作らない。値の変更は `doc-split-gate.md` の改訂として扱う。consumer の個別の都合は、baseline のファイルに既存の違反を記録し、縮小だけ許す形 (§4) で扱える。上書きの要否は、consumer の実運用の観測が出てから別の Issue で決める。

## 6. Pack で届ける文書 (決定 4)

consumer 向けの分割の目安と書き方は、Pack に同梱済みの `docs/governance/coding-rules.md` の §量・分割・Refactor の目安 に置く。この文書は `src/setup/distribution.ts:175` の `CLEAN_ALLOW_FILES` に載っていて Pack へ届き、設計文書の量と分割の目安を持つ節がある (「量の上限」の表の 1 行目)。新しい配布 path は足さず、配布の許可集合も変えない。`docs/templates/` には governance の参照文書の置き場が無い (`docs/templates/design/` は L6 の雛形だけ)。

その節への追記は本 PR では行わない (実装側の別 PR で行う)。追記する内容は次のとおりである。

- いつ分けるか: `doc-split-gate.md` §4.2 と同じ上限 (行数と責務の数) と、§3 の数え方への参照。値は写さず、正本の節を指す。consumer が自分の design root で `ut-tdd doc-split check` を実行できること。
- どう分けるか: 入口 1 本 (層ディレクトリ直下) と子 (サブフォルダ) の形、子の `split_of: <入口の path>` の 1 行、pair と status は入口だけが持つこと (`design-split-family.md`)。
- 超過時の出力 (§3) と是正の対応、baseline が無くても上限で判定されること (§4)、閾値は上書きできないこと (§5)。

## 7. 不変条件

- 本体 (`docs/design/harness` を持つ repo) では、走査する文書の集合・種別・測定値・finding・出力が現行と同一である。
- consumer の design root の `.md` は、本体と同じ規則と値で測られる。
- 閾値を変える入力 (設定・環境変数・option) は存在しない。
- baseline の有無で上限が緩まない。baseline が無いときは、すべての文書が上限で判定される。

## 8. 実装の順序

1. 契約 PR (本書と対のテスト設計)。
2. 設計書保護 gate の三段階 (`design-protection-diff-gate.md` §10) に従う Red PR と Green PR。対象は `src/lint/doc-split.ts`・`src/lint/doc-split-inputs.ts`・`src/cli/doc-split.ts`・`src/feedback/baseline-conflict.ts` で、新規の source_module は足さない。
3. §6 の Pack 文書への追記 (1 PR 1 論点のため、2 と分ける)。

## 9. DbC

- Pre: 入力は repo root と、そこから解決した `roots`。読み取りだけを行い、ファイルを書かない。
- Post: 本体では現行と同じ結果。consumer では `roots` 配下の `.md` が測られ、超過は §3 の文面になる。baseline が無くても例外にならず `ok` が決まる。
- Invariant: §7。
