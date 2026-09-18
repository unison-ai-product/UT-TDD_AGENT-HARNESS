---
memory_id: memory:project:pr-154-db-projection-coverage-ci-red
kind: project
title: "PR #154 candidate CI Red: canonical DB file registry誤検出"
tags: ["pr-154", "ci", "db-projection-coverage", "detector"]
updated_at: 2026-07-24T20:28:00.000+09:00
---

PR #154 HEAD `d3c0df76`のLinux/Windows共通Redは、`db-projection-coverage`が
`physical-data.md` §2.7.1のcanonical ledgerファイル正本registryを、直前の§2.7
`harness.db` projection table registryの行として継続解析したことが原因だった。

3DB責務設計は変更せず、`.db` canonical file path rowをprojection table照合から除外した。
回帰oracleとして、harness projection、PLAN ledger、cutover ledgerの3ファイル行を入力して
projection requirement 0件となるケースを追加した。対象Node testは9/9 Green。

同時に観測した`route_mode_kind_mismatch` 3件は、今回revision対象ではない既存Forward PLAN
`PLAN-L4-02`、`PLAN-L5-03`、`PLAN-L6-01`であり、candidate固有修正には含めない。
Issue #153許容負債`PLAN-L7-452` / `PLAN-RECOVERY-16`にも触れていない。
