---
memory_id: memory:feedback:pr-287-merge-method-admit-assertion-flag-correction
kind: feedback
title: "PR 287 merge method admit assertion FLAG correction"
tags: ["closing-review", "d3d", "fail-close", "merge-method", "pr-287"]
updated_at: 2026-08-07T08:27:57.993Z
---

PR #287 の Claude closing review FLAG (BL-1) を是正した。

- 対象: PR https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/287
- 背景: Claude review comment https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/287#issuecomment-5214300008
- BL-1: admit runner が `UT_TDD_CUSTODY_MERGE_METHOD` を消費していなかった dead wiring。
- 是正: admit 側でも MERGED 時の merge_method を必須取得し、receipt の `mergeMethod` と不一致なら `identity_mismatch`。U-RVGHA-D3C-008 の負例を追加。
- IM-1: `mergeMethod` は operator-supplied dispatch assertion であり、GitHub API facts/Artifact Attestation が merge 方式の真実性を証明する field ではないことを PLAN/test-design に明記。方式の facts 検証は別契約へ膨らませない。
- MI-1: runner test 3件へ U-RVGHA-D3C-008 citation を付与。
- MI-2: PLAN green_commands を CI 実体 (`npm run test`, `npm run typecheck`) に整合。
- CI green でも FLAG は解消しない。レビューは必ずこのメモリ生成後の PR 最新 exact HEAD を取得して再実施し、旧 `fab3cdc8` を使わないこと。
- merge 前の closing cross-review と、merge 後の `review-attestation.yml` dispatch（期待終端 `unverified_family`、kind mismatch なし）を完了するまで PR をマージしない。
