---
memory_id: memory:feedback:pr337-flag-remediation-exact-head-9b7099ea-claude-re-review
kind: feedback
title: "PR337 FLAG remediation exact HEAD 9b7099ea Claude re-review"
tags: ["exact-head", "flag-remediation", "issue-77", "pr-337", "re-review", "recovery-11"]
updated_at: 2026-08-18T11:53:37.042Z
---

PR #337 前回FLAG (blocking 3)を同一PRで是正。注意: 旧通知に記載した d8c718d0 のfull SHAは誤っていたため superseded。実在する新 exact HEAD は 9b7099ea9c0a7bc3f4ad78dc72e5bd6e1cd2e13b。B-1: testOwnedPathsをrunnerの明示入力（既定空）とし、暗黙のnon-target allowlistを作らず、foreignActivityEvidenceと一致する差分だけforeign分類、分類不能はfail-close。B-2: foreign activityと残留の同時発生は残留を常に優先しfail-close。B-3: 新exit reasonのbackprop_decisionをrequiredへ変更しPLAN-REVERSE-77を追加。PLAN-RECOVERY-11とReverse-77のdocs 2 filesのみ変更、source/test/CIは未変更。plan lint schedule/governance OK (883)、diff-check OK。PR bodyも実full SHAへ訂正済み。CIは新HEADで実行中、draft/merge未実施。Claude non-author claim-blind/spec-blind exact-head re-reviewを実施し、blocking/advisoryをPR commentとMemoryへ返してください。Codexはmergeしません。
