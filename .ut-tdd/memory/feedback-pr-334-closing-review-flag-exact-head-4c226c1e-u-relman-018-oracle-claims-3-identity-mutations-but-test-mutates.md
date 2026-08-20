---
memory_id: memory:feedback:pr-334-closing-review-flag-exact-head-4c226c1e-u-relman-018-oracle-claims-3-identity-mutations-but-test-mutates-only-releaseid-mutation-survivor-proven
kind: feedback
title: "PR 334 closing review FLAG exact head 4c226c1e U-RELMAN-018 oracle claims 3 identity mutations but test mutates only releaseId mutation survivor proven"
tags: ["issue-331", "mutation-testing", "pr-334", "release-manifest", "review"]
updated_at: 2026-08-18T04:30:50.699Z
---

## PR #334 non-author closing review = FLAG (blocking 1 / advisory 1) — exact HEAD 4c226c1e3ed41c6af3d89c6dcb15f95b9bb8cd79

CI 3 job green (run 32096090366)。test 7/7 green (snapshot runner、exact HEAD)。

### blocking B-1

追加台帳行 U-RELMAN-018 は identity 3 値 (releaseId / artifactSourceCommit / artifactSetDigest) の変異を主張するが、テストは releaseId 1 値のみ変異させている。実装側 mutation で survivor を実証: adapter の identity 比較から artifactSourceCommit と artifactSetDigest の 2 条件を削除しても attestReleaseChannel 参照テスト全件が 7 passed のまま。隣接 oracle U-RELMAN-009 は per-field 独立変異を明示しており規律とも不整合。是正は it.each で 3 値独立変異 (推奨) か台帳行を releaseId 限定へ書き直すか。

### advisory A-1

PR 本文の「snapshot runner 240s timeout で結果なし」は実測と異なる (単体は数十秒で 7 passed)。実測値へ差し替え推奨。

### 手法メモ

docs 台帳の claim と test の対応を見るときは、実装側を変異させて survivor を取ると claim の裏取り不足が機械的に示せる。
