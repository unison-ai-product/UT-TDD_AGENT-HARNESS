---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_doc_split_gate
pair_artifact: docs/test-design/harness/L7-doc-split-gate-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1032
---

> **L6 contract marker**: `analyzeDocSplit(sources, baseline, previousBaseline) => DocSplitResult` は unit-test-granularity contract である (未実装の目標契約。実装は本書の凍結後)。DbC pre/post/invariant は §9 にまとめる。oracle の詳細 (CANDIDATE-U-DOCSPLIT-001〜) は専用の `docs/test-design/harness/L7-doc-split-gate-test-design.md` が固定する。共有の `L7-unit-test-design.md` は、肥大の当事者なので本契約では触らず、索引行も足さない (§8.3 に既存検査との衝突を記す)。

# 設計文書の肥大検査 (doc-split gate) — 関数設計 (issue #1032)

## 1. 目的

設計文書が 1 枚に集まりすぎると、複数の branch が同じ文書を同時に変更し、merge のたびに衝突と再検が起きる。2026-10-14 の実測 (issue #1032) では、設計還流 (#958) の最中に open の branch のうち 9 本が `L7-unit-test-design.md` を、7 本が `function-spec.md` を同時に変更していた。

「責務ごとに L6 文書 1 本 + 対の L7 test-design 1 本」という形は既にあるが、それを守らせる機構が無い。本設計は、文書の行数と責務の数を測り、閾値を超えて増える変更を fail-close し、分割先の形を指示する検査 (doc-split gate) を定める。既存の違反は縮小しかできない baseline に記録する。

## 2. 対象

- **走査対象**: `docs/design/harness/` と `docs/test-design/harness/` 配下の `.md` を再帰的に全て。`docs/archive/` など他の場所は対象外。
- **文書の種別 (class)** は path だけで決める。frontmatter は読まない。
  - `l6-topic`: `docs/design/harness/L6-function-design/` 直下の `.md`。
  - `l7-topic`: `docs/test-design/harness/` 直下で、ファイル名が `L7-` で始まる `.md`。
  - `layer-doc`: 上記以外の対象文書 (L1〜L5 の設計、L8 以降の test-design)。層ごとに 1 本の目録的な文書なので、責務の数は制限せず行数だけを制限する。

## 3. 測る量

path は `/` 区切りに正規化する。内容は CRLF を LF に直してから数える。

- **行数 (`lines`)**: 内容を `\n` で分けた行の数。末尾が `\n` で終わるときは、その後ろの空要素を数えない。空のファイルは 0。`wc -l` と同じ値になる (2026-10-14 実測: `function-spec.md` 2,515、`L7-unit-test-design.md` 3,107)。
- **コードフェンス**: 行頭が 3 個のバッククォートの行で開閉する。フェンスの内側は、行数には含めるが、見出しと ID の抽出からは除く。
- **責務の数 (`responsibilities`)** は class ごとに定義する。
  - `l6-topic`: フェンスの外にある行頭 `## ` (レベル 2 の見出し) の数。
  - `l7-topic`: oracle family の種類数。フェンスの外にある表の行について、先頭セルから前後の空白と、1 組のバッククォートを外した文字列を ID 候補とする。ID 候補が正規表現 `^(?:CANDIDATE-)?[A-Z]+-([A-Z][A-Z0-9]*)(?:-[A-Z0-9]+)*-\d+$` に一致したとき、第 1 グループが family 名である。family 名の異なり数を数える。例: `U-HOVER-001` は `HOVER`、`CANDIDATE-U-WHIDE-004` は `WHIDE`、`U-FR-L1-21-01` は `FR`、`U-RIGHT-ARM-ENGINE-002` は `RIGHT`。ヘッダ行の `U-ID (候補)` は一致しない。ID を表の先頭セル以外にだけ書いた文書は、family が 0 になる (数え漏らす側であり、肥大の見逃しにはなるが誤検出にはならない)。
  - `layer-doc`: 数えない (`null`)。
- 各 `DocMeasure` は、責務の名前を文書内の出現順に持つ。`l6-topic` は見出しの文言、`l7-topic` は family 名。

## 4. 閾値

閾値は 2026-10-14 の `origin/main` 全文書 (対象 123 本: l6-topic 33、l7-topic 48、layer-doc 42) の実測から決めた。肥大した 2 本は外れ値として分布から除き、残りの最大値に余裕を持たせて丸める。

### 4.1 実測の分布

| class | 本数 | 行数の中央値 | 行数の p90 | 外れ値を除いた最大 | 外れ値 |
|---|---|---|---|---|---|
| `l6-topic` | 33 | 116 | 267 | 309 (`memory.md`) | `function-spec.md` 2,515 行 |
| `l7-topic` | 48 | 73 | 157 | 230 (`L7-pack-publication-admission-binding-test-design.md`) | `L7-unit-test-design.md` 3,107 行 |
| `layer-doc` | 42 | 193 | 525 | 1,385 (`L5-detailed-design/internal-processing.md`) | なし (連続した分布) |

| class | 責務の数 | 外れ値を除いた最大 | 外れ値 |
|---|---|---|---|
| `l6-topic` (`##` の数) | 中央値 7、p90 11 | 13 (`skill-admission.md`) | `function-spec.md` 34 |
| `l7-topic` (family の数) | 中央値 0、p90 1 | 2 (`L7-pack-publication-admission-binding-test-design.md` ほか) | `L7-unit-test-design.md` 119 |

`layer-doc` の上位は `internal-processing.md` 1,385 行、`L3-functional/functional-requirements.md` 950 行、`physical-data.md` 895 行、`L1-requirements/screen-requirements.md` 566 行、`L8-integration-test-design.md` 525 行と連続している。

### 4.2 決めた値

| class | 行数の上限 | 責務の数の上限 | 決め方 |
|---|---|---|---|
| `l6-topic` | 400 | 16 | 外れ値を除いた最大 (309 行 / 13 節) のおよそ 1.3 倍を丸める |
| `l7-topic` | 400 | 4 | 同 230 行のおよそ 1.7 倍。family は 1 topic に 1〜2 が実態なので 2 倍 |
| `layer-doc` | 1200 | なし | 連続した分布の中で、950 行までを許し、1,385 行を外れ値として baseline に載せる |

この値で `origin/main` の違反は 3 本 (`function-spec.md`、`L7-unit-test-design.md`、`internal-processing.md`) だけになる。閾値は `src/lint/doc-split.ts` の定数 `DOC_SPLIT_LIMITS` に置く。値を変える変更は設計の改訂 (本書の §4.2 と oracle の同時改訂) として扱い、baseline に既存違反を足して通すことはしない (§5)。

## 5. baseline

- 既存の違反は `src/lint/doc-split-baseline.ts` の `DOC_SPLIT_BASELINE` に、文書の path ごとに `{ lines, responsibilities }` として記録する (`layer-doc` の `responsibilities` は `null`)。1 文書を 1 行に書き、path の昇順に並べる。複数の分割 PR が別々の文書の行を縮めても、git が行単位で衝突なく merge できる。
- 初期値 (実装 PR で入れる): `function-spec.md` が `{ lines: 2515, responsibilities: 34 }`、`L7-unit-test-design.md` が `{ lines: 3107, responsibilities: 119 }`、`internal-processing.md` が `{ lines: 1385, responsibilities: null }`。実装 PR は着手時に実測し直して書く。
- 縮小のみの比較元: baseline そのものが増やされると §6 の規則は素通りする。そこで `previousBaseline` (比較元) を入力に取り、各文書の `lines` と `responsibilities` が比較元より増えたら、または比較元に無い文書が baseline に足されたら `doc-split-baseline-grown` で fail-close する。比較元は、doctor と CLI が `git merge-base HEAD origin/main` の commit にある `src/lint/doc-split-baseline.ts` を `git show` で読み、ソースを解釈して得る (import はしない)。merge-base は解決できたがその commit にファイルが無いときは、baseline を初めて入れる PR とみなして比較を省く (`previousBaseline = null`)。merge-base を解決できない、またはファイルはあるが読めない・解釈できないときは `doc-split-baseline-base-unreadable` で fail-close する。git の起動には `windowsHide: true` を付ける (issue #693)。

## 6. 判定規則と finding

文書ごとに `measureDoc` で測り、class の上限 (§4.2) と baseline を次の順で比べる。finding は `path` と `reason` を持つ。

1. **`doc-split-required`** (fail-close)。次のいずれか。
   - `exceeds-baseline`: baseline にある文書の `lines` または `responsibilities` が baseline より大きい。上限の内側でも、baseline にある文書は baseline が上限になる。
   - `new-doc-over-limit`: baseline に無い文書の `lines` または `responsibilities` が class の上限より大きい。
2. **`doc-split-stale-baseline`** (fail-close)。次のいずれか。
   - `shrunk`: baseline にある文書が baseline より小さくなった (`lines` か `responsibilities` のどちらかが小さく、どちらも大きくない)。同じ PR で baseline を減らす。
   - `within-limit`: baseline にある文書が、class の上限の内側に収まった。baseline の行を消す。
   - `missing-file`: baseline にある path の文書が走査対象に無い。baseline の行を消す。
3. **`doc-split-baseline-grown`** と **`doc-split-baseline-base-unreadable`** (fail-close)。§5。
4. **`doc-split-input-unreadable`** (fail-close)。走査対象の文書が 1 本も無い (`sources` が空)、または adapter が対象文書を読めなかった。入力が読めないことを「違反なし」と取り違えない。

`ok` は上の 4 種の finding が 0 件のときだけ true。`doc-split-required` のメッセージは分割先の形を指示する。

```
<path>:doc-split-required:<reason> lines=<n>/<limit> responsibilities=<m>/<limit>
  責務 <名前1>, <名前2> を docs/design/harness/L6-function-design/<topic>.md と
  docs/test-design/harness/L7-<topic>-test-design.md へ分ける
```

分ける責務の名前は、文書内の出現順の**後ろから** `k` 個とする。`k` は、責務の数が上限 (baseline にある文書は baseline) を超えた個数で、超えていないとき (行数だけが超えたとき) は 1 とし、いずれも `max(1, 超過個数)` である。後ろから選ぶのは、追記が末尾に集まる実態に合わせて、新しく足した責務を分割の候補にするためである。`<topic>` はその責務の名前を kebab-case にした候補で、指示の例にすぎず、実際の名前は分割する担当が決める。`l7-topic` の文書には L7 側だけの指示 (`L7-<topic>-test-design.md` へ分ける) を出す。`layer-doc` には「責務ごとの文書に分ける」と書き、分割先の path は指示しない (層の目録は topic の対を持たないため)。

出力は finding ごとに 1 行、末尾に `checked=<走査した文書数> over=<doc-split-required の件数> stale=<doc-split-stale-baseline の件数> baseline=<baseline の文書数>`。finding は `path`、`kind`、`reason` の順で一意に並べる。

## 7. 関数のシグネチャ (純粋関数と I/O の adapter)

純粋関数は `src/lint/doc-split.ts`、I/O は `src/lint/doc-split-inputs.ts` に分ける。純粋関数はファイルも git も読まない。

| 関数 | シグネチャ | 責務 |
|---|---|---|
| `classifyDoc` | `(path: string) => DocClass \| null` | path から class を決める。対象外は `null` |
| `measureDoc` | `(source: DocSplitSource) => DocMeasure` | §3 の値を測る。`{ path, docClass, lines, responsibilities, names }` |
| `analyzeDocSplit` | `(sources: readonly DocSplitSource[], baseline: DocSplitBaseline, previousBaseline: DocSplitBaseline \| null) => DocSplitResult` | §6 の規則を適用する。`{ ok, findings, summary }` |
| `parseDocSplitBaseline` | `(sourceText: string) => DocSplitBaseline \| null` | baseline のソースを解釈する。解釈できなければ `null` |
| `loadDocSplitSources` | `(repoRoot: string) => { sources: DocSplitSource[]; unreadable: string[] }` | adapter。走査対象の `.md` を読む。読めない path は `unreadable` に積む |
| `loadPreviousDocSplitBaseline` | `(repoRoot: string) => { kind: "found"; baseline: DocSplitBaseline } \| { kind: "absent" } \| { kind: "unreadable" }` | adapter。§5 の merge-base 経路 |
| `checkDocSplit` | `(repoRoot: string) => { messages: string[]; ok: boolean }` | adapter の合成。doctor と CLI が共有する |

`DocSplitSource` は `{ path: string; text: string }`、`DocSplitBaseline` は `Readonly<Record<string, { lines: number; responsibilities: number | null }>>`。`checkDocSplit` は例外を握りつぶさず、読めない入力は `doc-split-input-unreadable` か `doc-split-baseline-base-unreadable` の finding にして `ok: false` を返す。

## 8. 配線と分割の手順

### 8.1 doctor と CLI

- doctor: check 名 `doc-split`、CI の doctor (governance hard gates) で fail-close する。`process-quality` の `checkL6Completion` と同じ `{ messages, ok }` の形で `checkDocSplit` を呼ぶ。
- PR 前に流す軽い CLI: `ut-tdd doc-split check`。`checkDocSplit` を直接呼び、メッセージを出し、`ok` なら exit 0、そうでなければ exit 1。読み取りだけを行い、harness.db にも `.ut-tdd/` にも書かない。doctor の singleton には入らない (走査は約 120 本の `.md` と `git show` 1 回なので数秒以内に終わる)。CI の往復を待たずに、作業中の worktree で分かる。

### 8.2 既存 2 本の分割

検査を入れたあと、**1 人の担当が直列に**行う。並行して分割すると、分割そのものが肥大の原因だった衝突を再現するからである。1 PR = 1 文書とし、`function-spec.md`、`L7-unit-test-design.md` の順に進める。

1. 節を責務ごとに分ける案を作る。1 つの責務を、L6 側は `L6/<topic>.md`、L7 側は `L7-<topic>-test-design.md` の対にする。分け方の入力は §6 の finding が指す責務の名前と、実際の `##` の並びである。
2. 節を移す。**中身は変えない**。見出しの階層と本文を一字も変えずに移し、移動元には、移動先を指す 1 行だけを残すか、節ごと削る。新しい文書の frontmatter (layer / artifact_type / status / sub_doc / artifact_role / pair_artifact) と冒頭の marker だけを足す。
3. 中身が変わっていないことを機械で確かめる。移動の前後で、(移動元の全行の多重集合) と (移動先の全文書の本文行の多重集合) の差が、足した frontmatter と marker と指示行だけであること。
4. `DOC_SPLIT_BASELINE` の該当行を、同じ PR で実測値に減らす (縮んだのに更新しないと `doc-split-stale-baseline`)。
5. 下の読み先を同じ PR で直す。

### 8.3 `L7-unit-test-design.md` を名指しで読む箇所と直し方

2026-10-14 の `origin/main` で `L7-unit-test-design.md` を名指しで読んでいる箇所を grep で全て挙げた。`src/lint/oracle-test-trace.ts` は名指しで読んでおらず、`docs/test-design/` を再帰的に走査する (`collectOracleDeclarationSites` と `collectOracleIds`) ので、分割の影響を受けない。文中の 2 箇所 (41 行目のコメントと 428 行目のメッセージ) の文言だけを、分割後の正本に合わせて直す。

| 箇所 | 読み方 | 分割後の直し方 |
|---|---|---|
| `src/lint/l6-completion.ts` 41 行 `PAIR_ARTIFACT_RE` | L6 文書の `pair_artifact` が `L7-unit-test-design.md` であることを固定で要求する | `docs/test-design/harness/` 配下で、相手の文書が実在し、相手がこの L6 文書を指すこと、に直す。固定の path を要求しない |
| 同 189〜203 行 `loadL6CompletionInputs` / `canLoadL6CompletionInputs` | `L7-unit-test-design.md` 1 本を `l7Text` に読み、`status` と、各 L6 文書のファイル名が含まれるか (`missingL7DocRefs`) を見る | `docs/test-design/harness/L7-*.md` を全て連結して `l7Text` にし、`status` は `L7-unit-test-design.md` が残るなら従来どおり、ファイル名の参照は連結した全文で探す |
| 同 `DOC_PLAN_RE` と `missingDocPlans` | 各 L6 文書に `plan:` 欄が必須 | 本書は PLAN を持たず `issue:` で出典を指す (PO の方針: 契約の置き場は設計文書と test-design だけ)。`plan:` か `issue:` のどちらかを満たせばよい、に直す |
| `src/lint/ddd-tdd-rules.ts` 191 行 `loadDddTddInputs` と 470 行 `unitOracleSubstanceViolations` | `L7-unit-test-design.md` を `l7Text` に読み、policy の不変条件 oracle が含まれるか (`invariantTraceViolations`) と、`U-` の行の substance を見る | `docs/test-design/harness/L7-*.md` を全て連結して `l7Text` にする。substance の検査は連結後の全行に掛ける |
| `src/doctor/runtime-surface.ts` 94 行 | 必須ファイルとして存在だけを確認する | 分割後も `L7-unit-test-design.md` は残る (縮むだけで消えない) ので変更不要。残さない場合は、必須ファイルの一覧を分割後の文書に直す |
| `tests/l6-completion.test.ts` 171 行 | 実 repo の `L7-unit-test-design.md` を読む | 連結した `l7Text` に直す |
| `src/handover/index.ts` 7 行、`src/runtime/session-log.ts` 5 行、`src/setup/index.ts` 6 行、`src/runtime/forced-stop.ts` 6 行 | コメントが `§1.x` の節を指すだけ (読まない) | 節が別文書へ移ったら、コメントの path を移動先に直す |
| `src/task/classify-policy.ts` 72 行、`src/task/proposal-document-packs-core.ts`、`src/task/proposal-document-packs-operations.ts` | 提案文書の path 一覧に固定で書く (存在は確認しない) | 分割後も `L7-unit-test-design.md` は残るため壊れない。新しい対の文書を提案に含めたいときは一覧に足す |
| `src/setup/vmodel-template-assets.ts` 68〜69 行 | consumer 向け template の `L7-unit-test-design.md` (別の文書) | 変更不要 (本 repo の文書ではない) |

`function-spec.md` を名指しで読む箇所も同様に直す。`src/lint/l6-fr-coverage.ts` の 72 行 (`requiresSubstanceMarker`) と 160 行は、FR registry の `l6_spec` が `function-spec.md` で終わる行を、substance (型本体と pseudocode) を要求する対象にしている。FR の契約表の節を移した場合は、registry の `l6_spec` を移動先の path に更新し、`requiresSubstanceMarker` の一覧に移動先を足す。`src/lint/model-id-doc-drift.ts` 21 行の `MODEL_ID_DOC_DRIFT_TARGETS` と `src/plan/lint-policy.ts` 225 行の一覧は、移動先の文書を足す。

**既存検査との衝突 (本書の凍結時に判明)**: 現在の `l6-completion` は、§8.3 の最初の 3 行のとおり、新しい L6 文書に (1) `pair_artifact` が `L7-unit-test-design.md` であること、(2) `plan:` 欄、(3) `L7-unit-test-design.md` 内のファイル名の参照、を要求する。本書は `L7-unit-test-design.md` を触らず、PLAN も持たないので、実装 PR で上の直しを入れるまで doctor の `l6-completion` は赤になる。この直しは実装 PR の最小配線 (`l6-completion` の読み先の変更) に含める。直し方の方式 (任意の `L7-*.md` を認める) は設計判断であり、レビューで確定する。

## 9. 不変条件 (DbC)

- Pre: 入力は走査対象の文書の path と内容の列、baseline、比較元の baseline (`previousBaseline`、無ければ `null`)。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は `doc-split-required` / `doc-split-stale-baseline` / `doc-split-baseline-grown` / `doc-split-baseline-base-unreadable` / `doc-split-input-unreadable` が 0 件のときだけ true。finding は入力の順序に依存せず、一意に並ぶ。同じ入力から必ず同じ出力を返す (純粋性)。
- Invariant: 値は §3 の定義だけで測り、frontmatter・更新日・git の履歴を推測に使わない。閾値の変更は設計の改訂であり、baseline の追記では通らない (`doc-split-baseline-grown`)。分割で文書の中身を変えない (§8.2 の手順 3)。

## 10. 範囲外

- 文書の意味的な責務の分け方の良し悪し。本検査は見出しと ID の数だけを数え、「どの節がどの責務か」は分割する担当が決める。
- `docs/plans/`、`docs/governance/`、`docs/adr/` の肥大 (対象は設計と test-design だけ)。
- 実行時間や commit の頻度 (文書の更新頻度) による判定。

## 11. 根拠

- issue #1032 (PO 指摘 2026-10-14: 「そもそも設計が 1 枚のドキュメントに依存しすぎ」「文書分割自体が機能してないのが問題。ここもルールやゲートで分割指示が出るようにすべき」)。
- 2026-10-14 の実測: `function-spec.md` 2,515 行、`L7-unit-test-design.md` 3,107 行、同日の設計還流で open の branch 9 本と 7 本が同じ文書を同時に変更。
- baseline の型: `docs/design/harness/L6-function-design/windows-hide-spawn-guard.md` (issue #693) §4。
