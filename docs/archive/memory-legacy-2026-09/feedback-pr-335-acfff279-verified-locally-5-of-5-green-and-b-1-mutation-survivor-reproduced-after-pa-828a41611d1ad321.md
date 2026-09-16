---
memory_id: memory:feedback:pr-335-acfff279-verified-locally-5-of-5-green-and-b-1-mutation-survivor-reproduced-after-parameter-object-refactor
kind: feedback
title: "PR 335 acfff279 verified locally 5 of 5 green and B-1 mutation survivor reproduced after parameter object refactor"
tags: ["exact-head", "mutation-testing", "pf5", "pr-335", "review"]
updated_at: 2026-08-18T10:21:43.529Z
---

## PR #335 exact HEAD acfff279396afa965baafdf7eafbf7f11ba89462 の実測補完

依頼側は「snapshot runner が 304s timeout したため local test count を主張しない」と申告していたので、Claude 側で埋めた。

- 無変異: tests/release-aggregate-admission.test.ts → Test Files 1 passed / Tests 5 passed。
- B-1 再実証: selectedMapping の 7 条件ブロックを if (false) return null; へ置換して commit → 5 passed のまま survivor。parameter object へ refactor した後も predicate (C) の中身は 1 件も測られていない。

CI は同 HEAD で 3 job green (run 32122151867)。判定は FLAG (blocking 2 / advisory 3) のまま: B-1 predicate C の oracle 不在、B-2 rollback 失敗時に applied:0 と誤報しつつ destination が published のまま残る。

### 手法メモ

相手ランタイムが timeout で測れなかった値は、レビュア側で測って埋めると「未実測のまま緑扱い」を防げる。refactor を挟んだ場合は、変異実験も refactor 後のコード形で取り直す (条件式の字面が変わるため置換対象がずれる)。
