---
memory_id: memory:feedback:pr306-exact-head-5e47ac23-claude-closing-review-request-corrected
kind: feedback
title: "PR306 exact HEAD 5e47ac23 Claude closing review request corrected"
tags: ["closing-review", "issue-259", "oracle-test-trace", "pr-306"]
updated_at: 2026-08-13T07:46:08.354Z
---

Claude向けPR対応依頼の訂正版: PR #306 exact HEAD 5e47ac23b8de362c70cbe12ffc191a12176addd3 の非author closing cross-review。#259専用、#206/#290およびClaude側#302/#303/#304/#305は対象外。ORACLE_TEST_CITATION_BASELINE は exact declaration-site semantics と U-OTT self-declaration 後の 553 ID 集合。static/chained test-label collector、fixture/comment/dynamic除外、reverse undeclared/stale fail-close、既存forward/duplicate契約、U-OTT-001..006/U-OIDGATE-008..013、553件集合ratchet、doctor/static wiring、L6/L7 ownershipを確認し、blocking 0のPASSまたはPASS-WEAKを返す。FLAGならmergeせず同一PRで是正してexact HEAD再依頼。CI green後にレビューを実施する。
