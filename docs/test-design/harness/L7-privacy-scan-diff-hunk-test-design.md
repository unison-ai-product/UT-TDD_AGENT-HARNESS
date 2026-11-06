---
title: "L7 privacy scan diff hunk test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/privacy-scan.md
status: confirmed
updated: 2026-11-05
issue: 1467
---

# Privacy scan diff hunk のテスト設計 (issue #1467)

## 1. 位置付けと範囲

対になる L6 契約は `docs/design/harness/L6-function-design/privacy-scan.md` の diff mode (§2) である。
本書は、通常の unified-diff file header `+++ b/<path>` と、hunk 内の追加内容が偶然 `+++ ` で始まる行の区別、および追加行が後続 commit で削除されても履歴検査に残ることを検証する。
既存の privacy scan 契約 (`U-PRIVSCAN-001`〜`018`) を再定義せず、今回の parser 境界に必要な候補 oracle だけを追加する。共有 `L7-unit-test-design.md` は変更しない。

この範囲は `loadDiffPrivacyUnits` が返す各 commit の追加内容を `analyzePrivacyScan` が判定する経路に限る。merge commit、commit metadata、rename-only path、CI/distribution 配線、baseline、実 repo の走査は対象外である。

## 2. Fixture と実行方法

- 各 oracle は一時ディレクトリ内に独立した Git repository を作り、専用の synthetic commit author、固定した LF、署名なし commit を使う。scratch の親は `UT_TDD_1467_SCRATCH_ROOT` で指定し、未指定時だけ CI 用 `tmpdir()` に fallback する。実 repo / 実利用者 home / 実 denylist は読まない。
- `<P>` は 65 文字を超える local part と domain をテスト実行時に複数の文字列から組み立てる、実在しない email 形文字列である (local part の長さが email の上限を超える)。scanner の形検出対象にはなるが実在アドレスではない。ソース内に email の完成形を書かない。既存の private-name fixture や denylist fixture は再利用せず、実名・実在の個人情報を記述しない。
- `+++ b/<path>` は Git が生成する正規 file header であり、header 自体を内容の追加として走査しない。ファイル内の `++ <P>` は patch 上 `+++ <P>` に見えるが、hunk の追加内容として行番号・file path を保って走査する。
- `CANDIDATE-U-PRIVDIFF-001` は通常の `it` として Red を囲まず、必要な経路の前提 (複数ファイル header、通常追加、削除行の非対象) を検証する。これにより通常追加を拾う regression 経路が独立に通ることを示す。
- `CANDIDATE-U-PRIVDIFF-002` は新規ファイルの plus 行だけの fixture を扱い、正規 file header と hunk 内の `+++ <P>` の基本境界を検証する。
- `CANDIDATE-U-PRIVDIFF-003` は既存ファイルの置換 fixture を `beforeAll` で構築する。別の通常 `it` で add/delete が別 commit であること、A の `-U0` patch の同一 hunk に `--- x` の直後 `+++ <P>` が現れること、loader の `found`、履歴全体の analyzer が例外なく `{ ok: boolean, findings: array }` を返すこと、および head tree に `<P>` がないことを検証する。通常追加の検出器健全性は `CANDIDATE-U-PRIVDIFF-001` と `002` の人工 `PrivacyUnit` で確認する。これらの前提確認は Red assertion の `it.fails` の外で行い、`ok` の値は固定しない。`it.fails` には `docs/rewrite.md` の追加 commit に帰属する finding と `ok=false` の期待を置く。

## 3. 候補 oracle

| ID | 入力 | 期待 | 識別する不具合 |
| --- | --- | --- | --- |
| `CANDIDATE-U-PRIVDIFF-001` | 一時 repo の base に既存 `<P>` 行を持つファイルと無害な別ファイルを commit する。次の commit で既存 `<P>` 行を削除し、異なる 2 ファイルへ `<P>` を通常の追加行として追加する。base から head までを `loadDiffPrivacyUnits` で読み、diff mode の `analyzePrivacyScan` に渡す | 通常の `+++ b/<path>` header は内容 finding にならず、2 つの追加がそれぞれ正しい path・追加 commit の 1 始まり行番号で出る。削除された既存 `<P>` は finding に出ない。finding は 2 件で `ok=false` | 正規 file header を内容行にする / 複数ファイルの一方を落とす / 通常追加を落とす / 削除行を走査する |
| `CANDIDATE-U-PRIVDIFF-002` | base commit の後、`docs/plus.md` に `++ <P>` だけを加えた commit A と、その行を削除する別 commit B を作る。通常 `it` は A/B の別 commit、A の patch にある正規 header と hunk 行 `+++ <P>`、loader 成功、head tree に `<P>` が無いことを確認し、人工 `PrivacyUnit` で通常追加の検出器健全性も確認する。続く `it.fails` は履歴の loaded units を diff mode で走査する | `docs/plus.md@<A の先頭 12 桁>:1:privacy-email-hit` が報告され、`ok=false`。finding は B ではなく A に帰属する。A の patch に現れる `+++ <P>` は hunk 内追加内容なので、path/header として消費しない。履歴中には他の finding がなく、これを落とすと `ok=true` になる | hunk 行が `+++ ` で始まると file header と誤認して追加内容を落とす / 履歴終端の木だけを見るため B で消えた追加を落とす / 誤った header の path を finding location に使う |
| `CANDIDATE-U-PRIVDIFF-003` | base の既存 `docs/rewrite.md` に `-- x` を置き、commit A で `++ <P>` に置換し、commit B で `-- x` に戻す。通常 `it` は A の `-U0` patch の同じ hunk に `--- x` の直後 `+++ <P>` があること、base/A/B が別 commit、loader 成功、履歴 analyzer の戻り値形状、head tree に `<P>` がないことを確認する | `it.fails` は `docs/rewrite.md@<A の先頭 12 桁>:1:privacy-email-hit` と `ok=false` を要求する。A の追加内容を取りこぼすと、B ではその値が削除済みなので finding 0 件・`ok=true` となる | `--- ` 行を見て hunk を抜ける / `--- ` の直後の `+++ ` を file header と誤認する / history 終端だけを検査する |

`<P>` は 65 文字を超える local part を含む架空の値で、全体を実行時に連結して生成する。候補 001 と候補 002 の人工 unit で通常追加を検出器が拾うことを確認する。候補 002 と003の Git history は追加→別 commit 削除とし、003 は同一 hunk 内の削除直後に追加が来る既存ファイル置換である。単一 commit の patch parser 単体テストだけでは置き換えない。

## 4. Red の判別性と非対象

候補 001 は正常系として通常 file header・通常追加・削除・複数ファイルを assertion の集合で分けている。候補 002/003 の通常 prereq は patch、別 commit の履歴、loader、head tree、analyzer の戻り値形状を `it.fails` の外で確かめる。003 の Red 判定点は「置換 commit A の `docs/rewrite.md` 1 行目に email finding があり、`ok=false` になるか」である。現行 parser が追加を落とすと、後続 B でその値はなくなっているため finding 0 件・`ok=true` となり、別の通常 finding による false-green はない。diff loader が unreadable の場合は通常 prereq assertion でテスト失敗として止める。

この追加テストは `src/lint/privacy-scan-inputs.ts`、L6 文書、PLAN、ledger、共有 L7 unit index を編集しない。実装変更と CANDIDATE ID の正式 ID への昇格は本契約 PR の範囲外とする。
