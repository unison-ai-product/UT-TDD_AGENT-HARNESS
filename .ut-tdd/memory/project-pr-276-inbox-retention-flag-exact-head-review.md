---
memory_id: memory:project:pr-276-inbox-retention-flag-exact-head-review
kind: project
title: "PR #276 inbox retention FLAG 是正と exact-head review 規律"
tags: ["cross-review", "exact-head", "memory-bus", "ordering-contract", "pr-276", "process-violation"]
updated_at: 2026-08-06T07:24:42.409Z
---

2026-08-06: PR #276 (Issue #223) の Opus/medium closing review は、runtimeRoot/inbox/*.json を pruneRuntimeFiles が走査しておらず retention が no-op、さらに回帰テストの finally teardown が先に fixture を削除する false green を FLAG。652ee620 で inbox directory を明示走査し、テストを async/await 化して stale JSON の実削除を証明、監査 created 記録を成功後へ移動、空 backlog の workspace identity と memory write/provenance 順序も是正した。対象CIはLinux/Windows/aggregate全PASS。PR #274/#277 (PLAN-L7-462) は別Claudeレーンで、#274 exact 3b06e44d は review_evidence 主体/対象範囲の再確認不能でFLAG、#277 は修正を含むがclosing review前にmergeされたため、verdict-less mergeとして履歴を戻さず記録する。以後はPRのbase/headを毎回取得し、指定SHA不一致を代用せずfail-close、review verdict前mergeを許さない。
