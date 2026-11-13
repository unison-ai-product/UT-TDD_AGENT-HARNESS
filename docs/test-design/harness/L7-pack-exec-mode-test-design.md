---
title: "L7 Pack 実行可能ファイル mode 保持 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/pack-exec-mode.md
status: confirmed
updated: 2026-11-12
issue: 821
---

# Pack の実行可能ファイル mode の保持 テスト設計 (issue #821)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/pack-exec-mode.md` である。共有の
`docs/test-design/harness/L7-unit-test-design.md` には行を足さない (別 lane が分割・縮小中のため)。本書が
oracle の正本であり、`CANDIDATE-U-PACKMODE-001`〜`015` を候補として宣言する。昇格・実装は別 PR である。

## 2. 候補の oracle

正本: `docs/design/harness/L6-function-design/pack-exec-mode.md`。
以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。実装は別 PR。
全 ID は実行 bit (ファイルシステム) ではなく Git object の mode だけを観測する。fixture は一時 Git repo を
`core.filemode=false` (Windows 相当) と `true` (Linux) の両方で作る。

各 oracle は「その oracle が守る条件だけが成立し、他の条件は全て満たされる」入力を 1 つだけ持つ (§3 の行列)。
条件 (a)〜(h) の定義は `pack-exec-mode.md` §4.3 のとおり。

| ID | 入力 / 独立変異 | 期待 |
| --- | --- | --- |
| `CANDIDATE-U-PACKMODE-001` | source commit の tree に `100755` を 2 件持つ fixture を sync-pack で copy する (Windows 相当: `core.filemode=false`) | `nextCommands` に `git add` の後・`commit` の前で、`100755` の path ごとに `update-index --chmod=+x -- <path>` が出る。copy evidence の `pack` に同じ path / mode の一覧が残る。`localGitMutationExecuted` は `false` のまま、Pack checkout の index は sync-pack の前後で同一 (照合の条件には触れない: 方式 A の出力) |
| `CANDIDATE-U-PACKMODE-002` | 期待 mode の入力を、source commit の Git tree と、staged だけ `100755` に変えた index とで変える | 期待値は commit の Git tree 由来のままで、staged 変更は混入しない (期待値の入力の独立) |
| `CANDIDATE-U-PACKMODE-003` | 成功の対照 1: 手順を実施して作った C1 (`100755` が保たれる。全条件を満たす) | 照合が通る。Windows 相当 (`core.filemode=false`) でも `git ls-tree` が `100755` を返す |
| `CANDIDATE-U-PACKMODE-004` | (b) だけ: 期待 `100755` の path が C1 で `100644` (path と bytes は同一、他は全て正しい。手順を省略した C1) | fail-close。blob 内容が一致していても通らない |
| `CANDIDATE-U-PACKMODE-005` | (b) だけ: 期待 `100644` の期待集合内の path が C1 で `100755` (他は全て正しい。(c) は期待集合外だけを対象にするので成立しない) | fail-close |
| `CANDIDATE-U-PACKMODE-006` | Linux 上 (`core.filemode=true`、実行 bit あり) で 004 と同じ fixture | 004 と同じ判定。実行 bit の有無が判定を変えない |
| `CANDIDATE-U-PACKMODE-007` | (a) だけ: 期待 path の 1 件 (`scripts/ut-tdd` の出荷先) を C1 から削除 (残りの mode は全て正しい) | fail-close |
| `CANDIDATE-U-PACKMODE-008` | (c) だけ: 期待集合外の path を mode `100755` で C1 に足す (他は全て正しい) | fail-close |
| `CANDIDATE-U-PACKMODE-009` | 成功の対照 2: 正当な変換を通した C1 (path 写像 `docs/skills/` → `skills/` と書き換え済み `package.json`。bytes と digest は source と異なり、mode は期待どおり) | 照合が **PASS** する (bytes を理由に落とさない) |
| `CANDIDATE-U-PACKMODE-010` | (d) だけ: 期待集合外の path を mode `120000` で C1 に足す (期待集合内の mode は全て正しく、`100755` の extra も無い) | fail-close |
| `CANDIDATE-U-PACKMODE-011` | (e) だけ: `expectedPackModes` に、source の Git tree の mode が `120000` の entry を 1 件含む入力を渡す。**C1 は渡さない** (C1 側の (d) が成立する余地を作らない) | 期待値の導出の段階で fail-close する (`120000` を期待 mode として返さない) |
| `CANDIDATE-U-PACKMODE-012` | 期待値の入力の独立: manifest の `artifacts[].mode` だけを書き換え、C1 と source は正しい | どの条件も成立せず、照合は C1 と source の mode だけで決まり PASS する (manifest を期待値の入力にする退行が Red)。manifest 単独の書き換えの拒否は既存の parse が持つ (`artifactInventoryDigest` が mode を含み、不一致は manifest を拒否する。`src/schema/release-manifest.ts:110-125`、`:283-310`) |
| `CANDIDATE-U-PACKMODE-013` | (f) だけ: C1 の内容は全て正しく、照合した C1 と別の SHA を後続の公開処理へ渡す | 公開が拒否される (同じ gate が SHA の同一性を確かめる) |
| `CANDIDATE-U-PACKMODE-014` | (g) だけの統合 oracle (実 C1 を独立に変異。モックの `observe` を使わない): 固定した C1 SHA に期待集合外の `100644` の extra を足す。mode 照合の全条件は成立しない | 公開が拒否される (`auditPackPublication` が `partial_publication` で、`status: "attested"` にならない)。観測経路の実装と配線は実装 PR の受け入れ基準 (`pack-exec-mode.md` §4.3) |
| `CANDIDATE-U-PACKMODE-015` | (h) だけの統合 oracle (014 と同じ実 C1): mode と path は正しく、変換していない artifact の bytes だけを C1 側で改変する | 公開が拒否される (`attested` にならない)。変換で bytes が source と異なる正当な C1 (009) は通る |

