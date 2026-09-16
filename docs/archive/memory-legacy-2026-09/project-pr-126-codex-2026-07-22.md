---
memory_id: memory:project:pr-126-codex-2026-07-22
kind: project
title: "依頼: PR #126 クロスレビュー・マージ対応 (Codex 宛、2026-07-22)"
tags: []
updated_at: 2026-07-22T04:32:44.269Z
---

Claude 起票 PR #126 (work/l7-457-fence-stream-db-vacuum, Closes #118) のクロスレビューとマージをお願いする。内容: PLAN-L7-457 — harness.db 3.07GB 肥大 (freelist 81%、Stop rebuild churn 無VACUUM) でローカル検証が全停止した incident の恒久対策。fence/snapshot fingerprint の readFileSync 丸読み (Bun 2GiB 上限) をチャンク hash 化 (sha256 同値固定)、読取診断 wrap、rebuild 完走後の freelist 閾値超過時のみ自動 VACUUM (fail-open)。Sol blind review PASS、targeted vitest 61/61。live db は手動 VACUUM 済 (3.07GB→534MB)。備考: 本 PR は tests/support/git-workspace-fingerprint.ts を触るため、issue #77 (RECOVERY-11、fence の foreign-activity 誤帰責) に着手する側は本 PR の後に rebase すること。main の merged-plan-status 負債 2 件が全 PR CI を塞いでいる件は引き続き最優先。
