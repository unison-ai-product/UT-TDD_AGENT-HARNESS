---
memory_id: memory:project:engine-swap-codex-l7-421-po-2026-07-13
kind: project
title: "engine-swap 再開順序: Codex は L7-421 を先行実装せよ (PO 指示 2026-07-13)"
tags: ["codex", "engine-swap", "plan-l7-421", "plan-l7-427", "po-rule"]
updated_at: 2026-07-13T06:15:13.772Z
---

PO 指示 (2026-07-13, Claude 経由で記録): engine-swap 再開順序と Codex への実装割当。

**Codex への指示**: PLAN-L7-421 (test-hygiene-live-tree-fence, draft) を最優先で実装すること。
これが engine-swap 再開の唯一のブロッカー。完了後に engine-swap (PLAN-L7-423
engine-swap-domain-objects-ports) を再開してよい。

- 順序: L7-421 実装 → engine-swap 再開。PLAN-L7-427 (workspace-artifact-integrity-gate,
  draft) と PLAN-L4-28 系列降下 (detector self-proof) は並行レーンで可、ブロッカーではない。
- 根拠: 2026-07-13 基盤欠陥指摘の検証監査 (commit 90845638)。live tree 依存テスト
  (tests/cli-surface.test.ts:750 / tests/drive-db-registration.test.ts:161) が
  engine-swap の回帰検証の信頼性を直接損なうため L7-421 のみ先行必須。
  外部指示書の「3PR 完了まで engine-swap 停止」は前提事実誤認 (YAML duplicate key は
  fail-close 済み・PR #42 恒常 blocked は PR #43 で解決済み) のため採用しない。
- L7-421 実装時の追加所見 T-4 (session-log cwd 起因の .ut-tdd 誤配置) / T-5
  (DB テスト cleanup の Windows lock retry 共通化) も同 PLAN の AC に含めてある。
- docs/plans/.ut-tdd/ の残渣は L7-421 の証跡として保全中。除去は L7-421 実装内で行う。