## 3. 条件と oracle の行列

「発火」はその条件が成立して拒否に寄与すること、「-」は成立しないこと。`pure` は、その列の条件だけが発火する行である。
mutation は、その行が Red になるべき退行を 1 つだけ書く。

| ID | (a) 欠落 | (b) in-set の mode 違い | (c) 外の `100755` | (d) `120000` | (e) 期待が `120000` | (f) SHA 不一致 | (g) 外の `100644` extra | (h) bytes 改変 | その行が Red にする mutation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 003 | - | - | - | - | - | - | - | - | 全条件が成立しない入力を落とす過剰拒否 (偽陽性) |
| 004 | - | 発火 (pure) | - | - | - | - | - | - | (b) の比較を外す / blob oid だけで比べる |
| 005 | - | 発火 (pure) | - | - | - | - | - | - | (b) の比較を `+x` 期待の path だけに絞る (逆向きの変化を見ない) |
| 006 | - | 発火 (pure) | - | - | - | - | - | - | 実行 bit (ファイルシステム) で判定する |
| 007 | 発火 (pure) | - | - | - | - | - | - | - | C1 に在る path だけを走査する |
| 008 | - | - | 発火 (pure) | - | - | - | - | - | (c) の条件 (期待集合外の `100755`) を外す / 期待集合内だけを検査する |
| 009 | - | - | - | - | - | - | - | - | bytes や digest を source と照合する |
| 010 | - | - | - | 発火 (pure) | - | - | - | - | (d) の条件 (`120000` 固有の拒否) を外す |
| 011 | - | - | - | - | 発火 (pure) | - | - | - | (e) の条件 (導出での `120000` の拒否) を外す (`120000` を期待 mode として返す) |
| 012 | - | - | - | - | - | - | - | - | manifest の mode を期待値の入力にする |
| 013 | - | - | - | - | - | 発火 (pure) | - | - | 照合した SHA を公開処理へ固定しない |
| 014 | - | - | - | - | - | - | 発火 (pure) | - | 独立観測を配線しない / extra を見ない |
| 015 | - | - | - | - | - | - | - | 発火 (pure) | blob を読まない / mode と path だけ比べる観測 |

001 と 002 は照合の条件の外 (方式 A の出力と期待値の入力の独立) であり、行列に載せない。
002 の mutation は期待値を index (`ls-files -s`) から読む退行、001 の mutation は sync-pack が `update-index` / `git add` を実行する退行 (index 同一性が Red)。
どの条件の列にも pure の行が 1 つ以上ある。

分離できない組と、その扱い: 期待集合内の path が C1 で `120000` のときは (b) と (d) が同時に成立する。この入力は単独の oracle にしない
(どちらの条件を外しても Red のままで、片方の削除を検出できないため)。(d) の削除は 010 (期待集合外の `120000`) が、(b) の削除は 004 / 005 が検出する。
(b) と (c) は、(c) を期待集合外だけの条件と定義して分離した (旧記述では期待 `100644` の path が `100755` になる入力が両方を満たした)。
(e) と (d) は、(e) を C1 を読む前の導出の関数 (`expectedPackModes`) だけの条件にして分離した。011 は C1 を入力に持たないので (d) が寄与できず、(e) の削除は 011 だけが Red にする。逆に 010 は期待集合に `120000` を含まないので (e) が寄与できない。

過去の記述の見直し (本ラウンドで確認した項目): 旧 005 の 3 変異 (期待外の mode 変更 / manifest だけの書き換え / 別 SHA) は 005 / 012 / 013 に分けた。
旧 007 (期待 `100644` が `120000`) は (b) と (d) の二重で単独の反例にならないため廃した。旧 011 / 012 は (d) / (e) に対応する pure 入力へ、旧 013 / 014 は (g) / (h) に整理した。
旧 004 の「blob oid だけの照合への退行」は 004 の mutation に残した。
