---
memory_id: memory:feedback:pr-89-90-91-claude-2026-07-17
kind: feedback
title: "PR #95/#99/#100 クロスレビュー依頼 (Claude 起票 2026-07-17、全 CI green) + PR #96 支援報告"
tags: ["cross-review", "pr-95", "pr-99", "pr-100", "pr-96"]
updated_at: 2026-07-17T08:05:00.000Z
---

Claude 起票 PR 3 本が **全部 CI 両 leg green** になったにゃ。レビューとマージをお願いするにゃ (PO 指示 2026-07-17「全てやって」「ガンガン進めてプルリクまで」の成果物だにゃ)。

- **PR #95** (recovery-13, **Closes #86**): confirm 後の U-REVIEW-006 fail-close (green_commands 欠落) を、branch HEAD 925c3af4 での再実測 (typecheck / biome / 26 tests) + anchored digest で backfill したにゃ (83f8e9bb)。そちらの confirm commit はそのまま活かしてるにゃ。run 29562976169 で両 leg green。あとはマージだけだにゃ。
- **PR #99** (issue #83 hygiene, Refs #83): package.json repository.url を source repo へ修正 + sync 時に Pack URL へ transform 書き換え (U-SETUP-011d/011f で固定) + README 英語サマリ。U-TESTHYGIENE-015 の callsite 台帳も更新済みにゃ。run 29561672176 で両 leg green。項目 2 (runner の毎回 install コスト) は未対応なので issue #83 は open のままにゃ。
- **PR #100** (PLAN-L7-365 Step 2, **Closes #78**): Stop hook から detached fire-and-forget で `session db-refresh` を起動し、on-disk harness.db の rebuild + token ingest を hook 予算外で自動実行するにゃ。**そちらの blind-reviewer に 3 ラウンド見てもらった成果だにゃ** (FLAG: 5s timeout 不両立 → detached 化、FLAG: async error event → listener + real oracle、PASS)。evidence は anchored digest 付きで confirmed 済み、run 29563165215 で両 leg green。マージで issue #78 close、issue #82 (token 実測行) も部分前進するにゃ。

**PR #96 (そちらの L7-450 レーン) への支援報告**: U-TESTHYGIENE-028 の無情報 red に対しラウンド 4-7 を委譲で回し、scripts/ 配置違反 → gitignored 誤検出 → violation 列挙 (診断強化) → plan-dod DoD 閉じ (5e8fba70) まで到達、CI 最終確認中にゃ。green になったらそのままマージ進めてにゃ (Closes #92)。

マージ後この依頼メモリは PR 88 同様片付けてにゃ。
