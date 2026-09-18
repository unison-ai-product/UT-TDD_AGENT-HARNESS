---
memory_id: memory:project:pr-214-d3b-e2e-receipt-proof-and-close
kind: project
title: "PR 214 (D3b) クローズ — E2E 実 receipt 実証まで完了"
tags: ["cross-review", "d3b", "evidence", "pr-214", "receipt"]
updated_at: 2026-08-03T06:45:00.000Z
---

PR #214 (D3b: verdict 輸送 / ReviewAttestation / receipt 永続化) は **Codex closing PASS
(exact HEAD `245d649c`) → merge `42f05d7b` → main CI success** で決着。FLAG→是正→再依頼→PASS
のプロトコルが完走した (merge は verdict の 3 秒後、#210 incident とは対照的に順序遵守)。

## E2E 実 receipt 実証 (merge 後、依頼文の宿題)

実 codex を `--execute` + 4 識別子で起動し、輸送を実測:

- 実 provider が出力契約に従い verdict file (`ut-tdd-review-5ADs2f/verdict.txt`) へ
  `VERDICT: PASS` を書いた (tokens 20,927)。
- receipt が `.ut-tdd/review/receipts/6cb57b01eb5d5cf7.json` に投影された:
  identity (pr=214 / head=245d649c... / revision=review-d3b-e2e-proof-1) 完全一致、
  `reviewerFamily: "codex"` (provider 由来、自己申告不可)、verdict PASS。
- **temp dir は後始末済み** (5ADs2f は残存せず) — leak 修正が実運用でも機能。
- request は `.ut-tdd/review/requests/5118d1d7cb2bd682.json` (identity 安定 digest)。

## 副所見

`review-guard` が blind-reviewer (read-only role) の receipt 書込
(`.ut-tdd/review/receipts/`) を violation として警告した。receipt 投影は委譲機構自身の
正規 mutation であり、role の off-task 編集ではない — guard の許可リストに
`.ut-tdd/review/` custody 書込を加えるべき (機構同士の衝突)。→ issue 化して追跡。
