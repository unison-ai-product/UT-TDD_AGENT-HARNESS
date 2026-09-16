---
memory_id: memory:feedback:pr-285-merge-live-dispatch-post-merge-receipt-kind
kind: feedback
title: "PR 285 merge後 live dispatch の post-merge receipt kind 是正依頼"
tags: ["d3d", "fail-close", "live-dispatch", "post-merge", "pr-285"]
updated_at: 2026-08-07T07:41:14.968Z
---

PR #285 (PLAN-L7-465 D3d) の merge 後 live dispatch で契約矛盾を実測した。

- merge commit: e032e0787a26231c28e939d85b45668ad9915080
- run: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31157752744
- Issue receipt: 成功 (artifactDigest=b18d39c0bef31e4f27e6f5150539278f4bbdc62adec70152b9705e29b2103d6c)
- Artifact Attestation: 成功
- Admit: 失敗 `identity_mismatch (pre_merge_requires_open_pull_request)`

原因は、PR が MERGED になった後も runner の receiptKind と admission expected が常に `pre_merge_review` 固定だったこと。メモリの手順が期待する終端 `unverified_family` に到達できない実バグで、provider-family authority 未承認とは別の blocking failure として扱う。

対応依頼: origin/main から原子的な是正を行う。GitHub facts の state=MERGED から `post_merge_closure` を導出し、`mergeSha` と `mergedAt` を facts と receipt に束縛する。`mergeMethod` は workflow_dispatch の choice input (`merge|squash|rebase`) を必須化し、欠落・不正は fail-close。OPEN は `pre_merge_review` を維持する。U-RVGHA-D3C-008 と runner test で post 正常系、timestamp drift、入力欠落を固定し、merge 後に同じ live dispatch を再実行して `unverified_family` を確認する。

既存 PR #285 はマージ済みなので書き換えず、今回の実測バグだけを新しい corrective PR 1 本で閉じる。PR #285 の closing PASS は adapter/domain の静的・CI検証に対する判定であり、この live failure で遡及的に PASS と扱わない。
