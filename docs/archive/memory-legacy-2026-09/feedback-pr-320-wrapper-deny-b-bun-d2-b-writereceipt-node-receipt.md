---
memory_id: memory:feedback:pr-320-wrapper-deny-b-bun-d2-b-writereceipt-node-receipt
kind: feedback
title: "訂正: PR #320 wrapper deny の (b) は bun 実行による私の誤り、D2-B writeReceipt に欠陥なし (node で receipt 書込成功)"
tags: ["correction", "d2-b", "merge-path", "node-toolchain", "pr-320"]
updated_at: 2026-08-14T10:17:45.429Z
---

# 訂正: PR #320 の wrapper deny 理由 (b) は私の実行系誤りで、D2-B の実バグではない

直前の通知 (`feedback-pr-320-closing-pass-blocking-0-wrapper-merge-bun-windows-d2-b-writereceipt-eexist-merge`) の §2(b) を撤回する。

## 誤りの内容

私は `bun src/cli.ts pr merge` で wrapper を実行し、`result_receipt_write_failed:EEXIST` を「D2-B の実バグ、`existsSync` ガードで是正すべき」と報告した。**これは誤りである。** bun は `package.json` の `utTdd.nodeToolchain` で `bunAuthority: "legacy_migration_debt"` と宣言されており、`nodeAuthority: "candidate"` が正である (CI も node で回っている)。canonical でない実行系で観測した現象を repo の欠陥として帰責した。

## node での再実測

```
$ node src/cli.ts pr merge --pr 320 --json
{"ok":false,"pr":320,"headSha":"bdda726a...","verdict":null,"decision":"deny",
 "reason":"orphan_pr_observation:unmatched_pr:320@bdda726a...,no_request_for_current_head",
 "receiptPath":"<repo>\\.ut-tdd\\logs\\review-merge-gate.jsonl"}
exit_code=1
```

`receiptPath` が非 null で receipt 書込は成功しており、`result_receipt_write_failed` は消えている。**`writeReceipt` に欠陥はない。是正 PR は不要である。** 私が推奨した (i) は取り下げる。

## 残る事実

deny 理由は custody 側の 1 件だけになった: `orphan_pr_observation:unmatched_pr` + `no_request_for_current_head`。`.ut-tdd/review/requests` は PR #300 由来の 1 件のみ、`.ut-tdd/review/receipts` は 0 件で、live projection を入れる #319 は FLAG (blocking 3) 差し戻し中。したがって #320 を wrapper で merge することは現時点では依然できないが、その原因は**custody の未整備ただ一つ**であり、#319 が入れば解消する見込みである。

判断を仰ぐ選択肢は次の 2 つに減る:

- (ii) #319 が入るまで、exact-HEAD 束縛の `gh pr merge --match-head-commit bdda726a...` を暫定容認する。D2-D backstop は #320 を `bypass_merge` として検知するが真陽性であり既知として残る (#302 / #312 / #317 / #318 と同類型)。
- (iii) #319 の是正・merge が済んで live projection で #320 の HEAD に対する request/receipt が生成されるまで、#320 の merge を保留する。

私は (iii) を推奨する。#320 は PASS 済みで待たせるだけの損失にとどまり、bypass 検知を増やさずに済むため。ただし #319 の是正が長引く場合は (ii) へ切り替える判断を求める。

## 副次的な観測 (帰責ではなく情報)

`.claude/CLAUDE.md` の Hooks 節と `CLAUDE.md` の記述は現在も `bun "$CLAUDE_PROJECT_DIR/src/cli.ts"` 形式で、`package.json` の `nodeAuthority: candidate` / `bunAuthority: legacy_migration_debt` と食い違っている。私が bun を既定と誤認した直接の材料はこれである。ただし宣言の正本は `package.json` 側であり、私が実行前に確かめるべきだった。adapter doc 側の更新要否は node 移行の担当が判断されたい (私は PR 対応専任のため起票しない)。
