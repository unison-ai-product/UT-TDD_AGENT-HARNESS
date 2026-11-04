---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_design_split_family
pair_artifact: docs/test-design/harness/L7-design-split-family-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1530
---

> **L6 contract marker**: 本書は、1 つの設計文書を層ディレクトリのサブフォルダへ分割した「分割家族」の契約である (未実装の目標契約。実装は本書の凍結後に別 PR で行う)。oracle (CANDIDATE-U-SPLITFAM-001〜) は `docs/test-design/harness/L7-design-split-family-test-design.md` が固定する。方式判断は #1530 の control コメント (2026-11-04、advisor `claude-fable-5-1` `--decision design`) による。

# 設計文書の分割家族 — 関数設計 (issue #1530)

## 1. 目的と範囲

設計文書が大きくなると、層ディレクトリの下にサブフォルダを切って分割したくなる。consumer の実運用で観測した構成である。今の `designLayerFromPath` は直下 1 段の `.md` しか層に結び付けない。そのため 2 段目以下の文書は、どの gate にも入らず、黙って検査の外に出る。

本書は、この「黙って外れる」状態をなくす。分割した文書を、入口 1 本と子の集まりとして機械が扱えるようにする。

- 対象: `docs/design[/harness]/L[1-6]-*/` 配下の設計 `.md`。
- 対象外: test-design 側 (§7)、consumer への配布 (#1531)、本体の文書 (本体のサブフォルダは 0 本)。

## 2. 用語

| 語 | 意味 |
|---|---|
| 入口 | 層ディレクトリ直下の設計 `.md` (深さ 1)。pair と status を持つ |
| 子 | 層ディレクトリの 2 段目以下 (深さ 2 以上) の設計 `.md` |
| 分割家族 | 1 つの入口と、その入口を `split_of` で指す子の集まり |

## 3. 規則

frontmatter に足すキーは 1 つだけである。`split_of: <入口の path>` (1 行、子だけが持つ)。入口側に子の一覧は書かない。一覧と実ファイルの二重管理を避けるためである。

1. **split-orphan**: 深さ 2 以上の設計 `.md` に `split_of` が無ければ違反にする。`README.md` と `roadmap.md` は従来どおり除外する。
2. **split-target-invalid**: `split_of` が次のいずれかなら違反にする。
   - 実在する文書を指していない。
   - 子と同じ層ディレクトリ直下 (深さ 1) の文書ではない (別の層、別の子、サブフォルダの文書、自分自身を指す)。
3. **split-child-doc-type**: 子が `doc_type_id` を持てば違反にする。入口用の ID 抽出が子にも走るのを防ぐ。
4. **pair と status は入口だけが持つ**。子は pair 検査 (pair-missing / ref-unresolved / trace-orphan) と層ごとの status 集計の対象外とする。`isDesignSubDoc` の意味は「入口か」に固定する。
5. **ID 抽出は家族単位**。画面 ID などの抽出は、入口とその子を合わせた集合から集める (§5)。
6. `split_of` は既存の 1 行パーサ `fmValue` (`src/lint/shared.ts`) で読める。パーサは変えない。

## 4. 検出の置き場

`analyzePairFreeze` (`src/vmodel/lint.ts:120`) に、子を見る小さな分岐を足す。`designLayerFromPath` (`:75`) と `isDesignSubDoc` (`:82`) の正規表現は変えない。深さ 1 だけに合うまま保つので、既存の 12 か所は子を受け取らない。子の判定は、新しく足す関数 `designSplitChildLayer(path): string | null` (深さ 2 以上の層を返す) で行う。

- rule 3 (trace-bidir) の dir 集合参照 (`:163-172`) は、入口の `dirOf` だけを見る。test-design 側の `pair_artifact: docs/design/.../L2-screen/` は、サブフォルダを含む集合参照として既に成立する。変更しない。
- 違反の reason は `PairOrphan.reason` に `split-orphan` / `split-target-invalid` / `split-child-doc-type` を足す。

## 5. `designLayerFromPath` を使う 12 か所への影響

`designLayerFromPath` は pair-freeze 専用ではない。実測 (2026-11-04、`origin/main`) の grep 12 件を、子 (深さ 2 以上) に対する振る舞いと合わせて列挙する。定義と import は呼び出しではないが、12 件に含めて数える。

| # | 場所 | 何に使うか | 子に対する振る舞い |
|---|---|---|---|
| 1 | `src/vmodel/lint.ts:75` | 定義 (深さ 1 の正規表現) | 変更しない。子は `null` のまま |
| 2 | `src/vmodel/lint.ts:84` | `isDesignSubDoc` の判定 | 「入口か」の意味に固定。子は `false` (pair・status の対象外) |
| 3 | `src/vmodel/lint.ts:145` | pair-missing の層表示 (frontmatter `layer` 欠落時の補完) | 入口だけが通る。子は §3 の規則 1〜3 で別に判定する |
| 4 | `src/vmodel/lint.ts:697` | `analyzeVerificationGroups` の層群の絞り込み | 子は群の confirmed / draft 件数に数えない |
| 5 | `src/gate/static.ts:35` | import | 変更なし |
| 6 | `src/gate/static.ts:114` | 層ごとの `layerDocs` (confirmed / placeholder / draft の件数) | 子は件数に数えない。入口の status だけが家族を代表する |
| 7 | `src/gate/static.ts:117` | 層ごとの孤児 path の絞り込み | split 違反の path は子なので、`designSplitChildLayer` でも層を引いて同じ層の孤児に数える |
| 8 | `src/gate/right-arm-static.ts:11` | import | `designSplitChildLayer` と `splitChildrenOf` を足す |
| 9 | `src/gate/right-arm-static.ts:544` | L3 の本文の束ね (`g11L3Texts`、basename で振り分け) | 入口の basename が一致する文書へ、その子の本文を連結する |
| 10 | `src/gate/right-arm-static.ts:572` | `pairLayerIds` の `doc_type_id` と太字 ID の収集 | 入口と子の本文から収集する。子は `doc_type_id` を持たない (規則 3) ので、ID になる `doc_type_id` は入口のものだけ |
| 11 | `src/gate/right-arm-static.ts:586` | L3 見出し ID の束ね (`g12L3HeadingIds`) | 9 と同じ。入口の本文に子の本文を足す |
| 12 | `src/gate/right-arm-static.ts:618` | `l2ScreenIds` (L2 画面 ID、`DOC-L2-SCREEN` の「第4章 画面一覧」) | 入口が `DOC-L2-SCREEN` を持つとき、入口と子の本文から ID を集める |

実装の要点は、入口から子を引く補助 1 つ (`splitChildrenOf(entryPath, docs)`: `split_of` が入口を指す子を返す) を `src/vmodel/lint.ts` に置き、上の 9〜12 だけがそれを使うことである。他の箇所は、子を渡されない前提で変更しない。

## 6. fail-close と不変条件

- 違反は `ok: false` にする (warning にしない)。3 つの reason はどれも gate を落とす。
- 子ファイルが 1 本消えて別の子が残る場合は、残った子の `split_of` が指す入口が在るので違反にならない。入口が消えて子が残る場合は、子の `split_of` が `split-target-invalid` になる。
- 不変条件 1: サブフォルダを持たない repo (本体) では、今と出力が同一である。
- 不変条件 2: 子は pair・status・`doc_type_id` を持たない。入口が家族の唯一の代表である。
- 不変条件 3: `split_of` の参照は入口 1 段だけで、鎖 (子が子を指す) は作らない。鎖は `split-target-invalid` になる。

## 7. 範囲外

- consumer への配布 (テンプレート・skill への分割規則の追加) は #1531 で扱う。
- test-design 側の分割は扱わない。rule 3 の dir 集合参照が既に受け付ける。
- `fmValue` の複数行対応、`split_parts` のような一覧キーは作らない。
- 採らなかった案: 正規表現を全深さに広げる案 (子が 12 か所の全 gate に一斉に入る)、フォルダ 1 つを 1 文書とする案 (入口を移すと consumer の参照 path が壊れ、`README.md` の除外規則とも衝突する)。

## 8. 単位の契約 (DbC)

本書が足す関数の契約名は次の 2 つである (実装時の名前は §4 / §5 の記述に従う)。

- `designSplitChildLayer(path) => string | null`: 深さ 2 以上の設計 `.md` の層を返す。入口と対象外の path は `null`。
- `splitChildrenOf(entryPath, docs) => Doc[]`: `split_of` が入口を指す子を返す。

- pre: `path` は repo 相対の設計文書 path である。`split_of` は `fmValue` で読める 1 行の値である。
- post: 違反は `split-orphan` / `split-target-invalid` / `split-child-doc-type` の reason で `ok: false` になる (§6)。
- invariant: サブフォルダを持たない repo では出力が現行と同一である。子は pair・status・`doc_type_id` を持たず、`split_of` は入口 1 段だけを指す (§6)。
- oracle: CANDIDATE-U-SPLITFAM-001〜013 が上記の規則を固定する。
