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
oracle の正本であり、`CANDIDATE-U-PACKMODE-001`〜`014` を候補として宣言する。昇格・実装は別 PR である。

## 2. 候補の oracle

正本: `docs/design/harness/L6-function-design/pack-exec-mode.md`。
以下は契約からの転記であり、実行済み・Green・正式 oracle 昇格を主張しない。実装は別 PR。
全 ID は実行 bit (ファイルシステム) ではなく Git object の mode だけを観測する。fixture は一時 Git repo を
`core.filemode=false` (Windows 相当) と `true` (Linux) の両方で作る。

| ID | 入力 / 独立変異 | 期待 |
| --- | --- | --- |
| `CANDIDATE-U-PACKMODE-001` | source commit の tree に `100755` を 2 件持つ fixture を sync-pack で copy する (Windows 相当: `core.filemode=false`) | `nextCommands` に `git add` の後・`commit` の前で、`100755` の path ごとに `update-index --chmod=+x -- <path>` が出る。copy evidence の `pack` に同じ path / mode の一覧が残る。`localGitMutationExecuted` は `false` のまま、Pack checkout の index は sync-pack の前後で同一 |
| `CANDIDATE-U-PACKMODE-002` | 期待 mode の入力を、source commit の Git tree と、staged だけ `100755` に変えた index とで変える | 期待値は commit の Git tree 由来のままで、staged 変更は混入しない |
| `CANDIDATE-U-PACKMODE-003` | 手順を実施して作った C1 (`100755` が保たれる) | C1 照合が通る。Windows 相当 (`core.filemode=false`) でも `git ls-tree` が `100755` を返す |
| `CANDIDATE-U-PACKMODE-004` | 手順を省略して作った C1 (path と bytes は同一で `100644` へ落ちる) | C1 の mode 照合が fail-close する。blob 内容が一致していても通らない (blob oid だけの照合への退行が Red) |
| `CANDIDATE-U-PACKMODE-005` | 期待 `100644` の path が C1 で `100755` になる / manifest `artifacts[].mode` だけ書き換える / C1 の別 SHA を後続の公開処理へ渡す | 3 変異とも fail-close する。完全照合であること (`+x` 対象だけの検査への退行) と、検査した C1 SHA が公開処理まで固定されることを確かめる |
| `CANDIDATE-U-PACKMODE-006` | Linux 上で同じ fixture (`core.filemode=true`、実行 bit あり) | 001-005 と同じ判定。Windows と Linux で結果が同じであり、実行 bit の有無が判定を変えない |
| `CANDIDATE-U-PACKMODE-007` | 期待 `100644` の path の C1 の entry を mode `120000` に変える (他は正しい) | fail-close する。これは通常の mode 不一致の条件の反例であり、`120000` 固有の拒否は 011 / 012 が独立に固定する。mutation: mode 不一致の比較を外す退行が Red |
| `CANDIDATE-U-PACKMODE-008` | 期待 path の 1 件 (`scripts/ut-tdd` の出荷先) を C1 から削除する (他の mode は正しい) | fail-close する。mutation: C1 に在る path だけを走査し、期待 path の欠落を見ない退行が Red |
| `CANDIDATE-U-PACKMODE-009` | 期待集合に無い extra を `100755` で C1 に足す (他は正しい) | 本照合が fail-close する。mutation: 「期待しない `100755`」の条件を外す / 期待集合に在る path だけを検査する退行が Red。`100644` の extra は本照合の責務外で、013 が公開の gate で拒否する |
| `CANDIDATE-U-PACKMODE-010` | 成功の対照。正当な変換を通した C1: path 写像 (`docs/skills/` → `skills/`) と `package.json` の書き換え (`transformCleanDistributionArtifact`。bytes と digest は source と異なる) を経て、mode は期待どおり | 本照合は **PASS** する (変換後の bytes の違いを理由に落とさない)。bytes や digest を source と照合する退行が Red。4.3 の「bytes を比べない」を固定する |
| `CANDIDATE-U-PACKMODE-011` | 期待集合に無い extra を mode `120000` で C1 に足す (他は全て正しい。期待 mode との不一致も、`100755` の条件も該当しない) | 本照合が fail-close する。mutation: `120000` 固有の拒否 (条件 (d)) を外す退行だけが Red (007 は通常の不一致で落ちるため、これを検出できない) |
| `CANDIDATE-U-PACKMODE-012` | 源由来の期待 mode が `120000` で、C1 の mode も `120000` (不一致なし。path は期待集合に在る) | 期待値の導出の時点で fail-close する (公開の契約が受け付けない mode を期待値にしない)。mutation: `120000` 固有の拒否を外し、一致なら通す退行だけが Red |
| `CANDIDATE-U-PACKMODE-013` | 統合 oracle (実 C1 を独立に変異。モックの `observe` を使わない): 固定した C1 SHA に、期待集合に無い `100644` の extra entry を足す。mode 照合は通る | 公開が拒否される (`auditPackPublication` が `partial_publication` で、`attested` にならない)。mutation: 独立の観測経路を配線しない / extra を見ない退行が Red。観測経路の実装と配線は実装 PR の受け入れ基準 (`pack-exec-mode.md` §4.3) |
| `CANDIDATE-U-PACKMODE-014` | 統合 oracle (013 と同じ実 C1): mode は正しく、変換していない artifact の bytes だけを C1 側で改変する。mode 照合は通る | 公開が拒否される (`attested` にならない)。mutation: blob を読まない / mode と path だけ比べる観測の退行が Red。`package.json` のように変換で bytes が source と異なる正当な C1 (010) は引き続き通す |

001-006 のうち bytes の一致を要求するものは無い (004 の bytes は fixture の前提であり、照合の対象ではない)。

mutation: 期待値を index (`ls-files -s`) から読む退行、`+x` 対象だけを検査する退行、blob oid だけを比べる退行、sync-pack が
`update-index` / `git add` を実行する退行 (001 の index 同一性が Red)。

