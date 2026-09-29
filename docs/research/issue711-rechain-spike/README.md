# issue #711 PLAN-L6-711 rev 3: merge-time rechain の再現 spike 資材

PLAN-L6-711 rev 3 (案 B) の freeze 判定に使う、再現可能な証拠である。**読み取り専用**の spike で、次のことはしない: Git の読み出し以外の操作、harness.db へのアクセス、repo への書き込み。
production code は変更していない。本ディレクトリは Research の成果物であり、正本の設計 / test-design ではない。
正本への反映は、PLAN-L6-711 の改訂 PR で行う。

## ファイル

| file | 内容 |
| --- | --- |
| `spike-repro.mts` | 分類 spike。target の tracked projection の全 record を分類する |
| `composition-check.mts` | assembler → `derivePlanRevisionDigests` → `TrackedReceiptRenderer` の全連鎖が、tracked の bytes と一致するかを確かめる |
| `hints.json` | 未信頼の hint の snapshot。ローカルの revise manifest 131 件から、command_id / actor / source_commit / revision_digest / recorded_at / branch だけを抽出した。receipt_digest の再導出で一致した場合にだけ使う |
| `records.json` | 全 340 record の機械可読な分類 (seq、record_digest、command_id、path、cls、reason ほか) |
| `aggregate.json` | 期待する集計 |
| `spike-output.md` / `exit-code.txt` | 期待する標準出力と exit code |
| `composition-out.jsonl` | 全連鎖の byte 照合結果 (seq 330 / 338 / 340 / 172) |
| `SPIKE-TABLE.md` / `DESIGN.md` / `ORACLES.md` | 表の読み取り、PLAN 改訂案、candidate oracle |

## 実行 (Git Bash、Node 24、依存は導入済み)

```bash
git fetch origin archive/pr529-c5dce6c1-before-subject-repair   # history 書き換え前の commit を含む ref
cd docs/research/issue711-rechain-spike
node --experimental-strip-types spike-repro.mts --repo "$(git rev-parse --show-toplevel)" \
  --target 895ac2e93c1a820e8a5c736bf8787e4f15823e06 --hints hints.json \
  --extra-ref origin/archive/pr529-c5dce6c1-before-subject-repair \
  --json records.json --aggregate aggregate.json > spike-output.md; echo "exit=$?"
node --experimental-strip-types composition-check.mts "$(git rev-parse --show-toplevel)" 895ac2e9 records.json 330 338 340 172
```

`--repo` の `src/` の primitive は、`895ac2e9` から本 branch の base (`60099e55`) までの間、`src/plan-admission`・`src/plan-asset`・`src/kernel` に差分が無い (`git diff --stat 895ac2e9 60099e55 -- src/plan-admission src/plan-asset src/kernel` の出力が空)。
所要時間は約 5〜10 分である。
