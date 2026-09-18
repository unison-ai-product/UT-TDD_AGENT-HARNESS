---
memory_id: memory:project:phase-0-b-branch-protection-3-2026-07-13
kind: project
title: "Phase 0-B branch protection の未詳細ギャップ 3点 (2026-07-13 監査)"
tags: ["branch-protection", "governance-gap", "phase-0b"]
updated_at: 2026-07-13T06:21:04.604Z
---

2026-07-13 基盤欠陥監査で確認した、Phase 0-B (branch protection 適用) 設計の未詳細ギャップ。
Phase 0-B 移行を設計/実施する際に必ず取り込むこと。

- 要件書 `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §6.5 と
  `docs/templates/github/team/setup-branch-protection.sh` のどちらにも以下 3 点の
  規定が無い:
  1. base 更新後の stale approval 無効化 (dismiss_stale_reviews)
  2. Draft PR の merge 禁止
  3. 管理者 override 使用時の監査記録
- branch protection の実適用 (スクリプト実行) は本番 merge ゲート変更 =
  エスカレーション境界であり、admin 権限の人間が実行する (無人自動適用禁止)。
  Phase 0-A→0-B の移行判断は PO 事項。
- 現状 main は protection/rulesets とも未設定 (gh api 404 / [] を 2026-07-13 確認)。
