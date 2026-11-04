---
title: "L7 vmodel pair coverage test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/vmodel-pair-freeze.md
status: draft
updated: 2026-11-04
---

# V 字の対の被覆と右腕の実在 テスト設計 (issue #1019 方針 (a)、#1078 の検査漏れ 2 件)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/vmodel-pair-freeze.md` である。
本書はその §8 (規則 4 の被覆 `design-uncovered`、規則 5 の右の `pair_artifact` の実在、規則 6 の走査の向き) を検証する oracle を、候補 ID (`CANDIDATE-U-VPAIR-*`) として宣言する。
既存の `U-VPAIR-001`〜`006` (`L7-unit-test-design.md` §1.13) は、§1〜§3 の規則 1〜3 の oracle であり、本書は再採番も再所有もしない。
共有の `L7-unit-test-design.md` は肥大の当事者なので、索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID を宣言するだけである。昇格は設計書保護 gate §10.3 の三段階に従う: (1) 契約 PR (本書) → (2) src を含まない PR での 1:1 の正式昇格と Red (`it.fails`) → (3) 実装 PR が `it.fails` を `it` に戻す。実装 PR は本書に触れない。

## 2. fixture

- 規則 4・5・6 は `analyzePairFreeze` に `PairDoc` の列 (path、`pair_artifact`、内容、`pairTargetExists`) を直接渡す純関数の入力で作る。実 repo は読まない (014 を除く)。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。
- 011 の実在判定 (fs と git) は `loadPairDocs` の責務であり、temp directory に実 git repository を作り、tag `plans-archive-20990101` と blob を置いて確かめる。
- 013 の `lintForwardFreezeContract` は、既存の fixture (L8 の文書に L5 の basename を含める / 含めない) をそのまま使う。
- 014 は実 repo の走査であり、開発 repo を読むテストとして `test-repository-isolation` の登録が要る。

