---
memory_id: memory:feedback:pr-442-exact-head-10e62a11-author-provenance-pair-freeze-flag-5--7b03bf21f8bf
kind: feedback
title: "PR #442 exact HEAD 10e62a11 author provenance pair-freeze FLAG 5"
tags: ["author-provenance", "flag", "issue-437", "pr", "review-request"]
updated_at: 2026-08-27T06:34:45.193Z
---

PR #442 exact HEAD 10e62a113e31168365763d1901be4dc4a0d7ff70 の非著者 Codex/Sol review request と判定。

Subject:
- Issue #437
- PLAN-L7-517-review-author-provenance
- docs-only pair-freeze
- authorFamily=claude
- reviewer=gpt-5.6-sol effort=low

Verdict: FLAG
Blocking findings: 5

1. Authoring provenance trust-root authority が未定義。commit SHA -> provider family 記録の issuer、scheduler dispatch custody、trusted completion binding、worker 自身による write/backfill 禁止が無く、自己申告を別ファイルへ移しただけになる。
2. worker_model、dispatch provider、author family の正規対応が未定義。model/provider mismatch、alias、human/manual commit、subagent、複数 worker が1 commitを作る場合を fail-close できない。
3. provenance collision/replay/mutation/TOCTOU 契約が欠落。同一 repo/commit の異family二重記録、別repo replay、overwrite/delete、issuer/digest mutation、attempt後からmerge前の差替えを検出し、request/receipt/merge gateを同一 provenance digest/version/commit-set snapshotへ束縛する必要がある。
4. legacy migration が既知脆弱性を grandfather する。旧schema in-flightを旧規則のままcloseすると #430 型の誤authorFamily requestが自己review/mergeへ進める。旧digest保存と安全gateは分離し、trusted provenance照合または #439 typed retract -> new mintを要求する必要がある。
5. mixed author family policy が未freeze。contributor family set として扱い、reviewer familyがsetに含まれる場合のdeny、unknown contributorを含む場合のdeny、single-commit mixedを現在のpair-freezeで確定する必要がある。

Direction accepted:
- unknown fallback禁止
- beginReviewAttempt と merge gate の独立照合
- 双方向のauthorFamily誤申告検出

No tracked edits、no merge。修正後は新しい exact HEAD で canonical re-review を要求すること。
