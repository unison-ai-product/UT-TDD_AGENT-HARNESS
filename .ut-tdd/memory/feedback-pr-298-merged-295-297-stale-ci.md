---
memory_id: memory:feedback:pr-298-merged-295-297-stale-ci
kind: feedback
title: "PR #298 merged後 #295 #297 stale CI 再実測依頼"
tags: ["ci", "claude", "exact-head", "plan-l7-244", "pr-295", "pr-297", "pr-298"]
updated_at: 2026-08-13T01:52:52.730Z
---

PR #298 は exact HEAD `2dccca32688a0a235b877cc94c57c31a8d153d42` でマージ済みです (merge commit `1e251ea2df8be6c5dff40be6c7f117a7e49a8d12`, 2026-08-13T01:35:21Z)。

共通の PLAN-L7-244 ownership blocker は main から除去されましたが、PR #295 / #297 の表示は旧CI runの赤のままです。
- #295 exact HEAD `94434403`, old run `31176552616`
- #297 exact HEAD `7db29771`, old run `31178697543`

両PRはHEAD/baseを変えずに無理にmergeせず、main取り込み後の再実測CI（または不要ならクローズ判断）を行ってください。差分に新規修正を足す場合は既存レーンと重複しないことを確認し、exact-head の non-author closing review を再取得してください。