## 3. oracle 宣言の一覧

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-VPAIR-007` | (被覆 (a)) 左の文書 D (`L6-function-design/x.md`) と、`pair_artifact` が (i) D、(ii) D の dir の表記違い (`dir(D)/` と `dir(D)` の 2 通りで、本文は D の言及を持たない)、(iii) `dir(D)/` で本文が D の言及を持たない、の右の文書。file の D に末尾 `/` を足した `D/` は正常系にしない (現行の規則 3 は `D/` を `trace-orphan` とするため、本書は既存の規則 3 を変えない) | (i) は規則 4 が D を被覆とみなす (規則 3 の孤児も 0)。(ii) は `dir(D)/` と `dir(D)` で規則 4 の被覆判定が同じ (dir 表記の末尾 `/` は無視)。ただし判定するのは規則 4 の被覆だけで、全体の孤児 0 は主張しない。(iii) は D を名指ししないので `design-uncovered` が 1 件 (`path` は D、`detail` に期待する形)。この入力は `dir(D)` の表記違いでも同じ | `pair_artifact == D` を被覆に数えない / dir 表記の `/` の有無で被覆判定が割れる / dir の `pair_artifact` だけで被覆とみなす / 規則 4 の被覆と全体の孤児 0 を取り違える |
| `CANDIDATE-U-VPAIR-008` | (被覆 (b)) `pair_artifact` が `dir(D)/` の右の文書の内容が、(i) D の repo 相対 path を含む、(ii) D の basename だけを含み、その basename は L1〜L6 の左の文書の中で一意、(iii) 別の dir の右の文書 (`pair_artifact` が D の dir と違う) が D の path を含む | (i) と (ii) は被覆。(iii) は `design-uncovered` | path の一致を要求しない (言及なしでも被覆) / 別の dir の右の文書の言及を被覆に数える / 一意な basename の fallback を認めない |
| `CANDIDATE-U-VPAIR-009` | (名前の衝突) `L1-requirements/functional-requirements.md` と `L3-functional/functional-requirements.md` の 2 つの左の文書。L1 の dir を指す右の文書は L1 の path だけを含み、L3 の dir を指す右の文書は basename `functional-requirements.md` だけを含む | L1 は被覆。L3 は basename が一意でないため `design-uncovered` (basename の言及はどちらの D も被覆しない)。L3 の dir を指す右の文書が L3 の path を含めば L3 も被覆 | basename の一致を無条件に被覆とみなす (L3 が通る) / 衝突する basename を全て未被覆にする (path の一致でも落ちる) |
| `CANDIDATE-U-VPAIR-010` | (規則 5 の実在) `pair_artifact` が (i) 実在する file、(ii) 実在する dir (末尾 `/` あり)、(iii) 実在しない path (`docs/plans/PLAN-X-none.md`) の右の文書。`pairTargetExists` は `loadPairDocs` が fs で埋めた値を使う | (i) と (ii) は孤児 0。(iii) は `ref-unresolved` が 1 件 (`path` は右の文書、`detail` は値)。左の文書のどれにも指されていない右の文書でも (iii) は検出される | 実在確認を左の文書から指された右の文書だけに掛ける / dir を不実在とみなす / 値が `docs/test-design/` の `.md` 以外 (data file、dir) なら確認しない |
| `CANDIDATE-U-VPAIR-011` | (アーカイブ表記) temp の git repository に tag `plans-archive-20990101` と、その tag の tree の blob `docs/plans/PLAN-A.md` を置く。右の文書の `pair_artifact` が (i) `plans-archive-20990101:docs/plans/PLAN-A.md`、(ii) tag が無い `plans-archive-20990102:docs/plans/PLAN-A.md`、(iii) tag はあるが blob が無い `plans-archive-20990101:docs/plans/PLAN-B.md`、(iv) 形式が違う `plans-archive-2099:docs/plans/PLAN-A.md` | (i) は孤児 0。(ii)(iii)(iv) は `ref-unresolved` (`detail` は値)。tag を取得していない clone (tag 無し) でも (i) は `ref-unresolved` で fail-close し、黙って通さない | 形式の確認だけで通す ((iii) が通る) / tag の実在だけを確かめる / 解決できないときに通す (fail-open) |
| `CANDIDATE-U-VPAIR-012` | (走査の向きと対象外) (i) 左のどの文書にも指されず、`pair_artifact` が実在しない右の文書、(ii) `pair_artifact` を持たない右の文書 (frontmatter に値なし)、(iii) 左の README と `roadmap.md` (どの右の文書にも名指しされない) | (i) は規則 5 で `ref-unresolved` を 1 件。(ii) は孤児 0 (必須化しない)。(iii) は `design-uncovered` にならない (`isDesignSubDoc` の除外) | 右の文書の走査を左から辿れる範囲に限る / `pair_artifact` なしを孤児にする / README・roadmap を被覆の対象に含める |
| `CANDIDATE-U-VPAIR-013` | (`l8-coverage-missing` の吸収) `lintForwardFreezeContract` に、L8 の文書が `REQUIRED_L5_VERIFICATION_DOCS` の 5 本のうち `if-detail.md` を含まない入力と、5 本すべてを含む入力 | 前者は `l8-coverage-missing` が `detail: "if-detail.md"` で 1 件 (reason の名前と detail は従来のまま)。後者は 0 件。同じ入力で規則 4 の判定関数も `if-detail.md` を未被覆とする (判定関数を共有する) | reason の名前を変える / detail を path に変えて出力を壊す / 規則 4 と判定が割れる (関数を共有しない) |
| `CANDIDATE-U-VPAIR-014` | (実 repo の回帰) 実 repo で `analyzePairFreeze(loadPairDocs())` の孤児のうち reason が `design-uncovered` または規則 5 の `ref-unresolved` のもの | 0 件 (全 L1〜L6 の設計文書が被覆され、全 `pair_artifact` が実在する。#1078 A6 の付け替えと、被覆されない 4 本の名指しの追加が済んだ後) | 実 repo の孤児を許容リストで隠す |
| `CANDIDATE-U-VPAIR-015` | (規則 4 の `ok` への反映) 規則 1〜3 の孤児が 0 で、規則 4 の `design-uncovered` だけが 1 件起きる fixture (被覆されない左の文書 D 1 本を足す) | 孤児はその 1 件だけで、`ok === false` (件数の 0 比較ではなく `ok` を明示で検査) | 規則 4 の孤児を `ok` に反映しない |
| `CANDIDATE-U-VPAIR-016` | (規則 5 の `ok` への反映) 規則 1〜4 の孤児が 0 で、右の文書の `pair_artifact` が実在しない (`pairTargetExists === false`) ことによる規則 5 の `ref-unresolved` だけが 1 件起きる fixture | 孤児はその 1 件だけで、`ok === false` (`ok` を明示で検査) | 規則 5 の孤児を `ok` に反映しない |

## 4. 昇格の順序

- 013 以外の oracle は `src/vmodel/lint.ts` の新しい分岐 (`design-uncovered`、右の `pair_artifact` の実在判定) を要る。実装 PR の前に、(2) の PR で正式 ID へ昇格し、`it.fails` の Red を入れる。
- 014 は、現状の実測が未被覆 4 本・実在しない右の `pair_artifact` 2 本 (2026-11-04) なので、`CANDIDATE` のままで Red にする。0 件になるのは、被覆 4 本の名指しの追加と #1078 A6 の付け替えが入った後である。両方が先に入らなければ、実装 PR は Green にならない。
