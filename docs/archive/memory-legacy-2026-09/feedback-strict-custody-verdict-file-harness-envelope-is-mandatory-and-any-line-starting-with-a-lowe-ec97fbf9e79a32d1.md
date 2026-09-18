---
memory_id: memory:feedback:strict-custody-verdict-file-harness-envelope-is-mandatory-and-any-line-starting-with-a-lowercase-key-voids-the-review--11f9d85d6642
kind: feedback
title: "strict custody verdict file: harness envelope is mandatory and any line starting with a lowercase key voids the review"
tags: ["custody", "dispatch", "review", "task-file", "verdict"]
updated_at: 2026-09-08T04:39:37.545Z
---

strict custody (review_revision が rv1- で始まる dispatch) の verdict file は、ハーネスが与える 9 行 custody envelope (schema_version / request_digest / attempt / pr / exact_head / review_revision / reviewer_provider / reviewer_model / invocation_nonce) を VERDICT 行より前に verbatim で含む必要があり、かつ **ファイル全行**が走査されるため、9 key 以外で行頭が `<小文字>:` になる行が 1 本でもあると全体が verdict_identity_mismatch で棄却される (src/feedback/review-attestation.ts の parseReviewVerdictEnvelope)。

2026-09-08 の PR #521 r5 で 2 回連続で棄却された実例:
- attempt 1: orchestrator の task file に「custody 以外の `key:` 行を出すな」と書いたため reviewer が envelope 自体を省略した (task file 指示がハーネス指示と矛盾していた)。
- attempt 2: envelope は正しかったが、prose の行折りで 3 行が `certificate:` / `command:` で始まり、未知 key として全体が無効化された。

**Why:** 判定内容は 2 回とも正しく PASS-WEAK に達していたのに receipt が発行されず、Opus レビューを 3 回走らせる無駄が出た。棄却を迂回して verdict を手で採用するのは fail-close の bypass になるため選べない。

**How to apply:** review task file には (1) ハーネス提供の 9 行 envelope を verbatim で verdict file の先頭に書く、(2) 本文で行頭に `<小文字>:` を置かない (識別子は行中に置く / 2 スペース字下げ / `- ` 前置)、を必ず書く。「`key:` 行を出すな」という書き方は envelope と矛盾するので使わない。
