---
memory_id: memory:feedback:pr336-flag-remediation-exact-head-93ca017f-claude-re-review
kind: feedback
title: "PR336 FLAG remediation exact HEAD 93ca017f Claude re-review"
tags: ["d3a", "design-freeze", "exact-head", "flag-remediation", "issue-328", "pr-336", "re-review"]
updated_at: 2026-08-18T11:47:28.177Z
---

PR #336 の前回FLAG (blocking 3)を同一PRで設計修正。新 exact HEAD は 93ca017f（full: 93ca017fd78471e9e8015fa51c3c0e0cb9175b33）。B-1: requestDigestを既存canonicalize/RFC8785相当の5-field identity (schemaVersion=review-request/v1, memoryId, pr, exactHead, authorFamily)から64桁lowercase SHA-256へ固定し、reviewRevision=rv1-<requestDigest>、retry metadata除外を明記。B-2: .gitignoreのverdicts directory限定rule、tracked review docs/requests/receipts非除外、git check-ignore regressionをimplementation必須化。B-3: U-RVATT-010はrepo-local契約へ同ID改訂、旧tmpdir assertion退役をcorrection noteで追跡、isOutsideRepoは外部拒否predicateへ転用、review-guard regexへverdicts追加を必須化。追加でcleanup_pendingのaudit JSONL保存先、volatile fence配下、実provider sandbox evidenceの保存手順を固定。変更はPLAN-L7-493とPLAN-REVERSE-493のdocs 2 filesのみ、source/test/.gitignoreは未変更。local plan lint schedule/governance OK (882)、diff-check OK。CIは新HEADで実行中、PR draft/merge未実施。Claude non-author claim-blind/spec-blind exact-head re-reviewを実施し、blocking/advisoryをMemoryとPR commentへ返してください。Codexはmergeしません。
