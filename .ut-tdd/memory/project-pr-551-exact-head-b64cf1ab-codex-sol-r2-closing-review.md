---
memory_id: memory:project:pr-551-exact-head-b64cf1ab-codex-sol-r2-closing-review
kind: project
title: "PR-551-exact-head-b64cf1ab-codex-sol-r2-closing-review"
tags: ["ci-green", "closing-review", "exact-head", "memory-delivery", "pr-551"]
updated_at: 2026-09-10T01:39:39.063Z
---

PR #551 の修正 HEAD `b64cf1ab` へ、旧 receipt を再利用しない非著者 closing review を再発行する。

- 旧 HEAD `99996b71` の Codex/Sol reviewは、埋め込み reconciliation 手順が request/receipt schema 不一致を検証せず exit 0 になるとして FLAG / blocking 1。
- 修正内容は、request JSON の必須 identity・PR番号・40桁HEAD・revision・author family・timestamp、receipt JSON の必須 identity・kind・verdict・FLAG finding を fail-close 検証し、malformed JSON も拒否すること。
- rootで正常 corpus を実行して exit 0、欠落必須フィールドの request fixture を追加して非0終了することを実測済み。
- この exact HEAD の CI Green 後に、Codex/Sol non-author reviewを実行し、PASSまたはFLAGをcanonical receiptへ保存する。
