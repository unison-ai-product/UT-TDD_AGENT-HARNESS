---
memory_id: memory:feedback:pr-543-r3-verdict-flag-at-fe80ed7d-seal-preimage-contract-needs-review-authority-label-field-list-sourcepath-projection-binding-canonical-key-order-fix--7ba02b546fc6
kind: feedback
title: "PR #543 r3 verdict FLAG at fe80ed7d: seal preimage contract needs review-authority label/field list, sourcePath+projection binding, canonical key-order fix"
tags: ["issue542", "pr543", "review", "seal-preimage", "verdict"]
updated_at: 2026-09-09T01:00:32.379Z
---

## 非著者 closing review r3 (Codex `gpt-5.6-sol`) — exact HEAD fe80ed7d49a817f88e55826c8eb1235ed3f06ebc

**VERDICT: FLAG** (blocking 3)

- canonical receipt: `.ut-tdd/review/receipts/c218fe968dc1cc37eb8b5413f5c3ff06afc5896ec5c4f6e5fc7de2b23bd2d7af.json` (reviewerFamily codex)
- request memory: `review-request-pr543-fe80ed7d`
- exact-head CI: 5/5 success at fe80ed7d

r1 の blocking 2 件 (E.3 到達可能性 / E.4 ローカル artifact authority) は解消と判定された。
新規に 3 件が挙がっており、いずれも妥当な欠陥である。

### blocking findings

1. **`internal-processing.md:1191` (E.4)**: `reviewedImplementationAuthorityDigest` の exact preimage が
   固定されていない。E.2 は先頭 algorithm label を必須とするが E.4 は label を定義せず、observed facts と
   decision の順序付きフィールド列・文字列表現も列挙していないため、同じ custody 観測から複数の digest が
   生成できる。
2. **`internal-processing.md:1159` (E.3)**: Git object 照合が `sourcePath` = `planId` の canonical PLAN path
   であること、`historicalProjectionPath` = 当該 PLAN の tracked projection 正本であることを検証しない。
   到達可能な exact HEAD 内の任意 blob path を両 field に選び、対応する OID / content digest を再計算すれば
   全照合を自己整合的に通せるため、authority の対象 PLAN / projection を差し替えられる。
3. **`internal-processing.md:1208` (E.5)**: `certificate_json` のキー順を表示順で固定すると書いているが、
   同時に要求する既存 `canonical()` はキーを辞書順 sort するため、表示順とは異なる byte 列を生成する。
   exact byte preimage が二通りに規定されている。

### 対応方針 (r4)

- E.2 に algorithm label `ut-tdd-seal-review-authority-v1` を追加し、E.4 に順序付きフィールド列と
  各値の文字列表現 (数値は前置ゼロ禁止の 10 進 ASCII、decision は enum 値そのまま) を明記する。
  時間変動する観測値 (merge state / 観測時刻) は preimage に含めず受理条件側に置く
  (含めると same-payload replay の冪等が壊れる)。
- E.3 に 2 照合を追加: `sourcePath` が `docs/plans/<planId>.md` と exact 一致すること、
  `historicalProjectionPath` が tracked projection 正本 path と exact 一致し、かつその blob 内に
  `binding.plan_id` / `binding.asset_id` が対象と一致する terminal record が存在して
  `record_digest` が `historicalTailDigest` と一致すること。typed reason を対で置く。
- E.5 は「フィールド集合を固定し、byte 列上のキー順は `canonical()` の辞書順である」と書き直す
  (表示も辞書順に揃える)。二重規定を消す。

r3 receipt は head fe80ed7d のみに束縛され、修正後の head へは流用しない。
