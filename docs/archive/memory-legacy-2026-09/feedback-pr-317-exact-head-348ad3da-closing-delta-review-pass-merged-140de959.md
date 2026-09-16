---
memory_id: memory:feedback:pr-317-exact-head-348ad3da-closing-delta-review-pass-merged-140de959
kind: feedback
title: "PR #317 exact HEAD 348ad3da closing delta review PASS -> merged 140de959"
tags: ["closing-review", "merged", "pf3", "pr-317"]
updated_at: 2026-08-14T06:18:56.256Z
---

PR #317 (docs(plan): freeze PF-3 isolated Git resolver) を exact HEAD 348ad3dae01f0083070ae291d4bbe9d42c1ad898 で merge しました (merge commit 140de95975adb8f2c8817a198af7816fde453fd7, 2026-08-14T06:18:14Z)。

closing delta review = Claude 非 author family、VERDICT PASS / blocking 0 / 非 blocking 1。前 subject 51a373e0 の FLAG は superseded。verdict 全文は PR comment 5290156791。CI run 31774952129 = 3 job pass / CLEAN。

blocking B-1 (partial clone promisor lazy fetch) の解消を実測で裏取りしました。真の blobless partial clone (uploadpack.allowFilter=true の source から --no-checkout --filter=blob:none) で:
- GIT_NO_LAZY_FETCH=1 git cat-file -e <oid> -> exit 1 (blob 不在 = 真の blobless)
- echo <oid> | git cat-file --batch (env なし) -> `<oid> blob 20` + 内容 / exit 0 = wire 取得が起きる
- echo <oid> | GIT_NO_LAZY_FETCH=1 git cat-file --batch -> `<oid> missing` / exit 0
新方式 --batch でも env 固定が必要かつ十分であること、exit code は両者 0 なので契約が exit ではなく `<oid> missing` の parse で unavailable へ落とす設計が実出力と一致することを確認しています。oracle 2 の実 partial clone fixture 化、oracle 3 の synthetic 代替禁止、master PLAN-L7-473:107-116 の GIT_NO_LAZY_FETCH 条項、test-design CANDIDATE-RELMAN-012 の PLAN-L7-487 citation もすべて確認済みで、前回の非 blocking 2 件も閉じています。

cat-file --batch 化 + declared size streaming + default maxBuffer 非依存の契約追加は、PR #313 で実測した ENOBUFS 類型 (実 payload 1,896,474 bytes > Node 既定 1 MiB) を実装前に封じるもので、freeze PR で決めるべき方式判断として適切と評価しました。

実装 PR で回収してほしい非 blocking 1 件: cat-file --batch の stdin 書込 backpressure と stdout 読出の deadlock 境界が契約にも oracle にも無い。spawnSync 相当だと大量 OID + 大 blob で pipe 詰まりの余地があります (契約 falsity ではないので実装側の設計判断で十分)。

これで open PR は 0 件です。
