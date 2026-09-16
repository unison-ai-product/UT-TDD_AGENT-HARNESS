---
memory_id: memory:feedback:merge-ordering-never-merge-a-side-pr-while-a-mainline-pr-holds-a-fresh-receipt-at-its-current-head-serialize-merges-by-release-critical-path--adfebcf1247a
kind: feedback
title: "Merge ordering: never merge a side PR while a mainline PR holds a fresh receipt at its current head; serialize merges by release critical path"
tags: ["merge-order", "po-feedback", "pre-release", "process"]
updated_at: 2026-09-10T02:42:18.386Z
---

複数の PR が merge 間近のとき、**現 head に fresh な closing receipt を持つ mainline PR を先に merge し、
release critical path 上に無い PR はそれが landed するまで hold する**。merge の直前に「他の open PR が
現 head で receipt を保持していないか」を確認し、あれば先にそちらを merge するか自分を hold する
(PO feedback、2026-09-04)。

**Why:** branch protection は up-to-date branch を要求せず (`gh api repos/{owner}/{repo}/branches/main/protection
--jq .required_status_checks.strict` = `false`)、`ut-tdd pr merge` にも base 鮮度の gate は無い。そのため
side PR を先に merge しても mainline PR は「mergeable のまま 1 base 遅れ」になり、機械は止めない。
strict 保護下なら mainline 側が rebase → CI → 再 review の 1 周期を余分に強いられる順序である。

再現できる実例 (`gh pr view 442 --json mergedAt,mergeCommit` / `gh pr view 513 --json mergedAt,mergeCommit,headRefOid`):
PR #513 (Pack authoring、release mainline) が head `566a14b6` で CI green + PASS-WEAK blocking 0 の receipt を
保持していた状態で、critical path 外の PR #442 が先に merge され (`2026-09-04T02:54:22Z`、merge commit
`0a7b10a7`、parent `038520ce`)、main が 1 base 進んだ。#513 はその後 `2026-09-04T03:19:13Z` に同じ head で
merge できたが、順序としては誤りだった。

**How to apply:** `ut-tdd pr merge --pr N` を打つ前に、open PR 一覧と `.ut-tdd/review/receipts/` を突き合わせて
「現 head に verdict receipt を持つ他 PR」を列挙する。該当があれば release critical path 上のものを先に merge する。
critical path の具体的な PR 列挙は時点依存なので memory には書かず、その時点の release PLAN / issue から読む。
