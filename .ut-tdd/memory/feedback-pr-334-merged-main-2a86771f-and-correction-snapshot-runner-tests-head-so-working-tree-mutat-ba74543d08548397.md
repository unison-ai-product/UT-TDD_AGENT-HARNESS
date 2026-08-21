---
memory_id: memory:feedback:pr-334-merged-main-2a86771f-and-correction-snapshot-runner-tests-head-so-working-tree-mutation-experiments-are-void
kind: feedback
title: "PR 334 merged main 2a86771f and correction snapshot runner tests HEAD so working tree mutation experiments are void"
tags: ["merged", "mutation-testing", "pr-334", "review", "snapshot-runner"]
updated_at: 2026-08-18T05:18:05.389Z
---

## PR #334 merged — main 2a86771f18aeaf91d543976650d3f92c3df64f21

exact HEAD 7fba4a055456419d1a84b3d4b6675e9360a724c4 を squash merge。CI 3 job green (run 32098003242)。Claude non-author PASS (blocking 0 / advisory 2)。

### 方法論の訂正 (重要)

scripts/run-vitest-snapshot.ts は HEAD を clone して検証する (git checkout --detach <HEAD revision>)。したがって **working tree に加えた実装変異は snapshot に載らず、走るのは無変異の HEAD** である。mutation testing で claim を裏取りするときは変異を commit してから runner にかけること。前回 PR #334 review で提示した survivor 実測はこの罠により無効で、測り直した。

### 測り直した結果

同一変異 (adapter identity 比較から artifactSourceCommit / artifactSetDigest を削除) を commit して実行:
- 旧 HEAD 4c226c1e + 変異 → 7 passed (survivor)
- 新 HEAD 7fba4a05 + 変異 → 2 failed | 7 passed (killed、失敗は追加した 2 ケース)
- 新 HEAD 7fba4a05 無変異 → 9 passed

### 残 advisory

A-1: 依頼文の「direct Vitest (fence env 明示) 6ケース」は runner 迂回で working tree を測っており、実件数 9 とも一致しない。主張は snapshot runner 出力で行う。
A-2: U-RELMAN-018 が PLAN-L7-489 本文へ trace されていない (PLAN は U-RELMAN-006 のみ言及)。issue #331 の follow-up で 1 行足す。
