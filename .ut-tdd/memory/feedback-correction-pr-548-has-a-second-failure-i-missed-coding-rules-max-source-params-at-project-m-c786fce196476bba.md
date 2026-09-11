---
memory_id: memory:feedback:correction-pr-548-has-a-second-failure-i-missed-coding-rules-max-source-params-at-project-memory-migration-ts-305-and-592-oracle-test-trace-is-fixed-but-ci-stays-red--632f08a7b90d
kind: feedback
title: "Correction: PR 548 has a second failure I missed, coding-rules max-source-params at project-memory-migration.ts:305 and :592; oracle-test-trace is fixed but CI stays red"
tags: ["ci", "coding-rules", "correction", "issue545", "pr548"]
updated_at: 2026-09-09T05:31:09.276Z
---

## 訂正と続報 (head 4b90414a5012681fa16713ec51e2feae1a74b9b8): CI はまだ赤で、原因は別の 1 件

先の報告で「#548 の失敗は `oracle-test-trace` 1 件だけ」と書きましたが、**これは私の誤りでした**。
grep パターンを `violation 1` に限定していたため `violation 2` の行を取りこぼしていました。お詫びします。

前 head `23588984` の同じ job (102346246006) にも、実際には**もう 1 件**出ていました。

```
doctor: coding-rules — violation 2 (src/runtime/project-memory-migration.ts:305:max-source-params,
src/runtime/project-memory-migration.ts:592:max-source-params). Follow requirements coding-rule SSoT.
```

`U-PMEMQUAR-001..005` の test-design 登録 (+14 行) は正しく効いており `oracle-test-trace` は解消しています。
本 head の diff は test-design のみ (`git diff 23588984 4b90414a --stat` = 1 file, +14/-0) なので、
runtime 未変更のまま残っていた **`coding-rules` の 2 件が現在の唯一の赤**です。

### 該当箇所

`src/lint/coding-rules.ts:393` が `scope === "source"` の関数に対し **引数 4 個以上を fail-close** します
(`Source functions may accept at most 3 parameters; use an input object.`)。

- `src/runtime/project-memory-migration.ts:305` `private finishExisting(inventory, operationId, paths, …)`
- `src/runtime/project-memory-migration.ts:592` `private verifyComplete(marker, prepared, inventory, …)`

いずれも 4 引数以上です。是正は規約どおり **input object 化** (1 引数のオブジェクトに畳む) が筋で、
同 repo 内に先行例があります — `src/lint/descent-obligation.ts:499` と
`src/lint/forward-convergence.ts:140` は、まさに `max-source-params` を守るために後段合成 /
allowlist 注入で 3 引数に抑えたことをコメントで明示しています。

### re-review について

依頼メモリ `memory:project:pr548-exact-head-rereview-4b90414a` は
`oracle-test-trace_PLAN_lint_source-doc_doctor_Biome_diff-check_green` を根拠にしていますが、
exact-head CI は `harness-check-linux` fail (2m43s) / `harness-check-windows` pending です。
CI 完全 green が非著者 review の前提なので、この head では回しません。**上記 2 件の修正後の head を
通知してもらえれば、CI を自分で照合してから即 review を発行します。** merge / approve は行いません。
