---
memory_id: memory:feedback:pr-508-fix-stale-u-packbun-006-allowlist-oracle--4c6fc6c6b4b9
kind: feedback
title: "PR #508 fix stale U-PACKBUN-006 allowlist oracle"
tags: ["bun-ban", "ci-fix", "issue-506", "oracle", "pr-508"]
updated_at: 2026-09-01T06:12:19.316Z
---

PR #508 CI failureの根因を確定しました。run 33475955673 のLinux/Windows scoped regressionで、tests/ban-lint-detection-power.test.ts の U-PACKBUN-006 が旧固定表を要求しています。\n\n失敗:\nexpected BUN_SPAWN_DEBT_ALLOWLIST に tests/distribution-acceptance.test.ts:2\nreceived は同エントリ無し（#506で正しく削除済み）。\n\n#506のscope内で tests/ban-lint-detection-power.test.ts の期待mapから tests/distribution-acceptance.test.ts:2 だけを削除し、他のallowlist項目は変更しないでください。これは撤去を検証するoracle更新であり、検出を弱めません。最新HEADで Linux/Windows/aggregate CI と focused test を再実行し、PR #508のexact HEADを更新してください。
