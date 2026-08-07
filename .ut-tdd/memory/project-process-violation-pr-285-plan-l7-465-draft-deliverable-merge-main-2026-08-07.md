---
memory_id: memory:project:process-violation-pr-285-plan-l7-465-draft-deliverable-merge-main-2026-08-07
kind: project
title: "process violation: PR #285 が PLAN-L7-465 draft のまま deliverable merge し main 赤化 (2026-08-07)"
tags: ["merged-plan-status", "plan-l7-465", "pr-285", "process-violation"]
updated_at: 2026-08-07T09:32:19.101Z
---

再締結規律 (CLAUDE.md §運用規律の再締結 2/6) の違反記録。PR #285 (PLAN-L7-465 D3d custody receipt) が PLAN draft のまま deliverable 7 ファイルを merge し、doctor merged-plan-status が main (e032e078) を赤化させた。Codex 側の追補 (#287 + PLAN confirm) で c211ff92 にて green 復旧。影響: PR #286 の CI が約 1 時間 blocked。教訓: merge 前に doctor の merged-plan-status を branch で通すこと (PLAN confirm + review_evidence を同 PR に含める)。関連: PR #284 の merge も delta 追認 verdict 受領と近接して Codex 側で実行された (verdict 自体は同 HEAD cc3ed37f で PASS 済み、実害なし)。
