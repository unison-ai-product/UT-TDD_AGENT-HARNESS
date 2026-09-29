# SPIKE-TABLE: PLAN-L6-711 rev 3 再現 spike の分類表 (tracked 版、2026-09-29)

正本の出力は同じディレクトリにある。`aggregate.json` (集計)、`records.json` (全 340 record)、`spike-output.md` (標準出力)、`exit-code.txt` (`exit=0`)、`composition-out.jsonl`。
実行コマンドは `README.md` を参照。scratch 版で報告した値 (字義式 0/300、Tier 2 107/120) と旧 spike の 89/66/23 は、どちらも本表が置き換える。
差分が出た原因は、introduction commit の規則を §2 の minimal introducer に改めたことである。

## 1. 集計 (target `895ac2e93c1a820e8a5c736bf8787e4f15823e06`、primitive は `60099e55`。両者の間で src/plan-admission・src/plan-asset・src/kernel に差分は無い)

| 区分 | 件数 |
| --- | --- |
| projection records (母集団) | 340 |
| T0 introduction commit なし (receipt を含む blob が target の履歴に無い) | 23 |
| T0 introduction commit が複数 (minimal introducer が 2 件以上。seq 234 / 254 / 304) | 3 |
| Tier 1 対象 | 314 |
| Tier 1 content_digest 一致 | 314 / 314 |
| **advisor 字義式 (receipt 込み) = stripped 形** | **0 / 314** |
| rev 1 (draft) | 26 |
| legacy bootstrap | 27 |
| admission 復元不能 | 138 |
| base record が projection に無い | 7 |
| **Tier 2 対象** | **116** |
| **Tier 2 再導出成功** | **103 / 116** |
| うち sourceCommit = first parent | 84 |
| うち sourceCommit = history 書き換え前の commit | 19 (Git 状態の内訳: present-unreachable 4、absent-from-odb 15) |
| Tier 2 undecided (hint が得られない) | 13 (draft-base 7、actor-or-commit 6) |
| Tier 2 undecided (hint はあるが digest が一致しない) | 0 |
| base 形: stripped / literal / その他 (draft base) | 95 / 0 / 8 |
| **母集団全体に対する再導出率 (歴史的な下限)** | **103 / 340 = 30.3%** |
| 経路別の再導出 (`per_path`): draft / revise / rechain | 0/33、101/303、2/4 |
| 全連鎖の byte 照合 (seq 330 / 338 / 340 / 172) | 4 / 4 |

## 2. introduction commit の規則 (spike 分類専用。本番の verifier は使わない)

- 参照する ref は `{target}` だけとする。`--extra-ref` は sourceCommit の**候補の生成**にだけ使う。introduction commit の判定には使わない。
- 辿り方は `git rev-list --full-history --parents <target> -- <path>` とする。history の簡略化は行わない。
- commit C が digest d の minimal introducer であるとは、次の 2 つが両方成り立つことをいう。
  - C の path の blob が d を含む。
  - C のどの parent の path の blob も d を含まない。
- minimal introducer が 1 件なら、それを introduction commit とする。0 件なら `spike-no-introduction-commit`、2 件以上なら `spike-ambiguous-introduction` とする。tie-break はせず、committer / author の時刻も使わない。
- `source_commit_git` (`reachable-from-target` / `present-unreachable` / `absent-from-odb`) は、実行する clone の ref と object の状態に依存する。したがって本番の合否の根拠にしない (DESIGN §J-2)。

## 3. 読み取り

1. 字義式は 0/314 で、構成上偽である。
2. stripped 形の一般則には反例が 8 件ある。いずれも base が draft rev 1 で、canonical payload は draft command JSON だった。したがって per-instance 証明 (案 B) が必要である。
3. first-parent 規則には反例が 19 件ある。sourceCommit は opaque な committed preimage として、hint 証明で受理する。
4. 母集団全体を分母にした適用率は 30.3% で、これは下限である。将来の record については、DESIGN §J-3 の schema v3 preimage 投影と U-RECHAIN-031 の経路別 AC で適用率を担保する。
