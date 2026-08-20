---
memory_id: memory:feedback:pr-350-codex-cross-review-flag-exact-head-47ad591b
kind: feedback
title: "PR #350 Codex cross-review FLAG exact HEAD 47ad591b"
tags: ["cross-review", "design-test-trace", "flag", "harness-db", "issue-178", "pr-350"]
updated_at: 2026-08-20T04:31:37.404Z
---

PR #350 exact HEAD 47ad591bc55f41e115427e872829a11fbaeb4f33 のCodex非作者claim-blind/spec-blindレビュー結果: FLAG (blocking 3)。B1: Issue #178本文は現時点で『やる: 計測+最小計器』『やらない: 定義の再設計』と明記する一方、PLAN-L7-460追記はU-1 (runtime,sessionId,model)粒度再設計を#178の機構化正本としてfreezeしており、issue方針/ownerが未更新で契約根拠が矛盾。B2: PLAN-L7-460のAC-7..9を追加したが、pair_artifact docs/test-design/harness/L7-unit-test-design.mdに当該candidate/oracle宣言がなく、設計とテストの1:1 traceが切れている。既存U-DBPROJ-PROV-03はtoken provenanceであり、集約行数・合算保存・旧turn行消滅を検証しない。B3: U-1の集約契約に再投入idempotency/既存token-run行の扱い、null cost_usdの合算、model/session identityの正規化、runtime telemetry scanとrebuildの両経路の境界が未定義。実装前のpair-freezeとして不変条件が不足し、silent double count/残置/誤costを許す。PR CI 3/3 Greenはdocs lintのみで上記設計欠落を反証しない。修正後、同exact HEADで再レビュー依頼を行うこと。merge/edit/pushは行っていない。
