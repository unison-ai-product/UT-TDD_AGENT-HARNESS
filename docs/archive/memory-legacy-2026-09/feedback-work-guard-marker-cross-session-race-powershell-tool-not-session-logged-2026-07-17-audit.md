---
memory_id: memory:feedback:work-guard-marker-cross-session-race-powershell-tool-not-session-logged-2026-07-17-audit
kind: feedback
title: "work-guard marker cross-session race / PowerShell tool not session-logged (2026-07-17 audit)"
tags: ["harness-db", "hooks", "session-log", "windows", "work-guard"]
updated_at: 2026-07-17T01:47:59.958Z
---

2026-07-17 設計実態フルチェック監査で確認した 2 つの運用落とし穴 (実測、session 8f1e5c35)。

1. foreign-edit-override marker はセッションスコープでない (早い者勝ち one-shot)。
   `.ut-tdd/state/foreign-edit-override` は work-guard (`consumeOverrideMarker`) が session_id / 対象 path を照合せず無条件消費するため、A セッションが書いた marker を並行 B セッションの次の foreign edit が先に消費しうる。実測: 2026-07-17T01:33:51 に session 8f1e5c35 の marker を session 019f4a3e (ut-recovery-70 作業) が消費 (`.ut-tdd/logs/foreign-edit-overrides.jsonl`)。override が効かない時は audit log で消費者を確認し、marker を書き直して即座に編集すること。安全方向 (fail-close 側) に倒れるので実害は再試行コストのみ。

2. PostToolUse matcher `Edit|Write|MultiEdit|Bash` は Windows ネイティブ Claude Code (VSCode) の主シェルツール `PowerShell` を捕捉しない。
   PowerShell ツール経由のコマンド実行は session jsonl に tool_use として記録されず、hook_events projection にも乗らない (実測: 本セッションの PowerShell 実行 10+ 件が session log 不記録、Write のみ記録)。Windows 環境のシェル操作は監査可視性が Bash 経由より低い前提で読むこと。恒久対処は matcher への PowerShell 追加を設計判断 (L6 session-log design + settings template + project-hook lint REQUIRED の三点同時更新) として起票する必要がある。

関連: harness.db の鮮度は `ut-tdd db rebuild` で回復可能 (db-currency violation → rebuild → plan_registry 800 一致を実測確認)。
