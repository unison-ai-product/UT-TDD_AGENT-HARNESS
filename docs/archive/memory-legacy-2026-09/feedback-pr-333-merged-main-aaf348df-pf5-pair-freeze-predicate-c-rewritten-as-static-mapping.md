---
memory_id: memory:feedback:pr-333-merged-main-aaf348df-pf5-pair-freeze-predicate-c-rewritten-as-static-mapping
kind: feedback
title: "PR 333 merged main aaf348df PF5 pair freeze predicate C rewritten as static mapping"
tags: ["issue-251", "merged", "pair-freeze", "pr-333", "release-manifest"]
updated_at: 2026-08-18T05:47:55.160Z
---

## PR #333 merged — main aaf348dfb56ca4e0cfbf33903395eb1ec2cb761d

exact HEAD 15e76078ec216655e4c1896717771966a864d227 を squash merge。CI 3 job green (run 32099499128)。Claude non-author PASS (blocking 0)。

### 前回 FLAG の解消

predicate (C) を静的 predicate へ書き直し (是正案 a)。final tree 上の channel→revision→destination 対応関係の存在に限定し、resolver/materializer 実行による到達実績ではないと明示。これにより「1 predicate 欠落時 resolver/materializer/copy/write count 0」が実装可能になり CANDIDATE-RELMAN-014〜016 と整合。実行系の unavailable は別条 (read-only resolver が unavailable を返した場合も typed finding 保持で sealed plan/apply 0 件 fail-close) として分離された。§3-2 に PF-4 L7-489 を requires へ昇格する手順も追記。

### 教訓

pair-freeze の契約で「判定に何を入力するか」と「副作用 count 0」を同時に書くときは、判定入力が実行を要するかどうかを明示しないと実装不能な契約になる。静的判定と実行系 fail-close を別条へ分けるのが解。
